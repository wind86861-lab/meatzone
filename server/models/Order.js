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

  // Pricing
  totalPrice: { type: Number, required: true },
  subTotal: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  isFreeDelivery: { type: Boolean, default: false },

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

  // Courier cash tracking
  cashReceivedByCourier: { type: Boolean, default: false },
  cashReceivedAt: { type: Date, default: null },
  cashSubmittedToAdmin: { type: Boolean, default: false },
  cashSubmittedAt: { type: Date, default: null },
  cashSubmitBatch: { type: String, default: null },

  // Discounts
  promoCode: { type: String, default: '' },
  promoDiscount: { type: Number, default: 0 },
  coinDiscount: { type: Number, default: 0 },

  // Order status
  status: {
    type: String,
    enum: ['new', 'processing', 'confirmed', 'completed', 'delivered', 'cancelled'],
    default: 'new',
  },

  // Delivery
  deliveryTime: {
    type: Date,
    default: null,
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'assigned', 'in_transit', 'delivered', 'failed'],
    default: 'pending',
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  driverTelegramId: {
    type: String,
    default: null,
    index: true,
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

  // After-sales QR token (permanent — no expiry)
  serviceToken: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
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
  if (this.isNew && !this.serviceToken) {
    this.serviceToken = crypto.randomBytes(12).toString('hex'); // 24 characters, permanent
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
orderSchema.index({ assignedDriver: 1, deliveryStatus: 1 });
orderSchema.index({ status: 1, deliveryStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
