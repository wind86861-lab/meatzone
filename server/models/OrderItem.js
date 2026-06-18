const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  // Stage 1: Store the price at time of order (may be premium or regular)
  price: {
    type: Number,
    required: true,
  },
  originalPrice: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  // 'kg' → quantity is grams; 'pcs' → quantity is a piece count
  unit: {
    type: String,
    enum: ['kg', 'pcs'],
    default: 'pcs',
  },
  image: {
    type: String,
    default: '',
  },
  // Stage 1: Track if this was a premium price
  isPremiumPrice: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for faster queries
orderItemSchema.index({ order: 1, productId: 1 });

module.exports = mongoose.model('OrderItem', orderItemSchema);
