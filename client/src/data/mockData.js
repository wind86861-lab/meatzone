// ═══════════════════════════════════════════════════════════════
// Mock Data Service - Centralized data for frontend-only mode
// ═══════════════════════════════════════════════════════════════

export const mockProducts = [
  {
    _id: 'prod-1',
    name: { uz: 'Perforator Bosch GBH 2-26 DFR Professional', ru: 'Перфоратор Bosch GBH 2-26 DFR Professional', en: 'Hammer Drill Bosch GBH 2-26 DFR Professional' },
    category: 'tools',
    price: 1250000,
    finalPrice: 1062500,
    hasDiscount: true,
    discountPercent: 15,
    rating: 4.8,
    reviewCount: 124,
    inStock: true,
    stockCount: 15,
    isNew: false,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&h=800&fit=crop',
    ],
    description: { uz: 'Professional perforator yuqori quvvat va ishonchlilik bilan', ru: 'Профессиональный перфоратор с высокой мощностью и надежностью', en: 'Professional hammer drill with high power and reliability' },
    specifications: [
      { label: { uz: 'Quvvat', ru: 'Мощность', en: 'Power' }, value: '800 Вт' },
      { label: { uz: 'Energiya', ru: 'Энергия удара', en: 'Impact energy' }, value: '2.7 Дж' },
      { label: { uz: 'Og\'irlik', ru: 'Вес', en: 'Weight' }, value: '2.7 кг' },
    ],
  },
  {
    _id: 'prod-2',
    name: { uz: 'Smesitel Grohe Eurosmart New', ru: 'Смеситель Grohe Eurosmart New', en: 'Faucet Grohe Eurosmart New' },
    category: 'plumbing',
    price: 450000,
    finalPrice: 450000,
    hasDiscount: false,
    rating: 4.9,
    reviewCount: 89,
    inStock: true,
    stockCount: 32,
    isNew: true,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&h=800&fit=crop',
    ],
    description: { uz: 'Zamonaviy dizayn va yuqori sifat', ru: 'Современный дизайн и высокое качество', en: 'Modern design and high quality' },
    specifications: [
      { label: { uz: 'Material', ru: 'Материал', en: 'Material' }, value: 'Латунь' },
      { label: { uz: 'Kafolat', ru: 'Гарантия', en: 'Warranty' }, value: '5 лет' },
    ],
  },
  {
    _id: 'prod-3',
    name: { uz: 'Kabel VVGng 3x2.5 (100m)', ru: 'Кабель ВВГнг 3x2.5 (100м)', en: 'Cable VVGng 3x2.5 (100m)' },
    category: 'electrical',
    price: 520000,
    finalPrice: 442000,
    hasDiscount: true,
    discountPercent: 15,
    rating: 4.6,
    reviewCount: 56,
    inStock: true,
    stockCount: 8,
    isNew: false,
    isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=800&h=800&fit=crop',
    ],
    description: { uz: 'Yuqori sifatli elektr kabeli', ru: 'Высококачественный электрический кабель', en: 'High quality electrical cable' },
    specifications: [
      { label: { uz: 'Kesim', ru: 'Сечение', en: 'Cross-section' }, value: '3x2.5 мм²' },
      { label: { uz: 'Uzunlik', ru: 'Длина', en: 'Length' }, value: '100 м' },
    ],
  },
  {
    _id: 'prod-4',
    name: { uz: 'Tsement M500 Heidelberg (50 kg)', ru: 'Цемент М500 Heidelberg (50 кг)', en: 'Cement M500 Heidelberg (50 kg)' },
    category: 'materials',
    price: 85000,
    finalPrice: 85000,
    hasDiscount: false,
    rating: 4.7,
    reviewCount: 203,
    inStock: true,
    stockCount: 150,
    isNew: false,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=800&fit=crop',
    ],
    description: { uz: 'Yuqori sifatli tsement', ru: 'Высококачественный цемент', en: 'High quality cement' },
    specifications: [
      { label: { uz: 'Marka', ru: 'Марка', en: 'Grade' }, value: 'M500' },
      { label: { uz: 'Og\'irlik', ru: 'Вес', en: 'Weight' }, value: '50 кг' },
    ],
  },
  {
    _id: 'prod-5',
    name: { uz: 'Bo\'yoq Tikkurila Euro Power 7', ru: 'Краска Tikkurila Euro Power 7', en: 'Paint Tikkurila Euro Power 7' },
    category: 'paints',
    price: 380000,
    finalPrice: 323000,
    hasDiscount: true,
    discountPercent: 15,
    rating: 4.8,
    reviewCount: 78,
    inStock: true,
    stockCount: 24,
    isNew: false,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&h=800&fit=crop',
    ],
    description: { uz: 'Yuqori sifatli ichki bo\'yoq', ru: 'Высококачественная интерьерная краска', en: 'High quality interior paint' },
    specifications: [
      { label: { uz: 'Hajm', ru: 'Объем', en: 'Volume' }, value: '9 л' },
      { label: { uz: 'Rang', ru: 'Цвет', en: 'Color' }, value: 'Белый' },
    ],
  },
  {
    _id: 'prod-6',
    name: { uz: 'Samorezi 4.2x75 (200 dona)', ru: 'Саморезы 4.2x75 (200 шт)', en: 'Screws 4.2x75 (200 pcs)' },
    category: 'fasteners',
    price: 28000,
    finalPrice: 28000,
    hasDiscount: false,
    rating: 4.5,
    reviewCount: 145,
    inStock: true,
    stockCount: 320,
    isNew: false,
    isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=800&fit=crop',
    ],
    description: { uz: 'Universal samorezi', ru: 'Универсальные саморезы', en: 'Universal screws' },
    specifications: [
      { label: { uz: 'O\'lcham', ru: 'Размер', en: 'Size' }, value: '4.2x75 мм' },
      { label: { uz: 'Miqdor', ru: 'Количество', en: 'Quantity' }, value: '200 шт' },
    ],
  },
  {
    _id: 'prod-7',
    name: { uz: 'LED Panel 600x600 40W', ru: 'Светильник LED Panel 600x600 40W', en: 'LED Panel Light 600x600 40W' },
    category: 'lighting',
    price: 185000,
    finalPrice: 157250,
    hasDiscount: true,
    discountPercent: 15,
    rating: 4.7,
    reviewCount: 92,
    inStock: true,
    stockCount: 18,
    isNew: true,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&h=800&fit=crop',
    ],
    description: { uz: 'Zamonaviy LED panel', ru: 'Современная LED панель', en: 'Modern LED panel' },
    specifications: [
      { label: { uz: 'Quvvat', ru: 'Мощность', en: 'Power' }, value: '40 Вт' },
      { label: { uz: 'O\'lcham', ru: 'Размер', en: 'Size' }, value: '600x600 мм' },
    ],
  },
  {
    _id: 'prod-8',
    name: { uz: 'Gazonkosilka Bosch ARM 37', ru: 'Газонокосилка Bosch ARM 37', en: 'Lawn Mower Bosch ARM 37' },
    category: 'garden',
    price: 1450000,
    finalPrice: 1450000,
    hasDiscount: false,
    rating: 4.9,
    reviewCount: 67,
    inStock: true,
    stockCount: 7,
    isNew: false,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop',
    ],
    description: { uz: 'Professional gazon o\'rg\'ich', ru: 'Профессиональная газонокосилка', en: 'Professional lawn mower' },
    specifications: [
      { label: { uz: 'Quvvat', ru: 'Мощность', en: 'Power' }, value: '1400 Вт' },
      { label: { uz: 'Kesish kengligi', ru: 'Ширина скашивания', en: 'Cutting width' }, value: '37 см' },
    ],
  },
]

// Generate more products
for (let i = 9; i <= 40; i++) {
  const categories = ['tools', 'plumbing', 'electrical', 'materials', 'paints', 'fasteners', 'lighting', 'garden']
  const cat = categories[i % categories.length]
  mockProducts.push({
    _id: `prod-${i}`,
    name: { 
      uz: `Mahsulot ${i}`, 
      ru: `Товар ${i}`, 
      en: `Product ${i}` 
    },
    category: cat,
    price: Math.floor(Math.random() * 1000000) + 50000,
    finalPrice: Math.floor(Math.random() * 1000000) + 50000,
    hasDiscount: i % 3 === 0,
    discountPercent: i % 3 === 0 ? 15 : 0,
    rating: 4 + Math.random(),
    reviewCount: Math.floor(Math.random() * 200),
    inStock: i % 10 !== 0,
    stockCount: Math.floor(Math.random() * 100),
    isNew: i % 7 === 0,
    isFeatured: i % 5 === 0,
    images: [
      `https://images.unsplash.com/photo-${1500000000000 + i * 1000000}?w=800&h=800&fit=crop`,
    ],
    description: { uz: `Mahsulot tavsifi ${i}`, ru: `Описание товара ${i}`, en: `Product description ${i}` },
    specifications: [
      { label: { uz: 'Xususiyat', ru: 'Характеристика', en: 'Feature' }, value: `Qiymat ${i}` },
    ],
  })
}

export const mockCategories = [
  { id: 'tools', name: { uz: 'Asboblar', ru: 'Инструменты', en: 'Tools' }, count: mockProducts.filter(p => p.category === 'tools').length },
  { id: 'plumbing', name: { uz: 'Santexnika', ru: 'Сантехника', en: 'Plumbing' }, count: mockProducts.filter(p => p.category === 'plumbing').length },
  { id: 'electrical', name: { uz: 'Elektr', ru: 'Электрика', en: 'Electrical' }, count: mockProducts.filter(p => p.category === 'electrical').length },
  { id: 'materials', name: { uz: 'Qurilish materiallari', ru: 'Стройматериалы', en: 'Building Materials' }, count: mockProducts.filter(p => p.category === 'materials').length },
  { id: 'paints', name: { uz: 'Bo\'yoqlar', ru: 'Краски', en: 'Paints' }, count: mockProducts.filter(p => p.category === 'paints').length },
  { id: 'fasteners', name: { uz: 'Mahkamlash', ru: 'Крепёж', en: 'Fasteners' }, count: mockProducts.filter(p => p.category === 'fasteners').length },
  { id: 'lighting', name: { uz: 'Yoritish', ru: 'Освещение', en: 'Lighting' }, count: mockProducts.filter(p => p.category === 'lighting').length },
  { id: 'garden', name: { uz: 'Bog\' va hovli', ru: 'Сад и огород', en: 'Garden' }, count: mockProducts.filter(p => p.category === 'garden').length },
]

export const mockReviews = [
  {
    _id: 'rev-1',
    productId: 'prod-1',
    author: 'Алишер К.',
    rating: 5,
    text: 'Отличный перфоратор! Мощный, надежный, удобный. Использую для профессиональной работы.',
    date: '2026-03-15',
    helpful: 24,
  },
  {
    _id: 'rev-2',
    productId: 'prod-1',
    author: 'Дмитрий В.',
    rating: 5,
    text: 'Купил для ремонта квартиры. Справляется на ура! Рекомендую.',
    date: '2026-03-10',
    helpful: 18,
  },
  {
    _id: 'rev-3',
    productId: 'prod-2',
    author: 'Мария С.',
    rating: 5,
    text: 'Красивый смеситель, качество на высоте. Grohe как всегда не подводит.',
    date: '2026-03-08',
    helpful: 15,
  },
]

export const mockBlogPosts = [
  {
    _id: 'blog-1',
    title: { uz: 'Qurilish asboblarini qanday tanlash', ru: 'Как выбрать строительные инструменты', en: 'How to choose construction tools' },
    excerpt: { uz: 'Professional asboblarni tanlash bo\'yicha maslahatlar', ru: 'Советы по выбору профессиональных инструментов', en: 'Tips for choosing professional tools' },
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1200&h=600&fit=crop',
    date: '2026-03-20',
    category: 'tips',
  },
  {
    _id: 'blog-2',
    title: { uz: 'Uy ta\'mirlash uchun eng yaxshi materiallar', ru: 'Лучшие материалы для ремонта дома', en: 'Best materials for home renovation' },
    excerpt: { uz: 'Sifatli qurilish materiallarini tanlash', ru: 'Выбор качественных строительных материалов', en: 'Choosing quality building materials' },
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&h=600&fit=crop',
    date: '2026-03-18',
    category: 'guides',
  },
]

// Mock API functions
export const mockAPI = {
  products: {
    getAll: (params = {}) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          let filtered = [...mockProducts]
          if (params.category && params.category !== 'all') {
            filtered = filtered.filter(p => p.category === params.category)
          }
          if (params.featured) {
            filtered = filtered.filter(p => p.isFeatured)
          }
          if (params.search) {
            const q = params.search.toLowerCase()
            filtered = filtered.filter(p => 
              p.name.ru.toLowerCase().includes(q) ||
              p.name.uz.toLowerCase().includes(q) ||
              p.name.en.toLowerCase().includes(q)
            )
          }
          resolve({ data: { products: filtered, total: filtered.length } })
        }, 300)
      })
    },
    getById: (id) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const product = mockProducts.find(p => p._id === id)
          if (product) resolve({ data: product })
          else reject({ message: 'Product not found' })
        }, 200)
      })
    },
  },
  reviews: {
    getByProduct: (productId) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const reviews = mockReviews.filter(r => r.productId === productId)
          resolve({ data: reviews })
        }, 200)
      })
    },
  },
  categories: {
    getAll: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: mockCategories })
        }, 100)
      })
    },
  },
}
