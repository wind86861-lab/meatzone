const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Order = require('../models/Order');
const { protect, admin, adminOrManager } = require('../middleware/auth');
const { sendTelegramMessage, formatOrderMessage } = require('../utils/telegram');

const submitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { message: 'Too many submissions, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin/Manager: get all orders
router.get('/', protect, adminOrManager, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Public: create order (with rate limiting)
router.post('/public', submitLimiter, async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json(order);
    sendTelegramMessage(formatOrderMessage(order)).catch((err) => {
      console.error('Telegram notification error:', err.message);
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin/Manager: create order (authenticated, no rate limit)
router.post('/', protect, adminOrManager, async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json(order);
    sendTelegramMessage(formatOrderMessage(order)).catch((err) => {
      console.error('Telegram notification error:', err.message);
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin/Manager: update order status
router.put('/:id', protect, adminOrManager, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: delete order
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
