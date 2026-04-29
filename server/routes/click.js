const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Order = require('../models/Order');
const PaymentAttempt = require('../models/PaymentAttempt');
const { logger } = require('../config/logger');

// Click error codes
var ClickError = {
  Success: 0,
  SignFailed: -1,
  InvalidAmount: -2,
  ActionNotFound: -3,
  AlreadyPaid: -4,
  OrderNotFound: -5,
  TransactionError: -6,
  BadRequest: -8,
  TransactionCancelled: -9,
};

// Verify Click signature
function verifyClickSign(params) {
  var serviceId = process.env.CLICK_SERVICE_ID;
  var secretKey = process.env.CLICK_SECRET_KEY;

  var signString = params.click_trans_id +
    serviceId +
    secretKey +
    params.merchant_trans_id +
    (params.merchant_prepare_id || '') +
    params.amount +
    params.action +
    params.sign_time;

  var hash = crypto.createHash('md5').update(signString).digest('hex');
  return hash === params.sign_string;
}

// ── Prepare (action=0) — Click asks: can we start payment? ──
router.post('/prepare', express.urlencoded({ extended: true }), express.json(), async function (req, res) {
  var p = req.body;
  logger.info('Click Prepare', { body: p });

  // Verify signature
  if (!verifyClickSign(p)) {
    return res.json({
      error: ClickError.SignFailed,
      error_note: 'Invalid sign',
    });
  }

  if (Number(p.action) !== 0) {
    return res.json({ error: ClickError.ActionNotFound, error_note: 'Invalid action' });
  }

  var orderId = p.merchant_trans_id;
  var order = await Order.findById(orderId);

  if (!order) {
    return res.json({ error: ClickError.OrderNotFound, error_note: 'Order not found' });
  }

  if (order.paymentStatus === 'paid') {
    return res.json({ error: ClickError.AlreadyPaid, error_note: 'Already paid' });
  }

  // Verify amount
  if (Number(p.amount) !== order.totalPrice) {
    return res.json({ error: ClickError.InvalidAmount, error_note: 'Invalid amount' });
  }

  // Create payment attempt
  var attempt = await PaymentAttempt.create({
    order: order._id,
    provider: 'click',
    transactionId: String(p.click_trans_id),
    amount: order.totalPrice,
    status: 'creating',
    createTime: new Date(),
  });

  return res.json({
    error: ClickError.Success,
    error_note: 'Success',
    click_trans_id: p.click_trans_id,
    merchant_trans_id: orderId,
    merchant_prepare_id: String(attempt._id),
  });
});

// ── Complete (action=1) — Click says: payment done ──
router.post('/complete', express.urlencoded({ extended: true }), express.json(), async function (req, res) {
  var p = req.body;
  logger.info('Click Complete', { body: p });

  // Verify signature
  if (!verifyClickSign(p)) {
    return res.json({ error: ClickError.SignFailed, error_note: 'Invalid sign' });
  }

  if (Number(p.action) !== 1) {
    return res.json({ error: ClickError.ActionNotFound, error_note: 'Invalid action' });
  }

  var prepareId = p.merchant_prepare_id;
  var orderId = p.merchant_trans_id;

  var attempt = await PaymentAttempt.findById(prepareId);
  if (!attempt) {
    return res.json({ error: ClickError.TransactionError, error_note: 'Prepare not found' });
  }

  if (attempt.status === 'paid') {
    return res.json({ error: ClickError.AlreadyPaid, error_note: 'Already completed' });
  }

  if (attempt.status === 'cancelled') {
    return res.json({ error: ClickError.TransactionCancelled, error_note: 'Cancelled' });
  }

  var order = await Order.findById(orderId);
  if (!order) {
    return res.json({ error: ClickError.OrderNotFound, error_note: 'Order not found' });
  }

  // Check if Click reports error (p.error < 0 means payment failed on Click side)
  if (Number(p.error) < 0) {
    attempt.status = 'cancelled';
    attempt.cancelTime = new Date();
    await attempt.save();
    return res.json({
      error: ClickError.TransactionCancelled,
      error_note: 'Payment failed on provider side',
    });
  }

  // Payment successful
  attempt.status = 'paid';
  attempt.performTime = new Date();
  attempt.providerTransactionId = String(p.click_paydoc_id || p.click_trans_id);
  await attempt.save();

  // Update order
  order.paymentStatus = 'paid';
  order.paymentMethod = 'click';
  order.paymentId = String(p.click_trans_id);
  order.paidAt = new Date();
  await order.save();

  logger.info('Click payment completed', { orderId: orderId, amount: order.totalPrice });

  if (process.env.TELEGRAM_BOT_TOKEN) {
    var https = require('https');
    var token = process.env.TELEGRAM_BOT_TOKEN;

    var sendTg = function (chatId, text, extra) {
      var body = JSON.stringify(Object.assign({ chat_id: chatId, text: text, parse_mode: 'Markdown', disable_web_page_preview: true }, extra || {}));
      var opts = { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
      var req = https.request('https://api.telegram.org/bot' + token + '/sendMessage', opts, function () { });
      req.on('error', function () { });
      req.write(body);
      req.end();
    };

    // Notify customer
    if (order.telegramId) {
      sendTg(order.telegramId,
        '✅ *Оплата получена (Click)!*\n\n📦 `' + order._id + '`\n💰 ' + order.totalPrice.toLocaleString('ru-RU') + ' сум\n\n⏰ Время доставки сообщит администратор.'
      );
    }

    // Notify admin group with full order card
    var adminGroup = process.env.TELEGRAM_ADMIN_GROUP;
    if (adminGroup) {
      var OrderItem = require('../models/OrderItem');
      OrderItem.find({ order: order._id }).then(function (items) {
        var lines = items.map(function (i) { return '• ' + i.name + ' × ' + i.quantity + ' = ' + (i.price * i.quantity).toLocaleString('ru-RU') + ' сум'; });
        var map = (order.latitude && order.longitude) ? 'https://maps.google.com/?q=' + order.latitude + ',' + order.longitude : null;
        var prem = order.isPremiumOrder ? '👑 *PREMIUM* ' : '';
        var msg = '🟢 ' + prem + '*Оплата получена (Click)*\n\n🆔 `' + order._id + '`\n' +
          '👤 ' + (order.customerName || '—') + '\n📱 ' + (order.customerPhone || '—') + '\n' +
          '� ' + (order.address || '—') + ', ' + (order.district || '—') + '\n' +
          (map ? '🗺️ [Карта](' + map + ')\n' : '') +
          '💰 *' + order.totalPrice.toLocaleString('ru-RU') + ' сум*\n\n🛒 *Товары:*\n' + lines.join('\n');
        var ph = (order.customerPhone || '').replace(/\s/g, '');
        var kb = [[{ text: '✅ Подтвердить', callback_data: 'adm_confirm_' + order._id }, { text: '📞 Позвонить', url: 'tel:' + ph }], [{ text: '🔍 Детали', callback_data: 'adm_detail_' + order._id }, { text: '🚚 Доставлен', callback_data: 'adm_delivered_' + order._id }], [{ text: '❌ Отменить', callback_data: 'adm_cancel_' + order._id }, { text: '📋 Телефон', callback_data: 'adm_phone_' + order._id }]];
        sendTg(adminGroup, msg, { reply_markup: JSON.stringify({ inline_keyboard: kb }) });
      }).catch(function () { });
    }
  }

  return res.json({
    error: ClickError.Success,
    error_note: 'Success',
    click_trans_id: p.click_trans_id,
    merchant_trans_id: orderId,
    merchant_confirm_id: String(attempt._id),
  });
});

module.exports = router;
