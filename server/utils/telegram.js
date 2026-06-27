const https = require('https');

const sendTelegramMessage = async (text, chatId) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const dest = chatId || process.env.TELEGRAM_CHAT_ID;

  if (!token || !dest) return;

  const body = JSON.stringify({
    chat_id: dest,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        res.on('data', () => { });
        res.on('end', resolve);
      }
    );
    req.on('error', (err) => {
      console.error('Telegram notification error:', err.message);
      resolve();
    });
    req.write(body);
    req.end();
  });
};

const formatRequestMessage = (request) => {
  const typeLabels = {
    consultation: '📋 Konsultatsiya',
    'custom-order': '🛒 Maxsus buyurtma',
    calculator: '🔢 Kalkulyator',
    contact: '📞 Bog\'lanish',
  };

  const lines = [
    `🔔 <b>Yangi so'rov!</b>`,
    ``,
    `📌 Turi: <b>${typeLabels[request.type] || request.type}</b>`,
    `👤 Ism: <b>${request.name || '—'}</b>`,
    `📞 Telefon: <b>${request.phone}</b>`,
  ];

  if (request.productModel) lines.push(`📦 Mahsulot: <b>${request.productModel}</b>`);
  if (request.productQuantity) lines.push(`🔢 Miqdor: <b>${request.productQuantity}</b>`);
  if (request.comment) lines.push(`💬 Izoh: <b>${request.comment}</b>`);
  if (request.page) lines.push(`🌐 Sahifa: <b>${request.page}</b>`);
  if (request.image) lines.push(`🖼 Rasm: <a href="${request.image}">Ko'rish</a>`);

  lines.push(``, `🕐 Vaqt: <b>${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}</b>`);

  return lines.join('\n');
};

const formatOrderMessage = (order) => {
  const statusLabels = {
    new: '🆕 Новый',
    processing: '⚙️ В обработке',
    completed: '✅ Выполнен',
    cancelled: '❌ Отменён',
  };

  const lines = [
    `🛒 <b>Новый заказ!</b>`,
    ``,
    `👤 Имя: <b>${order.customerName || '—'}</b>`,
    `📞 Телефон: <b>${order.customerPhone}</b>`,
    `📦 Статус: <b>${statusLabels[order.status] || order.status}</b>`,
    ``,
    `🧾 <b>Товары:</b>`,
  ];

  (order.items || []).forEach((item, i) => {
    lines.push(`  ${i + 1}. ${item.name} × ${item.quantity} = <b>${(item.price * item.quantity).toLocaleString()} so'm</b>`);
  });

  lines.push(``);
  lines.push(`💰 Итого: <b>${order.totalPrice.toLocaleString()} so'm</b>`);
  if (order.comment) lines.push(`💬 Комментарий: <b>${order.comment}</b>`);
  lines.push(``, `🕐 Время: <b>${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}</b>`);

  return lines.join('\n');
};

// Full order card for the admin/orders group (includes items, address, map, payment)
const formatFullOrderMessage = (order, items) => {
  const payLabels = { cash: '💵 Naqd', click: '🔵 Click', payme: '🟢 Payme' };
  const lines = [
    `🛒 <b>Yangi buyurtma!</b>`,
    ``,
    `👤 <b>${order.customerName || '—'}</b>`,
    `📞 ${order.customerPhone || '—'}`,
  ];
  const addr = [order.address, order.district].filter(Boolean).join(', ');
  if (addr) lines.push(`🏠 ${addr}`);
  if (order.latitude && order.longitude) {
    lines.push(`🗺 <a href="https://maps.google.com/?q=${order.latitude},${order.longitude}">Xaritada ko'rish</a>`);
  }
  lines.push(``, `🧾 <b>Mahsulotlar:</b>`);
  (items || []).forEach((it, i) => {
    const isKg = it.unit === 'kg';
    const qtyStr = isKg
      ? (it.quantity >= 1000 ? (it.quantity / 1000) + ' kg' : it.quantity + ' g')
      : it.quantity + ' dona';
    const lineSum = isKg ? Math.round((it.price * it.quantity) / 1000) : it.price * it.quantity;
    lines.push(`  ${i + 1}. ${it.name} — ${qtyStr} = <b>${lineSum.toLocaleString('ru-RU')} so'm</b>`);
  });
  lines.push(``);
  if (order.subTotal) lines.push(`🧮 Mahsulotlar: ${order.subTotal.toLocaleString('ru-RU')} so'm`);
  if (order.deliveryFee) lines.push(`🚚 Yetkazib berish: ${order.deliveryFee.toLocaleString('ru-RU')} so'm`);
  lines.push(`💰 <b>Jami: ${(order.totalPrice || 0).toLocaleString('ru-RU')} so'm</b>`);
  lines.push(`💳 To'lov: <b>${payLabels[order.paymentMethod] || order.paymentMethod || '—'}</b>`);
  if (order.comment) lines.push(`💬 ${order.comment}`);
  lines.push(``, `🆔 <code>${order._id}</code>`);
  lines.push(`🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}`);
  return lines.join('\n');
};

module.exports = { sendTelegramMessage, formatRequestMessage, formatOrderMessage, formatFullOrderMessage };
