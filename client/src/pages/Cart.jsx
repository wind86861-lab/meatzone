import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import { Minus, Plus, Trash2, ShoppingCart, CheckCircle, Package, ChevronRight, Shield, Truck } from 'lucide-react'
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
  const [address, setAddress] = useState('')
  const [district, setDistrict] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [deepLink, setDeepLink] = useState('')
  const [orderId, setOrderId] = useState('')
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
    if (!customerName.trim()) { setError(language === 'ru' ? 'Введите имя' : 'Enter name'); return }
    if (!customerPhone.trim()) { setError(t.phoneRequired); return }
    if (!isValidUzbekPhoneNumber(customerPhone)) { setError(t.phoneInvalid); return }
    if (!address.trim()) { setError(language === 'ru' ? 'Введите адрес' : 'Enter address'); return }
    if (!district.trim()) { setError(language === 'ru' ? 'Введите район / махаллю' : 'Enter district'); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await ordersAPI.createOrder({
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        address: address.trim(),
        district: district.trim(),
        comment: comment.trim(),
      })
      setDeepLink(res.data.deepLink || '')
      setOrderId(res.data.order?._id || '')
      clearCart()
      setSubmitted(true)
    } catch (err) {
      const code = err.response?.data?.code
      if (code === 'INVALID_PRODUCT_ID') {
        setError(language === 'ru'
          ? 'Корзина содержит устаревшие товары. Очистите корзину и добавьте товары заново.'
          : language === 'en'
            ? 'Cart contains outdated items. Please clear cart and add products again.'
            : 'Savatda eskirgan mahsulotlar bor. Savatni tozalab, qayta qo\'shing.')
      } else {
        setError(language === 'ru' ? 'Ошибка при отправке. Попробуйте снова.' : 'Error. Try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-light-50">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-36 md:pt-40 pb-12 md:pb-16 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl hidden lg:block" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-3xl hidden lg:block" />
        <div className="absolute top-1/2 right-1/4 pointer-events-none hidden lg:block opacity-10">
          <ShoppingCart size={200} strokeWidth={0.5} className="text-primary" />
        </div>
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-dark-500 mb-4">
            <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
            <ChevronRight size={14} />
            <span className="text-dark-900 font-medium">{t.title}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-primary to-primary-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-soft mb-4">
            <ShoppingCart size={12} /> {items.length > 0 ? `${items.length} товаров` : 'Ваша корзина'}
          </span>
          <h1 className="font-heading text-4xl md:text-6xl text-dark-900 font-bold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{t.title}</span>
          </h1>
          <p className="text-dark-600 text-lg max-w-xl">
            {items.length > 0
              ? 'Оформите заказ сейчас и получите быструю доставку'
              : 'Добавьте товары из каталога, чтобы оформить заказ'}
          </p>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">

          {submitted ? (
            <div className="relative bg-white rounded-3xl border border-dark-200/60 p-12 text-center overflow-hidden max-w-lg mx-auto">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-accent-green/10 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-accent-green/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={48} className="text-accent-green" />
                </div>
                <h2 className="text-2xl font-bold text-dark-900 mb-2">{t.successTitle}</h2>
                {orderId && <p className="text-dark-400 text-sm mb-2">ID: {orderId}</p>}

                {deepLink ? (
                  <>
                    <p className="text-dark-600 mb-6">
                      {language === 'ru'
                        ? 'Перейдите в Telegram-бот для подтверждения заказа, отправки геолокации и оплаты.'
                        : language === 'en'
                          ? 'Go to Telegram bot to confirm order, send location and pay.'
                          : 'Buyurtmani tasdiqlash, geolokatsiyani yuborish va to\'lov uchun Telegram botga o\'ting.'}
                    </p>
                    <a
                      href={deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-[#0088cc] text-white rounded-xl font-bold text-lg hover:bg-[#006da3] hover:shadow-lg hover:scale-[1.02] transition-all mb-4"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                      {language === 'ru' ? 'Перейти в Telegram' : language === 'en' ? 'Open Telegram' : 'Telegramga o\'tish'}
                    </a>
                    <p className="text-dark-400 text-xs">
                      {language === 'ru'
                        ? 'Бот запросит номер телефона, геолокацию и предложит оплату'
                        : 'Bot will ask for phone, location and payment'}
                    </p>
                  </>
                ) : (
                  <p className="text-dark-500 mb-6">{t.successDesc}</p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <Link to="/catalog" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-6 py-3 border border-dark-200 rounded-xl font-bold text-dark-700 hover:bg-light-100 transition-colors text-center">
                    {t.catalog}
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {items.length === 0 ? (
                <div className="relative bg-white rounded-3xl border border-dark-200/60 p-12 text-center overflow-hidden max-w-lg mx-auto">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <Package size={48} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-dark-900 mb-2">{t.empty}</h2>
                    <p className="text-dark-500 mb-8">{t.emptyDesc}</p>
                    <Link to="/catalog" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary to-primary-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all">
                      {t.catalog}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Items list */}
                  <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                      <div key={item.productId} className="group bg-white rounded-2xl border border-dark-200/60 p-4 md:p-5 flex gap-4 items-start hover:shadow-[0_20px_60px_-15px_rgba(99,102,241,0.15)] hover:border-primary/20 transition-all duration-500">
                        <div className="w-20 h-20 bg-gradient-to-br from-light-100 to-primary-50 rounded-xl overflow-hidden relative flex items-center justify-center shrink-0">
                          {item.image
                            ? <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                            : <Package size={32} className="text-dark-200" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-dark-900 text-sm leading-snug line-clamp-2">{item.name}</h3>
                            <button onClick={() => removeItem(item.productId)} className="text-dark-300 hover:text-secondary-500 transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-secondary-50">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <p className="text-primary font-bold mb-3">{fmt(item.price)} so'm</p>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-8 h-8 border-2 border-dark-200 rounded-lg flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all text-dark-600">
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={e => updateQty(item.productId, parseInt(e.target.value) || 1)}
                              className="w-12 text-center border-2 border-dark-200 rounded-lg py-1 text-sm font-bold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                            <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-8 h-8 border-2 border-dark-200 rounded-lg flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all text-dark-600">
                              <Plus size={14} />
                            </button>
                            <span className="ml-auto text-sm text-dark-900 font-bold">{fmt(item.price * item.quantity)} so'm</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order summary + form */}
                  <div className="h-fit sticky top-24">
                    <div className="relative bg-white rounded-3xl border border-dark-200/60 p-6 overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
                      <div className="relative">
                        <h2 className="font-bold text-dark-900 text-lg mb-5">
                          {language === 'ru' ? 'Оформление' : language === 'en' ? 'Checkout' : 'Buyurtma'}
                        </h2>

                        <div className="space-y-3 mb-5">
                          <div>
                            <label className="block text-xs font-bold text-dark-700 mb-1.5">{t.namePlaceholder} *</label>
                            <input
                              value={customerName}
                              onChange={e => setCustomerName(e.target.value)}
                              placeholder={t.namePlaceholder}
                              className="w-full border-2 border-dark-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-dark-700 mb-1.5">{t.phonePlaceholder}</label>
                            <input
                              type="tel"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(formatPhoneNumber(e.target.value))}
                              placeholder="+998 (__) ___-__-__"
                              className="w-full border-2 border-dark-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-dark-700 mb-1.5">{language === 'ru' ? 'Адрес *' : language === 'en' ? 'Address *' : 'Manzil *'}</label>
                            <input
                              value={address}
                              onChange={e => setAddress(e.target.value)}
                              placeholder={language === 'ru' ? 'Улица, дом, квартира' : language === 'en' ? 'Street, house, apt' : 'Ko\'cha, uy, kvartira'}
                              className="w-full border-2 border-dark-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-dark-700 mb-1.5">{language === 'ru' ? 'Район / Махалля *' : language === 'en' ? 'District *' : 'Tuman / Mahalla *'}</label>
                            <input
                              value={district}
                              onChange={e => setDistrict(e.target.value)}
                              placeholder={language === 'ru' ? 'Олмазорский р-н, Мискин МФЙ' : language === 'en' ? 'Olmazor district' : 'Olmazor tumani, Miskin MFY'}
                              className="w-full border-2 border-dark-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-dark-700 mb-1.5">{t.commentPlaceholder}</label>
                            <textarea
                              value={comment}
                              onChange={e => setComment(e.target.value)}
                              placeholder={t.commentPlaceholder}
                              rows={2}
                              className="w-full border-2 border-dark-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                            />
                          </div>
                        </div>

                        <div className="border-t border-dark-100 pt-4 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-dark-600 font-medium">{t.total}</span>
                            <span className="text-2xl font-bold text-dark-900">{fmt(totalPrice)} so'm</span>
                          </div>
                        </div>

                        {error && (
                          <div className="mb-3">
                            <p className="text-secondary-500 text-sm font-medium">{error}</p>
                            {error.includes('устаревш') || error.includes('outdated') || error.includes('eskirgan') ? (
                              <button
                                onClick={() => { clearCart(); setError('') }}
                                className="mt-2 text-xs text-white bg-secondary-500 hover:bg-secondary-600 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                {language === 'ru' ? 'Очистить корзину' : language === 'en' ? 'Clear cart' : 'Savatni tozalash'}
                              </button>
                            ) : null}
                          </div>
                        )}

                        <button
                          onClick={handleCheckout}
                          disabled={submitting}
                          className="w-full bg-gradient-to-r from-primary to-primary-600 text-white py-3.5 rounded-xl font-bold text-base hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {submitting
                            ? (language === 'ru' ? 'Отправка...' : 'Sending...')
                            : t.checkout}
                        </button>

                        {/* Trust badges */}
                        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-dark-100">
                          <div className="flex items-center gap-1.5 text-dark-400 text-xs">
                            <Shield size={14} className="text-accent-green" />
                            <span>Безопасно</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-dark-400 text-xs">
                            <Truck size={14} className="text-primary" />
                            <span>Доставка</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
