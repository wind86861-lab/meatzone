const express = require('express');
const router = express.Router();
const Promo = require('../models/Promo');
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/auth');

/**
 * POST /api/promos/validate
 * Public — validate promo code before order submission
 * Body: { code, orderTotal, userId? }
 */
router.post('/validate', async (req, res) => {
  try {
    const { code, orderTotal = 0, userId } = req.body;
    if (!code) return res.status(400).json({ message: 'Code required' });

    const promo = await Promo.findOne({ code: code.toUpperCase().trim(), isActive: true });
    if (!promo) return res.status(404).json({ valid: false, message: "Promo-kod topilmadi" });

    // Expiry check
    if (promo.validUntil && new Date() > promo.validUntil) {
      return res.json({ valid: false, message: "Promo-kod muddati tugagan" });
    }

    // Usage limit
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return res.json({ valid: false, message: "Promo-kod limiti tugagan" });
    }

    // First-order check
    if (promo.firstOrderOnly && userId) {
      const existing = await Order.findOne({ user: userId, status: { $ne: 'cancelled' } });
      if (existing) return res.json({ valid: false, message: "Bu kod faqat birinchi zakaz uchun" });
    }

    // Already used by this user
    if (userId && promo.usedBy.some(u => String(u.user) === String(userId))) {
      return res.json({ valid: false, message: "Siz bu kodni ishlatgansiz" });
    }

    const discount = promo.discountType === 'percent'
      ? Math.round((Number(orderTotal) * promo.discountValue) / 100)
      : promo.discountValue;

    res.json({
      valid: true,
      promoId: promo._id,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discount,
      message: `${promo.discountType === 'percent' ? promo.discountValue + '%' : promo.discountValue.toLocaleString('ru-RU') + " so'm"} chegirma qo'llanildi`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: list all promos
router.get('/', protect, admin, async (req, res) => {
  try {
    const promos = await Promo.find().sort({ createdAt: -1 });
    res.json({ promos });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: create promo
router.post('/', protect, admin, async (req, res) => {
  try {
    const { code, discountType, discountValue, maxUses, validUntil, firstOrderOnly } = req.body;
    const promo = await Promo.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue: Number(discountValue),
      maxUses: maxUses || null,
      validUntil: validUntil || null,
      firstOrderOnly: Boolean(firstOrderOnly),
    });
    res.status(201).json(promo);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "Bu kod allaqachon mavjud" });
    res.status(500).json({ message: err.message });
  }
});

// Admin: toggle active
router.patch('/:id/toggle', protect, admin, async (req, res) => {
  try {
    const promo = await Promo.findById(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Not found' });
    promo.isActive = !promo.isActive;
    await promo.save();
    res.json(promo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: delete
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    await Promo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
