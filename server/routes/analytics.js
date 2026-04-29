const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

router.use(protect, admin);

router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      newOrders,
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
      todayRevenue,
      totalUsers,
      avgOrderValue,
    ] = await Promise.all([
      Order.countDocuments({ status: { $ne: 'cancelled' } }),
      Order.countDocuments({ status: 'new' }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: thisWeek } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      User.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, avg: { $avg: '$totalPrice' } } },
      ]),
    ]);

    // Revenue by month (current year)
    const revenueByMonth = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: new Date(today.getFullYear(), 0, 1) },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$totalPrice' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top 10 products by quantity sold
    const topProducts = await OrderItem.aggregate([
      { $group: { _id: '$productId', name: { $first: '$name' }, totalSold: { $sum: '$quantity' }, totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    // Orders by district
    const ordersByDistrict = await Order.aggregate([
      { $match: { district: { $ne: '' }, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$district', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    // Total products
    const totalProducts = await Product.countDocuments({ isActive: true });

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Orders by payment method
    const ordersByPayment = await Order.aggregate([
      { $match: { paymentMethod: { $ne: '' } } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
    ]);

    res.json({
      summary: {
        totalOrders,
        newOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        weeklyRevenue: weeklyRevenue[0]?.total || 0,
        todayRevenue: todayRevenue[0]?.total || 0,
        totalUsers,
        totalProducts,
        avgOrderValue: Math.round(avgOrderValue[0]?.avg || 0),
      },
      revenueByMonth,
      topProducts,
      ordersByDistrict,
      ordersByStatus,
      ordersByPayment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
