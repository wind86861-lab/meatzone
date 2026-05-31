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
  photoUrl: { type: String, default: '' },
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    address: { type: String, default: '' },
  },
  role: { type: String, enum: ['admin', 'driver', 'customer'], default: 'customer' },
  onboardingDone: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  lastActiveAt: { type: Date, default: Date.now },
}, { timestamps: true });

telegramUserSchema.virtual('isPremiumActive').get(function () {
  if (!this.isPremium || !this.premiumExpiresAt) return false;
  return new Date() < this.premiumExpiresAt;
});

module.exports = mongoose.model('TelegramUser', telegramUserSchema);
