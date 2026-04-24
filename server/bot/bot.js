const { Telegraf, Markup } = require('telegraf');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const User = require('../models/User');
const { botState } = require('../config/redis');
const { logger } = require('../config/logger');
const { getPaymeLink, getClickLink } = require('../utils/paymentLinks');

const STATES = {
  GREETING: 'GREETING',  // shown order, waiting for "begin"
  PHONE: 'PHONE',        // waiting for contact share
  REVIEW: 'REVIEW',      // showing order + address, waiting "continue"
  LOCATION: 'LOCATION',  // waiting for location
  CONFIRM: 'CONFIRM',    // showing full summary, waiting confirm/edit/cancel
  PAYMENT: 'PAYMENT',    // showing payment options
  DONE: 'DONE',          // finished
};

function createBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    logger.warn('TELEGRAM_BOT_TOKEN not set — bot disabled');
    return null;
  }

  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  bot.catch(function (err, ctx) {
    logger.error('Bot error', { error: err.message });
    ctx.reply('Произошла ошибка. Попробуйте снова.').catch(function () { });
  });

  // ─────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────

  function fmt(n) {
    return Number(n).toLocaleString('ru-RU');
  }

  async function getOrderLines(orderId) {
    var items = await OrderItem.find({ order: orderId });
    return items.map(function (i) {
      return '• ' + i.name + ' × ' + i.quantity + ' = ' + fmt(i.price * i.quantity) + ' сум';
    });
  }

  async function showConfirmScreen(ctx, order) {
    var lines = await getOrderLines(order._id);
    var map = (order.latitude && order.longitude)
      ? 'https://maps.google.com/?q=' + order.latitude + ',' + order.longitude
      : null;

    var premiumLine = order.isPremiumOrder ? '\n👑 Премиум-цены применены' : '';

    var text =
      '📋 *Подтверждение заказа*\n\n' +
      '👤 Имя: ' + (order.customerName || '—') + '\n' +
      '📱 Телефон: ' + (order.customerPhone || '—') + '\n' +
      '📍 Адрес: ' + (order.address || '—') + '\n' +
      '🏘️ Район: ' + (order.district || '—') + '\n' +
      (map ? '🗺️ [Геолокация](' + map + ')\n' : '🗺️ Геолокация: —\n') +
      '\n🛒 *Товары:*\n' + lines.join('\n') +
      premiumLine + '\n\n' +
      '💰 *Итого: ' + fmt(order.totalPrice) + ' сум*';

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ Подтвердить заказ', 'confirm')],
        [Markup.button.callback('✏️ Изменить геолокацию', 'change_loc')],
        [Markup.button.callback('❌ Отменить заказ', 'cancel')],
      ]),
    });
  }

  async function notifyAdminGroup(botInstance, order, from) {
    var groupId = process.env.TELEGRAM_ADMIN_GROUP;
    if (!groupId) return;

    var lines = await getOrderLines(order._id);
    var map = (order.latitude && order.longitude)
      ? 'https://maps.google.com/?q=' + order.latitude + ',' + order.longitude
      : null;

    var payLabels = { cash: '💵 Наличные при доставке', payme: '💳 Payme', click: '🟢 Click', '': '—' };
    var payStatusLabels = { pending: '⏳ Ожидает', paid: '✅ Оплачено', failed: '❌ Не оплачено', refunded: '↩️ Возврат' };
    var premiumBadge = order.isPremiumOrder ? '👑 *PREMIUM* ' : '';

    var msg =
      '🔔 ' + premiumBadge + '*Новый заказ!*\n\n' +
      '🆔 `' + order._id + '`\n' +
      '👤 ' + (order.customerName || (from && from.first_name) || '—') + '\n' +
      '📱 ' + (order.customerPhone || '—') + '\n' +
      '📍 ' + (order.address || '—') + '\n' +
      '🏘️ ' + (order.district || '—') + '\n' +
      (map ? '🗺️ [Посмотреть на карте](' + map + ')\n' : '') +
      '💳 ' + (payLabels[order.paymentMethod] || '—') + '\n' +
      '💰 ' + (payStatusLabels[order.paymentStatus] || '—') + '\n\n' +
      '🛒 *Товары:*\n' + lines.join('\n') + '\n\n' +
      '💰 *Итого: ' + fmt(order.totalPrice) + ' сум*';

    var adminButtons = [
      [{ text: '✅ Подтвердить', callback_data: 'adm_confirm_' + order._id }],
    ];
    if (order.customerPhone) {
      adminButtons[0].push({ text: '📞 Позвонить', url: 'tel:' + order.customerPhone.replace(/\s/g, '') });
    }
    if (process.env.ADMIN_PANEL_URL) {
      adminButtons.push([{
        text: '🔗 Открыть в панели',
        url: process.env.ADMIN_PANEL_URL + '/admin/orders/' + order._id,
      }]);
    }

    try {
      await botInstance.telegram.sendMessage(groupId, msg, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: adminButtons },
        disable_web_page_preview: true,
      });
    } catch (e) {
      logger.error('Admin notify error', { error: e.message });
    }
  }

  async function notifyAdminUpdate(botInstance, order) {
    var groupId = process.env.TELEGRAM_ADMIN_GROUP;
    if (!groupId) return;

    var payLabels = { cash: '💵 Наличные', payme: '💳 Payme', click: '🟢 Click' };
    var payStatusLabels = { pending: '⏳ Ожидает оплаты', paid: '✅ Оплачено', refunded: '↩️ Возврат' };

    var msg =
      '✅ *Заказ подтверждён клиентом*\n\n' +
      '🆔 `' + order._id + '`\n' +
      '👤 ' + (order.customerName || '—') + '\n' +
      '📱 ' + (order.customerPhone || '—') + '\n' +
      '💳 ' + (payLabels[order.paymentMethod] || order.paymentMethod || '—') + '\n' +
      '💰 ' + (payStatusLabels[order.paymentStatus] || order.paymentStatus) + '\n' +
      '🏷️ *Итого: ' + fmt(order.totalPrice) + ' сум*';

    try {
      await botInstance.telegram.sendMessage(groupId, msg, { parse_mode: 'Markdown' });
    } catch (e) {
      logger.error('Admin update error', { error: e.message });
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // 2.1 /start — entry point from website deep link
  // ─────────────────────────────────────────────────────────────────────
  bot.command('start', async function (ctx) {
    var token = ctx.message.text.split(' ')[1];

    if (!token) {
      // Silent — no message when user just opens bot without order token
      return;
    }

    try {
      var order = await Order.findOne({ deepLinkToken: token });
      if (!order) {
        return ctx.reply('❌ Заказ не найден. Попробуйте создать новый на сайте.');
      }
      if (!order.isTokenValid()) {
        return ctx.reply(
          '⏰ Ссылка истекла (действует 24 часа).\nПожалуйста, оформите новый заказ на сайте.',
          Markup.inlineKeyboard([[Markup.button.url('🛒 На сайт', process.env.SITE_URL || 'https://pneumax.uz')]])
        );
      }
      if (order.paymentStatus === 'paid' || order.status === 'completed') {
        return ctx.reply('✅ Этот заказ уже оплачен и обработан. Спасибо!');
      }
      if (order.status === 'cancelled') {
        return ctx.reply('❌ Этот заказ был отменён. Создайте новый на сайте.');
      }

      order.telegramId = String(ctx.from.id);
      await order.save();

      await botState.setState(ctx.from.id, {
        state: STATES.GREETING,
        orderId: String(order._id),
        token: token,
      });

      var lines = await getOrderLines(order._id);
      var premiumLine = order.isPremiumOrder ? '\n👑 _Применены премиум-цены_' : '';

      await ctx.reply(
        '👋 Здравствуйте, *' + (ctx.from.first_name || 'уважаемый клиент') + '*!\n\n' +
        '📦 *Ваш заказ с сайта:*\n' + lines.join('\n') +
        premiumLine + '\n\n' +
        '� Адрес: ' + (order.address || '—') + '\n' +
        '🏘️ Район: ' + (order.district || '—') + '\n\n' +
        '�💰 *Итого: ' + fmt(order.totalPrice) + ' сум*\n\n' +
        'Нажмите кнопку, чтобы начать оформление.',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🚀 Начать оформление', 'begin')],
          ]),
        }
      );
    } catch (err) {
      logger.error('start error', { error: err.message });
      ctx.reply('Произошла ошибка. Попробуйте снова.');
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // 2.2 Begin → request phone
  // ─────────────────────────────────────────────────────────────────────
  bot.action('begin', async function (ctx) {
    await ctx.answerCbQuery();
    var s = await botState.getState(ctx.from.id);
    if (!s || !s.orderId) {
      return ctx.reply('⚠️ Сессия истекла. Вернитесь на сайт и начните снова.');
    }

    await botState.setState(ctx.from.id, { ...s, state: STATES.PHONE });

    await ctx.reply(
      '📱 *Шаг 1 из 3 — Номер телефона*\n\n' +
      'Нажмите кнопку ниже, чтобы поделиться номером.\n' +
      '⚠️ _Номер будет зафиксирован и не может быть изменён._',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          [Markup.button.contactRequest('📞 Отправить номер телефона')],
          ['❌ Отменить заказ'],
        ]).oneTime().resize(),
      }
    );
  });

  // ─────────────────────────────────────────────────────────────────────
  // 2.2 Phone received
  // ─────────────────────────────────────────────────────────────────────
  bot.on('contact', async function (ctx) {
    var s = await botState.getState(ctx.from.id);
    if (!s || s.state !== STATES.PHONE) return;

    var phone = ctx.message.contact.phone_number;
    if (!phone.startsWith('+')) phone = '+' + phone;

    try {
      var order = await Order.findById(s.orderId);
      if (!order) return ctx.reply('❌ Заказ не найден.');

      order.customerPhone = phone;
      await order.save();

      await User.findOneAndUpdate(
        { telegramId: String(ctx.from.id) },
        { phone: phone, telegramUsername: ctx.from.username || '' },
        { upsert: false }
      );

      await botState.setState(ctx.from.id, { ...s, state: STATES.REVIEW, phone: phone });

      var lines = await getOrderLines(order._id);

      await ctx.reply(
        '✅ *Номер сохранён:* ' + phone + '\n\n' +
        '📋 *Шаг 2 из 3 — Ваш заказ*\n\n' +
        lines.join('\n') + '\n\n' +
        '📍 Адрес: ' + (order.address || '—') + '\n' +
        '🏘️ Район: ' + (order.district || '—') + '\n\n' +
        '💰 *Итого: ' + fmt(order.totalPrice) + ' сум*\n\n' +
        'Далее нужно отправить геолокацию для точной доставки.',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📍 Продолжить — отправить геолокацию', 'ask_location')],
          ]),
        }
      );
    } catch (err) {
      logger.error('contact error', { error: err.message });
      ctx.reply('Ошибка. Попробуйте снова.');
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // 2.4 Ask for location
  // ─────────────────────────────────────────────────────────────────────
  bot.action('ask_location', async function (ctx) {
    await ctx.answerCbQuery();
    var s = await botState.getState(ctx.from.id);
    if (!s) return ctx.reply('⚠️ Сессия истекла.');

    await botState.setState(ctx.from.id, { ...s, state: STATES.LOCATION });

    await ctx.reply(
      '📍 *Шаг 3 из 3 — Геолокация*\n\n' +
      'Нажмите кнопку ниже, чтобы отправить своё местоположение.\n' +
      '🚚 _Курьер приедет по этому адресу._',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          [Markup.button.locationRequest('📍 Отправить геопозицию')],
          ['❌ Отменить заказ'],
        ]).oneTime().resize(),
      }
    );
  });

  // ─────────────────────────────────────────────────────────────────────
  // 2.4 Location received → show confirmation screen
  // ─────────────────────────────────────────────────────────────────────
  bot.on('location', async function (ctx) {
    var s = await botState.getState(ctx.from.id);
    if (!s || !s.orderId) return;

    var lat = ctx.message.location.latitude;
    var lon = ctx.message.location.longitude;

    try {
      var order = await Order.findById(s.orderId);
      if (!order) return ctx.reply('❌ Заказ не найден.');

      order.latitude = lat;
      order.longitude = lon;
      await order.save();

      await botState.setState(ctx.from.id, { ...s, state: STATES.CONFIRM });

      await ctx.reply('✅ Геолокация сохранена!', Markup.removeKeyboard());
      await showConfirmScreen(ctx, order);
    } catch (err) {
      logger.error('location error', { error: err.message });
      ctx.reply('Ошибка. Попробуйте снова.');
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // 2.6 Change location (only location can be changed)
  // ─────────────────────────────────────────────────────────────────────
  bot.action('change_loc', async function (ctx) {
    await ctx.answerCbQuery();
    var s = await botState.getState(ctx.from.id);
    if (!s) return ctx.reply('⚠️ Сессия истекла.');

    await botState.setState(ctx.from.id, { ...s, state: STATES.LOCATION });

    await ctx.reply(
      '📍 Отправьте *новую геолокацию*:',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          [Markup.button.locationRequest('📍 Отправить новую геопозицию')],
          ['❌ Отменить заказ'],
        ]).oneTime().resize(),
      }
    );
  });

  // ─────────────────────────────────────────────────────────────────────
  // 2.5 Confirm → show payment options
  // ─────────────────────────────────────────────────────────────────────
  bot.action('confirm', async function (ctx) {
    await ctx.answerCbQuery();
    var s = await botState.getState(ctx.from.id);
    if (!s) return ctx.reply('⚠️ Сессия истекла.');

    try {
      var order = await Order.findById(s.orderId);
      if (!order) return ctx.reply('❌ Заказ не найден.');

      if (!order.latitude || !order.longitude) {
        return ctx.reply(
          '⚠️ Геолокация не отправлена. Пожалуйста, отправьте местоположение.',
          Markup.inlineKeyboard([[Markup.button.callback('📍 Отправить геолокацию', 'change_loc')]])
        );
      }

      if (!order.customerPhone) {
        return ctx.reply(
          '⚠️ Номер телефона не получен. Начните оформление заново.',
          Markup.inlineKeyboard([[Markup.button.callback('🔄 Начать снова', 'begin')]])
        );
      }

      order.status = 'processing';
      await order.save();

      await botState.setState(ctx.from.id, { ...s, state: STATES.PAYMENT });

      var paymeUrl = getPaymeLink(String(order._id), order.totalPrice);
      var clickUrl = getClickLink(String(order._id), order.totalPrice);

      await ctx.reply(
        '💳 *Выберите способ оплаты*\n\n' +
        '💰 Сумма к оплате: *' + fmt(order.totalPrice) + ' сум*',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.url('💳 Payme', paymeUrl)],
            [Markup.button.url('🟢 Click', clickUrl)],
            [Markup.button.callback('💵 Наличные при доставке', 'pay_cash')],
          ]),
        }
      );

      await notifyAdminGroup(bot, order, ctx.from);
    } catch (err) {
      logger.error('confirm error', { error: err.message });
      ctx.reply('Ошибка. Попробуйте снова.');
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // 2.7 Payment — cash
  // ─────────────────────────────────────────────────────────────────────
  bot.action('pay_cash', async function (ctx) {
    await ctx.answerCbQuery();
    await finishOrder(ctx, 'cash');
  });

  // ─────────────────────────────────────────────────────────────────────
  // 2.8 Finish order helper
  // ─────────────────────────────────────────────────────────────────────
  async function finishOrder(ctx, method) {
    var s = await botState.getState(ctx.from.id);
    if (!s) return;

    try {
      var order = await Order.findById(s.orderId);
      if (!order) return;

      order.paymentMethod = method;
      order.paymentStatus = (method === 'cash') ? 'pending' : 'paid';
      if (method !== 'cash') order.paidAt = new Date();
      await order.save();

      await botState.setState(ctx.from.id, { ...s, state: STATES.DONE });

      var payLabel = { cash: '💵 Наличные при доставке', payme: '💳 Payme', click: '🟢 Click' }[method] || method;

      await ctx.reply(
        '🎉 *Заказ принят!*\n\n' +
        '📦 Номер заказа: `' + order._id + '`\n' +
        '💳 Способ оплаты: ' + payLabel + '\n' +
        (method === 'cash'
          ? '⏳ Оплата при получении\n'
          : '✅ Оплата подтверждена\n') +
        '\n⏰ Время доставки будет сообщено администратором.\n\n' +
        'Спасибо за покупку в *PneuMax*! 🚗',
        {
          parse_mode: 'Markdown',
          ...Markup.removeKeyboard(),
        }
      );

      await notifyAdminUpdate(bot, order);

      setTimeout(function () {
        botState.deleteState(ctx.from.id).catch(function () { });
      }, 3600000);
    } catch (err) {
      logger.error('finishOrder error', { error: err.message });
      ctx.reply('Ошибка при завершении. Свяжитесь с поддержкой.');
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Cancel handlers
  // ─────────────────────────────────────────────────────────────────────
  bot.action('cancel', async function (ctx) {
    await ctx.answerCbQuery('Заказ отменён');
    var s = await botState.getState(ctx.from.id);
    if (s && s.orderId) {
      await Order.findByIdAndUpdate(s.orderId, { status: 'cancelled' }).catch(function () { });
    }
    await botState.deleteState(ctx.from.id).catch(function () { });
    await ctx.reply('❌ Заказ отменён.', Markup.removeKeyboard());
  });

  bot.hears('❌ Отменить заказ', async function (ctx) {
    var s = await botState.getState(ctx.from.id);
    if (s && s.orderId) {
      await Order.findByIdAndUpdate(s.orderId, { status: 'cancelled' }).catch(function () { });
    }
    await botState.deleteState(ctx.from.id).catch(function () { });
    await ctx.reply('❌ Заказ отменён.', Markup.removeKeyboard());
  });

  // ─────────────────────────────────────────────────────────────────────
  // 4. Admin: confirm order from group (sets delivery time)
  // ─────────────────────────────────────────────────────────────────────
  bot.action(/^adm_confirm_(.+)$/, async function (ctx) {
    var orderId = ctx.match[1];
    var adminIds = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').map(function (x) { return x.trim(); });

    if (!adminIds.includes(String(ctx.from.id))) {
      return ctx.answerCbQuery('❌ Нет прав доступа');
    }

    await ctx.answerCbQuery('✅ Открываю...');

    var order = await Order.findById(orderId);
    if (!order) return ctx.reply('❌ Заказ не найден: ' + orderId);

    await botState.setState(String(ctx.from.id), { action: 'ADM_CONFIRM', orderId: String(orderId) }, 600);

    await ctx.reply(
      '� *Заказ:* `' + orderId + '`\n' +
      '👤 ' + (order.customerName || '—') + '\n' +
      '📱 ' + (order.customerPhone || '—') + '\n\n' +
      'Введите *время доставки* в формате:\n`ДД.ММ.ГГГГ ЧЧ:ММ`\n\nПример: `25.04.2026 14:30`',
      { parse_mode: 'Markdown' }
    );
  });

  // Admin text handler — delivery time input
  bot.on('text', async function (ctx) {
    var s = await botState.getState(ctx.from.id);
    if (!s || s.action !== 'ADM_CONFIRM') return;

    var input = ctx.message.text.trim();

    // Parse DD.MM.YYYY HH:MM or YYYY-MM-DD HH:MM
    var dt = null;
    var m1 = input.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);
    var m2 = input.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);

    if (m1) {
      dt = new Date(m1[3] + '-' + m1[2] + '-' + m1[1] + 'T' + m1[4] + ':' + m1[5] + ':00+05:00');
    } else if (m2) {
      dt = new Date(m2[1] + '-' + m2[2] + '-' + m2[3] + 'T' + m2[4] + ':' + m2[5] + ':00+05:00');
    }

    if (!dt || isNaN(dt.getTime())) {
      return ctx.reply('❌ Неверный формат. Используйте: `25.04.2026 14:30`', { parse_mode: 'Markdown' });
    }

    try {
      var order = await Order.findByIdAndUpdate(
        s.orderId,
        { status: 'confirmed', deliveryTime: dt, confirmedAt: new Date() },
        { new: true }
      );

      if (!order) return ctx.reply('❌ Заказ не найден.');

      var dtStr = dt.toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent', dateStyle: 'long', timeStyle: 'short' });

      // Notify customer
      if (order.telegramId) {
        try {
          await bot.telegram.sendMessage(
            order.telegramId,
            '✅ *Ваш заказ подтверждён!*\n\n' +
            '📦 Номер: `' + order._id + '`\n' +
            '📅 Время доставки: *' + dtStr + '*\n\n' +
            'Спасибо за покупку в *PneuMax*! 🚗',
            { parse_mode: 'Markdown' }
          );
        } catch (e) {
          logger.error('customer delivery notify error', { error: e.message });
        }
      }

      await ctx.reply(
        '✅ Заказ `' + order._id + '` подтверждён!\n📅 Доставка: *' + dtStr + '*',
        { parse_mode: 'Markdown' }
      );

      await botState.deleteState(ctx.from.id);
    } catch (err) {
      logger.error('adm confirm error', { error: err.message });
      ctx.reply('Ошибка при подтверждении.');
    }
  });

  return bot;
}

module.exports = { createBot };
