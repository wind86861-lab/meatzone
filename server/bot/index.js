const { Telegraf, Markup } = require('telegraf');
const TelegramUser = require('../models/TelegramUser');
const Order = require('../models/Order');

// State for tracking user conversations
const userStates = {};

const ROLE_LABELS = {
  admin: '👑 Admin',
  manager: '📋 Manager',
  master: '🔧 Master',
  technician: '🛠 Texnik',
};

function getMasterKeyboard() {
  return Markup.keyboard([
    ['🆕 Yangi zakazlar', '📋 Mening zakazlarim'],
    ['✅ Zakaz tasdiqlash', '👨‍🔧 Usta tayinlash'],
  ]).resize();
}

function getManagerKeyboard() {
  return Markup.keyboard([
    ['🆕 Yangi zakazlar', '📋 Mening zakazlarim'],
    ['✅ Zakaz tasdiqlash', '👨‍🔧 Usta tayinlash'],
    ['➕ Yangi zakaz yaratish'],
  ]).resize();
}

function getAdminKeyboard() {
  return Markup.keyboard([
    ['🆕 Yangi zakazlar', '📋 Barcha zakazlar'],
    ['✅ Zakaz tasdiqlash', '👨‍🔧 Usta tayinlash'],
    ['➕ Yangi zakaz yaratish', '👥 Foydalanuvchilar'],
  ]).resize();
}

function getKeyboardForRole(role) {
  if (role === 'admin') return getAdminKeyboard();
  if (role === 'manager') return getManagerKeyboard();
  return getMasterKeyboard();
}

let botInstance = null;

function initBot() {
  if (botInstance) {
    console.log('[BOT] Bot already initialized, skipping');
    return botInstance;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('[BOT] No TELEGRAM_BOT_TOKEN found, skipping bot init');
    return null;
  }

  const bot = new Telegraf(token);
  botInstance = bot;

  // /start command
  bot.start(async (ctx) => {
    const chatId = ctx.chat.id;
    const existingUser = await TelegramUser.findOne({ chatId });

    if (existingUser) {
      ctx.reply(
        `👋 Xush kelibsiz, ${existingUser.name}!\n👤 Rolingiz: <b>${ROLE_LABELS[existingUser.role] || existingUser.role}</b>`,
        { parse_mode: 'HTML', ...getKeyboardForRole(existingUser.role) }
      );
      return;
    }

    ctx.reply(
      `👋 Avtoban Stroy botiga xush kelibsiz!\n\nRo'yxatdan o'tish uchun telefon raqamingizni yuboring:`,
      Markup.keyboard([
        [Markup.button.contactRequest('📱 Telefon raqamni yuborish')],
      ]).resize().oneTime()
    );
  });

  // Handle contact (phone number) for registration
  bot.on('contact', async (ctx) => {
    const chatId = ctx.chat.id;
    const contact = ctx.message.contact;
    let phone = contact.phone_number;

    // Normalize phone
    if (!phone.startsWith('+')) phone = '+' + phone;

    const existingUser = await TelegramUser.findOne({ chatId });
    if (existingUser) {
      ctx.reply('Siz allaqachon ro\'yxatdan o\'tgansiz!', getKeyboardForRole(existingUser.role));
      return;
    }

    const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Foydalanuvchi';

    const telegramUser = await TelegramUser.create({
      chatId,
      phone,
      name,
      role: 'master',
    });

    ctx.reply(
      `✅ Ro'yxatdan muvaffaqiyatli o'tdingiz!\n\n👤 Ism: <b>${name}</b>\n📱 Tel: <b>${phone}</b>\n👥 Rol: <b>${ROLE_LABELS[telegramUser.role]}</b>`,
      { parse_mode: 'HTML', ...getKeyboardForRole(telegramUser.role) }
    );
  });

  // ─── Yangi zakazlar (new orders) ───
  bot.hears('🆕 Yangi zakazlar', async (ctx) => {
    const chatId = ctx.chat.id;
    const tgUser = await TelegramUser.findOne({ chatId });
    if (!tgUser) return ctx.reply('Iltimos, avval /start buyrug\'ini yuboring.');

    const newOrders = await Order.find({ status: 'new' }).sort({ createdAt: -1 }).limit(10);

    if (newOrders.length === 0) {
      ctx.reply('🆕 Yangi zakazlar\n\nHozircha yangi zakazlar yo\'q.', getKeyboardForRole(tgUser.role));
      return;
    }

    let text = '🆕 <b>Yangi zakazlar:</b>\n\n';
    newOrders.forEach((order, i) => {
      const date = new Date(order.createdAt).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent' });
      text += `${i + 1}. 👤 ${order.customerName || '—'}\n`;
      text += `   📞 ${order.customerPhone}\n`;
      text += `   💰 ${order.totalPrice?.toLocaleString()} so'm\n`;
      text += `   📅 ${date}\n\n`;
    });

    ctx.reply(text, { parse_mode: 'HTML', ...getKeyboardForRole(tgUser.role) });
  });

  // ─── Mening zakazlarim (my orders) ───
  bot.hears(['📋 Mening zakazlarim', '📋 Barcha zakazlar'], async (ctx) => {
    const chatId = ctx.chat.id;
    const tgUser = await TelegramUser.findOne({ chatId });
    if (!tgUser) return ctx.reply('Iltimos, avval /start buyrug\'ini yuboring.');

    let orders;
    if (tgUser.role === 'admin' || tgUser.role === 'manager') {
      orders = await Order.find({}).sort({ createdAt: -1 }).limit(10);
    } else {
      orders = await Order.find({ assignedTo: tgUser.phone }).sort({ createdAt: -1 }).limit(10);
    }

    if (!orders || orders.length === 0) {
      const label = tgUser.role === 'admin' ? 'Zakazlar' : 'Mening zakazlarim';
      ctx.reply(`📋 ${label}\n\nSizga biriktirilgan zakazlar yo'q.`, getKeyboardForRole(tgUser.role));
      return;
    }

    const statusEmoji = { new: '🆕', processing: '⚙️', completed: '✅', cancelled: '❌' };
    let text = `📋 <b>${tgUser.role === 'admin' ? 'Barcha zakazlar' : 'Mening zakazlarim'}:</b>\n\n`;
    orders.forEach((order, i) => {
      const date = new Date(order.createdAt).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent' });
      text += `${i + 1}. ${statusEmoji[order.status] || '📦'} ${order.customerName || '—'}\n`;
      text += `   📞 ${order.customerPhone}\n`;
      text += `   💰 ${order.totalPrice?.toLocaleString()} so'm\n`;
      text += `   📅 ${date}\n\n`;
    });

    ctx.reply(text, { parse_mode: 'HTML', ...getKeyboardForRole(tgUser.role) });
  });

  // ─── Zakaz tasdiqlash (confirm order) ───
  bot.hears('✅ Zakaz tasdiqlash', async (ctx) => {
    const chatId = ctx.chat.id;
    const tgUser = await TelegramUser.findOne({ chatId });
    if (!tgUser) return ctx.reply('Iltimos, avval /start buyrug\'ini yuboring.');

    const newOrders = await Order.find({ status: 'new' }).sort({ createdAt: -1 }).limit(10);

    if (newOrders.length === 0) {
      ctx.reply('Hozircha tasdiqlanmagan zakazlar yo\'q.', getKeyboardForRole(tgUser.role));
      return;
    }

    const buttons = newOrders.map((order) => {
      const label = `${order.customerName || '—'} — ${order.totalPrice?.toLocaleString()} so'm`;
      return [Markup.button.callback(label, `confirm_${order._id}`)];
    });

    ctx.reply('Tasdiqlamoqchi bo\'lgan zakazni tanlang:', Markup.inlineKeyboard(buttons));
  });

  // Confirm order callback
  bot.action(/confirm_(.+)/, async (ctx) => {
    const orderId = ctx.match[1];
    try {
      const order = await Order.findByIdAndUpdate(orderId, { status: 'processing' }, { new: true });
      if (!order) {
        ctx.answerCbQuery('Zakaz topilmadi');
        return;
      }
      ctx.answerCbQuery('✅ Zakaz tasdiqlandi!');
      ctx.editMessageText(
        `✅ Zakaz tasdiqlandi!\n\n👤 ${order.customerName || '—'}\n📞 ${order.customerPhone}\n💰 ${order.totalPrice?.toLocaleString()} so'm\n\nStatus: ⚙️ Jarayonda`,
        { parse_mode: 'HTML' }
      );
    } catch (err) {
      ctx.answerCbQuery('Xatolik yuz berdi');
    }
  });

  // ─── Usta tayinlash (assign master) ───
  bot.hears('👨‍🔧 Usta tayinlash', async (ctx) => {
    const chatId = ctx.chat.id;
    const tgUser = await TelegramUser.findOne({ chatId });
    if (!tgUser) return ctx.reply('Iltimos, avval /start buyrug\'ini yuboring.');

    if (tgUser.role !== 'admin' && tgUser.role !== 'manager') {
      ctx.reply('Bu funksiya faqat admin va manager uchun.', getKeyboardForRole(tgUser.role));
      return;
    }

    const processingOrders = await Order.find({ status: 'processing' }).sort({ createdAt: -1 }).limit(10);
    if (processingOrders.length === 0) {
      ctx.reply('Hozircha usta tayinlash uchun zakazlar yo\'q.', getKeyboardForRole(tgUser.role));
      return;
    }

    const buttons = processingOrders.map((order) => {
      const label = `${order.customerName || '—'} — ${order.totalPrice?.toLocaleString()} so'm`;
      return [Markup.button.callback(label, `assign_${order._id}`)];
    });

    ctx.reply('Usta tayinlamoqchi bo\'lgan zakazni tanlang:', Markup.inlineKeyboard(buttons));
  });

  bot.action(/assign_(.+)/, async (ctx) => {
    const orderId = ctx.match[1];
    const masters = await TelegramUser.find({ role: 'master', isActive: true });

    if (masters.length === 0) {
      ctx.answerCbQuery('Ustalar topilmadi');
      return;
    }

    const buttons = masters.map((master) => {
      return [Markup.button.callback(`🔧 ${master.name} (${master.phone})`, `do_assign_${orderId}_${master.chatId}`)];
    });

    ctx.answerCbQuery();
    ctx.editMessageText('Usta tanlang:', Markup.inlineKeyboard(buttons));
  });

  bot.action(/do_assign_(.+)_(.+)/, async (ctx) => {
    const orderId = ctx.match[1];
    const masterChatId = parseInt(ctx.match[2]);

    const master = await TelegramUser.findOne({ chatId: masterChatId });
    if (!master) {
      ctx.answerCbQuery('Usta topilmadi');
      return;
    }

    await Order.findByIdAndUpdate(orderId, { assignedTo: master.phone });
    ctx.answerCbQuery('✅ Usta tayinlandi!');
    ctx.editMessageText(`✅ Zakaz ustaga tayinlandi!\n\n🔧 Usta: <b>${master.name}</b>\n📞 ${master.phone}`, { parse_mode: 'HTML' });

    // Notify the assigned master
    try {
      const order = await Order.findById(orderId);
      bot.telegram.sendMessage(
        masterChatId,
        `🔔 <b>Yangi zakaz sizga tayinlandi!</b>\n\n👤 Mijoz: ${order.customerName || '—'}\n📞 Tel: ${order.customerPhone}\n💰 Narx: ${order.totalPrice?.toLocaleString()} so'm\n${order.comment ? `💬 Izoh: ${order.comment}` : ''}`,
        { parse_mode: 'HTML' }
      );
    } catch (err) {
      console.error('[BOT] Error notifying master:', err.message);
    }
  });

  // ─── Yangi zakaz yaratish (create new order) - for manager/admin ───
  bot.hears('➕ Yangi zakaz yaratish', async (ctx) => {
    const chatId = ctx.chat.id;
    const tgUser = await TelegramUser.findOne({ chatId });
    if (!tgUser) return ctx.reply('Iltimos, avval /start buyrug\'ini yuboring.');

    if (tgUser.role !== 'admin' && tgUser.role !== 'manager') {
      ctx.reply('Bu funksiya faqat admin va manager uchun.', getKeyboardForRole(tgUser.role));
      return;
    }

    userStates[chatId] = { step: 'order_name' };
    ctx.reply(
      '📝 <b>Yangi zakaz yaratish</b>\n\nMijoz ismini kiriting:',
      { parse_mode: 'HTML', ...Markup.keyboard([['❌ Bekor qilish']]).resize() }
    );
  });

  // ─── Foydalanuvchilar (users) - admin only ───
  bot.hears('👥 Foydalanuvchilar', async (ctx) => {
    const chatId = ctx.chat.id;
    const tgUser = await TelegramUser.findOne({ chatId });
    if (!tgUser || tgUser.role !== 'admin') {
      ctx.reply('Bu funksiya faqat admin uchun.');
      return;
    }

    const users = await TelegramUser.find({}).sort({ createdAt: -1 });
    if (users.length === 0) {
      ctx.reply('Foydalanuvchilar yo\'q.', getKeyboardForRole(tgUser.role));
      return;
    }

    let text = '👥 <b>Foydalanuvchilar:</b>\n\n';
    users.forEach((u, i) => {
      text += `${i + 1}. ${u.name}\n   📞 ${u.phone}\n   👤 ${ROLE_LABELS[u.role] || u.role}\n\n`;
    });

    ctx.reply(text, { parse_mode: 'HTML', ...getKeyboardForRole(tgUser.role) });
  });

  // ─── Handle text messages for order creation flow ───
  bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;

    // Cancel
    if (text === '❌ Bekor qilish') {
      delete userStates[chatId];
      const tgUser = await TelegramUser.findOne({ chatId });
      ctx.reply('❌ Bekor qilindi.', getKeyboardForRole(tgUser?.role || 'master'));
      return;
    }

    const state = userStates[chatId];
    if (!state) return;

    const tgUser = await TelegramUser.findOne({ chatId });
    if (!tgUser) return;

    switch (state.step) {
      case 'order_name':
        state.customerName = text;
        state.step = 'order_phone';
        ctx.reply('📞 Mijoz telefon raqamini kiriting:');
        break;

      case 'order_phone':
        state.customerPhone = text;
        state.step = 'order_items';
        ctx.reply('📦 Mahsulotni kiriting (nomi va narxi):\n\nMasalan: <b>Shina 205/55 R16 - 450000</b>\n\nHar bir mahsulotni alohida yuboring.\nTugatish uchun "✅ Tayyor" deb yozing.', { parse_mode: 'HTML' });
        state.items = [];
        break;

      case 'order_items':
        if (text === '✅ Tayyor' || text === 'Tayyor') {
          if (state.items.length === 0) {
            ctx.reply('Kamida bitta mahsulot qo\'shing!');
            return;
          }
          state.step = 'order_comment';
          ctx.reply('💬 Izoh kiriting (yoki "Yo\'q" deb yozing):');
          return;
        }

        // Parse item: "Name - Price" or "Name Price"
        const parts = text.split(/[-–—]/).map(s => s.trim());
        let itemName, itemPrice;

        if (parts.length >= 2) {
          itemName = parts[0];
          itemPrice = parseInt(parts[parts.length - 1].replace(/\D/g, ''));
        } else {
          const match = text.match(/(.+?)\s+(\d[\d\s]*)/);
          if (match) {
            itemName = match[1].trim();
            itemPrice = parseInt(match[2].replace(/\s/g, ''));
          }
        }

        if (!itemName || !itemPrice || isNaN(itemPrice)) {
          ctx.reply('❌ Noto\'g\'ri format. Masalan: <b>Shina 205/55 R16 - 450000</b>', { parse_mode: 'HTML' });
          return;
        }

        state.items.push({ name: itemName, price: itemPrice, quantity: 1 });
        ctx.reply(`✅ Qo'shildi: <b>${itemName}</b> — ${itemPrice.toLocaleString()} so'm\n\nYana mahsulot qo'shing yoki "✅ Tayyor" deb yozing.`, { parse_mode: 'HTML' });
        break;

      case 'order_comment': {
        const comment = (text === 'Yo\'q' || text === 'yoq' || text === "Yo'q") ? '' : text;
        const totalPrice = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        try {
          const order = await Order.create({
            customerName: state.customerName,
            customerPhone: state.customerPhone,
            items: state.items,
            totalPrice,
            comment,
            status: 'new',
          });

          delete userStates[chatId];

          let summary = `✅ <b>Zakaz yaratildi!</b>\n\n`;
          summary += `👤 Mijoz: <b>${order.customerName}</b>\n`;
          summary += `📞 Tel: <b>${order.customerPhone}</b>\n\n`;
          summary += `🧾 <b>Mahsulotlar:</b>\n`;
          state.items.forEach((item, i) => {
            summary += `  ${i + 1}. ${item.name} — ${item.price.toLocaleString()} so'm\n`;
          });
          summary += `\n💰 Jami: <b>${totalPrice.toLocaleString()} so'm</b>`;
          if (comment) summary += `\n💬 Izoh: ${comment}`;

          ctx.reply(summary, { parse_mode: 'HTML', ...getKeyboardForRole(tgUser.role) });

          // Also send to admin chat
          const { sendTelegramMessage, formatOrderMessage } = require('../utils/telegram');
          sendTelegramMessage(formatOrderMessage(order)).catch(() => { });
        } catch (err) {
          console.error('[BOT] Order creation error:', err);
          ctx.reply('❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.', getKeyboardForRole(tgUser.role));
          delete userStates[chatId];
        }
        break;
      }

      default:
        delete userStates[chatId];
        break;
    }
  });

  // Launch bot
  bot.launch({ dropPendingUpdates: true })
    .then(() => console.log('[BOT] Telegram bot started'))
    .catch((err) => console.error('[BOT] Failed to start:', err.message));

  // Graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return bot;
}

// Send notification to a Telegram user by chatId
async function sendTelegramNotification(chatId, message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return;

  try {
    if (botInstance) {
      await botInstance.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } else {
      // Fallback: create a temporary telegram instance
      const { Telegram } = require('telegraf');
      const telegram = new Telegram(token);
      await telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
    }
    console.log(`[BOT] Notification sent to chatId: ${chatId}`);
  } catch (err) {
    console.error(`[BOT] Failed to send notification to ${chatId}:`, err.message);
  }
}

module.exports = { initBot, sendTelegramNotification };
