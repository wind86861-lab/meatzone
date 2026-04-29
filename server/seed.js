const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Settings = require('./models/Settings');
const Category = require('./models/Category');
const Product = require('./models/Product');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // ── Admin User ──────────────────────────────────────────
    const existingAdmin = await User.findOne({ email: 'admin@meatzone.uz' });
    if (!existingAdmin) {
      await User.create({ name: 'Admin', email: 'admin@meatzone.uz', password: 'admin123', role: 'admin', phone: '+998901234567' });
      console.log('✓ Admin user created');
    } else {
      console.log('✓ Admin user already exists');
    }

    // ── Settings ────────────────────────────────────────────
    const settingsDefaults = {
      siteName: 'MeatZone', phone1: '+998 90 123 45 67', phone2: '+998 90 765 43 21',
      email: 'info@meatzone.uz', workingHours: 'Dush–Yak: 08:00 – 22:00',
      address_uz: 'Toshkent shahri, Chilonzor tumani, G\'agarin ko\'chasi, 15-uy',
      address_ru: 'г. Ташкент, Чиланзарский район, ул. Гагарина, 15',
      address_en: 'Tashkent, Chilonzor district, Gagarin str., 15',
      instagram: 'https://instagram.com/meatzone.uz', facebook: '',
      telegram: 'https://t.me/meatzone_uz', youtube: '',
    };
    for (const [key, value] of Object.entries(settingsDefaults)) {
      await Settings.findOneAndUpdate({ key }, { key, value }, { upsert: true });
    }
    console.log('✓ Settings seeded');

    // ── Categories ──────────────────────────────────────────
    await Category.deleteMany({});
    const cats = await Category.insertMany([
      { name: { uz: "Mol go\'shti", ru: 'Говядина', en: 'Beef' }, slug: 'beef', order: 1, isActive: true },
      { name: { uz: "Qo\'y go\'shti", ru: 'Баранина', en: 'Mutton' }, slug: 'mutton', order: 2, isActive: true },
      { name: { uz: 'Tovuq', ru: 'Курица', en: 'Chicken' }, slug: 'chicken', order: 3, isActive: true },
      { name: { uz: 'Kolbasa', ru: 'Колбасные изделия', en: 'Sausages' }, slug: 'sausage', order: 4, isActive: true },
      { name: { uz: 'Tayyorlangan', ru: 'Готовая продукция', en: 'Ready meals' }, slug: 'ready', order: 5, isActive: true },
      { name: { uz: 'Muzlatilgan', ru: 'Замороженные', en: 'Frozen' }, slug: 'frozen', order: 6, isActive: true },
    ]);
    const [beef, mutton, chicken, sausage, ready, frozen] = cats;

    await Category.insertMany([
      { name: { uz: 'Muskul qismi', ru: 'Мышечная часть', en: 'Muscle cut' }, parent: beef._id, slug: 'beef-muscle', order: 1, isActive: true },
      { name: { uz: 'Qovurma uchun', ru: 'Для жарки', en: 'For frying' }, parent: beef._id, slug: 'beef-fry', order: 2, isActive: true },
      { name: { uz: 'Premium qo\'y', ru: 'Премиум баранина', en: 'Premium mutton' }, parent: mutton._id, slug: 'mutton-premium', order: 1, isActive: true },
      { name: { uz: 'Sovutilgan tovuq', ru: 'Очищенная курица', en: 'Cleaned chicken' }, parent: chicken._id, slug: 'chicken-clean', order: 1, isActive: true },
      { name: { uz: 'Dudlangan', ru: 'Копчёные', en: 'Smoked' }, parent: sausage._id, slug: 'sausage-smoked', order: 1, isActive: true },
      { name: { uz: 'Sho\'rva to\'plami', ru: 'Наборы для супа', en: 'Soup sets' }, parent: ready._id, slug: 'ready-soup', order: 1, isActive: true },
      { name: { uz: 'Muzlatilgan biftek', ru: 'Замороженный бифштекс', en: 'Frozen steak' }, parent: frozen._id, slug: 'frozen-steak', order: 1, isActive: true },
    ]);
    console.log('✓ Categories seeded');

    // ── Products ────────────────────────────────────────────
    await Product.deleteMany({});
    await Product.insertMany([
      {
        name: { uz: "Mol go\'shti (muskul) — 1 kg", ru: 'Говядина (мышечная часть) — 1 кг', en: 'Beef (muscle cut) — 1 kg' },
        description: { uz: "Toza, sovutilgan mol go\'shti. Qovurma va biftek uchun ideal. Muzlatilmagan.", ru: 'Чистая говяжья мышечная часть. Идеально для жарки и бифштекса. Не замороженная.', en: 'Clean beef muscle cut. Ideal for frying and steak. Not frozen.' },
        price: 63700, category: beef._id, stock: 45, isFeatured: true, isActive: true,
        discountPrice: 54000,
      },
      {
        name: { uz: "Qo\'y go\'shti premium — 1 kg", ru: 'Баранина премиум — 1 кг', en: 'Premium mutton — 1 kg' },
        description: { uz: "Yumshoq va to'yimli qo'y go\'shti. Tog' yaylovlarida boqilgan.", ru: 'Нежная и сытная баранина. Выросла на горных пастбищах.', en: 'Soft and satisfying mutton. Raised on mountain pastures.' },
        price: 85000, category: mutton._id, stock: 30, isFeatured: true, isActive: true,
      },
      {
        name: { uz: "Tovuq ko\'kragi — 1 kg", ru: 'Куриная грудка — 1 кг', en: 'Chicken breast — 1 kg' },
        description: { uz: "Toza tovuq ko\'kragi filesi. Parhez ovqati uchun ideal.", ru: 'Филе куриной грудки. Идеально для диетического питания.', en: 'Clean chicken breast fillet. Ideal for diet meals.' },
        price: 38000, category: chicken._id, stock: 60, isFeatured: false, isActive: true,
      },
      {
        name: { uz: 'Kolbasa Beef Premium — 500 g', ru: 'Колбаса Beef Premium — 500 г', en: 'Beef Premium Sausage — 500 g' },
        description: { uz: "100% mol go\'htidan tayyorlangan dudlangan kolbasa.", ru: 'Копчёная колбаса из 100% говядины.', en: 'Smoked sausage made from 100% beef.' },
        price: 38400, category: sausage._id, stock: 40, isFeatured: true, isActive: true,
        discountPrice: 32000,
      },
      {
        name: { uz: "Qovurish uchun mol — 800 g", ru: 'Говядина для жарки — 800 г', en: 'Beef for frying — 800 g' },
        description: { uz: "Qovurish uchun maxsus tanlangan mol go\'shti, suyaksiz.", ru: 'Специально отобранная говядина для жарки, без костей.', en: 'Specially selected beef for frying, boneless.' },
        price: 54000, category: beef._id, stock: 25, isFeatured: true, isActive: true,
      },
      {
        name: { uz: 'Tovuq oyoq — 1 kg', ru: 'Куриные ножки — 1 кг', en: 'Chicken legs — 1 kg' },
        description: { uz: 'Yangi tovuq oyoqlari. Sho\'rva va qovurma uchun.', ru: 'Свежие куриные ножки. Для супа и жарки.', en: 'Fresh chicken legs. For soup and frying.' },
        price: 28000, category: chicken._id, stock: 50, isFeatured: false, isActive: true,
      },
      {
        name: { uz: "Jigar (mol) — 1 kg", ru: 'Печень (говяжья) — 1 кг', en: 'Beef liver — 1 kg' },
        description: { uz: "Mol jigari. Vitamin va temir bilan to\'la.", ru: 'Говяжья печень. Богата витаминами и железом.', en: 'Beef liver. Rich in vitamins and iron.' },
        price: 28000, category: beef._id, stock: 35, isFeatured: false, isActive: true,
      },
      {
        name: { uz: "Qo\'zichoq qovurg\'a — 1 kg", ru: 'Бараньи рёбрышки — 1 кг', en: 'Lamb ribs — 1 kg' },
        description: { uz: "Yosh qo\'zichoq qovurg\'asi. To'y va ziyofatlar uchun.", ru: 'Рёбрышки молодого барашка. Для праздников и застолий.', en: 'Young lamb ribs. For celebrations and feasts.' },
        price: 92000, category: mutton._id, stock: 15, isFeatured: true, isActive: true,
        discountPrice: 79000,
      },
      {
        name: { uz: 'Pishloqli kolbasa — 400 g', ru: 'Колбаса с сыром — 400 г', en: 'Cheese sausage — 400 g' },
        description: { uz: "Pishloqli mol kolbasa, bolalar uchun yumshoq.", ru: 'Колбаса с сыром из говядины, мягкая для детей.', en: 'Beef cheese sausage, soft for kids.' },
        price: 32000, category: sausage._id, stock: 25, isFeatured: false, isActive: true,
      },
      {
        name: { uz: "Tayyor sho\'rva to\'plami — 1.5 kg", ru: 'Готовый набор для супа — 1.5 кг', en: 'Ready soup set — 1.5 kg' },
        description: { uz: "Sho\'rva uchun tayyor to\'plam: go\'sht, suyak, sabzavot.", ru: 'Готовый набор для супа: мясо, кости, овощи.', en: 'Ready soup set: meat, bones, vegetables.' },
        price: 72000, category: ready._id, stock: 18, isFeatured: true, isActive: true,
      },
    ]);
    console.log('✓ Products seeded');

    console.log('\n✅ MeatZone seed data inserted successfully!');
    console.log('   Admin login: admin@meatzone.uz / admin123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedData();
