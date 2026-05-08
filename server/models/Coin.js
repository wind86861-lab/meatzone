const mongoose = require('mongoose');

const coinSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['earned', 'spent', 'expired', 'admin'],
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  description: {
    type: String,
    default: '',
  },
}, { timestamps: true });

coinSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Coin', coinSchema);
