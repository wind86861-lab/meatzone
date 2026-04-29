const { Telegraf, Markup } = require('telegraf');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const TelegramUser = require('../models/TelegramUser');
// const Branch = require('../models/Branch'); // deleted — meatshop has no branches
const Settings = require('../models/Settings');
const { botState, redis } = require('../config/redis');
const { logger } = require('../config/logger');
const { getPaymeLink, getClickLink } = require('../utils/paymentLinks');

const STATES = {
  GREETING: 'GREETING',
  PHONE: 'PHONE',
  REVIEW: 'REVIEW',
  LOCATION: 'LOCATION',
  CONFIRM: 'CONFIRM',
  PAYMENT: 'PAYMENT',
  DONE: 'DONE',
};

function createBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    logger.warn('TELEGRAM_BOT_TOKEN not set — bot disabled');
    return null;
  }

  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmt = (n) => Number(n).toLocaleString('ru-RU');

  const getOwnerIds = () =>
    (process.env.TELEGRAM_OWNER_ID || process.env.TELEGRAM_ADMIN_IDS || '')
      .split(',').map(x => x.trim()).filter(Boolean);

  const getBotAdminIds = async () => {
    const fromEnv = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').map(x => x.trim()).filter(Boolean);
    try {
      const fromDb = await redis.smembers('bot:admins');
      return [...new Set([...fromEnv, ...fromDb])];
    } catch { return fromEnv; }
  };

  const isOwner = (id) => getOwnerIds().includes(String(id));
  const isBotAdmin = async (id) => (await getBotAdminIds()).includes(String(id));
  const canManage = async (id) => isOwner(id) || await isBotAdmin(id);

  const getOrderLines = async (orderId) => {
    const items = await OrderItem.find({ order: orderId });
    return items.map(i => `• ${i.name} × ${i.quantity} = ${fmt(i.price * i.quantity)} сум`);
  };

  const safeNotify = async (telegramId, text, extra = {}) => {
    try {
      await bot.telegram.sendMessage(telegramId, text, { parse_mode: 'Markdown', disable_web_page_preview: true, ...extra });
    } catch (e) {
      if (e.code === 403) await TelegramUser.findOneAndUpdate({ telegramId: String(telegramId) }, { isBanned: true }).catch(() => { });
      logger.warn('safeNotify failed', { telegramId, error: e.message });
    }
  };

  const editAdminMsg = async (order, text) => {
    const gid = process.env.TELEGRAM_ADMIN_GROUP;
    if (!gid || !order.adminMessageId) return;
    try {
      await bot.telegram.editMessageText(gid, Number(order.adminMessageId), null, text, {
        parse_mode: 'Markdown', disable_web_page_preview: true,
      });
    } catch (e) { logger.warn('editAdminMsg failed', { error: e.message }); }
  };

  const showConfirmScreen = async (ctx, order) => {
    const lines = await getOrderLines(order._id);
    const map = order.latitude && order.longitude
      ? `https://maps.google.com/?q=${order.latitude},${order.longitude}` : null;
    const ph = order.customerPhone || '';
    const masked = ph.length >= 4 ? ph.slice(0, -4).replace(/\d/g, '*') + ph.slice(-4) : ph;
    const prem = order.isPremiumOrder ? '\n👑 _Применены премиум-цены_' : '';
    const saved = order.originalTotalPrice > order.totalPrice
      ? `\n💚 _Экономия: ${fmt(order.originalTotalPrice - order.totalPrice)} сум_` : '';
    await ctx.reply(
      `📋 *Подтверждение заказа*\n\n👤 ${order.customerName || '—'}\n📱 ${masked}\n📍 ${order.address || '—'}\n🏘️ ${order.district || '—'}\n` +
      (map ? `🗺️ [Геолокация](${map})\n` : `🗺️ Геолокация: —\n`) +
      `\n🛒 *Товары:*\n${lines.join('\n')}${prem}${saved}\n\n💰 *Итого: ${fmt(order.totalPrice)} сум*`,
      {
        parse_mode: 'Markdown', disable_web_page_preview: true,
        ...Markup.inlineKeyboard([
          [Markup.button.callback('✅ Подтвердить заказ', 'confirm')],
          [Markup.button.callback('✏️ Изменить геолокацию', 'change_loc')],
          [Markup.button.callback('❌ Отменить заказ', 'cancel')],
        ])
      }
    );
  };

  const notifyAdminGroup = async (order, from) => {
    const gid = process.env.TELEGRAM_ADMIN_GROUP;
    if (!gid) return;
    const lines = await getOrderLines(order._id);
    const map = order.latitude && order.longitude
      ? `https://maps.google.com/?q=${order.latitude},${order.longitude}` : null;
    const payL = { cash: '💵 Наличные', payme: '💳 Payme', click: '🟢 Click', '': '—' };
    const prem = order.isPremiumOrder ? '👑 *PREMIUM* ' : '';
    const saved = order.originalTotalPrice > order.totalPrice
      ? `\n💚 _Скидка: ${fmt(order.originalTotalPrice - order.totalPrice)} сум_` : '';
    const msg =
      `🔔 ${prem}*Новый заказ!*\n\n🆔 \`${order._id}\`\n` +
      `👤 ${order.customerName || (from && from.first_name) || '—'}\n` +
      `📱 ${order.customerPhone || '—'}\n📍 ${order.address || '—'}\n🏘️ ${order.district || '—'}\n` +
      (map ? `🗺️ [Карта](${map})\n` : '') +
      `💳 ${payL[order.paymentMethod] || '—'}\n💰 *${fmt(order.totalPrice)} сум*${saved}\n\n🛒 *Товары:*\n${lines.join('\n')}`;
    const ph = (order.customerPhone || '').replace(/\s/g, '');
    const kb = [
      [{ text: '✅ Подтвердить', callback_data: `adm_confirm_${order._id}` },
      { text: '📞 Позвонить', url: `tel:${ph}` }],
      [{ text: '🔍 Детали', callback_data: `adm_detail_${order._id}` },
      { text: '🚚 Доставлен', callback_data: `adm_delivered_${order._id}` }],
      [{ text: '❌ Отменить', callback_data: `adm_cancel_${order._id}` },
      { text: '📋 Телефон', callback_data: `adm_phone_${order._id}` }],
    ];
    if (process.env.ADMIN_PANEL_URL)
      kb.push([{ text: '🔗 Панель', url: `${process.env.ADMIN_PANEL_URL}/admin/orders/${order._id}` }]);
    try {
      const sent = await bot.telegram.sendMessage(gid, msg, {
        parse_mode: 'Markdown', reply_markup: { inline_keyboard: kb }, disable_web_page_preview: true,
      });
      await Order.findByIdAndUpdate(order._id, { adminMessageId: String(sent.message_id) });
    } catch (e) { logger.error('notifyAdminGroup error', { error: e.message }); }
  };

  // ── MIDDLEWARE ────────────────────────────────────────────────────────────

  // Rate limiter — 20 msg/min per user
  bot.use(async (ctx, next) => {
    if (!ctx.from) return next();
    const key = `bot:rate:${ctx.from.id}`;
    try {
      const cnt = await redis.incr(key);
      if (cnt === 1) await redis.expire(key, 60);
      if (cnt > 20) {
        if (cnt === 21) ctx.reply('⚠️ Слишком много сообщений. Подождите минуту.').catch(() => { });
        return;
      }
    } catch { }
    return next();
  });

  // resolve_user — find/create TelegramUser, check banned
  bot.use(async (ctx, next) => {
    if (!ctx.from) return next();
    try {
      let u = await TelegramUser.findOne({ telegramId: String(ctx.from.id) });
      if (!u) {
        u = await TelegramUser.create({
          telegramId: String(ctx.from.id),
          firstName: ctx.from.first_name || '',
          lastName: ctx.from.last_name || '',
          username: ctx.from.username || '',
          languageCode: ctx.from.language_code || 'ru',
        });
      } else {
        u.lastActiveAt = new Date();
        if (ctx.from.username) u.username = ctx.from.username;
        await u.save();
      }
      if (u.isBanned) return; // silently drop banned users
      ctx.tgUser = u;
    } catch (e) { logger.error('resolveUser error', { error: e.message }); }
    return next();
  });

  // check_premium — lazy expiry
  bot.use(async (ctx, next) => {
    if (ctx.tgUser && ctx.tgUser.isPremium && ctx.tgUser.premiumExpiresAt && new Date() > ctx.tgUser.premiumExpiresAt) {
      await TelegramUser.findByIdAndUpdate(ctx.tgUser._id, { isPremium: false }).catch(() => { });
      ctx.tgUser.isPremium = false;
    }
    return next();
  });

  // ── USER FLOW ─────────────────────────────────────────────────────────────

  // ── Main menu keyboard ──────────────────────────────────────────────────
  const SITE = process.env.SITE_URL || 'https://meatzone.uz';

  const mainMenu = Markup.keyboard([
    ['🏢 Kompaniya haqida', '📜 Zakazlar tarixi'],
    ['👤 Mening profilim', '🔒 Parolni o\'zgartirish'],
    ['🌐 Tilni tanlash', '👑 Premium'],
    ['🛒 Do\'konga o\'tish', '📞 Yordam'],
  ]).resize();

  // menu command — show main menu
  bot.command('menu', async (ctx) => {
    return ctx.reply(
      '🏠 *Asosiy menyu*\n\nXush kelibsiz, *' + (ctx.from.first_name || 'foydalanuvchi') + '*!\nQuyidagi tugmalardan birini tanlang 👇',
      { parse_mode: 'Markdown', ...mainMenu }
    );
  });

  // start_handler
  bot.command('start', async (ctx) => {
    const token = ctx.message.text.split(' ')[1];
    if (!token) {
      return ctx.reply(
        '🏠 *Asosiy menyu*\n\nXush kelibsiz, *' + (ctx.from.first_name || 'foydalanuvchi') + '*!\nQuyidagi tugmalardan birini tanlang 👇',
        { parse_mode: 'Markdown', ...mainMenu }
      );
    }
    try {
      const order = await Order.findOne({ deepLinkToken: token });
      if (!order) return ctx.reply('❌ Заказ не найден. Создайте новый на сайте.');
      if (!order.isTokenValid()) return ctx.reply(
        '⏰ Ссылка истекла (24 часа).\nОформите новый заказ на сайте.',
        Markup.inlineKeyboard([[Markup.button.url('🛒 На сайт', (process.env.SITE_URL || 'https://meatzone.uz') + '/catalog')]])
      );
      if (order.paymentStatus === 'paid' || order.status === 'completed') return ctx.reply('✅ Этот заказ уже обработан. Спасибо!');
      if (order.status === 'cancelled') return ctx.reply('❌ Заказ отменён. Создайте новый на сайте.');

      order.telegramId = String(ctx.from.id);
      await order.save();

      const savedPhone = ctx.tgUser && ctx.tgUser.phone;
      await botState.setState(ctx.from.id, { state: STATES.GREETING, orderId: String(order._id), token });

      const lines = await getOrderLines(order._id);
      const prem = order.isPremiumOrder ? '\n👑 _Применены премиум-цены_' : '';
      const saved = order.originalTotalPrice > order.totalPrice
        ? `\n💚 _Экономия: ${fmt(order.originalTotalPrice - order.totalPrice)} сум_` : '';

      await ctx.reply(
        `👋 Здравствуйте, *${ctx.from.first_name || 'уважаемый клиент'}*!\n\n` +
        `📦 *Ваш заказ:*\n${lines.join('\n')}${prem}${saved}\n\n` +
        `📍 ${order.address || '—'} | 🏘️ ${order.district || '—'}\n\n` +
        `💰 *Итого: ${fmt(order.totalPrice)} сум*\n\nНажмите кнопку для начала оформления.`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🚀 Начать оформление', 'begin')]]) }
      );
    } catch (err) {
      logger.error('start error', { error: err.message });
      ctx.reply('Произошла ошибка. Попробуйте снова.');
    }
  });

  // begin — request phone (or skip if already known)
  bot.action('begin', async (ctx) => {
    await ctx.answerCbQuery();
    const s = await botState.getState(ctx.from.id);
    if (!s || !s.orderId) return ctx.reply('⚠️ Сессия истекла. Вернитесь на сайт.');
    if (ctx.tgUser && ctx.tgUser.phone) {
      const order = await Order.findById(s.orderId);
      if (order) { order.customerPhone = ctx.tgUser.phone; await order.save(); }
      await botState.setState(ctx.from.id, { ...s, state: STATES.LOCATION });
      return askLocation(ctx);
    }
    await botState.setState(ctx.from.id, { ...s, state: STATES.PHONE });
    await ctx.reply(
      '📱 *Шаг 1 из 3 — Номер телефона*\n\nНажмите кнопку ниже.\n⚠️ _Номер зафиксируется и не может быть изменён._',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([[Markup.button.contactRequest('📞 Поделиться номером')], ['❌ Отменить заказ']]).oneTime().resize()
      }
    );
  });

  // share_contact
  bot.on('contact', async (ctx) => {
    const s = await botState.getState(ctx.from.id);
    if (!s || s.state !== STATES.PHONE) return;
    let phone = ctx.message.contact.phone_number;
    if (!phone.startsWith('+')) phone = '+' + phone;
    try {
      const order = await Order.findById(s.orderId);
      if (!order) return ctx.reply('❌ Заказ не найден.');
      order.customerPhone = phone; await order.save();
      if (ctx.tgUser) await TelegramUser.findByIdAndUpdate(ctx.tgUser._id, { phone });
      await botState.setState(ctx.from.id, { ...s, state: STATES.LOCATION, phone });
      const lines = await getOrderLines(order._id);
      await ctx.reply(
        `✅ *Номер сохранён:* ${phone}\n\n📋 *Шаг 2 из 3 — Заказ*\n\n${lines.join('\n')}\n\n` +
        `📍 ${order.address || '—'} | 🏘️ ${order.district || '—'}\n\n💰 *Итого: ${fmt(order.totalPrice)} сум*\n\nДалее — геолокация.`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('📍 Продолжить', 'ask_location')]]) }
      );
    } catch (err) { logger.error('contact error', { error: err.message }); ctx.reply('Ошибка. Попробуйте снова.'); }
  });

  const askLocation = async (ctx) => {
    const s = await botState.getState(ctx.from.id);
    await botState.setState(ctx.from.id, { ...s, state: STATES.LOCATION });
    await ctx.reply(
      '📍 *Шаг 3 из 3 — Геолокация*\n\nНажмите кнопку для отправки местоположения.\n🚚 _Курьер приедет по этому адресу._',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([[Markup.button.locationRequest('📍 Отправить геопозицию')], ['❌ Отменить заказ']]).oneTime().resize()
      }
    );
  };

  bot.action('ask_location', async (ctx) => {
    await ctx.answerCbQuery();
    await askLocation(ctx);
  });

  // send_location
  bot.on('location', async (ctx) => {
    const s = await botState.getState(ctx.from.id);
    if (!s || !s.orderId) return;
    const lat = ctx.message.location.latitude, lon = ctx.message.location.longitude;
    try {
      const order = await Order.findById(s.orderId);
      if (!order) return ctx.reply('❌ Заказ не найден.');
      order.latitude = lat; order.longitude = lon; await order.save();
      await botState.setState(ctx.from.id, { ...s, state: STATES.CONFIRM });
      await ctx.reply('✅ Геолокация сохранена!', Markup.removeKeyboard());
      await showConfirmScreen(ctx, order);
    } catch (err) { logger.error('location error', { error: err.message }); ctx.reply('Ошибка. Попробуйте снова.'); }
  });

  // change_location
  bot.action('change_loc', async (ctx) => {
    await ctx.answerCbQuery();
    const s = await botState.getState(ctx.from.id);
    if (!s) return ctx.reply('⚠️ Сессия истекла.');
    await botState.setState(ctx.from.id, { ...s, state: STATES.LOCATION });
    await ctx.reply('📍 Отправьте *новую геолокацию*:', {
      parse_mode: 'Markdown',
      ...Markup.keyboard([[Markup.button.locationRequest('📍 Новая геопозиция')], ['❌ Отменить заказ']]).oneTime().resize()
    });
  });

  // confirm_order → choose_payment
  bot.action('confirm', async (ctx) => {
    await ctx.answerCbQuery();
    const s = await botState.getState(ctx.from.id);
    if (!s) return ctx.reply('⚠️ Сессия истекла.');
    try {
      const order = await Order.findById(s.orderId);
      if (!order) return ctx.reply('❌ Заказ не найден.');
      if (!order.latitude || !order.longitude)
        return ctx.reply('⚠️ Геолокация не отправлена.', Markup.inlineKeyboard([[Markup.button.callback('📍 Отправить', 'change_loc')]]));
      if (!order.customerPhone)
        return ctx.reply('⚠️ Телефон не получен.', Markup.inlineKeyboard([[Markup.button.callback('🔄 Начать снова', 'begin')]]));
      order.status = 'processing'; await order.save();
      await botState.setState(ctx.from.id, { ...s, state: STATES.PAYMENT });
      const paymeUrl = getPaymeLink(String(order._id), order.totalPrice);
      const clickUrl = getClickLink(String(order._id), order.totalPrice);
      await ctx.reply(
        `💳 *Выберите способ оплаты*\n\n💰 К оплате: *${fmt(order.totalPrice)} сум*`,
        {
          parse_mode: 'Markdown', ...Markup.inlineKeyboard([
            [Markup.button.url('💳 Payme', paymeUrl)],
            [Markup.button.url('🟢 Click', clickUrl)],
            [Markup.button.callback('💵 Наличные при доставке', 'pay_cash')],
          ])
        }
      );
      // notifyAdminGroup is called after payment: cash → finishOrder, online → payment webhook
    } catch (err) { logger.error('confirm error', { error: err.message }); ctx.reply('Ошибка. Попробуйте снова.'); }
  });

  // pay_cash
  bot.action('pay_cash', async (ctx) => { await ctx.answerCbQuery(); await finishOrder(ctx, 'cash'); });

  const finishOrder = async (ctx, method) => {
    const s = await botState.getState(ctx.from.id);
    if (!s) return;
    try {
      const order = await Order.findById(s.orderId);
      if (!order) return;
      order.paymentMethod = method;
      order.paymentStatus = method === 'cash' ? 'pending' : 'paid';
      if (method !== 'cash') order.paidAt = new Date();
      await order.save();
      await botState.setState(ctx.from.id, { ...s, state: STATES.DONE });
      const payLabel = { cash: '💵 Наличные при доставке', payme: '💳 Payme', click: '🟢 Click' }[method] || method;
      await ctx.reply(
        `🎉 *Заказ принят!*\n\n📦 Номер: \`${order._id}\`\n💳 ${payLabel}\n` +
        (method === 'cash' ? '⏳ Оплата при получении\n' : '✅ Оплата подтверждена\n') +
        '\n⏰ Время доставки сообщит администратор.\n\nСпасибо за покупку в *MeatZone*! 🥩',
        { parse_mode: 'Markdown', ...Markup.removeKeyboard() }
      );
      // receive_confirmation — notify admin group
      await notifyAdminGroup(order, ctx.from);
      setTimeout(() => botState.deleteState(ctx.from.id).catch(() => { }), 3_600_000);
    } catch (err) { logger.error('finishOrder error', { error: err.message }); ctx.reply('Ошибка. Свяжитесь с поддержкой.'); }
  };

  // cancel (user)
  bot.action('cancel', async (ctx) => {
    await ctx.answerCbQuery('Заказ отменён');
    const s = await botState.getState(ctx.from.id);
    if (s && s.orderId) await Order.findByIdAndUpdate(s.orderId, { status: 'cancelled' }).catch(() => { });
    await botState.deleteState(ctx.from.id).catch(() => { });
    await ctx.reply('❌ Заказ отменён.', Markup.removeKeyboard());
  });
  bot.hears('❌ Отменить заказ', async (ctx) => {
    const s = await botState.getState(ctx.from.id);
    if (s && s.orderId) await Order.findByIdAndUpdate(s.orderId, { status: 'cancelled' }).catch(() => { });
    await botState.deleteState(ctx.from.id).catch(() => { });
    await ctx.reply('❌ Заказ отменён.', Markup.removeKeyboard());
  });

  // ── ADMIN CALLBACKS ───────────────────────────────────────────────────────

  // confirm_order (admin) → set_delivery_time
  bot.action(/^adm_confirm_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌ Нет прав');
    await ctx.answerCbQuery('✅ Открываю...');
    const orderId = ctx.match[1];
    const order = await Order.findById(orderId);
    if (!order) return ctx.reply('❌ Заказ не найден.');
    await botState.setState(String(ctx.from.id), { action: 'ADM_CONFIRM', orderId }, 600);
    await ctx.reply(
      `📋 *Заказ:* \`${orderId}\`\n👤 ${order.customerName || '—'}\n📱 ${order.customerPhone || '—'}\n\n` +
      'Введите *время доставки*:\n`ДД.ММ.ГГГГ ЧЧ:ММ`\n\nПример: `25.04.2026 14:30`',
      { parse_mode: 'Markdown' }
    );
  });

  // view_order_detail
  bot.action(/^adm_detail_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌ Нет прав');
    await ctx.answerCbQuery();
    try {
      const order = await Order.findById(ctx.match[1]);
      if (!order) return ctx.reply('❌ Заказ не найден.');
      const lines = await getOrderLines(order._id);
      const map = order.latitude && order.longitude ? `https://maps.google.com/?q=${order.latitude},${order.longitude}` : null;
      const stL = { new: '🆕 Новый', processing: '⚙️ В обработке', confirmed: '✅ Подтверждён', completed: '🏁 Завершён', cancelled: '❌ Отменён' };
      const pyL = { pending: '⏳ Ожидает', paid: '✅ Оплачено', failed: '❌ Не оплачено', refunded: '↩️ Возврат' };
      await ctx.reply(
        `📋 *Детали заказа*\n\n🆔 \`${order._id}\`\n👤 ${order.customerName || '—'}\n📱 ${order.customerPhone || '—'}\n` +
        `📍 ${order.address || '—'}, ${order.district || '—'}\n` +
        (map ? `🗺️ [Карта](${map})\n` : '') +
        `📦 ${stL[order.status] || order.status}\n💳 ${pyL[order.paymentStatus] || order.paymentStatus}\n` +
        `🕐 ${order.createdAt.toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}\n` +
        (order.deliveryTime ? `🚚 Доставка: ${order.deliveryTime.toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}\n` : '') +
        `\n🛒 *Товары:*\n${lines.join('\n')}\n\n💰 *Итого: ${fmt(order.totalPrice)} сум*`,
        { parse_mode: 'Markdown', disable_web_page_preview: true }
      );
    } catch (e) { ctx.reply('Ошибка: ' + e.message); }
  });

  // mark_delivered
  bot.action(/^adm_delivered_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌ Нет прав');
    await ctx.answerCbQuery('🚚 Помечаю...');
    try {
      const order = await Order.findByIdAndUpdate(ctx.match[1], { status: 'completed' }, { new: true });
      if (!order) return ctx.reply('❌ Заказ не найден.');
      if (order.telegramId) {
        await safeNotify(order.telegramId,
          `🎉 *Ваш заказ доставлен!*\n\n📦 \`${order._id}\`\nСпасибо за покупку в *MeatZone*! 🥩\n[🛒 Новый заказ](${(process.env.SITE_URL || 'https://meatzone.uz') + '/catalog'})`
        );
      }
      await editAdminMsg(order, `🏁 *Заказ доставлен*\n🆔 \`${order._id}\`\n👤 ${order.customerName || '—'}\n💰 ${fmt(order.totalPrice)} сум`);
      await ctx.reply(`✅ Заказ \`${order._id}\` помечен доставленным.`, { parse_mode: 'Markdown' });
    } catch (e) { ctx.reply('Ошибка: ' + e.message); }
  });

  // cancel_order (admin) — ask reason
  bot.action(/^adm_cancel_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌ Нет прав');
    await ctx.answerCbQuery();
    await botState.setState(String(ctx.from.id), { action: 'ADM_CANCEL', orderId: ctx.match[1] }, 300);
    await ctx.reply(`❌ *Отмена заказа* \`${ctx.match[1]}\`\n\nВведите причину отмены:`, { parse_mode: 'Markdown' });
  });

  // view_customer_phone
  bot.action(/^adm_phone_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌ Нет прав');
    await ctx.answerCbQuery();
    const order = await Order.findById(ctx.match[1]);
    if (!order) return ctx.reply('❌ Заказ не найден.');
    const ph = order.customerPhone || '—';
    const tgLink = order.telegramId ? `\n✈️ [Написать в Telegram](tg://user?id=${order.telegramId})` : '';
    await ctx.reply(`📞 *Телефон клиента*\n\n\`${ph}\`${tgLink}`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.url('📞 Позвонить', `tel:${ph.replace(/\s/g, '')}`)]])
    });
  });

  // broadcast confirm/cancel
  bot.action('broadcast_go', async (ctx) => {
    await ctx.answerCbQuery('📢 Отправляю...');
    const s = await botState.getState(ctx.from.id);
    if (!s || !s.text) return;
    await botState.deleteState(ctx.from.id);
    const filter = s.filter === 'premium' ? { isPremium: true } : {};
    const users = await TelegramUser.find({ isBanned: { $ne: true }, ...filter }).select('telegramId');
    let sent = 0, failed = 0;
    for (const u of users) {
      try { await bot.telegram.sendMessage(u.telegramId, s.text, { parse_mode: 'Markdown' }); sent++; }
      catch { failed++; }
      await new Promise(r => setTimeout(r, 40));
    }
    await ctx.reply(`📢 Рассылка завершена!\n✅ Отправлено: ${sent}\n❌ Ошибок: ${failed}`);
  });
  bot.action('broadcast_cancel', async (ctx) => {
    await ctx.answerCbQuery('Отменено');
    await botState.deleteState(ctx.from.id);
    await ctx.reply('❌ Рассылка отменена.');
  });

  // ── Language selection callbacks ──────────────────────────────────────────
  bot.action('lang_uz', async (ctx) => {
    await ctx.answerCbQuery();
    if (ctx.tgUser) await TelegramUser.findByIdAndUpdate(ctx.tgUser._id, { languageCode: 'uz' }).catch(() => { });
    await ctx.editMessageText('✅ Til o\'zgartirildi: *O\'zbek tili* 🇺🇿', { parse_mode: 'Markdown' });
  });
  bot.action('lang_ru', async (ctx) => {
    await ctx.answerCbQuery();
    if (ctx.tgUser) await TelegramUser.findByIdAndUpdate(ctx.tgUser._id, { languageCode: 'ru' }).catch(() => { });
    await ctx.editMessageText('✅ Язык изменён: *Русский* 🇷🇺', { parse_mode: 'Markdown' });
  });
  bot.action('lang_en', async (ctx) => {
    await ctx.answerCbQuery();
    if (ctx.tgUser) await TelegramUser.findByIdAndUpdate(ctx.tgUser._id, { languageCode: 'en' }).catch(() => { });
    await ctx.editMessageText('✅ Language changed: *English* 🇬🇧', { parse_mode: 'Markdown' });
  });

  // ── TEXT HANDLER (multi-state) ────────────────────────────────────────────
  bot.on('text', async (ctx) => {
    const s = await botState.getState(ctx.from.id);
    const input = ctx.message.text.trim();
    if (input.startsWith('/')) return;

    // ── USER MENU BUTTONS ─────────────────────────────────────────────────
    if (input === '🏢 Kompaniya haqida') {
      try {
        const phones = '📱 +998 90 123-45-67';
        const addr = 'Toshkent, Chilonzor tumani';
        const mapUrl = 'https://maps.google.com';
        await ctx.reply(
          '🏢 *MeatZone haqida*\n\n' +
          '📅 Tashkil etilgan: 2023-yil\n\n' +
          '🎯 *Faoliyat:*\nPremium sifatli go\'sht va go\'sht mahsulotlari: mol, qo\'y, tovuq, kolbasa, tayyorlangan taomlar. Yetkazib berish Toshkent bo\'ylab.\n\n' +
          '📞 *Aloqa:*\n' + phones + '\n📧 info@meatzone.uz\n\n' +
          '🕐 Ish vaqti: Dush–Yak 08:00 – 22:00\n\n' +
          '🏠 *Manzil:*\n' + addr,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.url('📍 Xaritada ko\'rish', mapUrl)],
              [Markup.button.url('🌐 Saytga o\'tish', SITE)],
              [Markup.button.url('📩 Telegram kanal', 'https://t.me/meatzone_uz')],
            ])
          }
        );
      } catch (e) {
        await ctx.reply('🏢 *MeatZone*\n\n📞 +998 90 123-45-67\n🌐 ' + SITE, { parse_mode: 'Markdown' });
      }
      return;
    }

    if (input === '📜 Zakazlar tarixi') {
      try {
        const orders = await Order.find({ telegramId: String(ctx.from.id), status: { $ne: 'cancelled' } })
          .sort({ createdAt: -1 }).limit(5);
        if (!orders.length) {
          return ctx.reply('📜 Sizda hali zakazlar yo\'q.\n\nDo\'konga o\'ting va birinchi xaridingizni amalga oshiring! 🛒',
            Markup.inlineKeyboard([[Markup.button.url('🛒 Do\'konga o\'tish', SITE + '/catalog')]]))
        }
        const statusMap = { completed: '✅', confirmed: '🚚', pending: '⏳', processing: '⏳' };
        const lines = orders.map((o, i) => {
          const st = statusMap[o.status] || '📦';
          const d = o.createdAt.toLocaleDateString('ru-RU', { timeZone: 'Asia/Tashkent' });
          return `${i + 1}. ${st} \`${String(o._id).slice(-6)}\` | ${d} | ${fmt(o.totalPrice)} so'm`;
        });
        await ctx.reply(
          '📜 *Zakazlar tarixingiz*\n\n📦 Oxirgi ' + orders.length + ' ta:\n\n' + lines.join('\n'),
          { parse_mode: 'Markdown' }
        );
      } catch (e) { ctx.reply('Xatolik yuz berdi.'); }
      return;
    }

    if (input === '👤 Mening profilim') {
      const u = ctx.tgUser;
      const prem = u && u.isPremium && u.premiumExpiresAt && new Date() < u.premiumExpiresAt;
      const premLine = prem
        ? '👑 Status: *Premium*\n📅 ' + u.premiumExpiresAt.toLocaleDateString('ru-RU', { timeZone: 'Asia/Tashkent' }) + ' gacha'
        : '👤 Status: Oddiy foydalanuvchi';
      const phone = u && u.phone ? u.phone.replace(/(\d{3})\d{5}(\d{2})/, '$1*****$2') : '—';
      const orderCount = await Order.countDocuments({ telegramId: String(ctx.from.id), status: { $ne: 'cancelled' } }).catch(() => 0);
      await ctx.reply(
        '👤 *Mening profilim*\n\n' +
        '📛 Ism: *' + (ctx.from.first_name || '—') + '*\n' +
        '📱 Telefon: ' + phone + '\n' +
        '🆔 Telegram ID: `' + ctx.from.id + '`\n\n' +
        premLine + '\n\n' +
        '📦 Jami zakazlar: *' + orderCount + '* ta',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    if (input === '🔒 Parolni o\'zgartirish') {
      await ctx.reply(
        '🔒 *Parolni o\'zgartirish*\n\nParolni sayt orqali o\'zgartiring:\n\n' + SITE + '/login',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.url('🌐 Saytga o\'tish', SITE + '/login')]])
        }
      );
      return;
    }

    if (input === '🌐 Tilni tanlash') {
      await ctx.reply(
        '🌐 Tilni tanlang / Выберите язык / Choose language',
        Markup.inlineKeyboard([
          [Markup.button.callback('🇺🇿 O\'zbek tili', 'lang_uz')],
          [Markup.button.callback('🇷🇺 Русский язык', 'lang_ru')],
          [Markup.button.callback('🇬🇧 English', 'lang_en')],
        ])
      );
      return;
    }

    if (input === '👑 Premium') {
      const u = ctx.tgUser;
      const prem = u && u.isPremium && u.premiumExpiresAt && new Date() < u.premiumExpiresAt;
      if (prem) {
        const exp = u.premiumExpiresAt.toLocaleDateString('ru-RU', { timeZone: 'Asia/Tashkent' });
        await ctx.reply(
          '👑 *Premium — VIP imtiyozlar*\n\n' +
          '✅ Sizning holatiz: *Premium*\n📅 Amal qiladi: *' + exp + '* gacha\n\n' +
          '🌟 Imtiyozlaringiz:\n• 15% doimiy chegirma\n• Bepul yetkazib berish\n• Tezkor xizmat (birinchi navbat)\n• Maxsus aksiyalar',
          { parse_mode: 'Markdown' }
        );
      } else {
        await ctx.reply(
          '👑 *Premium — VIP imtiyozlar*\n\n' +
          '❌ Sizda hali premium yo\'q\n\n' +
          '🌟 Premium afzalliklari:\n• 15% doimiy chegirma\n• Bepul yetkazib berish\n• Tezkor xizmat\n• Maxsus aksiyalar\n\n' +
          '📞 Premium olish uchun administrator bilan bog\'laning.',
          { parse_mode: 'Markdown' }
        );
      }
      return;
    }

    if (input === '🛒 Do\'konga o\'tish') {
      await ctx.reply(
        '🛒 *MeatZone Do\'koni*\n\nOnlayn do\'konimizga xush kelibsiz!\nQuyidagi tugmani bosib mahsulotlarni ko\'ring 👇',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.url('🛒 Do\'konni ochish', SITE + '/catalog')]])
        }
      );
      return;
    }

    if (input === '📞 Yordam') {
      await ctx.reply(
        '📞 *Yordam markazi*\n\n' +
        '❓ *Tez-tez beriladigan savollar:*\n\n' +
        '1️⃣ Qanday zakaz beraman?\n→ "🛒 Do\'konga o\'tish" tugmasini bosing\n\n' +
        '2️⃣ Zakazimni qanday kuzataman?\n→ "📜 Zakazlar tarixi" bo\'limida\n\n' +
        '3️⃣ Premium qanday olaman?\n→ "👑 Premium" bo\'limida\n\n' +
        '💬 Boshqa savol bo\'lsa:',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.url('📞 Qo\'ng\'iroq qilish', 'tel:+998901234567')],
            [Markup.button.url('📧 Email yuborish', 'mailto:info@meatzone.uz')],
          ])
        }
      );
      return;
    }

    // set_delivery_time
    if (s && s.action === 'ADM_CONFIRM') {
      const m1 = input.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);
      const m2 = input.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
      let dt = null;
      if (m1) dt = new Date(`${m1[3]}-${m1[2]}-${m1[1]}T${m1[4]}:${m1[5]}:00+05:00`);
      else if (m2) dt = new Date(`${m2[1]}-${m2[2]}-${m2[3]}T${m2[4]}:${m2[5]}:00+05:00`);
      if (!dt || isNaN(dt.getTime()))
        return ctx.reply('❌ Неверный формат. Используйте: `25.04.2026 14:30`', { parse_mode: 'Markdown' });
      try {
        const order = await Order.findByIdAndUpdate(s.orderId,
          { status: 'confirmed', deliveryTime: dt, confirmedAt: new Date() }, { new: true });
        if (!order) return ctx.reply('❌ Заказ не найден.');
        const dtStr = dt.toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent', dateStyle: 'long', timeStyle: 'short' });
        if (order.telegramId) {
          await safeNotify(order.telegramId,
            `✅ *Ваш заказ подтверждён!*\n\n📦 \`${order._id}\`\n📅 Доставка: *${dtStr}*\n\nСпасибо за покупку в *MeatZone*! 🥩`);
        }
        await editAdminMsg(order, `✅ *Заказ подтверждён*\n🆔 \`${order._id}\`\n👤 ${order.customerName || '—'}\n📅 ${dtStr}\n💰 ${fmt(order.totalPrice)} сум`);
        await ctx.reply(`✅ Заказ \`${order._id}\` подтверждён!\n📅 ${dtStr}`, { parse_mode: 'Markdown' });
        await botState.deleteState(ctx.from.id);
      } catch (err) { ctx.reply('Ошибка: ' + err.message); }
      return;
    }

    // cancel_order (admin reason input)
    if (s && s.action === 'ADM_CANCEL') {
      try {
        const order = await Order.findByIdAndUpdate(s.orderId,
          { status: 'cancelled', adminNotes: input }, { new: true });
        if (!order) return ctx.reply('❌ Заказ не найден.');
        if (order.telegramId) {
          await safeNotify(order.telegramId,
            `❌ *Ваш заказ отменён*\n\n📦 \`${order._id}\`\n💬 Причина: ${input}\n\nСоздайте новый заказ на сайте.`,
            Markup.inlineKeyboard([[Markup.button.url('🛒 На сайт', (process.env.SITE_URL || 'https://meatzone.uz') + '/catalog')]])
          );
        }
        await editAdminMsg(order, `❌ *Заказ отменён*\n🆔 \`${order._id}\`\n👤 ${order.customerName || '—'}\n💬 ${input}`);
        await ctx.reply(`❌ Заказ \`${order._id}\` отменён.`, { parse_mode: 'Markdown' });
        await botState.deleteState(ctx.from.id);
      } catch (err) { ctx.reply('Ошибка: ' + err.message); }
      return;
    }

    // broadcast text input
    if (s && s.action === 'BROADCAST_INPUT') {
      await botState.setState(String(ctx.from.id), { action: 'BROADCAST_CONFIRM', text: input, filter: s.filter || 'all' }, 300);
      await ctx.reply(`📢 *Предпросмотр рассылки:*\n\n${input}\n\n_Фильтр: ${s.filter || 'all'}_\n\nОтправить?`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('✅ Отправить', 'broadcast_go')],
          [Markup.button.callback('❌ Отмена', 'broadcast_cancel')],
        ])
      });
      return;
    }

    // handle_invalid_input — per-state fallbacks
    if (s) {
      if (s.state === STATES.PHONE)
        return ctx.reply('⚠️ Используйте кнопку для отправки номера.',
          Markup.keyboard([[Markup.button.contactRequest('📞 Поделиться номером')], ['❌ Отменить заказ']]).oneTime().resize());
      if (s.state === STATES.LOCATION)
        return ctx.reply('⚠️ Используйте кнопку для отправки геолокации.',
          Markup.keyboard([[Markup.button.locationRequest('📍 Отправить геопозицию')], ['❌ Отменить заказ']]).oneTime().resize());
      if (s.state === STATES.CONFIRM || s.state === STATES.PAYMENT)
        return ctx.reply('⚠️ Используйте кнопки выше для продолжения.');
    }
  });

  // ── OWNER COMMANDS ────────────────────────────────────────────────────────
  const ownerOnly = (fn) => async (ctx) => {
    if (!isOwner(ctx.from.id)) return ctx.reply('❌ Только для владельца.');
    return fn(ctx);
  };

  // set_premium
  bot.command('setpremium', ownerOnly(async (ctx) => {
    const [, id, dur] = ctx.message.text.split(' ');
    if (!id || !dur) return ctx.reply('Использование: `/setpremium [telegram_id или телефон] [1m|3m|6m|1y]`', { parse_mode: 'Markdown' });
    const days = { '1m': 30, '3m': 90, '6m': 180, '1y': 365 }[dur];
    if (!days) return ctx.reply('❌ Неверный срок. Используйте: `1m`, `3m`, `6m`, `1y`', { parse_mode: 'Markdown' });
    const q = (id.startsWith('+') || /^\d{9,}$/.test(id)) ? { phone: id } : { telegramId: id };
    const u = await TelegramUser.findOneAndUpdate(q, { isPremium: true, premiumExpiresAt: new Date(Date.now() + days * 86_400_000) }, { new: true });
    if (!u) return ctx.reply('❌ Пользователь не найден.');
    const exp = u.premiumExpiresAt.toLocaleDateString('ru-RU', { timeZone: 'Asia/Tashkent' });
    await ctx.reply(`✅ Премиум активирован для @${u.username || u.telegramId}\n📅 До: *${exp}*`, { parse_mode: 'Markdown' });
    await safeNotify(u.telegramId, `👑 *Вам активирован премиум-доступ!*\n\n📅 Действует до: *${exp}*\n\nПользуйтесь скидками на сайте!`);
  }));

  // remove_premium
  bot.command('removepremium', ownerOnly(async (ctx) => {
    const [, id] = ctx.message.text.split(' ');
    if (!id) return ctx.reply('Использование: `/removepremium [telegram_id]`', { parse_mode: 'Markdown' });
    const u = await TelegramUser.findOneAndUpdate({ telegramId: id }, { isPremium: false, premiumExpiresAt: null }, { new: true });
    if (!u) return ctx.reply('❌ Пользователь не найден.');
    await ctx.reply(`✅ Премиум снят с @${u.username || id}`);
  }));

  // list_admins
  bot.command('admins', ownerOnly(async (ctx) => {
    const fromEnv = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').map(x => x.trim()).filter(Boolean);
    const fromDb = await redis.smembers('bot:admins').catch(() => []);
    const all = [...new Set([...fromEnv, ...fromDb])];
    if (!all.length) return ctx.reply('Список администраторов пуст.');
    await ctx.reply(`👥 *Администраторы бота:*\n\n${all.map((id, i) => `${i + 1}. \`${id}\``).join('\n')}`, { parse_mode: 'Markdown' });
  }));

  // add_admin
  bot.command('addadmin', ownerOnly(async (ctx) => {
    const [, id] = ctx.message.text.split(' ');
    if (!id) return ctx.reply('Использование: `/addadmin [telegram_id]`', { parse_mode: 'Markdown' });
    await redis.sadd('bot:admins', id);
    await ctx.reply(`✅ Администратор \`${id}\` добавлен.`, { parse_mode: 'Markdown' });
  }));

  // remove_admin
  bot.command('removeadmin', ownerOnly(async (ctx) => {
    const [, id] = ctx.message.text.split(' ');
    if (!id) return ctx.reply('Использование: `/removeadmin [telegram_id]`', { parse_mode: 'Markdown' });
    await redis.srem('bot:admins', id);
    await ctx.reply(`✅ Администратор \`${id}\` удалён.`, { parse_mode: 'Markdown' });
  }));

  // broadcast
  bot.command('broadcast', ownerOnly(async (ctx) => {
    const filter = ctx.message.text.split(' ')[1] || 'all';
    await botState.setState(String(ctx.from.id), { action: 'BROADCAST_INPUT', filter }, 600);
    await ctx.reply(`📢 *Рассылка* (фильтр: _${filter}_)\n\nВведите текст сообщения:`, { parse_mode: 'Markdown' });
  }));

  // view_stats
  bot.command('stats', ownerOnly(async (ctx) => {
    try {
      const now = new Date();
      const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
      const d7 = new Date(now); d7.setDate(now.getDate() - 7);
      const d30 = new Date(now); d30.setDate(1); d30.setHours(0, 0, 0, 0);
      const [t, w, m, prem, topP, topD, revRes] = await Promise.all([
        Order.countDocuments({ createdAt: { $gte: d0 }, status: { $ne: 'cancelled' } }),
        Order.countDocuments({ createdAt: { $gte: d7 }, status: { $ne: 'cancelled' } }),
        Order.countDocuments({ createdAt: { $gte: d30 }, status: { $ne: 'cancelled' } }),
        TelegramUser.countDocuments({ isPremium: true, premiumExpiresAt: { $gt: now } }),
        OrderItem.aggregate([{ $group: { _id: '$name', tot: { $sum: '$quantity' } } }, { $sort: { tot: -1 } }, { $limit: 5 }]),
        Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: '$district', c: { $sum: 1 } } }, { $sort: { c: -1 } }, { $limit: 3 }]),
        Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: d30 } } }, { $group: { _id: null, tot: { $sum: '$totalPrice' } } }]),
      ]);
      const rev = revRes[0]?.tot || 0;
      await ctx.reply(
        `📊 *Статистика MeatZone*\n\n📅 Сегодня: *${t}* заказов\n📆 Неделя: *${w}*\n🗓️ Месяц: *${m}*\n` +
        `💰 Выручка (месяц): *${fmt(rev)} сум*\n👑 Премиум: *${prem}*\n\n` +
        `🏆 *Топ товаров:*\n${topP.map((p, i) => `${i + 1}. ${p._id} — ${p.tot} шт.`).join('\n') || '—'}\n\n` +
        `📍 *Топ районов:*\n${topD.map((d, i) => `${i + 1}. ${d._id || '—'} — ${d.c}`).join('\n') || '—'}`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) { ctx.reply('Ошибка: ' + e.message); }
  }));

  // ban_user
  bot.command('ban', ownerOnly(async (ctx) => {
    const [, id] = ctx.message.text.split(' ');
    if (!id) return ctx.reply('Использование: `/ban [telegram_id]`', { parse_mode: 'Markdown' });
    await TelegramUser.findOneAndUpdate({ telegramId: id }, { isBanned: true }, { upsert: true, new: true });
    await ctx.reply(`🚫 Пользователь \`${id}\` заблокирован.`, { parse_mode: 'Markdown' });
  }));
  bot.command('unban', ownerOnly(async (ctx) => {
    const [, id] = ctx.message.text.split(' ');
    if (!id) return ctx.reply('Использование: `/unban [telegram_id]`', { parse_mode: 'Markdown' });
    await TelegramUser.findOneAndUpdate({ telegramId: id }, { isBanned: false });
    await ctx.reply(`✅ Пользователь \`${id}\` разблокирован.`, { parse_mode: 'Markdown' });
  }));

  // export_orders
  bot.command('export', ownerOnly(async (ctx) => {
    const parts = ctx.message.text.split(' ');
    const from = parts[1] ? new Date(parts[1]) : new Date(Date.now() - 30 * 86_400_000);
    const to = parts[2] ? new Date(parts[2] + 'T23:59:59') : new Date();
    try {
      const orders = await Order.find({ createdAt: { $gte: from, $lte: to } }).sort({ createdAt: 1 });
      if (!orders.length) return ctx.reply('Заказов за выбранный период не найдено.');
      const hdr = ['ID', 'Дата', 'Имя', 'Телефон', 'Адрес', 'Район', 'Сумма', 'Оплата', 'Статус'].join(';');
      const rows = orders.map(o => [
        o._id, o.createdAt.toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' }),
        (o.customerName || '').replace(/;/g, ','), o.customerPhone || '',
        (o.address || '').replace(/;/g, ','), o.district || '',
        o.totalPrice, o.paymentMethod || '', o.status,
      ].join(';'));
      const csv = '\uFEFF' + [hdr, ...rows].join('\n');
      await ctx.replyWithDocument(
        { source: Buffer.from(csv, 'utf8'), filename: `orders_${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}.csv` },
        { caption: `📊 Экспорт: ${orders.length} заказов` }
      );
    } catch (e) { ctx.reply('Ошибка экспорта: ' + e.message); }
  }));

  // set_bot_settings
  bot.command('settings', ownerOnly(async (ctx) => {
    const parts = ctx.message.text.split(' ');
    if (parts.length === 1) {
      const [cash, minO, ttl] = await Promise.all([
        redis.get('bot:settings:cash_enabled'),
        redis.get('bot:settings:min_order'),
        redis.get('bot:settings:token_ttl'),
      ]);
      return ctx.reply(
        `⚙️ *Настройки бота*\n\ncash\_enabled: *${cash ?? 'true'}*\nmin\_order: *${minO ?? '0'} сум*\ntoken\_ttl: *${ttl ?? '24'} ч*\n\n_Изменить: /settings [ключ] [значение]_`,
        { parse_mode: 'Markdown' }
      );
    }
    const [, key, value] = parts;
    const allowed = ['cash_enabled', 'min_order', 'token_ttl'];
    if (!allowed.includes(key)) return ctx.reply(`❌ Доступные ключи: ${allowed.join(', ')}`);
    await redis.set(`bot:settings:${key}`, value);
    await ctx.reply(`✅ \`${key}\` = \`${value}\``, { parse_mode: 'Markdown' });
  }));

  // ── ERROR HANDLER ─────────────────────────────────────────────────────────
  bot.catch((err, ctx) => {
    logger.error('Bot error', { error: err.message, stack: err.stack });
    ctx.reply('Произошла ошибка. Попробуйте снова.').catch(() => { });
  });

  return bot;
}

module.exports = { createBot };
