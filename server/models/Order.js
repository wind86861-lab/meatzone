const mongoose = require('mongoose');
const crypto = require('crypto');

const orderSchema = new mongoose.Schema({
  // Stage 1: Deep link token for website -> bot transfer
  deepLinkToken: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },

  // Stage 1: Reference to user (if registered)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    sparse: true,
  },

  // Stage 1: Telegram integration
  telegramId: {
    type: String,
    index: true,
    sparse: true,
  },

  // Customer info
  customerName: { type: String, default: '' },
  customerPhone: { type: String, default: '' },

  // Stage 1: Address and geolocation
  address: {
    type: String,
    default: '',
  },
  district: {
    type: String,
    default: '',
  },
  latitude: {
    type: Number,
    default: null,
  },
  longitude: {
    type: Number,
    default: null,
  },

  // Pricing - Stage 1 tracks if user was premium at order time
  totalPrice: { type: Number, required: true },
  originalTotalPrice: { type: Number, default: 0 }, // Price without premium discount
  isPremiumOrder: { type: Boolean, default: false },

  // Stage 1: Payment status
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online', 'payme', 'click', ''],
    default: '',
  },
  paymentId: {
    type: String,
    default: '',
  },
  paidAt: {
    type: Date,
    default: null,
  },

  // Order status
  status: {
    type: String,
    enum: ['new', 'processing', 'confirmed', 'completed', 'cancelled'],
    default: 'new',
  },

  // Stage 1: Delivery/confirmation
  deliveryTime: {
    type: Date,
    default: null,
  },
  confirmedAt: {
    type: Date,
    default: null,
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  comment: { type: String, default: '' },
  adminNotes: { type: String, default: '' },
  adminMessageId: { type: String, default: '' },

  // Stage 1: Token expiration (24 hours)
  tokenExpiresAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Stage 1: Generate deep link token before saving
orderSchema.pre('save', function (next) {
  if (this.isNew && !this.deepLinkToken) {
    this.deepLinkToken = crypto.randomBytes(16).toString('hex'); // 32 characters
    this.tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }
  next();
});

// Stage 1: Method to check if token is valid
orderSchema.methods.isTokenValid = function () {
  if (!this.tokenExpiresAt) return false;
  return new Date() < this.tokenExpiresAt;
};

// Stage 1: Method to get bot deep link
orderSchema.methods.getBotDeepLink = function (botUsername) {
  if (!this.deepLinkToken) return null;
  return `https://t.me/${botUsername}?start=${this.deepLinkToken}`;
};

// Indexes for common queries
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ telegramId: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
