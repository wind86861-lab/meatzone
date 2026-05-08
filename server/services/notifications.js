// Simple notification service — stores bot instance for cross-module access
let botInstance = null;
const TelegramUser = require('../models/TelegramUser');

module.exports = {
  setBot(bot) {
    botInstance = bot;
    console.log('[notifications] Bot instance registered');
  },

  getBot() {
    return botInstance;
  },

  async sendMessage(telegramId, text, options = {}) {
    if (!botInstance) {
      console.warn('[notifications] Bot not initialized, cannot send message');
      return null;
    }
    try {
      return await botInstance.telegram.sendMessage(telegramId, text, {
        parse_mode: 'Markdown',
        ...options,
      });
    } catch (err) {
      console.error('[notifications] Failed to send message:', err.message);
      return null;
    }
  },

  async notifyRoleChanged(telegramId, newRole, lang = 'uz') {
    const roles = {
      customer: {
        uz: { name: '👤 Mijoz', desc: 'Siz do\'kondan mahsulot buyurtma qilishingiz mumkin.' },
        ru: { name: '👤 Клиент', desc: 'Вы можете заказывать товары в магазине.' },
      },
      driver: {
        uz: { name: '🚚 Kurer', desc: 'Siz buyurtmalarni yetkazib berish uchun tayinlangan dasturga kirishingiz mumkin.' },
        ru: { name: '🚚 Курьер', desc: 'Вам открыт доступ к панели курьера для доставки заказов.' },
      },
      operator: {
        uz: { name: '⚙️ Operator', desc: 'Siz buyurtmalarni boshqarish paneliga kirishingiz mumkin.' },
        ru: { name: '⚙️ Оператор', desc: 'Вам открыт доступ к панели управления заказами.' },
      },
      manager: {
        uz: { name: '📊 Menejer', desc: 'Siz boshqaruv paneliga to\'liq kirishingiz mumkin.' },
        ru: { name: '📊 Менеджер', desc: 'Вам открыт полный доступ к панели управления.' },
      },
      admin: {
        uz: { name: '🛡 Admin', desc: 'Siz tizimning to\'liq administrator huquqlariga egasiz.' },
        ru: { name: '🛡 Администратор', desc: 'Вам предоставлены полные права администратора системы.' },
      },
    };

    const r = roles[newRole] || roles.customer;
    const info = r[lang] || r.uz;

    const text = lang === 'ru'
      ? `🔔 *Ваша роль обновлена!*\n\nНовая роль: *${info.name}*\n\n${info.desc}\n\nОткройте бот, чтобы увидеть новое меню 👇`
      : `🔔 *Sizning rolingiz yangilandi!*\n\nYangi rol: *${info.name}*\n\n${info.desc}\n\nYangi menyuni ko'rish uchun botni oching 👇`;

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'Meatzone_uz_bot';
    const { Markup } = require('telegraf');
    return this.sendMessage(telegramId, text, {
      ...Markup.inlineKeyboard([
        [Markup.button.url('🤖 Botni ochish', `https://t.me/${botUsername}`)],
      ]),
    });
  },

  /**
   * Broadcast a new order to ALL available drivers.
   * Returns array of { telegramId, messageId } for tracking.
   */
  async notifyDriversOfNewOrder(order, items) {
    if (!botInstance) return [];
    try {
      const drivers = await TelegramUser.find({ role: 'driver', isActive: true });
      if (!drivers.length) {
        console.log('[drivers] No active Telegram drivers found');
        return [];
      }

      // Escape Markdown special chars in user-generated text
      const esc = (s) => String(s || '').replace(/[_*\[\]()~`>#+\-=|{}.!]/g, '\\$&');

      const itemLines = (items || []).map((it, i) =>
        `${i + 1}. ${esc(it.name)} — ${it.quantity} x ${Number(it.price || 0).toLocaleString('ru-RU')} so'm = ${Number((it.price || 0) * (it.quantity || 1)).toLocaleString('ru-RU')} so'm`
      ).join('\n');

      const text =
        `🚚 *Yangi yetkazib berish buyurtmasi!*\n\n` +
        `👤 ${esc(order.customerName)}\n` +
        `📱 ${esc(order.customerPhone)}\n` +
        `📍 ${esc(order.address)}${order.district ? ' (' + esc(order.district) + ')' : ''}\n` +
        `💰 *${Number(order.totalPrice || 0).toLocaleString('ru-RU')} so'm*\n\n` +
        `*Mahsulotlar:*\n${itemLines || '—'}\n\n` +
        `⏱ Buyurtma olinganidan keyin yetkazib berishni boshlang!`;

      const { Markup } = require('telegraf');
      const sent = [];

      for (const d of drivers) {
        try {
          const msg = await botInstance.telegram.sendMessage(
            d.telegramId,
            text,
            {
              parse_mode: 'Markdown',
              ...Markup.inlineKeyboard([
                [Markup.button.callback('✅ Qabul qilish', `accept_order:${order._id}`)],
              ]),
            }
          );
          sent.push({ telegramId: d.telegramId, messageId: msg.message_id });
          console.log(`[drivers] Sent to driver ${d.telegramId} (msg ${msg.message_id})`);
        } catch (err) {
          console.error(`[drivers] Failed to notify driver ${d.telegramId}:`, err.message);
        }
      }
      console.log(`[drivers] Notified ${sent.length}/${drivers.length} drivers about order ${order._id}`);
      return sent;
    } catch (err) {
      console.error('[drivers] Error broadcasting to drivers:', err.message);
      return [];
    }
  },

  /**
   * Notify other drivers that an order was already taken.
   */
  async notifyDriverOrderTaken(order, winnerTelegramId, sentNotifications) {
    if (!botInstance) return;
    try {
      const text =
        `⚠️ *Bu buyurtma allaqachon olingan*\n\n` +
        `Boshqa buyurtma paydo bo'lganda sizni xabardor qilamiz.`;

      for (const n of (sentNotifications || [])) {
        if (n.telegramId === winnerTelegramId) continue;
        try {
          await botInstance.telegram.editMessageText(
            n.telegramId,
            n.messageId,
            undefined,
            text,
            { parse_mode: 'Markdown' }
          );
        } catch (err) {
          // message may be deleted or too old, silently ignore
        }
      }
    } catch (err) {
      console.error('[drivers] Error notifying drivers order taken:', err.message);
    }
  },
};
