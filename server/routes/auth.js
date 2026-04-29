const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const TelegramUser = require('../models/TelegramUser');
const { protect, admin } = require('../middleware/auth');

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

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'technician',
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

// =====================================================
// STAGE 1: ADMIN PREMIUM MANAGEMENT
// =====================================================

/**
 * POST /api/admin/users/:id/premium
 * Stage 1: Grant or revoke premium status for a user
 * Body: { isPremium: boolean, durationDays: number }
 */
router.post('/admin/users/:id/premium', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPremium, durationDays = 30 } = req.body;

    // Try User model first, then TelegramUser
    let user = await User.findById(id);
    let isTg = false;
    if (!user) {
      user = await TelegramUser.findById(id);
      isTg = true;
    }
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isPremium = isPremium;
    if (isPremium) {
      user.premiumExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
      if (!isTg) user.userType = 'premium';
    } else {
      user.premiumExpiresAt = null;
      if (!isTg) user.userType = 'regular';
    }

    await user.save();

    res.json({
      message: isPremium ? 'Premium status granted' : 'Premium status revoked',
      user: {
        _id: user._id,
        name: isTg ? (user.firstName || '') : (user.name || ''),
        isPremium: user.isPremium,
        premiumExpiresAt: user.premiumExpiresAt,
      },
    });
  } catch (error) {
    console.error('Premium update error:', error);
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
    const allowed = ['admin', 'manager', 'technician', 'customer'];
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

    user.role = role;
    await user.save();
    res.json({
      message: `Role changed to ${role}`,
      user: { _id: user._id, name: isTg ? (user.firstName || '') : (user.name || ''), role: user.role },
    });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/admin/users
 * Returns merged users from User + TelegramUser collections
 */
router.get('/admin/users', protect, admin, async (req, res) => {
  try {
    const { isPremium, page = 1, limit = 20 } = req.query;
    const premFilter = isPremium !== undefined ? isPremium === 'true' : null;

    // 1. Get all web-app users
    const userQuery = {};
    if (premFilter !== null) userQuery.isPremium = premFilter;
    const webUsers = await User.find(userQuery).select('-password').sort({ createdAt: -1 }).lean();

    // 2. Get all telegram bot users
    const tgQuery = {};
    if (premFilter !== null) tgQuery.isPremium = premFilter;
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
        isPremium: u.isPremium || false,
        premiumExpiresAt: u.premiumExpiresAt || null,
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
        isPremium: t.isPremium || false,
        premiumExpiresAt: t.premiumExpiresAt || null,
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
    if (userType === 'premium') query.isPremium = true;
    if (userType === 'regular') query.isPremium = { $ne: true };

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
