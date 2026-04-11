const mongoose = require('mongoose');

const telegramUserSchema = new mongoose.Schema({
  chatId: {
    type: Number,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'master', 'technician'],
    default: 'master',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

telegramUserSchema.index({ phone: 1 });

module.exports = mongoose.model('TelegramUser', telegramUserSchema);
