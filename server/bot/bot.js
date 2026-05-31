const { Telegraf, Markup } = require('telegraf');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const TelegramUser = require('../models/TelegramUser');
const User = require('../models/User');
const CashHandover = require('../models/CashHandover');
// const Branch = require('../models/Branch'); // deleted — meatshop has no branches
const Settings = require('../models/Settings');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Promo = require('../models/Promo');
const Banner = require('../models/Banner');
const { botState, redis } = require('../config/redis');
const { logger } = require('../config/logger');
const { getPaymeLink, getClickLink } = require('../utils/paymentLinks');
const notifications = require('../services/notifications');

const STATES = {
  GREETING: 'greeting',
  PHONE: 'phone',
  ADDRESS: 'address',
  DISTRICT: 'district',
  LANDMARK: 'landmark',
  CONFIRM: 'confirm',
  PAYMENT: 'payment',
  DONE: 'done',
  ONBOARD_LANG: 'onboard_lang',
  ONBOARD_NAME: 'onboard_name',
  ONBOARD_PHONE: 'onboard_phone',
};

function createBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    logger.warn('TELEGRAM_BOT_TOKEN not set — bot disabled');
    return null;
  }

  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  notifications.setBot(bot);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmt = (n) => Number(n).toLocaleString('ru-RU');

  const getLang = (ctx) => {
    const code = ctx.tgUser?.languageCode || ctx.from?.language_code || 'uz';
    return (code === 'ru' || code === 'uz') ? code : 'uz';
  };

  const dict = {
    uz: {
      welcome: 'Xush kelibsiz',
      menuTitle: '🏠 *Asosiy menyu*\n\nXush kelibsiz, *{name}*!\nQuyidagi tugmalardan birini tanlang 👇',
      orderNotFound: '❌ Buyurtma topilmadi. Saytda yangisini yarating.',
      linkExpired: '⏰ Havola muddati tugagan (24 soat).\nSaytda yangi buyurtma yarating.',
      orderProcessed: '✅ Bu buyurtma allaqachon bajarilgan. Rahmat!',
      orderCancelled: '❌ Buyurtma bekor qilingan. Saytda yangisini yarating.',
      startGreeting: '👋 Salom, *{name}*!\n\n📦 *Sizning buyurtmangiz:*\n{lines}{prem}{saved}\n\n📍 {address} | 🏘️ {district}\n\n💰 *Jami: {total} so\'m*\n\nBoshlash uchun tugmani bosing.',
      startButton: '🚀 Boshlash',
      stepPhone: '📱 *1-qadam — Telefon raqami*\n\nQuyidagi tugmani bosing.\n⚠️ _Raqam saqlanadi va o\'zgartirib bo\'lmaydi._',
      sharePhone: '📞 Raqamni ulashish',
      cancelOrder: '❌ Buyurtmani bekor qilish',
      phoneSaved: '✅ *Raqam saqlandi:* {phone}\n\n📋 *2-qadam — Buyurtma*\n\n{lines}\n\n📍 {address} | 🏘️ {district}\n\n💰 *Jami: {total} so\'m*\n\nKeyingisi — joylashuv.',
      nextStep: '📍 Davom etish',
      stepLocation: '📍 *3-qadam — Joylashuv*\n\nJoylashuvni yuborish tugmasini bosing.\n🚚 _Kuryer shu manzilga yetkazib beradi._',
      sendLocation: '📍 Joylashuvni yuborish',
      locationSaved: '✅ Joylashuv saqlandi!',
      confirmTitle: '📋 *Buyurtmani tasdiqlash*',
      confirmButton: '✅ Buyurtmani tasdiqlash',
      changeLocation: '✏️ Joylashuvni o\'zgartirish',
      cancelButton: '❌ Buyurtmani bekor qilish',
      choosePayment: '💳 *To\'lov usulini tanlang*\n\n💰 To\'lash: *{total} so\'m*',
      payCash: '💵 Yetkazib berishda naqd pul',
      orderAccepted: '🎉 *Buyurtma qabul qilindi!*\n\n📦 Raqam: `{id}`\n💳 {method}\n{paymentStatus}\n\n⏰ Yetkazish vaqtini administrator xabar qiladi.\n\n*MeatZone* dan xarid qilganingiz uchun rahmat! 🥩',
      paymentPending: '⏳ Yetkazib berishda to\'lanadi\n',
      paymentConfirmed: '✅ To\'lov tasdiqlandi\n',
      orderDelivered: '🎉 *Buyurtmangiz yetkazildi!*\n\n📦 `{id}`\n*MeatZone* dan xarid qilganingiz uchun rahmat! 🥩\n[🛒 Yangi buyurtma]({catalog})',
      sessionExpired: '⚠️ Sessiya tugagan. Saytga qaytib kiring.',
      noLocation: '⚠️ Joylashuv yuborilmagan.',
      noPhone: '⚠️ Telefon raqam qabul qilinmagan.',
      sendNewLocation: '📍 Joylashuvni yuborish',
      restart: '🔄 Qayta boshlash',
      newLocation: '📍 Yangi joylashuv',
      newOrder: '🔔 *Yangi buyurtma!*',
      orderDetails: '📋 *Buyurtma tafsilotlari*',
      orderDeliveredAdmin: '🏁 *Buyurtma yetkazildi*',
      cancelOrderAdmin: '❌ *Buyurtmani bekor qilish*',
      enterCancelReason: 'Bekor qilish sababini kiriting:',
      enterDeliveryTime: 'Yetkazish vaqtini kiriting:\n`DD.MM.YYYY HH:MM`\n\nMisol: `25.04.2026 14:30`',
      clientPhone: '📞 *Mijoz telefoni*',
      call: '📞 Qo\'ng\'iroq qilish',
      rateLimit: '⚠️ Juda ko\'p xabar. Bir daqiqa kuting.',
      error: 'Xatolik yuz berdi. Qayta urinib ko\'ring.',
      errorSupport: 'Xatolik. Qo\'llab-quvvatlash bilan bog\'laning.',
      onboardWelcome: '👋 *MeatZone ga xush kelibsiz!*\n\nDavom etish uchun tilni tanlang:',
      onboardLangBtn1: '🇺🇿 O\'zbek tili',
      onboardLangBtn2: '🇷🇺 Русский язык',
      onboardEnterName: '📝 *Ismingizni kiriting:*\n\n_Masalan: Abdulloh, Jasur_',
      onboardSharePhone: '📱 *Telefon raqamingizni ulashing:*\n\nQuyidagi tugmani bosing 👇',
      onboardPhoneBtn: '📞 Raqamni ulashish',
      onboardDone: '✅ *Ro\'yxatdan o\'tdingiz!*\n\nXush kelibsiz, *{name}*! 🎉\n\nQuyidagi menyudan foydalaning 👇',
    },
    ru: {
      welcome: 'Добро пожаловать',
      menuTitle: '🏠 *Главное меню*\n\nДобро пожаловать, *{name}*!\nВыберите одну из кнопок 👇',
      orderNotFound: '❌ Заказ не найден. Создайте новый на сайте.',
      linkExpired: '⏰ Ссылка истекла (24 часа).\nОформите новый заказ на сайте.',
      orderProcessed: '✅ Этот заказ уже обработан. Спасибо!',
      orderCancelled: '❌ Заказ отменён. Создайте новый на сайте.',
      startGreeting: '👋 Здравствуйте, *{name}*!\n\n📦 *Ваш заказ:*\n{lines}{prem}{saved}\n\n📍 {address} | 🏘️ {district}\n\n💰 *Итого: {total} сум*\n\nНажмите кнопку для начала оформления.',
      startButton: '🚀 Начать оформление',
      stepPhone: '📱 *Шаг 1 из 3 — Номер телефона*\n\nНажмите кнопку ниже.\n⚠️ _Номер зафиксируется и не может быть изменён._',
      sharePhone: '📞 Поделиться номером',
      cancelOrder: '❌ Отменить заказ',
      phoneSaved: '✅ *Номер сохранён:* {phone}\n\n📋 *Шаг 2 из 3 — Заказ*\n\n{lines}\n\n📍 {address} | 🏘️ {district}\n\n💰 *Итого: {total} сум*\n\nДалее — геолокация.',
      nextStep: '📍 Продолжить',
      stepLocation: '📍 *Шаг 3 из 3 — Геолокация*\n\nНажмите кнопку для отправки местоположения.\n🚚 _Курьер приедет по этому адресу._',
      sendLocation: '📍 Отправить геопозицию',
      locationSaved: '✅ Геолокация сохранена!',
      confirmTitle: '📋 *Подтверждение заказа*',
      confirmButton: '✅ Подтвердить заказ',
      changeLocation: '✏️ Изменить геолокацию',
      cancelButton: '❌ Отменить заказ',
      choosePayment: '💳 *Выберите способ оплаты*\n\n💰 К оплате: *{total} сум*',
      payCash: '💵 Наличные при доставке',
      orderAccepted: '🎉 *Заказ принят!*\n\n📦 Номер: `{id}`\n💳 {method}\n{paymentStatus}\n\n⏰ Время доставки сообщит администратор.\n\nСпасибо за покупку в *MeatZone*! 🥩',
      paymentPending: '⏳ Оплата при получении\n',
      paymentConfirmed: '✅ Оплата подтверждена\n',
      orderDelivered: '🎉 *Ваш заказ доставлен!*\n\n📦 `{id}`\nСпасибо за покупку в *MeatZone*! 🥩\n[🛒 Новый заказ]({catalog})',
      sessionExpired: '⚠️ Сессия истекла. Вернитесь на сайт.',
      noLocation: '⚠️ Геолокация не отправлена.',
      noPhone: '⚠️ Телефон не получен.',
      sendNewLocation: '📍 Отправить геопозицию',
      restart: '🔄 Начать снова',
      newLocation: '📍 Новая геопозиция',
      newOrder: '🔔 *Новый заказ!*',
      orderDetails: '📋 *Детали заказа*',
      orderDeliveredAdmin: '🏁 *Заказ доставлен*',
      cancelOrderAdmin: '❌ *Отмена заказа*',
      enterCancelReason: 'Введите причину отмены:',
      enterDeliveryTime: 'Введите *время доставки*:\n`ДД.ММ.ГГГГ ЧЧ:ММ`\n\nПример: `25.04.2026 14:30`',
      clientPhone: '📞 *Телефон клиента*',
      call: '📞 Позвонить',
      rateLimit: '⚠️ Слишком много сообщений. Подождите минуту.',
      error: 'Произошла ошибка. Попробуйте снова.',
      errorSupport: 'Ошибка. Свяжитесь с поддержкой.',
      onboardWelcome: '👋 *Добро пожаловать в MeatZone!*\n\nВыберите язык для продолжения:',
      onboardLangBtn1: '🇺🇿 O\'zbek tili',
      onboardLangBtn2: '🇷🇺 Русский язык',
      onboardEnterName: '📝 *Введите ваше имя:*\n\n_Например: Иван, Алексей_',
      onboardSharePhone: '📱 *Поделитесь номером телефона:*\n\nНажмите кнопку ниже 👇',
      onboardPhoneBtn: '📞 Поделиться номером',
      onboardDone: '✅ *Регистрация завершена!*\n\nДобро пожаловать, *{name}*! 🎉\n\nВоспользуйтесь меню ниже 👇',
    }
  };

  const _t = (ctx, key, vars = {}) => {
    const l = getLang(ctx);
    let s = dict[l]?.[key] || dict.uz[key] || key;
    Object.entries(vars).forEach(([k, v]) => { s = s.replaceAll(`{${k}}`, v); });
    return s;
  };

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
  const isBotAdmin = async (id) => {
    const envIds = await getBotAdminIds();
    if (envIds.includes(String(id))) return true;
    // Also check MongoDB TelegramUser.role
    try {
      const u = await TelegramUser.findOne({ telegramId: String(id), role: 'admin' });
      return !!u;
    } catch { return false; }
  };
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
    const l = getLang(ctx);
    const lines = await getOrderLines(order._id);
    const map = order.latitude && order.longitude
      ? `https://maps.google.com/?q=${order.latitude},${order.longitude}` : null;
    const ph = order.customerPhone || '';
    const masked = ph.length >= 4 ? ph.slice(0, -4).replace(/\d/g, '*') + ph.slice(-4) : ph;
    const prem = order.isPremiumOrder ? '\n👑 _' + (l === 'ru' ? 'Применены премиум-цены' : 'Premium narxlar qo\'llandi') + '_' : '';
    const saved = order.originalTotalPrice > order.totalPrice
      ? `\n💚 _` + (l === 'ru' ? 'Экономия' : 'Tejash') + `: ${fmt(order.originalTotalPrice - order.totalPrice)} сум_` : '';
    const mapLabel = l === 'ru' ? '🗺️ [Геолокация]' : '🗺️ [Joylashuv]';
    const noMapLabel = l === 'ru' ? '🗺️ Геолокация: —\n' : '🗺️ Joylashuv: —\n';
    await ctx.reply(
      _t(ctx, 'confirmTitle') + `\n\n👤 ${order.customerName || '—'}\n📱 ${masked}\n📍 ${order.address || '—'}\n🏘️ ${order.district || '—'}\n` +
      (map ? `${mapLabel}(${map})\n` : noMapLabel) +
      `\n🛒 *${l === 'ru' ? 'Товары' : 'Tovarlar'}:*\n${lines.join('\n')}${prem}${saved}\n\n💰 *${l === 'ru' ? 'Итого' : 'Jami'}: ${fmt(order.totalPrice)} сум*`,
      {
        parse_mode: 'Markdown', disable_web_page_preview: true,
        ...Markup.inlineKeyboard([
          [Markup.button.callback(_t(ctx, 'confirmButton'), 'confirm')],
          [Markup.button.callback(_t(ctx, 'changeLocation'), 'change_loc')],
          [Markup.button.callback(_t(ctx, 'cancelButton'), 'cancel')],
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
    const esc = (s) => String(s || '').replace(/[_*\[\]()~`>#+\-=|{}.!]/g, '\\$&');
    const msg =
      `🔔 ${prem}*Новый заказ!*\n\n🆔 \`${order._id}\`\n` +
      `👤 ${esc(order.customerName) || (from && esc(from.first_name)) || '—'}\n` +
      `📱 ${esc(order.customerPhone) || '—'}\n📍 ${esc(order.address) || '—'}\n🏘️ ${esc(order.district) || '—'}\n` +
      (map ? `🗺️ [Карта](${map})\n` : '') +
      `💳 ${payL[order.paymentMethod] || '—'}\n💰 *${fmt(order.totalPrice)} сум*${saved}\n\n🛒 *Товары:*\n${lines.join('\n')}`;
    const ph = (order.customerPhone || '').replace(/\s/g, '');
    const kb = [
      [{ text: '✅ Подтвердить', callback_data: `adm_confirm_${order._id}` },
      { text: '🔍 Детали', callback_data: `adm_detail_${order._id}` }],
      [{ text: '🚚 Доставлен', callback_data: `adm_delivered_${order._id}` },
      { text: '📋 Телефон', callback_data: `adm_phone_${order._id}` }],
      [{ text: '❌ Отменить', callback_data: `adm_cancel_${order._id}` }],
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
        if (cnt === 21) ctx.reply(_t(ctx, 'rateLimit')).catch(() => { });
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

  // ── Role-based menus ────────────────────────────────────────────────────
  const customerMenu = Markup.keyboard([
    ['🏢 Kompaniya haqida', '📜 Zakazlar tarixi'],
    ['👤 Mening profilim', '🌐 Tilni tanlash'],
    ['🛒 Do\'konga o\'tish', '📞 Yordam'],
  ]).resize();

  const driverMenu = Markup.keyboard([
    ['🚚 Mening buyurtmalarim', '📍 Yetkazish tarixi'],
    ['👤 Profilim', '💰 Daromadim'],
  ]).resize();

  const operatorMenu = Markup.keyboard([
    ['📥 Yangi buyurtmalar', '📊 Bugun statistika'],
    ['👤 Profilim', '⚙️ Sozlamalar'],
    ['📞 Yordam'],
  ]).resize();

  const adminMenu = Markup.keyboard([
    ['📋 Buyurtmalar', '📊 Statistika'],
    ['👤 Foydalanuvchilar', '📢 Xabar yuborish'],
    ['📞 Yordam'],
  ]).resize();

  function getMainMenu(ctx) {
    const role = ctx.tgUser?.role || 'customer';
    if (role === 'admin') return adminMenu;
    if (role === 'driver') return driverMenu;
    if (role === 'operator') return operatorMenu;
    return customerMenu;
  }

  // ── Onboarding ────────────────────────────────────────────────────────────
  const startOnboarding = async (ctx, pendingToken = null) => {
    await botState.setState(ctx.from.id, { state: STATES.ONBOARD_LANG, pendingToken });
    await ctx.reply(
      '👋 *MeatZone ga xush kelibsiz! / Добро пожаловать в MeatZone!*\n\nTilni tanlang / Выберите язык:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🇺🇿 O\'zbek tili', 'onb_lang_uz')],
          [Markup.button.callback('🇷🇺 Русский язык', 'onb_lang_ru')],
        ])
      }
    );
  };

  // ── Onboarding guard — blocks all handlers until onboarding is complete ──
  const ONBOARD_STATES = [STATES.ONBOARD_LANG, STATES.ONBOARD_NAME, STATES.ONBOARD_PHONE];

  bot.use(async (ctx, next) => {
    if (!ctx.tgUser || ctx.tgUser.onboardingDone) return next();

    // Let onboarding callbacks pass through to their action handlers
    if (ctx.callbackQuery) {
      const data = ctx.callbackQuery.data || '';
      if (data === 'onb_lang_uz' || data === 'onb_lang_ru') return next();
    }

    const s = await botState.getState(ctx.from.id);

    // Already mid-onboarding — let text/contact handlers process the step
    if (s && ONBOARD_STATES.includes(s.state)) return next();

    // Extract token if user sent /start <token> while not yet onboarded
    let pendingToken = s?.pendingToken || null;
    if (ctx.message?.text?.startsWith('/start ')) {
      pendingToken = ctx.message.text.split(' ')[1] || null;
    }

    return startOnboarding(ctx, pendingToken);
  });

  // ── Onboarding lang actions ───────────────────────────────────────────────
  bot.action('onb_lang_uz', async (ctx) => {
    await ctx.answerCbQuery();
    const s = await botState.getState(ctx.from.id);
    if (ctx.tgUser) { ctx.tgUser.languageCode = 'uz'; await ctx.tgUser.save(); }
    await botState.setState(ctx.from.id, { ...(s || {}), state: STATES.ONBOARD_NAME });
    await ctx.reply(_t(ctx, 'onboardEnterName'), { parse_mode: 'Markdown', ...Markup.removeKeyboard() });
  });

  bot.action('onb_lang_ru', async (ctx) => {
    await ctx.answerCbQuery();
    const s = await botState.getState(ctx.from.id);
    if (ctx.tgUser) { ctx.tgUser.languageCode = 'ru'; await ctx.tgUser.save(); }
    await botState.setState(ctx.from.id, { ...(s || {}), state: STATES.ONBOARD_NAME });
    await ctx.reply(_t(ctx, 'onboardEnterName'), { parse_mode: 'Markdown', ...Markup.removeKeyboard() });
  });

  // ── menu command — show main menu based on role
  bot.command('menu', async (ctx) => {
    const role = ctx.tgUser?.role || 'customer';
    const menu = getMainMenu(ctx);
    let title;
    if (role === 'driver') {
      title = getLang(ctx) === 'ru' ? '🚚 *Панель курьера*' : '🚚 *Kurer paneli*';
    } else if (role === 'operator') {
      title = getLang(ctx) === 'ru' ? '⚙️ *Панель оператора*' : '⚙️ *Operator paneli*';
    } else {
      title = _t(ctx, 'menuTitle', { name: ctx.from.first_name || 'foydalanuvchi' });
    }
    return ctx.reply(title, { parse_mode: 'Markdown', ...menu });
  });

  // /lang command
  bot.command('lang', async (ctx) => {
    await ctx.reply(
      '🌐 *Til / Язык*\n\nTanlang / Выберите:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🇺🇿 O\'zbekcha', 'set_lang_uz'), Markup.button.callback('🇷🇺 Русский', 'set_lang_ru')],
        ])
      }
    );
  });
  bot.action('set_lang_uz', async (ctx) => {
    await ctx.answerCbQuery();
    if (ctx.tgUser) { ctx.tgUser.languageCode = 'uz'; await ctx.tgUser.save(); }
    await ctx.reply('✅ Til o\'zbekchaga o\'zgartirildi!', Markup.removeKeyboard());
  });
  bot.action('set_lang_ru', async (ctx) => {
    await ctx.answerCbQuery();
    if (ctx.tgUser) { ctx.tgUser.languageCode = 'ru'; await ctx.tgUser.save(); }
    await ctx.reply('✅ Язык изменён на русский!', Markup.removeKeyboard());
  });

  // start_handler
  bot.command('start', async (ctx) => {
    const token = ctx.message.text.split(' ')[1];

    // New user — run onboarding first
    if (ctx.tgUser && !ctx.tgUser.onboardingDone) {
      return startOnboarding(ctx, token || null);
    }

    if (!token) {
      return ctx.reply(
        _t(ctx, 'menuTitle', { name: ctx.from.first_name || 'foydalanuvchi' }),
        { parse_mode: 'Markdown', ...getMainMenu(ctx) }
      );
    }
    try {
      const order = await Order.findOne({ deepLinkToken: token });
      if (!order) return ctx.reply(_t(ctx, 'orderNotFound'));
      if (!order.isTokenValid()) return ctx.reply(
        _t(ctx, 'linkExpired'),
        Markup.inlineKeyboard([[Markup.button.url(getLang(ctx) === 'ru' ? '🛒 На сайт' : '🛒 Saytga', (process.env.SITE_URL || 'https://meatzone.uz') + '/catalog')]])
      );
      if (order.paymentStatus === 'paid' || order.status === 'completed') return ctx.reply(_t(ctx, 'orderProcessed'));
      if (order.status === 'cancelled') return ctx.reply(_t(ctx, 'orderCancelled'));

      order.telegramId = String(ctx.from.id);
      await order.save();

      const savedPhone = ctx.tgUser && ctx.tgUser.phone;
      await botState.setState(ctx.from.id, { state: STATES.GREETING, orderId: String(order._id), token });

      const lines = await getOrderLines(order._id);
      const prem = order.isPremiumOrder ? '\n👑 _Применены премиум-цены_' : '';
      const saved = order.originalTotalPrice > order.totalPrice
        ? `\n💚 _Экономия: ${fmt(order.originalTotalPrice - order.totalPrice)} сум_` : '';

      const l = getLang(ctx);
      await ctx.reply(
        _t(ctx, 'startGreeting', {
          name: ctx.from.first_name || (l === 'ru' ? 'уважаемый клиент' : 'hurmatli mijoz'),
          lines: lines.join('\n'),
          prem, saved,
          address: order.address || '—',
          district: order.district || '—',
          total: fmt(order.totalPrice)
        }),
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback(_t(ctx, 'startButton'), 'begin')]]) }
      );
    } catch (err) {
      logger.error('start error', { error: err.message });
      ctx.reply(_t(ctx, 'error'));
    }
  });

  // begin — request phone (or skip if already known)
  bot.action('begin', async (ctx) => {
    await ctx.answerCbQuery();
    const s = await botState.getState(ctx.from.id);
    if (!s || !s.orderId) return ctx.reply(_t(ctx, 'sessionExpired'));
    const order = await Order.findById(s.orderId);
    if (!order) return ctx.reply(_t(ctx, 'orderNotFound'));

    // Auto-fill name from Telegram profile
    if (!order.customerName || !order.customerName.trim()) {
      order.customerName = ctx.from.first_name || ctx.from.username || 'Mijoz';
      await order.save();
    }

    // Check if phone exists, otherwise ask for it
    if (!order.customerPhone && ctx.tgUser && ctx.tgUser.phone) {
      order.customerPhone = ctx.tgUser.phone;
      await order.save();
    }

    if (!order.customerPhone) {
      await botState.setState(ctx.from.id, { ...s, state: STATES.PHONE });
      return ctx.reply(
        _t(ctx, 'stepPhone'),
        {
          parse_mode: 'Markdown',
          ...Markup.keyboard([[Markup.button.contactRequest(_t(ctx, 'sharePhone'))], [_t(ctx, 'cancelOrder')]]).oneTime().resize()
        }
      );
    }

    // Phone exists, check address
    if (!order.address || !order.address.trim()) {
      await botState.setState(ctx.from.id, { ...s, state: STATES.ADDRESS });
      return ctx.reply(
        getLang(ctx) === 'ru' ? '🏠 *Введите адрес доставки:*\n\n_Например: ул. Мустакиллик, дом 25, кв. 10_' : '🏠 *Yetkazib berish manzilini kiriting:*\n\n_Masalan: Mustaqillik ko\'chasi, 25-uy, 10-xonadon_',
        { parse_mode: 'Markdown', ...Markup.removeKeyboard() }
      );
    }

    // Address exists, check district
    if (!order.district || !order.district.trim()) {
      await botState.setState(ctx.from.id, { ...s, state: STATES.DISTRICT });
      return ctx.reply(
        getLang(ctx) === 'ru' ? '� *Введите район:*\n\n_Например: Чиланзар, Юнусабад, Сергели_' : '� *Tumanni kiriting:*\n\n_Masalan: Chilonzor, Yunusobod, Sergeli_',
        { parse_mode: 'Markdown', ...Markup.removeKeyboard() }
      );
    }

    // District exists, check landmark
    if (!order.comment || !order.comment.trim()) {
      await botState.setState(ctx.from.id, { ...s, state: STATES.LANDMARK });
      return ctx.reply(
        getLang(ctx) === 'ru' ? '📍 *Введите ориентир (mo\'jal):*\n\n_Например: рядом с метро Чиланзар, напротив Макро_' : '📍 *Mo\'jalni kiriting:*\n\n_Masalan: Chilonzor metro yonida, Makro ro\'parasida_',
        { parse_mode: 'Markdown', ...Markup.removeKeyboard() }
      );
    }

    // All data exists, proceed to confirmation
    await botState.setState(ctx.from.id, { ...s, state: STATES.CONFIRM });
    return showConfirmScreen(ctx, order);
  });

  // share_contact
  bot.on('contact', async (ctx) => {
    const s = await botState.getState(ctx.from.id);
    if (!s) return;
    let phone = ctx.message.contact.phone_number;
    if (!phone.startsWith('+')) phone = '+' + phone;

    // ── Onboarding phone step ─────────────────────────────────────────────
    if (s.state === STATES.ONBOARD_PHONE) {
      try {
        if (ctx.tgUser) {
          await TelegramUser.findByIdAndUpdate(ctx.tgUser._id, {
            phone,
            onboardingDone: true,
            firstName: s.name || ctx.tgUser.firstName || ctx.from.first_name || '',
          });
        }
        await botState.deleteState(ctx.from.id);
        const displayName = s.name || ctx.from.first_name || 'foydalanuvchi';
        await ctx.reply(
          _t(ctx, 'onboardDone', { name: displayName }),
          { parse_mode: 'Markdown', ...Markup.removeKeyboard() }
        );

        // If user started with an order deep-link, resume it now
        if (s.pendingToken) {
          const order = await Order.findOne({ deepLinkToken: s.pendingToken });
          if (order && order.isTokenValid() && order.paymentStatus !== 'paid' && order.status !== 'cancelled') {
            order.telegramId = String(ctx.from.id);
            if (!order.customerPhone) order.customerPhone = phone;
            if (!order.customerName) order.customerName = displayName;
            await order.save();
            await botState.setState(ctx.from.id, { state: STATES.GREETING, orderId: String(order._id), token: s.pendingToken });
            const lines = await getOrderLines(order._id);
            const l = getLang(ctx);
            const prem = order.isPremiumOrder ? '\n👑 _' + (l === 'ru' ? 'Применены премиум-цены' : 'Premium narxlar qo\'llandi') + '_' : '';
            const saved = order.originalTotalPrice > order.totalPrice
              ? `\n💚 _${l === 'ru' ? 'Экономия' : 'Tejash'}: ${fmt(order.originalTotalPrice - order.totalPrice)} сум_` : '';
            return ctx.reply(
              _t(ctx, 'startGreeting', {
                name: displayName,
                lines: lines.join('\n'),
                prem, saved,
                address: order.address || '—',
                district: order.district || '—',
                total: fmt(order.totalPrice),
              }),
              { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback(_t(ctx, 'startButton'), 'begin')]]) }
            );
          }
        }

        // No pending order — show main menu
        ctx.tgUser = await TelegramUser.findOne({ telegramId: String(ctx.from.id) });
        return ctx.reply(
          _t(ctx, 'menuTitle', { name: displayName }),
          { parse_mode: 'Markdown', ...getMainMenu(ctx) }
        );
      } catch (err) {
        logger.error('onboard contact error', { error: err.message });
        return ctx.reply(_t(ctx, 'error'));
      }
    }

    if (s.state !== STATES.PHONE) return;
    try {
      const order = await Order.findById(s.orderId);
      if (!order) return ctx.reply(_t(ctx, 'orderNotFound'));
      order.customerPhone = phone;

      // Auto-fill name from Telegram profile
      if (!order.customerName || !order.customerName.trim()) {
        order.customerName = ctx.from.first_name || ctx.from.username || 'Mijoz';
      }
      await order.save();
      if (ctx.tgUser) await TelegramUser.findByIdAndUpdate(ctx.tgUser._id, { phone });

      // Check address
      if (!order.address || !order.address.trim()) {
        await botState.setState(ctx.from.id, { ...s, state: STATES.ADDRESS, phone });
        return ctx.reply(
          getLang(ctx) === 'ru' ? '✅ Телефон сохранён!\n\n🏠 *Введите адрес доставки:*\n\n_Например: ул. Мустакиллик, дом 25, кв. 10_' : '✅ Telefon saqlandi!\n\n🏠 *Yetkazib berish manzilini kiriting:*\n\n_Masalan: Mustaqillik ko\'chasi, 25-uy, 10-xonadon_',
          { parse_mode: 'Markdown', ...Markup.removeKeyboard() }
        );
      }

      // Address exists, check district
      if (!order.district || !order.district.trim()) {
        await botState.setState(ctx.from.id, { ...s, state: STATES.DISTRICT, phone });
        return ctx.reply(
          getLang(ctx) === 'ru' ? '✅ Телефон сохранён!\n\n🏙 *Введите район:*\n\n_Например: Чиланзар, Юнусабад, Сергели_' : '✅ Telefon saqlandi!\n\n🏙 *Tumanni kiriting:*\n\n_Masalan: Chilonzor, Yunusobod, Sergeli_',
          { parse_mode: 'Markdown', ...Markup.removeKeyboard() }
        );
      }

      // District exists, check landmark
      if (!order.comment || !order.comment.trim()) {
        await botState.setState(ctx.from.id, { ...s, state: STATES.LANDMARK, phone });
        return ctx.reply(
          getLang(ctx) === 'ru' ? '✅ Телефон сохранён!\n\n📍 *Введите ориентир (mo\'jal):*\n\n_Например: рядом с метро Чиланзар, напротив Макро_' : '✅ Telefon saqlandi!\n\n📍 *Mo\'jalni kiriting:*\n\n_Masalan: Chilonzor metro yonida, Makro ro\'parasida_',
          { parse_mode: 'Markdown', ...Markup.removeKeyboard() }
        );
      }

      // All data exists, go to confirmation
      await botState.setState(ctx.from.id, { ...s, state: STATES.CONFIRM, phone });
      return showConfirmScreen(ctx, order);
    } catch (err) { logger.error('contact error', { error: err.message }); ctx.reply(_t(ctx, 'error')); }
  });

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
      if (!order) return ctx.reply(_t(ctx, 'orderNotFound'));
      order.latitude = lat; order.longitude = lon; await order.save();
      await botState.setState(ctx.from.id, { ...s, state: STATES.CONFIRM });
      await ctx.reply(_t(ctx, 'locationSaved'), Markup.removeKeyboard());
      await showConfirmScreen(ctx, order);
    } catch (err) { logger.error('location error', { error: err.message }); ctx.reply(_t(ctx, 'error')); }
  });

  // change_location
  bot.action('change_loc', async (ctx) => {
    await ctx.answerCbQuery();
    const s = await botState.getState(ctx.from.id);
    if (!s) return ctx.reply(_t(ctx, 'sessionExpired'));
    await botState.setState(ctx.from.id, { ...s, state: STATES.LOCATION });
    await ctx.reply('📍 ' + _t(ctx, 'newLocation') + ':', {
      parse_mode: 'Markdown',
      ...Markup.keyboard([[Markup.button.locationRequest(_t(ctx, 'sendNewLocation')), [_t(ctx, 'cancelOrder')]]]).oneTime().resize()
    });
  });

  // confirm_order → choose_payment
  bot.action('confirm', async (ctx) => {
    await ctx.answerCbQuery();
    const s = await botState.getState(ctx.from.id);
    if (!s) return ctx.reply(_t(ctx, 'sessionExpired'));
    try {
      const order = await Order.findById(s.orderId);
      if (!order) return ctx.reply(_t(ctx, 'orderNotFound'));
      if (!order.latitude || !order.longitude)
        return ctx.reply(_t(ctx, 'noLocation'), Markup.inlineKeyboard([[Markup.button.callback(_t(ctx, 'sendNewLocation'), 'change_loc')]]));
      if (!order.customerPhone)
        return ctx.reply(_t(ctx, 'noPhone'), Markup.inlineKeyboard([[Markup.button.callback(_t(ctx, 'restart'), 'begin')]]));
      order.status = 'processing'; await order.save();
      await botState.setState(ctx.from.id, { ...s, state: STATES.PAYMENT });
      const paymeUrl = getPaymeLink(String(order._id), order.totalPrice);
      const clickUrl = getClickLink(String(order._id), order.totalPrice);
      await ctx.reply(
        _t(ctx, 'choosePayment', { total: fmt(order.totalPrice) }),
        {
          parse_mode: 'Markdown', ...Markup.inlineKeyboard([
            [Markup.button.url('💳 Payme', paymeUrl)],
            [Markup.button.url('🟢 Click', clickUrl)],
            [Markup.button.callback(_t(ctx, 'payCash'), 'pay_cash')],
          ])
        }
      );
      // notifyAdminGroup is called after payment: cash → finishOrder, online → payment webhook
    } catch (err) { logger.error('confirm error', { error: err.message }); ctx.reply(_t(ctx, 'error')); }
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
      const payLabel = { cash: _t(ctx, 'payCash'), payme: '💳 Payme', click: '🟢 Click' }[method] || method;
      const paymentStatus = method === 'cash' ? _t(ctx, 'paymentPending') : _t(ctx, 'paymentConfirmed');
      await ctx.reply(
        _t(ctx, 'orderAccepted', {
          id: order._id,
          method: payLabel,
          paymentStatus
        }),
        { parse_mode: 'Markdown', ...Markup.removeKeyboard() }
      );
      // receive_confirmation — notify admin group
      await notifyAdminGroup(order, ctx.from);

      // ── Broadcast to all Telegram drivers if not yet assigned ──
      if (!order.assignedDriver && !order.driverTelegramId) {
        console.log(`[finishOrder] Broadcasting order ${order._id} to drivers`);
        const items = await OrderItem.find({ order: order._id }).lean();
        const sent = await notifications.notifyDriversOfNewOrder(order, items);
        console.log(`[finishOrder] Driver broadcast result: ${sent.length} drivers notified`);
        if (sent.length) {
          await redis.setex(`order:${order._id}:driver_notif`, 3600, JSON.stringify(sent));
        }
      } else {
        console.log(`[finishOrder] Skipping driver broadcast: assignedDriver=${order.assignedDriver}, driverTelegramId=${order.driverTelegramId}`);
      }

      setTimeout(() => botState.deleteState(ctx.from.id).catch(() => { }), 3_600_000);
    } catch (err) { logger.error('finishOrder error', { error: err.message }); ctx.reply(_t(ctx, 'errorSupport')); }
  };

  // cancel (user)
  bot.action('cancel', async (ctx) => {
    await ctx.answerCbQuery(_t(ctx, 'cancelButton'));
    const s = await botState.getState(ctx.from.id);
    if (s && s.orderId) await Order.findByIdAndUpdate(s.orderId, { status: 'cancelled' }).catch(() => { });
    await botState.deleteState(ctx.from.id).catch(() => { });
    await ctx.reply('❌ ' + _t(ctx, 'cancelButton'), Markup.removeKeyboard());
  });
  bot.hears(['❌ Отменить заказ', '❌ Buyurtmani bekor qilish'], async (ctx) => {
    const s = await botState.getState(ctx.from.id);
    if (s && s.orderId) await Order.findByIdAndUpdate(s.orderId, { status: 'cancelled' }).catch(() => { });
    await botState.deleteState(ctx.from.id).catch(() => { });
    await ctx.reply('❌ ' + _t(ctx, 'cancelButton'), Markup.removeKeyboard());
  });

  // ── ADMIN CALLBACKS ───────────────────────────────────────────────────────

  // confirm_order (admin) → set_delivery_time
  bot.action(/^adm_confirm_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌ Нет прав');
    await ctx.answerCbQuery('✅ Открываю...');
    const orderId = ctx.match[1];
    const order = await Order.findById(orderId);
    if (!order) return ctx.reply('❌ Заказ не найден.');
    const esc = (s) => String(s || '').replace(/[_*\[\]()~`>#+\-=|{}.!]/g, '\\$&');
    await botState.setState(String(ctx.from.id), { action: 'ADM_CONFIRM', orderId }, 600);
    await ctx.reply(
      `📋 *Заказ:* \`${orderId}\`\n👤 ${esc(order.customerName) || '—'}\n📱 ${esc(order.customerPhone) || '—'}\n\n` +
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
      const esc = (s) => String(s || '').replace(/[_*\[\]()~`>#+\-=|{}.!]/g, '\\$&');
      await ctx.reply(
        `📋 *Детали заказа*\n\n🆔 \`${order._id}\`\n👤 ${esc(order.customerName) || '—'}\n📱 ${esc(order.customerPhone) || '—'}\n` +
        `📍 ${esc(order.address) || '—'}, ${esc(order.district) || '—'}\n` +
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
        const u = await TelegramUser.findOne({ telegramId: order.telegramId });
        const l = (u?.languageCode === 'ru' || u?.languageCode === 'uz') ? u.languageCode : 'uz';
        const msg = dict[l].orderDelivered.replace('{id}', order._id).replace('{catalog}', (process.env.SITE_URL || 'https://meatzone.uz') + '/catalog');
        await safeNotify(order.telegramId, msg);
      }
      const esc = (s) => String(s || '').replace(/[_*\[\]()~`>#+\-=|{}.!]/g, '\\$&');
      await editAdminMsg(order, `🏁 *Заказ доставлен*\n🆔 \`${order._id}\`\n👤 ${esc(order.customerName) || '—'}\n💰 ${fmt(order.totalPrice)} сум`);
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
      ...Markup.inlineKeyboard([[Markup.button.url('📞 Позвонить', `https://t.me/+${ph.replace(/\D/g, '')}`)]])
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

  // ── DRIVER ORDER ACTIONS ────────────────────────────────────────────────
  // First-come-first-served order acceptance
  bot.action(/^accept_order:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const orderId = ctx.match[1];
    const tgUser = ctx.tgUser;
    if (!tgUser || tgUser.role !== 'driver') {
      return ctx.reply('⚠️ Bu amal faqat kurerlar uchun.');
    }

    try {
      // Find the User that matches this Telegram driver
      const driverUser = await User.findOne({ telegramId: String(tgUser.telegramId), role: 'driver' });

      // Atomic update — only succeeds if no driver assigned yet
      const order = await Order.findOneAndUpdate(
        {
          _id: orderId,
          status: { $in: ['confirmed', 'processing'] },
          assignedDriver: null,
          driverTelegramId: null,
        },
        {
          assignedDriver: driverUser ? driverUser._id : null,
          driverTelegramId: String(tgUser.telegramId),
          deliveryStatus: 'assigned',
        },
        { new: true }
      );

      if (!order) {
        // Already taken by another driver
        const taken = await Order.findById(orderId);
        if (taken && (taken.assignedDriver || taken.driverTelegramId)) {
          return ctx.editMessageText(
            `⚠️ *Bu buyurtma allaqachon olingan*\n\n` +
            `Boshqa buyurtma paydo bo'lganda sizni xabardor qilamiz.`,
            { parse_mode: 'Markdown' }
          );
        }
        return ctx.reply('❌ Buyurtma topilmadi yoki hali tasdiqlanmagan.');
      }

      // WINNER — send confirmation with next actions
      await ctx.editMessageText(
        `🎉 *Siz buyurtmani oldingiz!*\n\n` +
        `👤 ${order.customerName || '—'}\n` +
        `📱 ${order.customerPhone || '—'}\n` +
        `📍 ${order.address || '—'}${order.district ? ' (' + order.district + ')' : ''}\n` +
        `💰 ${fmt(order.totalPrice)} so'm\n\n` +
        `Tez orada yetkazib berishni boshlang.`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🚚 Yetkazishni boshlash', `start_delivery:${orderId}`)],
          ]),
        }
      );

      // Notify other drivers (async, don't block)
      const sentList = await redis.get(`order:${orderId}:driver_notif`);
      if (sentList) {
        const list = JSON.parse(sentList);
        const bot = notifications.getBot();
        for (const n of list) {
          if (String(n.telegramId) === String(tgUser.telegramId)) continue;
          try {
            if (bot) {
              await bot.telegram.editMessageText(
                n.telegramId,
                n.messageId,
                undefined,
                `⚠️ *Bu buyurtma allaqachon olingan*\n\nBoshqa buyurtma paydo bo'lganda sizni xabardor qilamiz.`,
                { parse_mode: 'Markdown' }
              );
            }
          } catch (editErr) {
            logger.warn('edit loser msg failed', { to: n.telegramId, msg: n.messageId, err: editErr.message });
          }
        }
      }
    } catch (err) {
      logger.error('accept_order error', { error: err.message, orderId });
      ctx.reply('❌ Xatolik yuz berdi. Qayta urinib ko\'ring.');
    }
  });

  bot.action(/^start_delivery:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const orderId = ctx.match[1];
    const tgUser = ctx.tgUser;
    if (!tgUser || tgUser.role !== 'driver') return ctx.reply('⚠️ Faqat kurerlar uchun.');

    try {
      const order = await Order.findOneAndUpdate(
        {
          _id: orderId,
          driverTelegramId: String(tgUser.telegramId),
          deliveryStatus: 'assigned',
        },
        { deliveryStatus: 'in_transit' },
        { new: true }
      );

      if (!order) return ctx.reply('❌ Buyurtma topilmadi yoki sizga tegishli emas.');

      await ctx.editMessageText(
        `🚚 *Yetkazish boshlandi!*\n\n` +
        `📍 ${order.address || '—'}${order.district ? ' (' + order.district + ')' : ''}\n` +
        `👤 ${order.customerName || '—'}\n` +
        `📱 ${order.customerPhone || '—'}\n\n` +
        `Yetkazib berib bo'lgach, "Yetkazildi" ni bosing.`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('✅ Yetkazildi', `mark_delivered:${orderId}`)],
          ]),
        }
      );
    } catch (err) {
      logger.error('start_delivery error', { error: err.message, orderId });
      ctx.reply('❌ Xatolik yuz berdi.');
    }
  });

  bot.action(/^mark_delivered:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const orderId = ctx.match[1];
    const tgUser = ctx.tgUser;
    if (!tgUser || tgUser.role !== 'driver') return ctx.reply('⚠️ Faqat kurerlar uchun.');

    try {
      const order = await Order.findOneAndUpdate(
        {
          _id: orderId,
          driverTelegramId: String(tgUser.telegramId),
          deliveryStatus: 'in_transit',
        },
        { deliveryStatus: 'delivered', status: 'completed' },
        { new: true }
      );

      if (!order) return ctx.reply('❌ Buyurtma topilmadi yoki sizga tegishli emas.');

      // If COD order, ask if cash was collected
      if (order.paymentMethod === 'cash' && !order.cashCollected) {
        await ctx.editMessageText(
          `✅ *Buyurtma yetkazildi!*\n\n` +
          `💰 ${fmt(order.totalPrice)} so'm\n\n` +
          `Naqd pul oldingizmi?`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('✅ Ha, oldim', `cash_collected:${orderId}`)],
              [Markup.button.callback('❌ Yo\'q, olmadim', `cash_not_collected:${orderId}`)],
            ]),
          }
        );
      } else {
        await ctx.editMessageText(
          `✅ *Buyurtma yetkazildi!*\n\n` +
          `💰 ${fmt(order.totalPrice)} so'm\n\n` +
          `Rahmat! Yana buyurtmalar kuting.`,
          { parse_mode: 'Markdown' }
        );
      }

      // Notify customer
      if (order.telegramId) {
        const u = await TelegramUser.findOne({ telegramId: order.telegramId });
        const l = (u?.languageCode === 'ru') ? 'ru' : 'uz';
        const msg = dict[l].orderDelivered.replace('{id}', order._id).replace('{catalog}', (process.env.SITE_URL || 'https://meatzone.uz') + '/catalog');
        await safeNotify(order.telegramId, msg);
      }

      // Notify admin group
      const gid = process.env.TELEGRAM_ADMIN_GROUP;
      if (gid) {
        const driverName = `${tgUser.firstName || ''} @${tgUser.username || tgUser.telegramId}`.trim();
        await editAdminMsg(order, `🏁 *Доставлен курьером*\n🆔 \`${order._id}\`\n👤 ${order.customerName || '—'}\n🚚 Курьер: ${driverName}\n💰 ${fmt(order.totalPrice)} сум`);
        try {
          await bot.telegram.sendMessage(gid,
            `✅ *Заказ доставлен!*\n\n🆔 \`${order._id}\`\n👤 ${order.customerName || '—'}\n📱 ${order.customerPhone || '—'}\n🚚 Курьер: ${driverName}\n💰 *${fmt(order.totalPrice)} сум*`,
            { parse_mode: 'Markdown' }
          );
        } catch (e) { logger.warn('admin group notify failed', { error: e.message }); }
      }
    } catch (err) {
      logger.error('mark_delivered error', { error: err.message, orderId });
      ctx.reply('❌ Xatolik yuz berdi.');
    }
  });

  // Handle cash collected confirmation
  bot.action(/^cash_collected:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery('✅ Tasdiqlandi');
    const orderId = ctx.match[1];
    try {
      await Order.findByIdAndUpdate(orderId, {
        cashCollected: true,
        cashCollectedAt: new Date(),
      });
      await ctx.editMessageText(
        `✅ *Buyurtma yetkazildi!*\n\n` +
        `💵 Naqd pul qabul qilindi: *${fmt((await Order.findById(orderId)).totalPrice)} so'm*\n\n` +
        `Rahmat! Yana buyurtmalar kuting.`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) { logger.error('cash_collected error', { error: e.message }); }
  });

  bot.action(/^cash_not_collected:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery('⚠️ Belgilandi');
    const orderId = ctx.match[1];
    try {
      await Order.findByIdAndUpdate(orderId, {
        cashCollected: false,
      });
      await ctx.editMessageText(
        `✅ *Buyurtma yetkazildi!*\n\n` +
        `⚠️ Naqd pul olinmadi.\n\n` +
        `Rahmat! Yana buyurtmalar kuting.`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) { logger.error('cash_not_collected error', { error: e.message }); }
  });

  // ── CASH HANDOVER SUBMISSION ──────────────────────────────────────────────
  bot.action('submit_cash_handover', async (ctx) => {
    await ctx.answerCbQuery();
    const tgUser = ctx.tgUser;
    if (!tgUser || tgUser.role !== 'driver') return ctx.reply('⚠️ Faqat kurerlar uchun.');

    try {
      const driverUser = await User.findOne({ telegramId: String(tgUser.telegramId), role: 'driver' });
      const orConditions = [
        { driverTelegramId: String(tgUser.telegramId) },
      ];
      if (driverUser) {
        orConditions.push({ assignedDriver: driverUser._id });
      }

      const cashOrders = await Order.find({
        $or: orConditions,
        status: 'completed',
        paymentMethod: 'cash',
        cashCollected: true,
        cashHandedOver: false,
      });

      if (!cashOrders.length) {
        return ctx.reply('📭 Topshirish uchun pul yo\'q.');
      }

      const totalAmount = cashOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
      const orderIds = cashOrders.map(o => o._id);

      // Create cash handover record
      const handover = await CashHandover.create({
        courier: driverUser?._id || null,
        courierTelegramId: String(tgUser.telegramId),
        courierName: tgUser.firstName || tgUser.username || 'Kurer',
        submittedAmount: totalAmount,
        expectedAmount: totalAmount,
        orders: orderIds,
        orderCount: cashOrders.length,
        status: 'pending',
        periodStart: cashOrders[cashOrders.length - 1].createdAt,
        periodEnd: cashOrders[0].createdAt,
      });

      // Mark orders as handed over
      await Order.updateMany(
        { _id: { $in: orderIds } },
        { cashHandedOver: true, handoverRef: handover._id }
      );

      await ctx.editMessageText(
        `✅ *Pul topshirildi!*\n\n` +
        `💵 Jami: *${fmt(totalAmount)} so'm*\n` +
        `📦 Buyurtmalar: ${cashOrders.length} ta\n\n` +
        `⏳ Admin tasdiqlashini kuting.`,
        { parse_mode: 'Markdown' }
      );

      // Notify admin group
      const gid = process.env.TELEGRAM_ADMIN_GROUP;
      if (gid) {
        const driverName = `${tgUser.firstName || ''} @${tgUser.username || tgUser.telegramId}`.trim();
        await bot.telegram.sendMessage(gid,
          `💵 *Kurer pul topshirdi*\n\n` +
          `🚚 Kurer: ${driverName}\n` +
          `💰 Summa: *${fmt(totalAmount)} so'm*\n` +
          `📦 Buyurtmalar: ${cashOrders.length} ta\n` +
          `🆔 Handover ID: \`${handover._id}\`\n\n` +
          `⏳ Tasdiqlanishi kerak.`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('✅ Tasdiqlash', `confirm_handover:${handover._id}`)],
              [Markup.button.callback('❌ Rad etish', `reject_handover:${handover._id}`)],
            ]),
          }
        );
      }
    } catch (err) {
      logger.error('submit_cash_handover error', { error: err.message });
      ctx.reply('❌ Xatolik yuz berdi.');
    }
  });

  // Admin confirms cash handover
  bot.action(/^confirm_handover:(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌ Ruxsat yo\'q');
    await ctx.answerCbQuery('✅ Tasdiqlanmoqda...');
    const handoverId = ctx.match[1];

    try {
      const handover = await CashHandover.findByIdAndUpdate(
        handoverId,
        {
          status: 'confirmed',
          confirmedAt: new Date(),
          confirmedBy: ctx.from.id,
          confirmedByName: `${ctx.from.first_name || ''} @${ctx.from.username || ctx.from.id}`.trim(),
        },
        { new: true }
      );

      if (!handover) return ctx.reply('❌ Topilmadi.');

      await ctx.editMessageText(
        `✅ *Pul qabul qilindi*\n\n` +
        `🚚 Kurer: ${handover.courierName}\n` +
        `💰 Summa: *${fmt(handover.submittedAmount)} so'm*\n` +
        `📦 Buyurtmalar: ${handover.orderCount} ta\n` +
        `✅ Tasdiqlagan: ${handover.confirmedByName}`,
        { parse_mode: 'Markdown' }
      );

      // Notify courier
      await bot.telegram.sendMessage(
        handover.courierTelegramId,
        `✅ *Pul qabul qilindi!*\n\n` +
        `💵 ${fmt(handover.submittedAmount)} so'm tasdiqlandi.\n\n` +
        `Rahmat!`,
        { parse_mode: 'Markdown' }
      ).catch(() => { });
    } catch (err) {
      logger.error('confirm_handover error', { error: err.message });
      ctx.reply('❌ Xatolik yuz berdi.');
    }
  });

  // Admin rejects cash handover
  bot.action(/^reject_handover:(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌ Ruxsat yo\'q');
    await ctx.answerCbQuery('❌ Rad etilmoqda...');
    const handoverId = ctx.match[1];

    try {
      const handover = await CashHandover.findByIdAndUpdate(
        handoverId,
        {
          status: 'rejected',
          confirmedAt: new Date(),
          confirmedBy: ctx.from.id,
          confirmedByName: `${ctx.from.first_name || ''} @${ctx.from.username || ctx.from.id}`.trim(),
        },
        { new: true }
      );

      if (!handover) return ctx.reply('❌ Topilmadi.');

      // Unmark orders
      await Order.updateMany(
        { _id: { $in: handover.orders } },
        { cashHandedOver: false, handoverRef: null }
      );

      await ctx.editMessageText(
        `❌ *Pul rad etildi*\n\n` +
        `🚚 Kurer: ${handover.courierName}\n` +
        `💰 Summa: ${fmt(handover.submittedAmount)} so'm\n` +
        `❌ Rad etgan: ${handover.confirmedByName}`,
        { parse_mode: 'Markdown' }
      );

      // Notify courier
      await bot.telegram.sendMessage(
        handover.courierTelegramId,
        `❌ *Pul rad etildi*\n\n` +
        `💵 ${fmt(handover.submittedAmount)} so'm rad etildi.\n\n` +
        `Iltimos, admin bilan bog\'laning.`,
        { parse_mode: 'Markdown' }
      ).catch(() => { });
    } catch (err) {
      logger.error('reject_handover error', { error: err.message });
      ctx.reply('❌ Xatolik yuz berdi.');
    }
  });

  // ── DRIVER ORDER DETAILS ────────────────────────────────────────────────
  bot.action(/^driver_order:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const orderId = ctx.match[1];
    try {
      const order = await Order.findById(orderId).populate('assignedDriver', 'name phone');
      if (!order) return ctx.reply('❌ Buyurtma topilmadi.');

      // Verify this driver owns the order
      const driverUser = await User.findOne({ telegramId: String(ctx.tgUser.telegramId), role: 'driver' });
      const isOwner = (
        (driverUser && String(order.assignedDriver?._id) === String(driverUser._id)) ||
        String(order.driverTelegramId) === String(ctx.tgUser.telegramId)
      );
      if (!isOwner) return ctx.reply('⚠️ Sizga bu buyurtma tegishli emas.');

      const items = await OrderItem.find({ order: order._id });
      const esc = (s) => String(s || '').replace(/[_*\[\]()~`>#+\-=|{}.!]/g, '\\$&');

      const itemLines = items.map(i => `• ${esc(i.name)} × ${i.quantity} = ${fmt(i.price * i.quantity)} so'm`).join('\n');

      const mapLink = (order.latitude && order.longitude)
        ? `https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}`
        : null;

      const distLine = order.distance !== null && order.distance !== undefined
        ? `🛣️ *${order.distance} km* ~${order.duration || '—'}\n` : '';
      const feeLine = order.deliveryFee > 0 && !order.isFreeDelivery
        ? `💵 Yetkazib berish: *${fmt(order.deliveryFee)} so'm*\n` : '';
      const freeLine = order.isFreeDelivery
        ? `💵 Yetkazib berish: *Bepul*\n` : '';

      const text =
        `📋 *Buyurtma #${String(order._id).slice(-6)}*\n\n` +
        `👤 *${esc(order.customerName) || '—'}*\n` +
        `📱 ${esc(order.customerPhone) || '—'}\n` +
        `📍 ${esc(order.address) || '—'}${order.district ? ' (' + esc(order.district) + ')' : ''}\n` +
        `${distLine}${feeLine}${freeLine}` +
        `💰 *Jami: ${fmt(order.totalPrice)} so'm*\n\n` +
        `*Mahsulotlar:*\n${itemLines}\n\n` +
        `🏷 Holat: ${order.deliveryStatus === 'in_transit' ? '🚚 Yo\'lda' : (order.deliveryStatus === 'assigned' ? '📦 Tayinlangan' : '⏳ Kutilmoqda')}`;

      const actionButtons = [];
      if (order.deliveryStatus === 'assigned' || order.deliveryStatus === 'pending') {
        actionButtons.push(Markup.button.callback('🚚 Yetkazishni boshlash', `start_delivery:${orderId}`));
      }
      if (order.deliveryStatus === 'in_transit') {
        actionButtons.push(Markup.button.callback('✅ Yetkazildi', `mark_delivered:${orderId}`));
      }

      const rows = [];
      if (actionButtons.length) rows.push(actionButtons);
      if (mapLink) rows.push([Markup.button.url('🗺 Marshrutni ochish', mapLink)]);
      rows.push([Markup.button.callback('◀️ Orqaga', 'driver_back_to_orders')]);

      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(rows),
        disable_web_page_preview: true,
      });
    } catch (err) {
      logger.error('driver_order error', { error: err.message, orderId });
      ctx.reply('❌ Xatolik yuz berdi.');
    }
  });

  bot.action('driver_back_to_orders', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('↩️ *Buyurtmalar ro\'yxatiga qaytish*\n\nAsosiy menyudan "🚚 Mening buyurtmalarim" ni tanlang.', { parse_mode: 'Markdown' });
  });

  // ── TEXT HANDLER (multi-state) ────────────────────────────────────────────
  bot.on('text', async (ctx) => {
    const s = await botState.getState(ctx.from.id);
    const input = ctx.message.text.trim();
    if (input.startsWith('/')) return;

    // ── ONBOARDING NAME STEP ─────────────────────────────────────────────
    if (s && s.state === STATES.ONBOARD_NAME) {
      const name = input.slice(0, 64);
      if (ctx.tgUser) {
        ctx.tgUser.firstName = name;
        await ctx.tgUser.save();
      }
      await botState.setState(ctx.from.id, { ...s, state: STATES.ONBOARD_PHONE, name });
      return ctx.reply(
        _t(ctx, 'onboardSharePhone'),
        {
          parse_mode: 'Markdown',
          ...Markup.keyboard([[Markup.button.contactRequest(_t(ctx, 'onboardPhoneBtn'))]]).oneTime().resize()
        }
      );
    }

    // ── ORDER FLOW TEXT INPUTS ────────────────────────────────────────────
    if (s && s.state === STATES.ADDRESS) {
      try {
        const order = await Order.findById(s.orderId);
        if (!order) return ctx.reply(_t(ctx, 'orderNotFound'));
        order.address = input;
        await order.save();

        await botState.setState(ctx.from.id, { ...s, state: STATES.DISTRICT });
        return ctx.reply(
          getLang(ctx) === 'ru' ? '✅ Адрес сохранён!\n\n� *Введите район:*\n\n_Например: Чиланзар, Юнусабад, Сергели_' : '✅ Manzil saqlandi!\n\n� *Tumanni kiriting:*\n\n_Masalan: Chilonzor, Yunusobod, Sergeli_',
          { parse_mode: 'Markdown' }
        );
      } catch (err) { logger.error('address error', { error: err.message }); return ctx.reply(_t(ctx, 'error')); }
    }

    if (s && s.state === STATES.DISTRICT) {
      try {
        const order = await Order.findById(s.orderId);
        if (!order) return ctx.reply(_t(ctx, 'orderNotFound'));
        order.district = input;
        await order.save();

        await botState.setState(ctx.from.id, { ...s, state: STATES.LANDMARK });
        return ctx.reply(
          getLang(ctx) === 'ru' ? '✅ Район сохранён!\n\n📍 *Введите ориентир (mo\'jal):*\n\n_Например: рядом с метро Чиланзар, напротив Макро_' : '✅ Tuman saqlandi!\n\n📍 *Mo\'jalni kiriting:*\n\n_Masalan: Chilonzor metro yonida, Makro ro\'parasida_',
          { parse_mode: 'Markdown' }
        );
      } catch (err) { logger.error('district error', { error: err.message }); return ctx.reply(_t(ctx, 'error')); }
    }

    if (s && s.state === STATES.LANDMARK) {
      try {
        const order = await Order.findById(s.orderId);
        if (!order) return ctx.reply(_t(ctx, 'orderNotFound'));
        order.comment = input;
        await order.save();

        await botState.setState(ctx.from.id, { ...s, state: STATES.CONFIRM });
        await ctx.reply(
          getLang(ctx) === 'ru' ? '✅ Ориентир сохранён!' : '✅ Mo\'jal saqlandi!',
          { parse_mode: 'Markdown' }
        );
        return showConfirmScreen(ctx, order);
      } catch (err) { logger.error('landmark error', { error: err.message }); return ctx.reply(_t(ctx, 'error')); }
    }

    // ── USER MENU BUTTONS ─────────────────────────────────────────────────
    if (input === '🏢 Kompaniya haqida') {
      try {
        const phones = '📱 +998 90 123-45-67';
        const addr = 'Toshkent, Chilonzor tumani';
        const mapUrl = 'https://maps.app.goo.gl/y6AiKiycK2PvuinXA?g_st=ic';
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
      try {
        const u = ctx.tgUser;
        const prem = u && u.isPremium && u.premiumExpiresAt && new Date() < u.premiumExpiresAt;
        const premLine = prem
          ? '👑 Status: *Premium*\n📅 ' + u.premiumExpiresAt.toLocaleDateString('ru-RU', { timeZone: 'Asia/Tashkent' }) + ' gacha'
          : '👤 Status: Oddiy foydalanuvchi';
        const phone = u && u.phone ? u.phone.replace(/(\d{3})\d{5}(\d{2})/, '$1*****$2') : '—';
        const orderCount = await Order.countDocuments({ telegramId: String(ctx.from.id), status: { $ne: 'cancelled' } }).catch(() => 0);
        const esc = (s) => String(s || '').replace(/[_*\[\]()~`>#+\-=|{}.!]/g, '\\$&');
        await ctx.reply(
          '👤 *Mening profilim*\n\n' +
          '📛 Ism: *' + esc(ctx.from.first_name || '—') + '*\n' +
          '📱 Telefon: ' + esc(phone) + '\n' +
          '🆔 Telegram ID: `' + ctx.from.id + '`\n\n' +
          premLine + '\n\n' +
          '📦 Jami zakazlar: *' + orderCount + '* ta',
          { parse_mode: 'Markdown' }
        );
      } catch (e) { logger.error('profile error', { error: e.message }); ctx.reply('❌ Xatolik yuz berdi.'); }
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

    if (input === ' Do\'konga o\'tish') {
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
        '💬 Boshqa savol bo\'lsa: 📞 +998 90 123-45-67',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.url('📧 Email yuborish', 'mailto:info@meatzone.uz')],
            [Markup.button.url('🛒 Do\'konni ochish', SITE + '/catalog')],
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

    // ── ADMIN PANEL MULTI-STEP FLOWS ─────────────────────────────────────────

    // Create product
    if (s && s.action === 'ADM_PROD_CREATE') {
      if (!await canManage(ctx.from.id)) return;
      if (s.step === 'name_ru') {
        await botState.setState(String(ctx.from.id), { ...s, step: 'price', nameRu: input }, 600);
        return ctx.reply('📦 Шаг 2/3 — Введите *цену* (в сумах):', { parse_mode: 'Markdown' });
      }
      if (s.step === 'price') {
        const price = parseInt(input.replace(/\D/g, ''), 10);
        if (!price || price <= 0) return ctx.reply('❌ Введите корректную цену (например: 45000)');
        try {
          const p = await Product.create({
            name: { uz: s.nameRu, ru: s.nameRu, en: s.nameRu },
            description: { uz: '', ru: '', en: '' },
            price,
            isActive: true,
          });
          await botState.deleteState(ctx.from.id);
          const gid = process.env.TELEGRAM_ADMIN_GROUP;
          if (gid) {
            await bot.telegram.sendMessage(gid,
              `📦 *Новый товар добавлен*\n\n${s.nameRu}\n💰 ${fmt(price)} сум\n🔧 Добавил: @${ctx.from.username || ctx.from.id}`,
              { parse_mode: 'Markdown' }
            ).catch(() => { });
          }
          return ctx.reply(`✅ Товар *${s.nameRu}* (${fmt(price)} сум) создан!\n\nID: \`${p._id}\``, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([[Markup.button.callback('📦 К товарам', 'adm_products')]])
          });
        } catch (e) { return ctx.reply('Ошибка: ' + e.message); }
      }
    }

    // Create category
    if (s && s.action === 'ADM_CAT_CREATE') {
      if (!await canManage(ctx.from.id)) return;
      try {
        const cat = await Category.create({ name: { uz: input, ru: input, en: input }, isActive: true });
        await botState.deleteState(ctx.from.id);
        const gid = process.env.TELEGRAM_ADMIN_GROUP;
        if (gid) {
          await bot.telegram.sendMessage(gid,
            `📂 *Новая категория:* ${input}\n🔧 Добавил: @${ctx.from.username || ctx.from.id}`,
            { parse_mode: 'Markdown' }
          ).catch(() => { });
        }
        return ctx.reply(`✅ Категория *${input}* создана!`, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.callback('📂 К категориям', 'adm_cats')]])
        });
      } catch (e) { return ctx.reply('Ошибка: ' + e.message); }
    }

    // Create promo
    if (s && s.action === 'ADM_PROMO_CREATE') {
      if (!await canManage(ctx.from.id)) return;
      if (s.step === 'code') {
        const code = input.toUpperCase().replace(/\s/g, '');
        await botState.setState(String(ctx.from.id), { ...s, step: 'type', code }, 300);
        return ctx.reply(
          `🏷 Код: *${code}*\n\nШаг 2/3 — Выберите *тип скидки*:`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('📉 Процент (%)', 'adm_promo_type_percent')],
              [Markup.button.callback('💵 Фиксированная сумма', 'adm_promo_type_fixed')],
            ])
          }
        );
      }
      if (s.step === 'value') {
        const value = parseFloat(input.replace(/\D/g, ''));
        if (!value || value <= 0) return ctx.reply('❌ Введите корректное число');
        try {
          await Promo.create({ code: s.code, discountType: s.discountType, discountValue: value, isActive: true });
          await botState.deleteState(ctx.from.id);
          const label = s.discountType === 'percent' ? `${value}%` : `${fmt(value)} сум`;
          const gid = process.env.TELEGRAM_ADMIN_GROUP;
          if (gid) {
            await bot.telegram.sendMessage(gid,
              `🏷 *Новый промокод:* \`${s.code}\` (−${label})\n🔧 Создал: @${ctx.from.username || ctx.from.id}`,
              { parse_mode: 'Markdown' }
            ).catch(() => { });
          }
          return ctx.reply(`✅ Промокод *${s.code}* (−${label}) создан!`, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([[Markup.button.callback('🏷 К промокодам', 'adm_promos')]])
          });
        } catch (e) { return ctx.reply('Ошибка: ' + (e.code === 11000 ? 'Код уже существует' : e.message)); }
      }
    }

    // Create banner
    if (s && s.action === 'ADM_BANNER_CREATE') {
      if (!await canManage(ctx.from.id)) return;
      if (s.step === 'title') {
        await botState.setState(String(ctx.from.id), { ...s, step: 'emoji', title: input }, 300);
        return ctx.reply('🖼 Шаг 2/2 — Введите *эмодзи* баннера (например: 🥩, или прочерк —):', { parse_mode: 'Markdown' });
      }
      if (s.step === 'emoji') {
        const emoji = input === '—' || input === '-' ? '🥩' : input;
        try {
          await Banner.create({ title: s.title, emoji, active: true });
          await botState.deleteState(ctx.from.id);
          const gid = process.env.TELEGRAM_ADMIN_GROUP;
          if (gid) {
            await bot.telegram.sendMessage(gid,
              `🖼 *Новый баннер:* ${emoji} ${s.title}\n🔧 Добавил: @${ctx.from.username || ctx.from.id}`,
              { parse_mode: 'Markdown' }
            ).catch(() => { });
          }
          return ctx.reply(`✅ Баннер *${emoji} ${s.title}* создан!`, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([[Markup.button.callback('🖼 К баннерам', 'adm_banners')]])
          });
        } catch (e) { return ctx.reply('Ошибка: ' + e.message); }
      }
    }

    // broadcast text input (command /broadcast)
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

    // broadcast text input (admin menu button)
    if (s && s.action === 'BROADCAST' && s.step === 'text') {
      await botState.setState(ctx.from.id, { action: 'BROADCAST', step: 'confirm', text: input }, 300);
      await ctx.reply(
        `📢 *Xabar yuborish*\n\n${input}\n\n_Barcha foydalanuvchilarga yuboriladi._\n\nYuborilsinmi?`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('✅ Ha, yuborish', 'broadcast_go')],
            [Markup.button.callback('❌ Bekor qilish', 'broadcast_cancel')],
          ]),
        }
      );
      return;
    }

    // ── DRIVER MENU BUTTONS ───────────────────────────────────────────────
    if (input === '🚚 Mening buyurtmalarim') {
      const role = ctx.tgUser?.role;
      if (role !== 'driver') return ctx.reply('⚠️ Bu bo\'lim faqat kurerlarga mo\'ljallangan.');
      try {
        const driverUser = await User.findOne({ telegramId: String(ctx.tgUser.telegramId), role: 'driver' });
        const orConditions = [
          { driverTelegramId: String(ctx.tgUser.telegramId) },
        ];
        if (driverUser) {
          orConditions.push({ assignedDriver: driverUser._id });
        }
        const assigned = await Order.find({
          $or: orConditions,
          status: { $nin: ['completed', 'delivered', 'cancelled'] },
        }).sort({ createdAt: -1 }).limit(10);
        if (!assigned.length) {
          return ctx.reply('📭 Hozirda sizga tayinlangan faol buyurtma yo\'q.');
        }
        const buttons = assigned.map((o) => {
          const statusEmoji = o.deliveryStatus === 'in_transit' ? '🚚' : (o.deliveryStatus === 'assigned' ? '📦' : '⏳');
          const d = o.createdAt.toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent' });
          return [Markup.button.callback(`${statusEmoji} #${String(o._id).slice(-6)} | ${d} — ${fmt(o.totalPrice)} so'm`, `driver_order:${o._id}`)];
        });
        await ctx.reply(
          '🚚 *Mening faol buyurtmalarim*\n\nBatafsil ma\'lumot uchun buyurtmani tanlang:',
          { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
        );
      } catch (e) { ctx.reply('Xatolik: ' + e.message); }
      return;
    }

    if (input === '📍 Yetkazish tarixi') {
      const role = ctx.tgUser?.role;
      if (role !== 'driver') return ctx.reply('⚠️ Bu bo\'lim faqat kurerlarga mo\'ljallangan.');
      try {
        const driverUser = await User.findOne({ telegramId: String(ctx.tgUser.telegramId), role: 'driver' });
        const orConditions = [
          { driverTelegramId: String(ctx.tgUser.telegramId) },
        ];
        if (driverUser) {
          orConditions.push({ assignedDriver: driverUser._id });
        }
        const delivered = await Order.find({
          $or: orConditions,
          status: 'completed',
        }).sort({ createdAt: -1 }).limit(10);
        if (!delivered.length) {
          return ctx.reply('📭 Hali yetkazilgan buyurtma yo\'q.');
        }
        const lines = delivered.map((o, i) => {
          const d = o.createdAt.toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent' });
          return `${i + 1}. ✅ \`${String(o._id).slice(-6)}\` | ${d} | ${fmt(o.totalPrice)} so'm`;
        });
        await ctx.reply(
          '📍 *Yetkazish tarixi*\n\n📦 Oxirgi ' + delivered.length + ' ta:\n\n' + lines.join('\n'),
          { parse_mode: 'Markdown' }
        );
      } catch (e) { ctx.reply('Xatolik: ' + e.message); }
      return;
    }

    if (input === '👤 Profilim') {
      const u = ctx.tgUser;
      const role = u?.role || 'customer';
      const roleNames = { customer: 'Mijoz', driver: 'Kurer 🚚', operator: 'Operator', manager: 'Menejer', admin: 'Admin' };
      const phone = u && u.phone ? u.phone : '—';
      const esc = (s) => String(s || '').replace(/[_*\[\]()~`>#+\-=|{}.!]/g, '\\$&');
      await ctx.reply(
        '👤 *Mening profilim*\n\n' +
        '📛 Ism: *' + esc(ctx.from.first_name || '—') + '*\n' +
        '📱 Telefon: ' + esc(phone) + '\n' +
        '🆔 Telegram: @' + esc(ctx.from.username || String(ctx.from.id)) + '\n' +
        '🏷 Rol: *' + esc(roleNames[role] || role) + '*',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    if (input === '💰 Daromadim') {
      const role = ctx.tgUser?.role;
      if (role !== 'driver') return ctx.reply('⚠️ Bu bo\'lim faqat kurerlarga mo\'ljallangan.');
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const driverUser = await User.findOne({ telegramId: String(ctx.tgUser.telegramId), role: 'driver' });
        const orConditions = [
          { driverTelegramId: String(ctx.tgUser.telegramId) },
        ];
        if (driverUser) {
          orConditions.push({ assignedDriver: driverUser._id });
        }

        const orders = await Order.find({
          $or: orConditions,
          status: 'completed',
          createdAt: { $gte: startOfMonth },
        }).sort({ createdAt: -1 }).limit(20).lean();

        const count = orders.length;
        const totalDelivery = orders.reduce((s, o) => s + (o.deliveryFee || 0), 0);
        const totalOrders = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
        const avgDelivery = count > 0 ? Math.round(totalDelivery / count) : 0;

        const lines = orders.slice(0, 10).map((o, i) => {
          const d = o.createdAt.toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent' });
          return `${i + 1}. \`${String(o._id).slice(-6)}\` | ${d}\n   💰 ${fmt(o.totalPrice)} so'm${o.deliveryFee > 0 ? ' | 🚚 ' + fmt(o.deliveryFee) + ' so\'m' : ''}`;
        }).join('\n');

        // Calculate cash to hand over (COD orders with cash collected but not handed over)
        const cashOrders = await Order.find({
          $or: orConditions,
          status: 'completed',
          paymentMethod: 'cash',
          cashCollected: true,
          cashHandedOver: false,
        }).lean();
        const cashToHandOver = cashOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);

        const buttons = [];
        if (cashToHandOver > 0) {
          buttons.push([Markup.button.callback(`✅ Pulni topshirish (${fmt(cashToHandOver)} so'm)`, 'submit_cash_handover')]);
        }

        await ctx.reply(
          '💰 *Daromadim*\n\n' +
          '📅 *Bu oy yetkazilgan:* ' + count + ' ta buyurtma\n' +
          '🚚 *Yetkazib berishdan jami:* ' + fmt(totalDelivery) + ' so\'m\n' +
          '💵 *Buyurtmalar jami:* ' + fmt(totalOrders) + ' so\'m\n' +
          '📊 *O\'rtacha yetkazish:* ' + fmt(avgDelivery) + ' so\'m\n\n' +
          (cashToHandOver > 0 ? `💵 *Topshirish kerak:* ${fmt(cashToHandOver)} so'm (${cashOrders.length} ta buyurtma)\n\n` : '') +
          (lines ? '*Oxirgi buyurtmalar:*\n' + lines : ''),
          { parse_mode: 'Markdown', ...(buttons.length > 0 ? Markup.inlineKeyboard(buttons) : {}) }
        );
      } catch (e) { ctx.reply('Xatolik: ' + e.message); }
      return;
    }

    // ── OPERATOR MENU BUTTONS ─────────────────────────────────────────────
    if (input === '📥 Yangi buyurtmalar') {
      const role = ctx.tgUser?.role;
      if (role !== 'operator' && role !== 'admin' && role !== 'manager') {
        return ctx.reply('⚠️ Bu bo\'lim faqat operatorlarga mo\'ljallangan.');
      }
      try {
        const newOrders = await Order.find({ status: 'new' }).sort({ createdAt: -1 }).limit(10);
        if (!newOrders.length) {
          return ctx.reply('📭 Hozirda yangi buyurtmalar yo\'q.');
        }
        const lines = newOrders.map((o, i) => {
          const d = o.createdAt.toLocaleTimeString('uz-UZ', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit' });
          return `${i + 1}. 🆕 \`${String(o._id).slice(-6)}\` | ${d}\n   👤 ${o.customerName || '—'} | 📍 ${o.address || '—'}\n   💰 ${fmt(o.totalPrice)} so'm`;
        });
        await ctx.reply(
          '📥 *Yangi buyurtmalar* (' + newOrders.length + ' ta)\n\n' + lines.join('\n\n'),
          { parse_mode: 'Markdown' }
        );
      } catch (e) { ctx.reply('Xatolik: ' + e.message); }
      return;
    }

    if (input === '📊 Bugun statistika') {
      const role = ctx.tgUser?.role;
      if (role !== 'operator' && role !== 'admin' && role !== 'manager') {
        return ctx.reply('⚠️ Bu bo\'lim faqat operatorlarga mo\'ljallangan.');
      }
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [total, completed, newCount] = await Promise.all([
          Order.countDocuments({ createdAt: { $gte: today } }),
          Order.countDocuments({ createdAt: { $gte: today }, status: 'completed' }),
          Order.countDocuments({ createdAt: { $gte: today }, status: 'new' }),
        ]);
        await ctx.reply(
          '📊 *Bugungi statistika*\n\n' +
          '📦 Jami buyurtmalar: *' + total + '* ta\n' +
          '✅ Bajarilgan: *' + completed + '* ta\n' +
          '🆕 Yangi: *' + newCount + '* ta',
          { parse_mode: 'Markdown' }
        );
      } catch (e) { ctx.reply('Xatolik: ' + e.message); }
      return;
    }

    // ── ADMIN MENU BUTTONS ────────────────────────────────────────────────
    if (input === '📋 Buyurtmalar') {
      if (!await canManage(ctx.from.id)) return ctx.reply('⚠️ Ruxsat yo\'q.');
      try {
        const orders = await Order.find().sort({ createdAt: -1 }).limit(10);
        if (!orders.length) return ctx.reply('📭 Buyurtmalar yo\'q.');
        const rows = orders.map((o) => [
          Markup.button.callback(
            `${STATUS_EMOJIS[o.status] || '⚪'} #${String(o._id).slice(-6)} | ${fmt(o.totalPrice)} so'm`,
            `adm_order_${o._id}`
          ),
        ]);
        rows.push([Markup.button.callback('◀️ Orqaga', 'adm_back')]);
        await ctx.reply('📋 *Buyurtmalar* (oxirgi 10 ta)', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) });
      } catch (e) { ctx.reply('Xatolik: ' + e.message); }
      return;
    }

    if (input === '👤 Foydalanuvchilar') {
      if (!await canManage(ctx.from.id)) return ctx.reply('⚠️ Ruxsat yo\'q.');
      try {
        const users = await TelegramUser.find().sort({ createdAt: -1 }).limit(20);
        const rows = users.map((u) => [
          Markup.button.callback(
            `${u.firstName || '—'} (@${u.username || u.telegramId}) — ${u.role || 'customer'}`,
            `adm_user_view_${u.telegramId}`
          ),
        ]);
        rows.push([Markup.button.callback('◀️ Orqaga', 'adm_back')]);
        await ctx.reply('👤 *Foydalanuvchilar* (oxirgi 20 ta)', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) });
      } catch (e) { ctx.reply('Xatolik: ' + e.message); }
      return;
    }

    if (input === '📢 Xabar yuborish') {
      if (!await canManage(ctx.from.id)) return ctx.reply('⚠️ Ruxsat yo\'q.');
      await botState.setState(ctx.from.id, { action: 'BROADCAST', step: 'text' }, 300);
      await ctx.reply(
        '📢 *Xabar yuborish*\n\nXabar matnini kiriting:\n\n_Eslatma: barcha foydalanuvchilarga yuboriladi._',
        { parse_mode: 'Markdown' }
      );
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

  // ── ADMIN PANEL ───────────────────────────────────────────────────────────

  const admMenu = () => Markup.inlineKeyboard([
    [Markup.button.callback('📋 Заказы', 'adm_orders'), Markup.button.callback('📊 Статистика', 'adm_stats_panel')],
    [Markup.button.callback('📦 Товары', 'adm_products'), Markup.button.callback('📂 Категории', 'adm_cats')],
    [Markup.button.callback('🏷 Промокоды', 'adm_promos'), Markup.button.callback('🖼 Баннеры', 'adm_banners')],
    [Markup.button.callback('👥 Пользователи', 'adm_users'), Markup.button.callback('🚚 Доставка', 'adm_delivery')],
  ]);

  bot.command('admin', async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.reply('❌ Нет прав.');
    await ctx.reply('🛡 *Панель администратора*\n\nВыберите раздел:', { parse_mode: 'Markdown', ...admMenu() });
  });

  bot.action('adm_back', async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    await ctx.editMessageText('🛡 *Панель администратора*\n\nВыберите раздел:', { parse_mode: 'Markdown', ...admMenu() });
  });

  // ── PRODUCTS ─────────────────────────────────────────────────────────────

  const showProductsList = async (ctx) => {
    const products = await Product.find().sort({ createdAt: -1 }).limit(12);
    const rows = products.map(p => [Markup.button.callback(
      `${p.isActive ? '✅' : '❌'} ${p.name.ru} — ${fmt(p.price)} сум`,
      `adm_prod_view_${p._id}`
    )]);
    rows.push([Markup.button.callback('➕ Добавить товар', 'adm_prod_create'), Markup.button.callback('◀️ Назад', 'adm_back')]);
    const text = `📦 *Товары* (${products.length}):`;
    return { text, keyboard: Markup.inlineKeyboard(rows) };
  };

  bot.action('adm_products', async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    const { text, keyboard } = await showProductsList(ctx);
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action(/^adm_prod_view_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    const p = await Product.findById(ctx.match[1]).populate('category');
    if (!p) return ctx.reply('❌ Товар не найден.');
    const disc = p.discountValue > 0
      ? `\n💸 Скидка: ${p.discountValue}${p.discountType === 'percentage' ? '%' : ' сум'} → ${fmt(p.finalPrice)} сум` : '';
    await ctx.editMessageText(
      `📦 *${p.name.ru}*\n\n💰 Цена: ${fmt(p.price)} сум${disc}\n📂 Категория: ${p.category?.name?.ru || '—'}\n📦 Остаток: ${p.stock}\n✅ Активен: ${p.isActive ? 'Да' : 'Нет'}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback(p.isActive ? '❌ Деактивировать' : '✅ Активировать', `adm_prod_toggle_${p._id}`)],
          [Markup.button.callback('🗑 Удалить', `adm_prod_del_confirm_${p._id}`)],
          [Markup.button.callback('◀️ К товарам', 'adm_products')],
        ])
      }
    );
  });

  bot.action(/^adm_prod_toggle_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    const p = await Product.findById(ctx.match[1]);
    if (!p) return ctx.answerCbQuery('Не найдено');
    p.isActive = !p.isActive;
    await p.save();
    await ctx.answerCbQuery(p.isActive ? '✅ Активирован' : '❌ Деактивирован');
    await ctx.editMessageText(
      `📦 *${p.name.ru}*\n\n💰 Цена: ${fmt(p.price)} сум\n✅ Активен: ${p.isActive ? 'Да' : 'Нет'}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback(p.isActive ? '❌ Деактивировать' : '✅ Активировать', `adm_prod_toggle_${p._id}`)],
          [Markup.button.callback('🗑 Удалить', `adm_prod_del_confirm_${p._id}`)],
          [Markup.button.callback('◀️ К товарам', 'adm_products')],
        ])
      }
    );
  });

  bot.action(/^adm_prod_del_confirm_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    await ctx.editMessageText(`⚠️ *Удалить товар?*\n\nID: \`${ctx.match[1]}\`\nДействие необратимо!`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🗑 Да, удалить', `adm_prod_delete_${ctx.match[1]}`)],
        [Markup.button.callback('◀️ Отмена', `adm_prod_view_${ctx.match[1]}`)],
      ])
    });
  });

  bot.action(/^adm_prod_delete_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await Product.findByIdAndDelete(ctx.match[1]);
    await ctx.answerCbQuery('🗑 Удалено');
    const { text, keyboard } = await showProductsList(ctx);
    await ctx.editMessageText(`✅ Товар удалён.\n\n${text}`, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action('adm_prod_create', async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    await botState.setState(String(ctx.from.id), { action: 'ADM_PROD_CREATE', step: 'name_ru' }, 600);
    await ctx.reply('📦 *Новый товар*\n\nШаг 1/3 — Введите название на *русском*:', { parse_mode: 'Markdown' });
  });

  // ── CATEGORIES ───────────────────────────────────────────────────────────

  const showCatsList = async () => {
    const cats = await Category.find().sort({ order: 1, createdAt: -1 });
    const rows = cats.map(c => [Markup.button.callback(`📂 ${c.name.ru}`, `adm_cat_del_confirm_${c._id}`)]);
    rows.push([Markup.button.callback('➕ Добавить категорию', 'adm_cat_create'), Markup.button.callback('◀️ Назад', 'adm_back')]);
    return { text: `📂 *Категории* (${cats.length}):`, keyboard: Markup.inlineKeyboard(rows) };
  };

  bot.action('adm_cats', async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    const { text, keyboard } = await showCatsList();
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action('adm_cat_create', async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    await botState.setState(String(ctx.from.id), { action: 'ADM_CAT_CREATE' }, 300);
    await ctx.reply('📂 *Новая категория*\n\nВведите название на *русском*:', { parse_mode: 'Markdown' });
  });

  bot.action(/^adm_cat_del_confirm_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    const cat = await Category.findById(ctx.match[1]);
    if (!cat) return ctx.editMessageText('Категория не найдена.');
    await ctx.editMessageText(`⚠️ *Удалить категорию «${cat.name.ru}»?*`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🗑 Удалить', `adm_cat_delete_${ctx.match[1]}`)],
        [Markup.button.callback('◀️ Отмена', 'adm_cats')],
      ])
    });
  });

  bot.action(/^adm_cat_delete_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await Category.findByIdAndDelete(ctx.match[1]);
    await ctx.answerCbQuery('🗑 Удалено');
    const { text, keyboard } = await showCatsList();
    await ctx.editMessageText(`✅ Категория удалена.\n\n${text}`, { parse_mode: 'Markdown', ...keyboard });
  });

  // ── PROMOS ───────────────────────────────────────────────────────────────

  const showPromosList = async () => {
    const promos = await Promo.find().sort({ createdAt: -1 }).limit(10);
    const rows = promos.map(p => [Markup.button.callback(
      `${p.isActive ? '✅' : '❌'} ${p.code} (${p.discountValue}${p.discountType === 'percent' ? '%' : ' сум'})`,
      `adm_promo_view_${p._id}`
    )]);
    rows.push([Markup.button.callback('➕ Создать промокод', 'adm_promo_create'), Markup.button.callback('◀️ Назад', 'adm_back')]);
    return { text: `🏷 *Промокоды* (${promos.length}):`, keyboard: Markup.inlineKeyboard(rows) };
  };

  bot.action('adm_promos', async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    const { text, keyboard } = await showPromosList();
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action(/^adm_promo_view_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    const p = await Promo.findById(ctx.match[1]);
    if (!p) return ctx.reply('❌ Не найдено.');
    const exp = p.validUntil ? p.validUntil.toLocaleDateString('ru-RU') : 'Бессрочно';
    await ctx.editMessageText(
      `🏷 *${p.code}*\n\n💸 Скидка: ${p.discountValue}${p.discountType === 'percent' ? '%' : ' сум'}\n✅ Активен: ${p.isActive ? 'Да' : 'Нет'}\n📊 Использован: ${p.usedCount}/${p.maxUses || '∞'}\n📅 До: ${exp}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback(p.isActive ? '❌ Отключить' : '✅ Включить', `adm_promo_toggle_${p._id}`)],
          [Markup.button.callback('🗑 Удалить', `adm_promo_delete_${p._id}`)],
          [Markup.button.callback('◀️ К промокодам', 'adm_promos')],
        ])
      }
    );
  });

  bot.action(/^adm_promo_toggle_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    const p = await Promo.findById(ctx.match[1]);
    if (!p) return ctx.answerCbQuery('Не найдено');
    p.isActive = !p.isActive;
    await p.save();
    await ctx.answerCbQuery(p.isActive ? '✅ Включён' : '❌ Отключён');
    await ctx.editMessageText(
      `🏷 *${p.code}*\n\n💸 Скидка: ${p.discountValue}${p.discountType === 'percent' ? '%' : ' сум'}\n✅ Активен: ${p.isActive ? 'Да' : 'Нет'}\n📊 Использован: ${p.usedCount}/${p.maxUses || '∞'}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback(p.isActive ? '❌ Отключить' : '✅ Включить', `adm_promo_toggle_${p._id}`)],
          [Markup.button.callback('🗑 Удалить', `adm_promo_delete_${p._id}`)],
          [Markup.button.callback('◀️ К промокодам', 'adm_promos')],
        ])
      }
    );
  });

  bot.action(/^adm_promo_delete_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await Promo.findByIdAndDelete(ctx.match[1]);
    await ctx.answerCbQuery('🗑 Удалено');
    const { text, keyboard } = await showPromosList();
    await ctx.editMessageText(`✅ Промокод удалён.\n\n${text}`, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action('adm_promo_create', async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    await botState.setState(String(ctx.from.id), { action: 'ADM_PROMO_CREATE', step: 'code' }, 300);
    await ctx.reply('🏷 *Новый промокод*\n\nШаг 1/3 — Введите *код* (например: MEAT20):', { parse_mode: 'Markdown' });
  });

  bot.action(/^adm_promo_type_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    const type = ctx.match[1]; // 'percent' or 'fixed'
    const s = await botState.getState(ctx.from.id);
    if (!s || s.action !== 'ADM_PROMO_CREATE') return;
    await botState.setState(String(ctx.from.id), { ...s, step: 'value', discountType: type }, 300);
    const typeLabel = type === 'percent' ? 'процент (%)' : 'фиксированная сумма (сум)';
    await ctx.editMessageText(`🏷 Тип скидки: *${typeLabel}*\n\nШаг 3/3 — Введите *размер скидки*:`, { parse_mode: 'Markdown' });
  });

  // ── BANNERS ──────────────────────────────────────────────────────────────

  const showBannersList = async () => {
    const banners = await Banner.find().sort({ order: 1 });
    const rows = banners.map(b => [Markup.button.callback(
      `${b.active ? '✅' : '❌'} ${b.emoji || ''} ${b.title}`,
      `adm_banner_toggle_${b._id}`
    )]);
    rows.push([Markup.button.callback('➕ Добавить баннер', 'adm_banner_create'), Markup.button.callback('◀️ Назад', 'adm_back')]);
    return { text: `🖼 *Баннеры* (${banners.length}):`, keyboard: Markup.inlineKeyboard(rows) };
  };

  bot.action('adm_banners', async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    const { text, keyboard } = await showBannersList();
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action(/^adm_banner_toggle_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    const b = await Banner.findById(ctx.match[1]);
    if (!b) return ctx.answerCbQuery('Не найдено');
    b.active = !b.active;
    await b.save();
    await ctx.answerCbQuery(b.active ? '✅ Активирован' : '❌ Деактивирован');
    const { text, keyboard } = await showBannersList();
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  });

  bot.action('adm_banner_create', async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    await botState.setState(String(ctx.from.id), { action: 'ADM_BANNER_CREATE', step: 'title' }, 300);
    await ctx.reply('🖼 *Новый баннер*\n\nШаг 1/2 — Введите *заголовок*:', { parse_mode: 'Markdown' });
  });

  // ── USERS ────────────────────────────────────────────────────────────────

  bot.action('adm_users', async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    const users = await TelegramUser.find({ isBanned: { $ne: true } }).sort({ lastActiveAt: -1 }).limit(10);
    const roleIcons = { customer: '👤', driver: '🚚', operator: '⚙️', manager: '📊', admin: '🛡' };
    const rows = users.map(u => [Markup.button.callback(
      `${roleIcons[u.role] || '👤'} ${u.firstName || u.username || u.telegramId}`,
      `adm_user_view_${u.telegramId}`
    )]);
    rows.push([Markup.button.callback('◀️ Назад', 'adm_back')]);
    await ctx.editMessageText(`👥 *Пользователи* (последние активные):`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(rows)
    });
  });

  bot.action(/^adm_user_view_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    const u = await TelegramUser.findOne({ telegramId: ctx.match[1] });
    if (!u) return ctx.reply('❌ Не найдено.');
    const allRoles = ['customer', 'driver', 'operator', 'manager', 'admin'];
    const otherRoles = allRoles.filter(r => r !== u.role);
    const roleRows = [];
    for (let i = 0; i < otherRoles.length; i += 2) {
      roleRows.push(otherRoles.slice(i, i + 2).map(r => Markup.button.callback(r, `adm_user_setrole_${u.telegramId}_${r}`)));
    }
    roleRows.push([Markup.button.callback('◀️ К пользователям', 'adm_users')]);
    const lastActive = u.lastActiveAt ? u.lastActiveAt.toLocaleDateString('ru-RU') : '—';
    await ctx.editMessageText(
      `👤 *${u.firstName || '—'} ${u.lastName || ''}*\n\n🆔 \`${u.telegramId}\`\n📱 ${u.phone || '—'}\n🏷 Роль: *${u.role}*\n🗓 Активность: ${lastActive}\n\n_Нажмите роль для назначения:_`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(roleRows) }
    );
  });

  bot.action(/^adm_user_setrole_([^_]+)_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    const telegramId = ctx.match[1];
    const newRole = ctx.match[2];
    const allowed = ['customer', 'driver', 'operator', 'manager', 'admin'];
    if (!allowed.includes(newRole)) return ctx.answerCbQuery('❌ Недопустимая роль');

    const oldUser = await TelegramUser.findOne({ telegramId });
    if (!oldUser) return ctx.answerCbQuery('Не найдено');
    const oldRole = oldUser.role;

    const u = await TelegramUser.findOneAndUpdate({ telegramId }, { role: newRole }, { new: true });

    // Sync Redis bot:admins for immediate bot access
    try {
      if (newRole === 'admin' && oldRole !== 'admin') {
        await redis.sadd('bot:admins', telegramId);
      } else if (oldRole === 'admin' && newRole !== 'admin') {
        await redis.srem('bot:admins', telegramId);
      }
    } catch (e) { console.error('[bot:admins] Redis sync error:', e.message); }

    await ctx.answerCbQuery(`✅ Роль: ${newRole}`);
    await notifications.notifyRoleChanged(telegramId, newRole, u.languageCode || 'ru').catch(() => { });

    // Notify admin group
    const gid = process.env.TELEGRAM_ADMIN_GROUP;
    if (gid) {
      await bot.telegram.sendMessage(gid,
        `👤 *Роль изменена*\n\n🆔 \`${telegramId}\`\n👤 ${u.firstName || '—'}\n🏷 Старая: \`${oldRole}\` → *${newRole}*\n🔧 Изменено: @${ctx.from.username || ctx.from.id}`,
        { parse_mode: 'Markdown' }
      ).catch(() => { });
    }

    const roleEmojis = { customer: '👤', driver: '🚚', operator: '⚙️', manager: '📊', admin: '🛡️' };
    await ctx.editMessageText(
      `✅ *Роль назначена*\n\n🆔 \`${telegramId}\`\n👤 ${u.firstName || '—'}\n🏷 ${roleEmojis[oldRole] || '👤'} \`${oldRole}\` → ${roleEmojis[newRole] || '👤'} *${newRole}*\n\nПользователь ${newRole === 'admin' ? 'теперь может открывать /admin' : 'обновлён'}.`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('◀️ К пользователям', 'adm_users')]]) }
    );
  });

  // ── ORDERS MANAGEMENT ────────────────────────────────────────────────────

  const STATUS_EMOJIS = { new: '🔵', processing: '🟡', confirmed: '🟣', completed: '🟢', cancelled: '🔴' };

  bot.action('adm_orders', async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery('📋 Загружаю...');
    try {
      const orders = await Order.find({ status: { $in: ['new', 'processing', 'confirmed'] } })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      if (!orders.length) {
        await ctx.editMessageText(
          '📋 *Заказы*\n\nНет активных заказов (new/processing/confirmed).',
          { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('◀️ Назад', 'adm_back')]]) }
        );
        return;
      }
      const rows = [];
      for (const o of orders) {
        const items = await OrderItem.find({ order: o._id }).select('name quantity').lean();
        const itemsTxt = items.map(i => `• ${i.name}×${i.quantity}`).join(', ');
        const emoji = STATUS_EMOJIS[o.status] || '⚪';
        rows.push([Markup.button.callback(
          `${emoji} #${o._id.toString().slice(-6)} — ${fmt(o.totalPrice)} сум`,
          `adm_order_${o._id}`
        )]);
        rows.push([Markup.button.callback(
          `   ${itemsTxt.slice(0, 40)}${itemsTxt.length > 40 ? '…' : ''}`,
          `adm_order_${o._id}`
        )]);
      }
      rows.push([Markup.button.callback('◀️ Назад', 'adm_back')]);
      await ctx.editMessageText(
        `📋 *Активные заказы* (${orders.length})\n\nВыберите заказ для управления:`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) }
      );
    } catch (e) {
      await ctx.editMessageText('Ошибка: ' + e.message, {
        ...Markup.inlineKeyboard([[Markup.button.callback('◀️ Назад', 'adm_back')]])
      });
    }
  });

  bot.action(/^adm_order_(?!status)(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    try {
      const orderId = ctx.match[1];
      const order = await Order.findById(orderId).lean();
      if (!order) return ctx.reply('❌ Заказ не найден.');
      const items = await OrderItem.find({ order: order._id }).lean();
      const itemsTxt = items.map(i => `• ${i.name} × ${i.quantity} = ${fmt(i.price * i.quantity)} сум`).join('\n');
      const status = order.status || 'new';
      const emoji = STATUS_EMOJIS[status] || '⚪';
      const statusLabels = { new: 'Новый', processing: 'В обработке', confirmed: 'Подтверждён', completed: 'Выполнен', cancelled: 'Отменён' };
      const date = order.createdAt ? new Date(order.createdAt).toLocaleString('ru-RU') : '—';

      const actions = [];
      if (status === 'new') {
        actions.push([Markup.button.callback('✅ Подтвердить', `adm_order_status_${orderId}_confirmed`)]);
        actions.push([Markup.button.callback('🟡 В обработку', `adm_order_status_${orderId}_processing`)]);
      } else if (status === 'processing') {
        actions.push([Markup.button.callback('✅ Подтвердить', `adm_order_status_${orderId}_confirmed`)]);
      } else if (status === 'confirmed') {
        actions.push([Markup.button.callback('🟢 Выполнен', `adm_order_status_${orderId}_completed`)]);
      }
      actions.push([Markup.button.callback('🔴 Отменить', `adm_order_status_${orderId}_cancelled`)]);
      actions.push([Markup.button.callback('◀️ К заказам', 'adm_orders')]);

      await ctx.editMessageText(
        `📋 *Заказ #${orderId.slice(-6)}*\n\n` +
        `👤 ${order.customerName || '—'}\n` +
        `📱 ${order.customerPhone || '—'}\n` +
        `📍 ${order.address || '—'}\n` +
        `💰 *${fmt(order.totalPrice)} сум* (доставка ${fmt(order.deliveryFee || 0)} сум)\n` +
        `🏷 ${emoji} ${statusLabels[status] || status}\n` +
        `🗓 ${date}\n\n` +
        `*Товары:*\n${itemsTxt || '—'}`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard(actions) }
      );
    } catch (e) {
      await ctx.reply('Ошибка: ' + e.message);
    }
  });

  bot.action(/^adm_order_status_(.+)_(.+)$/, async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    const orderId = ctx.match[1];
    const newStatus = ctx.match[2];
    const allowedTransitions = ['new', 'processing', 'confirmed', 'completed', 'cancelled'];
    if (!allowedTransitions.includes(newStatus)) return ctx.answerCbQuery('❌ Недопустимый статус');
    try {
      const order = await Order.findByIdAndUpdate(orderId, { status: newStatus }, { new: true });
      if (!order) return ctx.answerCbQuery('❌ Заказ не найден');
      await ctx.answerCbQuery(`✅ Статус: ${newStatus}`);
      // Notify customer
      if (order.telegramId) {
        const msgs = {
          uz: `📋 *Buyurtma holati o'zgardi*\n\n#${orderId.slice(-6)} — *${newStatus}*\n📍 ${order.address || '—'}\n💰 ${fmt(order.totalPrice)} so'm`,
          ru: `📋 *Статус заказа изменён*\n\n#${orderId.slice(-6)} — *${newStatus}*\n📍 ${order.address || '—'}\n💰 ${fmt(order.totalPrice)} сум`,
        };
        await bot.telegram.sendMessage(order.telegramId, msgs.uz, { parse_mode: 'Markdown' }).catch(() => { });
      }
      // Refresh order view
      await bot.telegram.editMessageText(
        ctx.chat.id, ctx.callbackQuery.message.message_id, null,
        `✅ *Статус обновлён*\n\nЗаказ #${orderId.slice(-6)} теперь *${newStatus}*.`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('📋 К заказам', 'adm_orders')]]) }
      );
    } catch (e) {
      await ctx.answerCbQuery('❌ Ошибка');
    }
  });

  // ── DELIVERY SETTINGS ────────────────────────────────────────────────────

  bot.action('adm_delivery', async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery();
    const [pricePerKm, freeThreshold, minOrder] = await Promise.all([
      redis.get('delivery:price_per_km'),
      redis.get('delivery:free_threshold'),
      redis.get('bot:settings:min_order'),
    ]);
    await ctx.editMessageText(
      `🚚 *Настройки доставки*\n\n💰 Цена за км: *${pricePerKm || '—'} сум*\n🎁 Бесплатно от: *${freeThreshold || '—'} сум*\n📦 Мин. заказ: *${minOrder || '0'} сум*\n\n_Изменить мин. заказ: /settings min\_order [сумма]_`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('◀️ Назад', 'adm_back')]]) }
    );
  });

  // ── STATS PANEL ──────────────────────────────────────────────────────────

  bot.action('adm_stats_panel', async (ctx) => {
    if (!await canManage(ctx.from.id)) return ctx.answerCbQuery('❌');
    await ctx.answerCbQuery('📊 Загружаю...');
    try {
      const now = new Date();
      const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
      const d30 = new Date(now); d30.setDate(1); d30.setHours(0, 0, 0, 0);
      const [today, month, pending, revenue, users] = await Promise.all([
        Order.countDocuments({ createdAt: { $gte: d0 }, status: { $ne: 'cancelled' } }),
        Order.countDocuments({ createdAt: { $gte: d30 }, status: { $ne: 'cancelled' } }),
        Order.countDocuments({ status: { $in: ['new', 'processing', 'confirmed'] } }),
        Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: d30 } } }, { $group: { _id: null, t: { $sum: '$totalPrice' } } }]),
        TelegramUser.countDocuments({ isBanned: { $ne: true } }),
      ]);
      await ctx.editMessageText(
        `📊 *Статистика MeatZone*\n\n📅 Сегодня: *${today}* заказов\n🗓️ Месяц: *${month}* заказов\n⏳ В обработке: *${pending}*\n💰 Выручка (месяц): *${fmt(revenue[0]?.t || 0)} сум*\n👥 Пользователей: *${users}*`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('◀️ Назад', 'adm_back')]]) }
      );
    } catch (e) {
      await ctx.editMessageText('Ошибка: ' + e.message, {
        ...Markup.inlineKeyboard([[Markup.button.callback('◀️ Назад', 'adm_back')]])
      });
    }
  });

  // ── ERROR HANDLER ─────────────────────────────────────────────────────────
  bot.catch((err, ctx) => {
    logger.error('Bot error', { error: err.message, stack: err.stack });
    ctx.reply('Произошла ошибка. Попробуйте снова.').catch(() => { });
  });

  return bot;
}

module.exports = { createBot };
