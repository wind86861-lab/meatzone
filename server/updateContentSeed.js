const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const PageContent = require('./models/PageContent');

dotenv.config({ path: path.join(__dirname, '.env') });

const seedPageContent = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const contents = [
            {
                page: 'home',
                section: 'advantages',
                content: {
                    items: [
                        { title: { uz: '20+', ru: '20+', en: '20+' }, subtitle: { uz: 'Yil tajriba', ru: 'Лет опыта', en: 'Years experience' } },
                        { title: { uz: '5000+', ru: '5000+', en: '5000+' }, subtitle: { uz: 'Ehtiyot qismlar', ru: 'Запчастей', en: 'Spare parts' } },
                        { title: { uz: 'Buyurtma', ru: 'Заказ', en: 'Order' }, subtitle: { uz: 'Moslashuvchan', ru: 'Гибкий', en: 'Flexible' } },
                        { title: { uz: 'Tez', ru: 'Быстро', en: 'Fast' }, subtitle: { uz: 'Yetkazib berish', ru: 'Доставка', en: 'Delivery' } },
                        { title: { uz: "To'lov", ru: 'Оплата', en: 'Payment' }, subtitle: { uz: 'Turi ixtiyoriy', ru: 'Любой способ', en: 'Any method' } },
                    ]
                }
            },
            {
                page: 'about',
                section: 'advantages',
                content: {
                    items: [
                        { title: { uz: '20+', ru: '20+', en: '20+' }, subtitle: { uz: 'Yil tajriba', ru: 'Лет опыта', en: 'Years' } },
                        { title: { uz: '5000+', ru: '5000+', en: '5000+' }, subtitle: { uz: 'Ehtiyot qismlar', ru: 'Запчастей', en: 'Spare parts' } },
                        { title: { uz: 'Buyurtma', ru: 'Заказ', en: 'Order' }, subtitle: { uz: 'Moslashuvchan', ru: 'Гибкий', en: 'Flexible' } },
                        { title: { uz: 'Tez', ru: 'Быстро', en: 'Fast' }, subtitle: { uz: 'Yetkazib berish', ru: 'Доставка', en: 'Delivery' } },
                        { title: { uz: "To'lov", ru: 'Оплата', en: 'Payment' }, subtitle: { uz: 'Turi ixtiyoriy', ru: 'Любой способ', en: 'Any method' } },
                    ]
                }
            },
            {
                page: 'customOrder',
                section: 'benefits',
                content: {
                    items: [
                        {
                            icon: 'Package',
                            title: { uz: 'Tezkor To\'g\'ri IMPORT', ru: 'Быстрая доставка ИМПОРТ', en: 'Fast IMPORT Delivery' },
                            desc: { uz: 'Bizdan buyurtma qilgan mahsulotlaringizni tez orada yetqazib beramiz', ru: 'Мы быстро доставим заказанные товары', en: 'We will deliver your ordered products quickly' }
                        },
                        {
                            icon: 'Handshake',
                            title: { uz: 'Maxsus Buyurtma Xizmati', ru: 'Услуга специального заказа', en: 'Custom Order Service' },
                            desc: { uz: 'Sizga kerakli mahsulotni topib beramiz va yetqazib beramiz', ru: 'Найдем и доставим нужный товар', en: 'We will find and deliver the product you need' }
                        },
                        {
                            icon: 'CreditCard',
                            title: { uz: 'Qulay To\'lov Shartlari', ru: 'Выгодные условия оплаты', en: 'Flexible Payment Terms' },
                            desc: { uz: 'Hamkorlik qilish uchun maxsus shartlar va qulay to\'lov usullari', ru: 'Специальные условия для партнерства и удобные способы оплаты', en: 'Special terms for partnership and convenient payment methods' }
                        },
                        {
                            icon: 'Target',
                            title: { uz: 'Professional Xizmat', ru: 'Профессиональное обслуживание', en: 'Professional Service' },
                            desc: { uz: 'Professional xizmat va mutaxassislarimizdan maslahat', ru: 'Профессиональное обслуживание и консультация наших специалистов', en: 'Professional service and consultation' }
                        }
                    ]
                }
            }
        ];

        for (const item of contents) {
            await PageContent.findOneAndUpdate(
                { page: item.page, section: item.section },
                item,
                { upsert: true, new: true }
            );
            console.log(`✓ Seeded ${item.page} - ${item.section}`);
        }

        console.log('✅ Page content updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding page content:', error);
        process.exit(1);
    }
};

seedPageContent();
