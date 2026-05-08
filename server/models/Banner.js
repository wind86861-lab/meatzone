const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true, default: '' },
  subtitle: { type: String, default: '' },
  tag: { type: String, default: '' },
  emoji: { type: String, default: '🥩' },
  variant: { type: String, enum: ['red', 'dark', 'amber', 'green', 'blue', 'purple'], default: 'red' },
  image: { type: String, default: '' },
  link: { type: String, default: '/catalog' },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
