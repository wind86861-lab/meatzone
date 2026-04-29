const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    uz: { type: String, required: true },
    ru: { type: String, required: true },
    en: { type: String, required: true },
  },
  description: {
    uz: { type: String, default: '' },
    ru: { type: String, default: '' },
    en: { type: String, default: '' },
  },
  price: {
    type: Number,
    required: true,
  },
  // Premium pricing for Stage 1
  premiumPrice: {
    type: Number,
    default: null, // null means use regular price
  },
  discountValue: {
    type: Number,
    default: null,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage',
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  images: [{
    type: String,
  }],
  specifications: [{
    key: {
      uz: String,
      ru: String,
      en: String,
    },
    value: {
      uz: String,
      ru: String,
      en: String,
    },
  }],
  stock: {
    type: Number,
    default: 0,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

productSchema.virtual('finalPrice').get(function () {
  if (!this.discountValue || this.discountValue <= 0) return this.price;
  if (this.discountType === 'percentage') {
    const discount = Math.min(this.discountValue, 100);
    return Math.round(this.price * (1 - discount / 100));
  }
  return Math.max(0, this.price - this.discountValue);
});

productSchema.virtual('hasDiscount').get(function () {
  return this.discountValue > 0;
});

productSchema.virtual('discountPercent').get(function () {
  if (!this.discountValue || this.discountValue <= 0) return 0;
  if (this.discountType === 'percentage') return Math.min(this.discountValue, 100);
  if (this.price > 0) return Math.min(Math.round((this.discountValue / this.price) * 100), 100);
  return 0;
});

productSchema.virtual('rating').get(function () {
  return 4.7;
});

productSchema.virtual('reviewCount').get(function () {
  return 0;
});

// Stage 1: Get price based on user type
productSchema.methods.getPriceByUserType = function (userType = 'regular') {
  if (userType === 'premium' && this.premiumPrice !== null && this.premiumPrice >= 0) {
    return this.premiumPrice;
  }
  return this.finalPrice;
};

// Stage 1: Virtual for premium final price
productSchema.virtual('premiumFinalPrice').get(function () {
  if (this.premiumPrice !== null && this.premiumPrice >= 0) {
    return this.premiumPrice;
  }
  return this.finalPrice;
});

module.exports = mongoose.model('Product', productSchema);
