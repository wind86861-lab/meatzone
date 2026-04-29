const mongoose = require('mongoose');

const telegramUserSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true, index: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  username: { type: String, default: '' },
  languageCode: { type: String, default: 'ru' },
  phone: { type: String, default: '' },
  isPremium: { type: Boolean, default: false },
  premiumExpiresAt: { type: Date, default: null },
  role: { type: String, enum: ['admin', 'manager', 'customer'], default: 'customer' },
  isBanned: { type: Boolean, default: false },
  lastActiveAt: { type: Date, default: Date.now },
}, { timestamps: true });

telegramUserSchema.virtual('isPremiumActive').get(function () {
  if (!this.isPremium || !this.premiumExpiresAt) return false;
  return new Date() < this.premiumExpiresAt;
});

module.exports = mongoose.model('TelegramUser', telegramUserSchema);
