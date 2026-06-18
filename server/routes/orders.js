const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const User = require('../models/User');
const TelegramUser = require('../models/TelegramUser');
const { protect, admin, driver, adminOrDriver } = require('../middleware/auth');
const { getDeliverySettings, haversine, getRoadDistance } = require('./delivery');
const Coin = require('../models/Coin');
const Promo = require('../models/Promo');
const { botState } = require('../config/redis');
const { sendTelegramMessage, formatOrderMessage } = require('../utils/telegram');
const { sendMessage: notifyTelegramUser } = require('../services/notifications');
const { getPaymeLink, getClickLink } = require('../utils/paymentLinks');

// Helper: notify customer on Telegram about order status change
async function notifyCustomerStatusChange(order, newStatus) {
  if (!order.telegramId) return;

  const statusLabels = {
    new: { uz: 'Yangi', ru: 'Новый', icon: '🆕' },
    processing: { uz: 'Tayyorlanmoqda', ru: 'В обработке', icon: '⚙️' },
    confirmed: { uz: 'Tasdiqlangan', ru: 'Подтверждён', icon: '✅' },
    completed: { uz: 'Yetkazildi', ru: 'Доставлен', icon: '🚚' },
    delivered: { uz: 'Yetkazildi', ru: 'Доставлен', icon: '🚚' },
    cancelled: { uz: 'Bekor qilindi', ru: 'Отменён', icon: '❌' },
  };

  const s = statusLabels[newStatus] || statusLabels.new;
  const lang = order.languageCode || 'uz';
  const label = s[lang] || s.uz;

  const messages = {
    uz: `${s.icon} *Buyurtma holati o'zgardi*\n\n🆔 \`${order._id}\`\n📌 Holat: *${label}*\n💰 Jami: *${(order.totalPrice || 0).toLocaleString('ru-RU')} so'm*`,
    ru: `${s.icon} *Статус заказа изменён*\n\n🆔 \`${order._id}\`\n📌 Статус: *${label}*\n💰 Итого: *${(order.totalPrice || 0).toLocaleString('ru-RU')} сум*`,
  };

  await notifyTelegramUser(order.telegramId, messages[lang] || messages.uz).catch(() => { });
}
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
    const {
      items, customerPhone, customerName, userId, telegramId,
      address, district, comment,
      latitude, longitude,
      useCoins, promoCode, paymentMethod,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Items are required', code: 'NO_ITEMS' });
    }
    // Name, address, district are optional — will be filled via Telegram bot

    // Validate all productIds are valid ObjectIds before any DB query
    const mongoose = require('mongoose');
    for (const item of items) {
      if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({
          message: `Invalid product ID: "${item.productId}". Please clear your cart and add products again.`,
          code: 'INVALID_PRODUCT_ID',
        });
      }
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({ message: 'Invalid quantity', code: 'INVALID_QTY' });
      }
    }

    // Calculate total with appropriate prices
    let subTotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }

      const price = product.finalPrice || product.price;
      // kg products send quantity in grams → line total = price per kg * grams / 1000
      const lineTotal = product.unit === 'kg'
        ? Math.round((price * item.quantity) / 1000)
        : price * item.quantity;

      orderItems.push({
        productId: product._id,
        name: product.name.ru || product.name.uz,
        price: price,
        originalPrice: product.price,
        quantity: item.quantity,
        unit: product.unit || 'pcs',
        image: product.images[0] || '',
      });

      subTotal += lineTotal;
    }

    // ── Delivery fee from settings ───────────────────────────────────────────
    const cfg = await getDeliverySettings();
    let deliveryFee = 0;
    let isFreeDelivery = false;
    let deliveryDistance = null;
    let deliveryDuration = null;
    let deliveryGeometry = null;

    if (!cfg.enabled) {
      isFreeDelivery = true;
    } else if (cfg.freeUntil && new Date() <= cfg.freeUntil) {
      isFreeDelivery = true;
    } else if (subTotal >= cfg.freeThreshold) {
      isFreeDelivery = true;
    } else if (latitude && longitude) {
      const roadResult = await getRoadDistance(cfg.storeLat, cfg.storeLng, Number(latitude), Number(longitude));
      deliveryDistance = roadResult.distance;
      deliveryDuration = roadResult.duration || null;
      deliveryGeometry = roadResult.geometry || null;
      deliveryFee = Math.max(cfg.minFee, Math.round(deliveryDistance * cfg.pricePerKm / 500) * 500);
    } else {
      deliveryFee = cfg.minFee;
    }

    // ── Promo code discount ──────────────────────────────────────────────────
    let promoDiscount = 0;
    let appliedPromo = null;
    if (promoCode) {
      const promo = await Promo.findOne({ code: promoCode.toUpperCase().trim(), isActive: true });
      if (promo && (!promo.validUntil || new Date() <= promo.validUntil) &&
        (promo.maxUses === null || promo.usedCount < promo.maxUses)) {
        promoDiscount = promo.discountType === 'percent'
          ? Math.round((subTotal * promo.discountValue) / 100)
          : promo.discountValue;
        appliedPromo = promo;
      }
    }

    // ── Coin discount ────────────────────────────────────────────────────────
    let coinDiscount = 0;
    if (useCoins && userId) {
      const coinDocs = await Coin.aggregate([
        { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId) } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const coinBalance = coinDocs[0]?.total || 0;
      const Settings = require('../models/Settings');
      const maxPctDoc = await Settings.findOne({ key: 'coin_max_percent' });
      const maxPct = Number(maxPctDoc?.value) || 30;
      const maxCoinDiscount = Math.round((subTotal * maxPct) / 100);
      coinDiscount = Math.min(coinBalance, maxCoinDiscount);
    }

    const totalDiscount = promoDiscount + coinDiscount;
    const totalPrice = Math.max(0, subTotal - totalDiscount) + deliveryFee;

    // ── Create order ─────────────────────────────────────────────────────────
    const order = await Order.create({
      customerPhone: customerPhone || '',
      customerName: customerName || '',
      address: address || '',
      district: district || '',
      comment: comment || '',
      user: userId || null,
      telegramId: telegramId || null,
      latitude: latitude || null,
      longitude: longitude || null,
      subTotal,
      deliveryFee,
      isFreeDelivery,
      totalPrice,
      distance: deliveryDistance !== null ? Math.round(deliveryDistance * 10) / 10 : null,
      duration: deliveryDuration,
      routeGeometry: deliveryGeometry,
      paymentMethod: paymentMethod || 'cash',
      promoCode: appliedPromo ? appliedPromo.code : '',
      promoDiscount,
      coinDiscount,
      status: 'new',
      paymentStatus: 'pending',
    });

    // Record promo usage
    if (appliedPromo) {
      appliedPromo.usedCount += 1;
      if (userId) appliedPromo.usedBy.push({ user: userId, order: order._id });
      await appliedPromo.save();
    }

    // Deduct coins
    if (coinDiscount > 0 && userId) {
      await Coin.create({ user: userId, amount: -coinDiscount, type: 'spent', order: order._id, description: 'Zakaz uchun sarflandi' });
    }

    // Create order items
    await OrderItem.insertMany(
      orderItems.map(item => ({ ...item, order: order._id }))
    );

    // Store token in Redis for quick bot lookup
    await botState.setToken(order.deepLinkToken, order._id.toString(), 86400);

    // ── Broadcast to all Telegram drivers immediately ──
    const OrderItemModel = require('../models/OrderItem');
    const savedItems = await OrderItemModel.find({ order: order._id }).lean();
    const { notifyDriversOfNewOrder } = require('../services/notifications');
    const storeLocation = { lat: cfg.storeLat, lng: cfg.storeLng };
    const sent = await notifyDriversOfNewOrder(order, savedItems, storeLocation);
    if (sent.length) {
      const { redis } = require('../config/redis');
      await redis.setex(`order:${order._id}:driver_notif`, 3600, JSON.stringify(sent));
    }

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

    // Notify customer on Telegram about new order
    if (order.telegramId) {
      const welcomeMsg = order.languageCode === 'ru'
        ? `🛒 *Новый заказ создан!*\n\n🆔 \`${order._id}\`\n Итого: *${totalPrice.toLocaleString('ru-RU')} сум*\n\n_Мы сообщим, когда статус изменится._`
        : `🛒 *Yangi buyurtma yaratildi!*\n\n🆔 \`${order._id}\`\n💰 Jami: *${totalPrice.toLocaleString('ru-RU')} so'm*\n\n_Holat o'zgarganda xabar beramiz._`;
      notifyTelegramUser(order.telegramId, welcomeMsg).catch(() => { });
    }

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

    const oldStatus = order.status;
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

    // ── Broadcast to all Telegram drivers when confirmed ──
    if (!order.assignedDriver && !order.driverTelegramId) {
      const { notifyDriversOfNewOrder } = require('../services/notifications');
      const OrderItem = require('../models/OrderItem');
      const items = await OrderItem.find({ order: order._id }).lean();
      const { getDeliverySettings } = require('../routes/delivery');
      const cfg2 = await getDeliverySettings();
      const storeLocation = { lat: cfg2.storeLat, lng: cfg2.storeLng };
      const sent = await notifyDriversOfNewOrder(order, items, storeLocation);
      if (sent.length) {
        const { redis } = require('../config/redis');
        await redis.setex(`order:${order._id}:driver_notif`, 3600, JSON.stringify(sent));
      }
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
// PUBLIC: lightweight payment status (no auth) — used by the cart after redirect
// =====================================================
router.get('/:id/payment-status', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).select('paymentStatus status');
    if (!order) return res.status(404).json({ message: 'Not found' });
    res.json({ paymentStatus: order.paymentStatus, status: order.status });
  } catch (e) {
    res.status(400).json({ message: 'Bad request' });
  }
});

// PUBLIC: after-sales info by serviceToken (no auth)
// =====================================================
router.get('/service/:token', async (req, res) => {
  try {
    const order = await Order.findOne({ serviceToken: req.params.token });
    if (!order) return res.status(404).json({ message: 'Not found' });

    const orderItems = await OrderItem.find({ order: order._id }).lean();

    res.json({
      order: {
        _id: order._id,
        shortId: order._id.toString().slice(-6).toUpperCase(),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        address: order.address,
        district: order.district,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        subTotal: order.subTotal,
        deliveryFee: order.deliveryFee,
        isFreeDelivery: order.isFreeDelivery,
        totalPrice: order.totalPrice,
        promoDiscount: order.promoDiscount,
        coinDiscount: order.coinDiscount,
        comment: order.comment,
        deliveryTime: order.deliveryTime,
        createdAt: order.createdAt,
      },
      items: orderItems,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =====================================================
// PUBLIC: get orders by customer phone (no auth)
// =====================================================
router.get('/by-phone/:phone', async (req, res) => {
  try {
    const phone = req.params.phone.replace(/\s/g, '');
    // Escape regex special chars to avoid MongoDB regex errors (e.g. '+' in phone)
    const escaped = phone.replace(/[+.*?^${}()|[\]\\]/g, '\\$&');
    const orders = await Order.find({ customerPhone: { $regex: escaped, $options: 'i' } })
      .sort({ createdAt: -1 })
      .limit(50);

    // Attach order items
    const result = await Promise.all(orders.map(async (o) => {
      const items = await OrderItem.find({ order: o._id }).lean();
      return { ...o.toObject(), items };
    }));

    res.json({ orders: result, total: result.length, page: 1, pages: 1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/orders/my-orders
 * Returns orders for the authenticated Telegram user (identified via JWT from Mini App login).
 */
router.get('/my-orders', protect, async (req, res) => {
  try {
    const telegramId = req.user?.telegramId;
    if (!telegramId) return res.json({ orders: [], total: 0 });

    const orders = await Order.find({ telegramId })
      .sort({ createdAt: -1 })
      .limit(50);

    const result = await Promise.all(orders.map(async (o) => {
      const items = await OrderItem.find({ order: o._id }).lean();
      return { ...o.toObject(), items };
    }));

    res.json({ orders: result, total: result.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =====================================================
// EXISTING ENDPOINTS (Updated for Stage 1)
router.get('/', protect, admin, async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 20, search, dateFrom, dateTo } = req.query;
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { customerPhone: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
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
      .populate('user', 'name phone')
      .populate('confirmedBy', 'name')
      .populate('assignedDriver', 'name phone');

    res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin — quick order stats for badge/notifications
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const counts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const result = { new: 0, processing: 0, confirmed: 0, completed: 0, cancelled: 0, total: 0 };
    counts.forEach(c => {
      if (result[c._id] !== undefined) result[c._id] = c.count;
      result.total += c.count;
    });
    res.json(result);
  } catch (error) {
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

// ADMIN: generate QR code image for an order
router.get('/:id/qr', protect, admin, async (req, res) => {
  try {
    const QRCode = require('qrcode');
    const order = await Order.findById(req.params.id).select('serviceToken _id');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Ensure serviceToken exists (backfill for old orders)
    if (!order.serviceToken) {
      const crypto = require('crypto');
      order.serviceToken = crypto.randomBytes(12).toString('hex');
      await order.save();
    }

    const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
    const url = `${siteUrl}/service/${order.serviceToken}`;

    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    });

    res.json({ qr: dataUrl, url, serviceToken: order.serviceToken });
  } catch (error) {
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

// =========================
// DRIVER ENDPOINTS
// =========================

/**
 * GET /api/orders/driver/my-orders
 * Get orders assigned to the logged-in driver
 */
router.get('/driver/my-orders', protect, driver, async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { assignedDriver: req.user._id },
        { driverTelegramId: req.user.telegramId },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('assignedDriver', 'name phone');

    const enriched = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({ order: order._id }).lean();
        return { ...order.toObject(), items };
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error('Driver orders error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/orders/driver/available
 * Get unassigned pending orders for drivers to claim
 */
router.get('/driver/available', protect, driver, async (req, res) => {
  try {
    const filter = {
      status: { $in: ['confirmed', 'processing'] },
      deliveryStatus: { $in: ['pending', null] },
    };

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    const enriched = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({ order: order._id }).lean();
        return { ...order.toObject(), items };
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error('Driver available orders error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/orders/:id/assign-driver
 * Assign an order to a driver (admin or the driver themselves)
 */
router.post('/:id/assign-driver', protect, adminOrDriver, async (req, res) => {
  try {
    const { driverId } = req.body;
    const targetDriverId = driverId || req.user._id;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Drivers can only assign to themselves, admin can assign to any driver
    if (req.user.role === 'driver' && targetDriverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only assign to yourself' });
    }

    const targetUser = await User.findById(targetDriverId);
    order.assignedDriver = targetDriverId;
    order.driverTelegramId = targetUser?.telegramId || null;
    order.deliveryStatus = 'assigned';
    await order.save();

    const updated = await Order.findById(order._id)
      .populate('assignedDriver', 'name phone');

    res.json({ message: 'Driver assigned', order: updated });
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/orders/:id/delivery-status
 * Update delivery status (driver only)
 */
router.post('/:id/delivery-status', protect, driver, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['in_transit', 'delivered', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid delivery status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isAssigned =
      (order.assignedDriver && order.assignedDriver.toString() === req.user._id.toString()) ||
      (order.driverTelegramId && order.driverTelegramId === req.user.telegramId);
    if (!isAssigned) {
      return res.status(403).json({ message: 'Not your assigned order' });
    }

    order.deliveryStatus = status;
    if (status === 'delivered') {
      order.status = 'completed';

      // Notify customer
      notifyCustomerStatusChange(order, 'delivered');

      // Award coins to customer
      if (order.user) {
        try {
          const Settings = require('../models/Settings');
          const rateDoc = await Settings.findOne({ key: 'coin_rate' });
          const coinRate = Number(rateDoc?.value) || 1; // coins per 1000 sum
          const earned = Math.floor((order.subTotal / 1000) * coinRate);
          if (earned > 0) {
            await Coin.create({ user: order.user, amount: earned, type: 'earned', order: order._id, description: 'Zakaz uchun bonus' });
          }
        } catch (e) { /* non-fatal */ }
      }
    }
    await order.save();

    res.json({ message: 'Delivery status updated', order });
  } catch (error) {
    console.error('Delivery status error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/orders/:id/driver/confirm-cash
 * Driver confirms they received cash from the customer
 */
router.post('/:id/driver/confirm-cash', protect, driver, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isAssigned =
      (order.assignedDriver && order.assignedDriver.toString() === req.user._id.toString()) ||
      (order.driverTelegramId && order.driverTelegramId === req.user.telegramId);
    if (!isAssigned) return res.status(403).json({ message: 'Not your order' });

    if (order.paymentMethod !== 'cash') {
      return res.status(400).json({ message: 'Not a cash order' });
    }
    const isDelivered =
      order.deliveryStatus === 'delivered' ||
      order.status === 'completed' ||
      order.status === 'delivered';
    if (!isDelivered) {
      return res.status(400).json({ message: 'Order not delivered yet' });
    }

    order.cashReceivedByCourier = true;
    order.cashReceivedAt = new Date();
    order.paymentStatus = 'paid';
    order.paidAt = new Date();
    await order.save();

    res.json({ message: 'Cash confirmed', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/orders/driver/cash-summary
 * Driver's own cash summary: pending (received not submitted) + submitted total
 */
router.get('/driver/cash-summary', protect, driver, async (req, res) => {
  try {
    const driverFilter = [
      { assignedDriver: req.user._id },
      ...(req.user.telegramId ? [{ driverTelegramId: req.user.telegramId }] : []),
    ];

    const [pending, submitted] = await Promise.all([
      Order.find({
        $and: [
          { $or: driverFilter },
          { $or: [{ deliveryStatus: 'delivered' }, { status: { $in: ['completed', 'delivered'] } }] },
        ],
        paymentMethod: 'cash',
        cashSubmittedToAdmin: { $ne: true },
      }).select('totalPrice customerName createdAt cashReceivedAt cashReceivedByCourier'),

      Order.find({
        $or: driverFilter,
        paymentMethod: 'cash',
        cashSubmittedToAdmin: true,
      }).select('totalPrice cashSubmittedAt cashSubmitBatch'),
    ]);

    const pendingTotal = pending.reduce((s, o) => s + (o.totalPrice || 0), 0);
    const submittedTotal = submitted.reduce((s, o) => s + (o.totalPrice || 0), 0);

    res.json({ pending, pendingTotal, submitted: submitted.length, submittedTotal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/orders/driver/submit-cash
 * Driver submits all pending cash to admin in bulk
 */
router.post('/driver/submit-cash', protect, driver, async (req, res) => {
  try {
    const driverFilter = [
      { assignedDriver: req.user._id },
      ...(req.user.telegramId ? [{ driverTelegramId: req.user.telegramId }] : []),
    ];

    const pendingOrders = await Order.find({
      $and: [
        { $or: driverFilter },
        { $or: [{ deliveryStatus: 'delivered' }, { status: { $in: ['completed', 'delivered'] } }] },
      ],
      paymentMethod: 'cash',
      cashSubmittedToAdmin: { $ne: true },
    });

    if (pendingOrders.length === 0) {
      return res.status(400).json({ message: 'No pending cash to submit' });
    }

    const batchId = `batch_${Date.now()}_${req.user._id}`;
    const total = pendingOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
    const now = new Date();

    await Order.updateMany(
      { _id: { $in: pendingOrders.map(o => o._id) } },
      { cashSubmittedToAdmin: true, cashSubmittedAt: now, cashSubmitBatch: batchId }
    );

    // Notify admin via Telegram if possible
    try {
      const { getBot } = require('../services/notifications');
      const bot = getBot();
      const adminUsers = await TelegramUser.find({ role: 'admin', isActive: true }).select('telegramId');
      const driverName = req.user.name || req.user.firstName || 'Haydovchi';
      const msg = `💵 <b>Naqd pul topshirildi</b>\n\nHaydovchi: ${driverName}\nSumma: <b>${total.toLocaleString()} so'm</b>\nBuyurtmalar: ${pendingOrders.length} ta\nBatch: <code>${batchId}</code>`;
      for (const admin of adminUsers) {
        bot?.telegram?.sendMessage(admin.telegramId, msg, { parse_mode: 'HTML' }).catch(() => { });
      }
    } catch (e) { /* non-fatal */ }

    res.json({ message: 'Cash submitted', count: pendingOrders.length, total, batchId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/orders/admin/cash-summary
 * Admin — see cash balance per courier
 */
router.get('/admin/cash-summary', protect, admin, async (req, res) => {
  try {
    const pipeline = [
      {
        $match: {
          paymentMethod: 'cash',
          $and: [
            {
              $or: [
                { deliveryStatus: 'delivered' },
                { status: { $in: ['completed', 'delivered'] } },
              ],
            },
            {
              $or: [
                { assignedDriver: { $ne: null } },
                { driverTelegramId: { $ne: null } },
              ],
            },
          ],
        },
      },
      {
        $group: {
          _id: { driver: '$assignedDriver', driverTelegramId: '$driverTelegramId' },
          pendingTotal: {
            $sum: { $cond: [{ $ne: ['$cashSubmittedToAdmin', true] }, '$totalPrice', 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $ne: ['$cashSubmittedToAdmin', true] }, 1, 0] },
          },
          submittedTotal: {
            $sum: { $cond: [{ $eq: ['$cashSubmittedToAdmin', true] }, '$totalPrice', 0] },
          },
          submittedCount: {
            $sum: { $cond: [{ $eq: ['$cashSubmittedToAdmin', true] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.driver',
          foreignField: '_id',
          as: 'driverInfo',
        },
      },
    ];

    const rows = await Order.aggregate(pipeline);

    // Enrich with TelegramUser data for drivers without web account
    const telegramIds = rows
      .filter(r => !r.driverInfo?.length && r._id.driverTelegramId)
      .map(r => r._id.driverTelegramId);

    const tgUsers = telegramIds.length
      ? await TelegramUser.find({ telegramId: { $in: telegramIds } }).select('firstName phone telegramId').lean()
      : [];
    const tgMap = Object.fromEntries(tgUsers.map(u => [u.telegramId, u]));

    const result = rows.map(r => {
      const webDriver = r.driverInfo?.[0];
      const tgDriver = tgMap[r._id.driverTelegramId];
      return {
        driverId: r._id.driver || r._id.driverTelegramId,
        driverName: webDriver?.name || tgDriver?.firstName || 'Noma\'lum haydovchi',
        driverPhone: webDriver?.phone || tgDriver?.phone || '',
        pendingTotal: r.pendingTotal,
        pendingCount: r.pendingCount,
        submittedTotal: r.submittedTotal,
        submittedCount: r.submittedCount,
      };
    });

    res.json({ drivers: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
