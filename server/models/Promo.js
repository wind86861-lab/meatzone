const mongoose = require('mongoose');

const promoSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percent', 'fixed'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
  },
  maxUses: {
    type: Number,
    default: null, // null = unlimited
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  validUntil: {
    type: Date,
    default: null, // null = no expiry
  },
  firstOrderOnly: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  usedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    usedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

promoSchema.index({ isActive: 1 });

module.exports = mongoose.model('Promo', promoSchema);
