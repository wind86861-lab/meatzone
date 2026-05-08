const express = require('express');
const router = express.Router();
const Coin = require('../models/Coin');
const Settings = require('../models/Settings');
const { protect, admin } = require('../middleware/auth');

async function getCoinSettings() {
  const docs = await Settings.find({ key: { $in: ['coin_rate', 'coin_max_percent'] } });
  const s = {};
  docs.forEach(d => { s[d.key] = d.value; });
  return {
    rate: Number(s.coin_rate) || 1,         // coins per 1000 sum spent
    maxPercent: Number(s.coin_max_percent) || 30, // max % of order payable by coins
  };
}

// Get balance for logged-in user
router.get('/balance', protect, async (req, res) => {
  try {
    const result = await Coin.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const balance = result[0]?.total || 0;
    res.json({ balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get transaction history
router.get('/history', protect, async (req, res) => {
  try {
    const history = await Coin.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('order', 'totalPrice createdAt');
    res.json({ history });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get coin settings (public, for checkout display)
router.get('/settings', async (req, res) => {
  try {
    const cfg = await getCoinSettings();
    res.json(cfg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: update coin settings
router.put('/settings', protect, admin, async (req, res) => {
  try {
    const { coin_rate, coin_max_percent } = req.body;
    if (coin_rate !== undefined) {
      await Settings.findOneAndUpdate({ key: 'coin_rate' }, { key: 'coin_rate', value: Number(coin_rate) }, { upsert: true });
    }
    if (coin_max_percent !== undefined) {
      await Settings.findOneAndUpdate({ key: 'coin_max_percent' }, { key: 'coin_max_percent', value: Number(coin_max_percent) }, { upsert: true });
    }
    res.json(await getCoinSettings());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: manually add/deduct coins for a user
router.post('/admin/adjust', protect, admin, async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    const coin = await Coin.create({ user: userId, amount, type: 'admin', description: description || 'Admin adjustment' });
    res.json(coin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
module.exports.getCoinSettings = getCoinSettings;
