const mongoose = require('mongoose');

const cashHandoverSchema = new mongoose.Schema({
  // Courier info
  courier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courierTelegramId: {
    type: String,
    required: true,
  },
  courierName: String,

  // Cash amounts
  submittedAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  expectedAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  discrepancy: {
    type: Number,
    default: 0,
  },

  // Orders included
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  }],
  orderCount: {
    type: Number,
    default: 0,
  },

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending',
  },

  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  confirmedAt: Date,

  // Admin confirmation
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  confirmedByName: String,

  // Notes
  courierNotes: String,
  adminNotes: String,

  // Period covered
  periodStart: Date,
  periodEnd: Date,
}, {
  timestamps: true,
});

// Indexes
cashHandoverSchema.index({ courier: 1, submittedAt: -1 });
cashHandoverSchema.index({ status: 1, submittedAt: -1 });
cashHandoverSchema.index({ courierTelegramId: 1 });

// Calculate discrepancy before save
cashHandoverSchema.pre('save', function(next) {
  this.discrepancy = this.submittedAmount - this.expectedAmount;
  next();
});

module.exports = mongoose.model('CashHandover', cashHandoverSchema);
