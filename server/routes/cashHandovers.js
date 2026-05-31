const express = require('express');
const router = express.Router();
const CashHandover = require('../models/CashHandover');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/cash-handovers
// @desc    Get all cash handovers with filters
// @access  Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const { status, courierId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (courierId) filter.courier = courierId;
    if (startDate || endDate) {
      filter.submittedAt = {};
      if (startDate) filter.submittedAt.$gte = new Date(startDate);
      if (endDate) filter.submittedAt.$lte = new Date(endDate);
    }

    const handovers = await CashHandover.find(filter)
      .populate('courier', 'name phone email')
      .populate('confirmedBy', 'name')
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await CashHandover.countDocuments(filter);

    res.json({
      handovers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error('Get cash handovers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/cash-handovers/stats
// @desc    Get cash handover statistics
// @access  Admin
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const [pending, confirmed, rejected, totalPending, totalConfirmed] = await Promise.all([
      CashHandover.countDocuments({ status: 'pending' }),
      CashHandover.countDocuments({ status: 'confirmed' }),
      CashHandover.countDocuments({ status: 'rejected' }),
      CashHandover.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$submittedAmount' } } },
      ]),
      CashHandover.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$submittedAmount' } } },
      ]),
    ]);

    res.json({
      pending,
      confirmed,
      rejected,
      totalPendingAmount: totalPending[0]?.total || 0,
      totalConfirmedAmount: totalConfirmed[0]?.total || 0,
    });
  } catch (error) {
    console.error('Get cash handover stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/cash-handovers/:id
// @desc    Get single cash handover with order details
// @access  Admin
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const handover = await CashHandover.findById(req.params.id)
      .populate('courier', 'name phone email')
      .populate('confirmedBy', 'name')
      .populate({
        path: 'orders',
        select: 'customerName customerPhone totalPrice deliveryFee createdAt status',
      })
      .lean();

    if (!handover) {
      return res.status(404).json({ message: 'Cash handover not found' });
    }

    res.json(handover);
  } catch (error) {
    console.error('Get cash handover error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/cash-handovers/:id/confirm
// @desc    Confirm cash handover
// @access  Admin
router.put('/:id/confirm', protect, admin, async (req, res) => {
  try {
    const { notes } = req.body;

    const handover = await CashHandover.findByIdAndUpdate(
      req.params.id,
      {
        status: 'confirmed',
        confirmedAt: new Date(),
        confirmedBy: req.user._id,
        confirmedByName: req.user.name,
        adminNotes: notes || '',
      },
      { new: true }
    ).populate('courier', 'name phone');

    if (!handover) {
      return res.status(404).json({ message: 'Cash handover not found' });
    }

    res.json({ message: 'Cash handover confirmed', handover });
  } catch (error) {
    console.error('Confirm cash handover error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/cash-handovers/:id/reject
// @desc    Reject cash handover
// @access  Admin
router.put('/:id/reject', protect, admin, async (req, res) => {
  try {
    const { notes } = req.body;

    const handover = await CashHandover.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        confirmedAt: new Date(),
        confirmedBy: req.user._id,
        confirmedByName: req.user.name,
        adminNotes: notes || '',
      },
      { new: true }
    ).populate('courier', 'name phone');

    if (!handover) {
      return res.status(404).json({ message: 'Cash handover not found' });
    }

    // Unmark orders as handed over
    await Order.updateMany(
      { _id: { $in: handover.orders } },
      { cashHandedOver: false, handoverRef: null }
    );

    res.json({ message: 'Cash handover rejected', handover });
  } catch (error) {
    console.error('Reject cash handover error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/cash-handovers/courier/:courierId/pending
// @desc    Get pending cash for a specific courier
// @access  Admin
router.get('/courier/:courierId/pending', protect, admin, async (req, res) => {
  try {
    const courier = await User.findById(req.params.courierId);
    if (!courier) {
      return res.status(404).json({ message: 'Courier not found' });
    }

    const orConditions = [
      { driverTelegramId: courier.telegramId },
    ];
    if (courier._id) {
      orConditions.push({ assignedDriver: courier._id });
    }

    const cashOrders = await Order.find({
      $or: orConditions,
      status: 'completed',
      paymentMethod: 'cash',
      cashCollected: true,
      cashHandedOver: false,
    }).select('customerName totalPrice createdAt').lean();

    const totalPending = cashOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    res.json({
      courier: {
        _id: courier._id,
        name: courier.name,
        phone: courier.phone,
      },
      pendingOrders: cashOrders,
      totalPending,
      orderCount: cashOrders.length,
    });
  } catch (error) {
    console.error('Get courier pending cash error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
