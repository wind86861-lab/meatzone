const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');
const { botState } = require('../config/redis');
const { sendTelegramMessage, formatOrderMessage } = require('../utils/telegram');
const { getPaymeLink, getClickLink } = require('../utils/paymentLinks');
const PaymentAttempt = require('../models/PaymentAttempt');

const submitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { message: 'Too many submissions, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// =====================================================
// STAGE 1: NEW ENDPOINTS
// =====================================================

/**
 * POST /api/orders/create
 * Stage 1: Create order from website with deep_link_token
 * Body: { items: [{productId, quantity}], customerPhone, customerName, userId?, telegramId? }
 */
router.post('/create', submitLimiter, async (req, res) => {
  try {
    const { items, customerPhone, customerName, userId, telegramId, address, district, comment } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Items are required' });
    }

    // Validate all productIds are valid ObjectIds before any DB query
    const mongoose = require('mongoose');
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({
          message: `Invalid product ID: "${item.productId}". Please clear your cart and add products again.`,
          code: 'INVALID_PRODUCT_ID',
        });
      }
    }

    // Check if user is premium
    let isPremiumUser = false;
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.isPremium && user.premiumExpiresAt > new Date()) {
        isPremiumUser = true;
      }
    }

    // Calculate total with appropriate prices
    let totalPrice = 0;
    let originalTotalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }

      const originalPrice = product.price;
      const finalPrice = product.getPriceByUserType(isPremiumUser ? 'premium' : 'regular');

      orderItems.push({
        productId: product._id,
        name: product.name.ru || product.name.uz,
        price: finalPrice,
        originalPrice: originalPrice,
        quantity: item.quantity,
        image: product.images[0] || '',
        isPremiumPrice: isPremiumUser && finalPrice < originalPrice,
      });

      totalPrice += finalPrice * item.quantity;
      originalTotalPrice += originalPrice * item.quantity;
    }

    // Create order
    const order = await Order.create({
      customerPhone: customerPhone || '',
      customerName: customerName || '',
      address: address || '',
      district: district || '',
      comment: comment || '',
      user: userId || null,
      telegramId: telegramId || null,
      totalPrice,
      originalTotalPrice,
      isPremiumOrder: isPremiumUser,
      status: 'new',
      paymentStatus: 'pending',
    });

    // Create order items
    await OrderItem.insertMany(
      orderItems.map(item => ({ ...item, order: order._id }))
    );

    // Store token in Redis for quick bot lookup
    await botState.setToken(order.deepLinkToken, order._id.toString(), 86400);

    // Return order with deep link
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'your_bot';
    const deepLink = order.getBotDeepLink(botUsername);

    res.status(201).json({
      order: {
        _id: order._id,
        deepLinkToken: order.deepLinkToken,
        totalPrice,
        status: order.status,
      },
      deepLink,
      deepLinkToken: order.deepLinkToken,
      paymentLinks: {
        payme: getPaymeLink(String(order._id), totalPrice),
        click: getClickLink(String(order._id), totalPrice),
      },
    });

    // Send notification
    sendTelegramMessage(formatOrderMessage(order)).catch((err) => {
      console.error('Telegram notification error:', err.message);
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/orders/token/:token
 * Stage 1: Get order by deep link token (called by bot on /start TOKEN)
 */
router.get('/token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Try Redis first for performance
    let orderId = await botState.getToken(token);

    let order;
    if (orderId) {
      order = await Order.findById(orderId);
    } else {
      // Fallback to MongoDB
      order = await Order.findOne({ deepLinkToken: token });
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found or token expired' });
    }

    // Check if token is still valid
    if (!order.isTokenValid()) {
      return res.status(410).json({ message: 'Token has expired' });
    }

    // Get order items
    const orderItems = await OrderItem.find({ order: order._id });

    res.json({
      order: {
        _id: order._id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalPrice: order.totalPrice,
        status: order.status,
        paymentStatus: order.paymentStatus,
        address: order.address,
        district: order.district,
        latitude: order.latitude,
        longitude: order.longitude,
        deepLinkToken: order.deepLinkToken,
      },
      items: orderItems,
    });
  } catch (error) {
    console.error('Token lookup error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * PUT /api/orders/:id/location
 * Stage 1: Update order with geolocation from bot
 */
router.put('/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, address, district, telegramId } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Optional: verify telegramId matches
    if (telegramId && order.telegramId && order.telegramId !== telegramId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    order.latitude = latitude;
    order.longitude = longitude;
    if (address) order.address = address;
    if (district) order.district = district;

    await order.save();

    res.json({
      message: 'Location updated',
      order: {
        _id: order._id,
        latitude: order.latitude,
        longitude: order.longitude,
        address: order.address,
        district: order.district,
      },
    });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/orders/:id/pay
 * Stage 1: Payment webhook from payment provider
 */
router.post('/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId, paymentMethod, amount, status, webhookSecret } = req.body;

    // Verify webhook secret
    if (webhookSecret !== process.env.PAYMENT_WEBHOOK_SECRET) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (status === 'success') {
      order.paymentStatus = 'paid';
      order.paymentId = paymentId;
      order.paymentMethod = paymentMethod;
      order.paidAt = new Date();
      await order.save();

      // Notify admin group
      const adminMessage = `💰 Payment received!\nOrder: ${order._id}\nAmount: ${amount} UZS\nMethod: ${paymentMethod}`;
      sendTelegramMessage(adminMessage, process.env.TELEGRAM_ADMIN_GROUP).catch(console.error);

      res.json({ message: 'Payment confirmed', order: { _id: order._id, paymentStatus: 'paid' } });
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      res.json({ message: 'Payment failed recorded', order: { _id: order._id, paymentStatus: 'failed' } });
    }
  } catch (error) {
    console.error('Payment webhook error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/admin/orders/:id/confirm
 * Stage 1: Admin confirms order and sets delivery time
 */
router.post('/:id/confirm', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryTime, adminNotes } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = 'confirmed';
    order.confirmedAt = new Date();
    order.confirmedBy = req.user._id;
    if (deliveryTime) order.deliveryTime = new Date(deliveryTime);
    if (adminNotes) order.adminNotes = adminNotes;

    await order.save();

    // Notify customer via bot if telegramId exists
    if (order.telegramId) {
      const message = `✅ Your order has been confirmed!\nOrder ID: ${order._id}\n${deliveryTime ? `Delivery: ${new Date(deliveryTime).toLocaleString()}` : ''}`;
      sendTelegramMessage(message, order.telegramId).catch(console.error);
    }

    res.json({
      message: 'Order confirmed',
      order: {
        _id: order._id,
        status: order.status,
        deliveryTime: order.deliveryTime,
        confirmedAt: order.confirmedAt,
      },
    });
  } catch (error) {
    console.error('Order confirmation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// =====================================================
// EXISTING ENDPOINTS (Updated for Stage 1)
// =====================================================

// Admin: get all orders (with advanced filters)
router.get('/', protect, admin, async (req, res) => {
  try {
    const { status, paymentStatus, paymentMethod, district, search, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (district) query.district = { $regex: district, $options: 'i' };
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : undefined },
      ].filter(q => Object.values(q)[0] !== undefined);
    }
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user', 'name phone isPremium')
      .populate('confirmedBy', 'name');

    res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single order with items
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name phone telegramId isPremium')
      .populate('confirmedBy', 'name');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const orderItems = await OrderItem.find({ order: order._id });
    const paymentHistory = await PaymentAttempt.find({ order: order._id }).sort({ createdAt: -1 });

    res.json({ order, items: orderItems, paymentHistory });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: refund order
router.post('/:id/refund', protect, admin, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Order is not paid' });
    }

    // Find the successful payment attempt
    const attempt = await PaymentAttempt.findOne({ order: order._id, status: 'paid' });
    if (!attempt) {
      // No payment attempt found — just mark order as refunded (cash order)
      order.paymentStatus = 'refunded';
      await order.save();
      return res.json({ message: 'Order marked as refunded', order: { _id: order._id, paymentStatus: 'refunded' } });
    }

    if (attempt.provider === 'payme' && attempt.transactionId) {
      // Call our own Payme CancelTransaction handler internally
      attempt.status = 'refunded';
      attempt.cancelTime = new Date();
      attempt.cancelReason = 1;
      attempt.refundedAt = new Date();
      attempt.refundReason = reason || 'Admin refund';
      await attempt.save();

      // In production, you'd also make an HTTP call to Payme API:
      // POST https://checkout.paycom.uz with CancelTransaction method
      // For now, the Payme side will reconcile via their next CheckTransaction call
    } else if (attempt.provider === 'click') {
      attempt.status = 'refunded';
      attempt.cancelTime = new Date();
      attempt.refundedAt = new Date();
      attempt.refundReason = reason || 'Admin refund';
      await attempt.save();
    } else {
      // Cash — just mark
      attempt.status = 'refunded';
      attempt.refundedAt = new Date();
      attempt.refundReason = reason || 'Admin refund';
      await attempt.save();
    }

    order.paymentStatus = 'refunded';
    await order.save();

    // Notify customer
    if (order.telegramId && process.env.TELEGRAM_BOT_TOKEN) {
      const { Telegraf } = require('telegraf');
      const tempBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
      tempBot.telegram.sendMessage(order.telegramId,
        '💸 Возврат средств по заказу ' + order._id + '\n' + (reason || '')
      ).catch(() => { });
    }

    res.json({ message: 'Refund processed', order: { _id: order._id, paymentStatus: 'refunded' } });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: update order
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: delete order
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Also delete order items
    await OrderItem.deleteMany({ order: req.params.id });

    res.json({ message: 'Order deleted' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
