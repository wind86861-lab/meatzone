import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import { Minus, Plus, Trash2, ShoppingCart, CheckCircle, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { ordersAPI } from '../services/api'
import { formatPhoneNumber, isValidUzbekPhoneNumber } from '../utils/phoneValidation'

export default function Cart() {
  const { language } = useLanguage()
  const { items, removeItem, updateQty, clearCart, totalPrice } = useCart()
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const fmt = (n) => n.toLocaleString('ru-RU')

  const t = {
    title: language === 'ru' ? 'Корзина' : language === 'en' ? 'Cart' : 'Savat',
    empty: language === 'ru' ? 'Корзина пуста' : language === 'en' ? 'Cart is empty' : 'Savat bo\'sh',
    emptyDesc: language === 'ru' ? 'Добавьте товары из каталога' : language === 'en' ? 'Add products from the catalog' : 'Katalogdan mahsulotlar qo\'shing',
    catalog: language === 'ru' ? 'Перейти в каталог' : language === 'en' ? 'Go to catalog' : 'Katalogga o\'tish',
    total: language === 'ru' ? 'Итого:' : language === 'en' ? 'Total:' : 'Jami:',
    namePlaceholder: language === 'ru' ? 'Ваше имя' : language === 'en' ? 'Your name' : 'Ismingiz',
    phonePlaceholder: language === 'ru' ? 'Номер телефона *' : language === 'en' ? 'Phone number *' : 'Telefon raqamingiz *',
    commentPlaceholder: language === 'ru' ? 'Комментарий (необязательно)' : language === 'en' ? 'Comment (optional)' : 'Izoh (ixtiyoriy)',
    checkout: language === 'ru' ? 'Оформить заказ' : language === 'en' ? 'Checkout' : 'Buyurtmani rasmiylashtirish',
    phoneRequired: language === 'ru' ? 'Введите номер телефона' : language === 'en' ? 'Enter phone number' : 'Telefon raqamini kiriting',
    phoneInvalid: language === 'ru' ? 'Неверный формат номера. Используйте: +998 XX XXX XX XX или XX XXX XX XX' : language === 'en' ? 'Invalid phone format. Use: +998 XX XXX XX XX or XX XXX XX XX' : 'Noto\'g\'ri format. Ishlatish: +998 XX XXX XX XX yoki XX XXX XX XX',
    successTitle: language === 'ru' ? 'Заказ оформлен!' : language === 'en' ? 'Order placed!' : 'Buyurtma qabul qilindi!',
    successDesc: language === 'ru' ? 'Мы свяжемся с вами в ближайшее время.' : language === 'en' ? 'We will contact you soon.' : 'Tez orada siz bilan bog\'lanamiz.',
    newOrder: language === 'ru' ? 'Оформить новый заказ' : language === 'en' ? 'New order' : 'Yangi buyurtma',
  }

  const handleCheckout = async () => {
    if (!customerPhone.trim()) { setError(t.phoneRequired); return }
    if (!isValidUzbekPhoneNumber(customerPhone)) { setError(t.phoneInvalid); return }
    setError('')
    setSubmitting(true)
    try {
      await ordersAPI.create({
        items: items.map(i => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        comment: comment.trim(),
        totalPrice,
      })
      clearCart()
      setSubmitted(true)
    } catch {
      setError(language === 'ru' ? 'Ошибка при отправке. Попробуйте снова.' : 'Error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-8 md:py-14">

        {submitted ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <CheckCircle size={72} className="text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.successTitle}</h2>
            <p className="text-gray-500 mb-8">{t.successDesc}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => setSubmitted(false)} className="px-6 py-3 bg-[#3563e9] text-white rounded-xl font-semibold hover:bg-[#2952d1] transition-colors">
                {t.newOrder}
              </button>
              <Link to="/catalog" className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-center">
                {t.catalog}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1e3d69] mb-8 flex items-center gap-3">
              <ShoppingCart size={32} /> {t.title}
              {items.length > 0 && (
                <span className="text-lg font-normal text-gray-400">({items.length})</span>
              )}
            </h1>

            {items.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <Package size={72} className="text-gray-200 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">{t.empty}</h2>
                <p className="text-gray-400 mb-8">{t.emptyDesc}</p>
                <Link to="/catalog" className="inline-block bg-[#3563e9] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#2952d1] transition-colors">
                  {t.catalog}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Items list */}
                <div className="lg:col-span-2 space-y-4">
                  {items.map((item) => (
                    <div key={item.productId} className="bg-white rounded-xl p-4 md:p-5 shadow-sm flex gap-4 items-start" data-aos="fade-right">
                      <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                          : <Package size={32} className="text-gray-200" />}
                        <div className="absolute top-1 left-1 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded">
                          <span className="text-white text-[8px] font-bold tracking-wide">PNEUMAX</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{item.name}</h3>
                          <button onClick={() => removeItem(item.productId)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <p className="text-[#1e3d69] font-bold mb-3">{fmt(item.price)} so'm</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600">
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e => updateQty(item.productId, parseInt(e.target.value) || 1)}
                            className="w-12 text-center border border-gray-200 rounded-lg py-1 text-sm font-semibold focus:outline-none focus:border-[#3563e9]"
                          />
                          <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600">
                            <Plus size={14} />
                          </button>
                          <span className="ml-auto text-sm text-gray-500 font-medium">{fmt(item.price * item.quantity)} so'm</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order summary + form */}
                <div className="bg-white rounded-xl shadow-sm p-5 h-fit sticky top-6">
                  <h2 className="font-bold text-gray-900 text-lg mb-4">
                    {language === 'ru' ? 'Оформление' : language === 'en' ? 'Checkout' : 'Buyurtma'}
                  </h2>

                  <div className="space-y-3 mb-5">
                    <input
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder={t.namePlaceholder}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#3563e9]"
                    />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(formatPhoneNumber(e.target.value))}
                      placeholder={t.phonePlaceholder}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3563e9] focus:border-transparent"
                      required
                    />
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder={t.commentPlaceholder}
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#3563e9] resize-none"
                    />
                  </div>

                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">{t.total}</span>
                      <span className="text-xl font-bold text-[#1e3d69]">{fmt(totalPrice)} so'm</span>
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                  <button
                    onClick={handleCheckout}
                    disabled={submitting}
                    className="w-full bg-[#3563e9] text-white py-3.5 rounded-xl font-bold text-base hover:bg-[#2952d1] transition-colors shadow-md disabled:opacity-60"
                  >
                    {submitting
                      ? (language === 'ru' ? 'Отправка...' : 'Sending...')
                      : t.checkout}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
