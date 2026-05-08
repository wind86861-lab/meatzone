const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const TelegramUser = require('../models/TelegramUser');
const { protect, admin } = require('../middleware/auth');
const { notifyRoleChanged } = require('../services/notifications');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '8h',
  });
};

router.post('/register', protect, admin, [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, role, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const allowedRoles = ['admin', 'manager', 'technician', 'customer', 'driver'];
    const finalRole = allowedRoles.includes(role) ? role : 'technician';

    const user = await User.create({
      name,
      email,
      password,
      role: finalRole,
      phone,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── TELEGRAM MINI APP AUTH ───────────────────────────────────────────────
const crypto = require('crypto');

function verifyTelegramInitData(initData) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN not set');

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  // Sort keys and build data-check string
  const keys = [...params.keys()].sort();
  const dataCheckString = keys.map(k => `${k}=${params.get(k)}`).join('\n');

  // Compute secret = HMAC_SHA256(bot_token, "WebAppData")
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  // Compute hash = HMAC_SHA256(data_check_string, secret)
  const computedHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  if (computedHash !== hash) return null;

  // Parse user object
  const userJson = params.get('user');
  if (!userJson) return null;
  try {
    return JSON.parse(decodeURIComponent(userJson));
  } catch {
    return null;
  }
}

/**
 * POST /api/auth/telegram/init
 * Verify Telegram Mini App initData and auto-authenticate user.
 * Body: { initData: string }
 */
router.post('/telegram/init', async (req, res) => {
  try {
    const { initData } = req.body;
    if (!initData) return res.status(400).json({ message: 'initData required' });

    const tgUser = verifyTelegramInitData(initData);
    if (!tgUser) return res.status(401).json({ message: 'Invalid initData' });

    const telegramId = String(tgUser.id);

    // Find or create User linked to this Telegram account
    let user = await User.findOne({ telegramId });
    if (!user) {
      const safeEmail = `tg_${telegramId}@telegram.meatzone.uz`;
      const randomPassword = crypto.randomBytes(32).toString('hex');

      user = await User.create({
        name: tgUser.first_name || tgUser.username || `TG_${telegramId}`,
        email: safeEmail,
        password: randomPassword,
        role: 'customer',
        telegramId,
        telegramUsername: tgUser.username || '',
      });
    }

    // Upsert TelegramUser record (sync with bot)
    await TelegramUser.findOneAndUpdate(
      { telegramId },
      {
        firstName: tgUser.first_name || '',
        lastName: tgUser.last_name || '',
        username: tgUser.username || '',
        languageCode: tgUser.language_code || 'uz',
        lastActiveAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        telegramId: user.telegramId,
      },
    });
  } catch (error) {
    console.error('Telegram init auth error:', error);
    res.status(500).json({ message: error.message });
  }
});

// =====================================================
// DRIVER MANAGEMENT
// =====================================================

/**
 * GET /api/auth/drivers
 * Get all drivers
 */
router.get('/drivers', protect, admin, async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' }).select('-password').sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * PUT /api/admin/users/:id/role
 * Change user role (admin, manager, customer)
 * Body: { role: string }
 */
router.put('/admin/users/:id/role', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const allowed = ['admin', 'manager', 'technician', 'customer', 'driver', 'operator'];
    if (!allowed.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Allowed: ${allowed.join(', ')}` });
    }

    // Try User model first, then TelegramUser
    let user = await User.findById(id);
    let isTg = false;
    if (!user) {
      user = await TelegramUser.findById(id);
      isTg = true;
    }
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent removing own admin role
    if (!isTg && String(user._id) === String(req.user._id) && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot remove your own admin role' });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // Sync role to linked TelegramUser if this is a web User with telegramId
    if (!isTg && user.telegramId) {
      try {
        await TelegramUser.findOneAndUpdate(
          { telegramId: user.telegramId },
          { role }
        );
        console.log(`[role] Synced TelegramUser ${user.telegramId} role to ${role}`);
      } catch (syncErr) {
        console.error(`[role] Failed to sync TelegramUser role:`, syncErr.message);
      }
    }

    // Send Telegram notification to any user that has a telegramId
    const telegramIdToNotify = user.telegramId || null;
    if (telegramIdToNotify) {
      try {
        let lang = 'uz';
        if (isTg) {
          lang = ['ru', 'uz'].includes(user.languageCode) ? user.languageCode : 'uz';
        } else {
          // Web user — look up TelegramUser for their language preference
          const tgUser = await TelegramUser.findOne({ telegramId: telegramIdToNotify });
          if (tgUser) lang = ['ru', 'uz'].includes(tgUser.languageCode) ? tgUser.languageCode : 'uz';
        }
        await notifyRoleChanged(telegramIdToNotify, role, lang);
        console.log(`[role] Notification sent to ${telegramIdToNotify}: role ${oldRole} -> ${role}`);
      } catch (notifyErr) {
        console.error(`[role] Failed to notify ${telegramIdToNotify}:`, notifyErr.message);
      }
    }

    res.json({
      message: `Role changed from ${oldRole} to ${role}`,
      user: { _id: user._id, name: isTg ? (user.firstName || '') : (user.name || ''), role: user.role },
    });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * PUT /api/admin/users/:id/status
 * Toggle user active/inactive status
 * Body: { isActive: boolean }
 */
router.put('/admin/users/:id/status', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Try User model first, then TelegramUser
    let user = await User.findById(id);
    let isTg = false;
    if (!user) {
      user = await TelegramUser.findById(id);
      isTg = true;
    }
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent deactivating own account
    if (!isTg && String(user._id) === String(req.user._id) && !isActive) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    user.isActive = isActive;
    await user.save();
    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'}`,
      user: { _id: user._id, isActive: user.isActive },
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/admin/users
 * Returns merged users from User + TelegramUser collections
 */
router.get('/admin/users', protect, admin, async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;

    // 1. Get all web-app users
    const userQuery = {};
    if (role) userQuery.role = role;
    const webUsers = await User.find(userQuery).select('-password').sort({ createdAt: -1 }).lean();

    // 2. Get all telegram bot users
    const tgQuery = {};
    if (role) tgQuery.role = role;
    const tgUsers = await TelegramUser.find(tgQuery).sort({ createdAt: -1 }).lean();

    // 3. Merge: index webUsers by telegramId for dedup
    const seenTgIds = new Set();
    const merged = [];

    for (const u of webUsers) {
      const row = {
        _id: u._id,
        source: 'web',
        name: u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        role: u.role || 'customer',
        telegramId: u.telegramId || '',
        telegramUsername: u.telegramUsername || '',
        isActive: u.isActive !== false,
        createdAt: u.createdAt,
      };
      if (u.telegramId) seenTgIds.add(u.telegramId);
      merged.push(row);
    }

    for (const t of tgUsers) {
      if (seenTgIds.has(t.telegramId)) continue;
      merged.push({
        _id: t._id,
        source: 'telegram',
        name: [t.firstName, t.lastName].filter(Boolean).join(' ') || '',
        email: '',
        phone: t.phone || '',
        role: t.role || 'customer',
        telegramId: t.telegramId || '',
        telegramUsername: t.username || '',
        isActive: !t.isBanned,
        createdAt: t.createdAt,
      });
    }

    // 4. Sort by date desc
    merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = merged.length;
    const pg = parseInt(page);
    const lim = parseInt(limit);
    const paged = merged.slice((pg - 1) * lim, pg * lim);

    res.json({
      users: paged,
      total,
      page: pg,
      pages: Math.ceil(total / lim),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/auth/admin/broadcast
 * Send a Telegram message to all users (or filtered by userType)
 * Body: { message: string, userType?: 'all'|'premium'|'regular', parseMode?: 'Markdown'|'HTML' }
 */
router.post('/admin/broadcast', protect, admin, async (req, res) => {
  try {
    const { message, userType = 'all', parseMode = 'HTML' } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(503).json({ message: 'Telegram bot not configured' });
    }

    const query = { telegramId: { $exists: true, $ne: null } };

    const users = await User.find(query).select('telegramId name');

    const { Telegraf } = require('telegraf');
    const tempBot = new Telegraf(botToken);

    let sent = 0, failed = 0;
    for (const u of users) {
      try {
        await tempBot.telegram.sendMessage(u.telegramId, message, { parse_mode: parseMode });
        sent++;
        // Throttle: ~30 msg/sec Telegram limit
        await new Promise(r => setTimeout(r, 35));
      } catch {
        failed++;
      }
    }

    res.json({ sent, failed, total: users.length });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
