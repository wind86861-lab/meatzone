import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { Minus, Plus, Package, X, ShoppingCart, Check } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { productsAPI, requestsAPI } from '../services/api'
import { useCart } from '../context/CartContext'
import { formatPhoneNumber, isValidUzbekPhoneNumber } from '../utils/phoneValidation'

export default function ProductDetail() {
  const { t, language } = useLanguage()
  const { addItem } = useCart()
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [similarProducts, setSimilarProducts] = useState([])
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [ordering, setOrdering] = useState(false)
  const [ordered, setOrdered] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderName, setOrderName] = useState('')
  const [orderPhone, setOrderPhone] = useState('')
  const [consultName2, setConsultName2] = useState('')
  const [consultPhone2, setConsultPhone2] = useState('')
  const [consult2Submitting, setConsult2Submitting] = useState(false)
  const [consult2Submitted, setConsult2Submitted] = useState(false)

  useEffect(() => {
    if (id) {
      productsAPI.getById(id).then(res => { setProduct(res.data); setSelectedImage(0) }).catch(() => { })
      productsAPI.getAll({ active: 'true', limit: 20 }).then(res => {
        const all = (res.data?.products || []).filter(p => p._id !== id)
        setSimilarProducts(all.sort(() => Math.random() - 0.5).slice(0, 4))
      }).catch(() => { })
    }
  }, [id])

  if (!product) return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-20 text-center text-gray-400">Yuklanmoqda...</div>
      <Footer />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-6 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mb-10 md:mb-16" data-aos="fade-up">
          {/* Left Side - Product Images */}
          <div className="flex gap-3 md:gap-4">
            <div className="flex flex-col gap-2 md:gap-4">
              {(product.images?.length ? product.images : ['placeholder']).map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-16 h-16 md:w-24 md:h-24 border-2 rounded-lg overflow-hidden ${selectedImage === index ? 'border-[#3563e9]' : 'border-gray-200'}`}
                >
                  {img !== 'placeholder'
                    ? <img src={img} alt={`Product ${index + 1}`} className="w-full h-full object-contain" />
                    : <div className="w-full h-full bg-gray-100 flex items-center justify-center"><Package size={24} className="text-gray-300" /></div>}
                </button>
              ))}
            </div>
            <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-8 flex items-center justify-center relative overflow-hidden">
              {product.images?.[selectedImage]
                ? <img src={product.images[selectedImage]} alt={product.name?.[language]} className="w-full h-auto object-contain" />
                : <Package size={120} className="text-gray-200" />}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-8 transform -rotate-12 scale-150">
                  {[...Array(20)].map((_, i) => (
                    <span key={i} className="text-white/15 text-2xl md:text-3xl font-bold tracking-wider select-none whitespace-nowrap">
                      PNEUMAX
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Product Details */}
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1e3d69] mb-2">
              {product.name?.[language] || product.name?.uz}
            </h1>
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <span className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1e3d69]">
                {(product.finalPrice || product.price).toLocaleString()} so'm
              </span>
              {product.hasDiscount && (
                <span className="text-base md:text-xl text-gray-400 line-through">{product.price.toLocaleString()} so'm</span>
              )}
            </div>

            {product.specifications?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {language === 'uz' ? 'Texnik xususiyatlar' : language === 'ru' ? 'Технические характеристики' : 'Specifications'}
                </h3>
                <div className="space-y-2">
                  {product.specifications.map((spec, i) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="font-medium text-gray-700">{spec.key?.[language] || spec.key?.uz}:</span>
                      <span className="text-gray-600">{spec.value?.[language] || spec.value?.uz}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Order */}
            <div className="space-y-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 text-center border-x border-gray-300 py-2.5 font-semibold text-gray-900 focus:outline-none"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {ordered ? (
                  <div className="flex-1 bg-green-50 border border-green-200 text-green-700 py-3 rounded-xl font-semibold text-center text-sm">
                    ✓ {language === 'uz' ? 'Qabul qilindi!' : language === 'ru' ? 'Принято!' : 'Received!'}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowOrderModal(true)}
                    disabled={ordering}
                    className="flex-1 bg-[#3563e9] text-white py-3 rounded-xl font-bold text-base hover:bg-[#2952d1] transition-colors shadow-md hover:shadow-lg disabled:opacity-60"
                  >
                    {language === 'uz' ? 'Buyurtma berish' : language === 'ru' ? 'Заказать' : 'Order Now'}
                  </button>
                )}
                <button
                  onClick={() => {
                    addItem(product, quantity)
                    setAddedToCart(true)
                    setTimeout(() => setAddedToCart(false), 2000)
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${addedToCart
                    ? 'border-green-500 bg-green-50 text-green-600'
                    : 'border-[#1e3d69] text-[#1e3d69] hover:bg-[#1e3d69] hover:text-white'
                    }`}
                >
                  {addedToCart
                    ? <><Check size={18} /> {language === 'ru' ? 'Добавлено' : language === 'en' ? 'Added' : 'Qo\'shildi'}</>
                    : <><ShoppingCart size={18} /> {language === 'ru' ? 'В корзину' : language === 'en' ? 'Add to Cart' : 'Savatga'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="bg-white rounded-2xl p-8 mb-16" data-aos="fade-up">
          <h2 className="text-2xl font-bold text-[#1e3d69] mb-4">
            {language === 'uz' ? 'Mahsulot tavsifi' : language === 'ru' ? 'Описание товара' : 'Product Description'}
          </h2>
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {product.description?.[language] || product.description?.uz || '-'}
          </div>
        </div>

        {/* Similar Products */}
        <div className="mb-10 md:mb-16">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1e3d69] mb-5 md:mb-8 uppercase">
            {language === 'uz' && 'TAFSIYA QILINADI'}
            {language === 'ru' && 'РЕКОМЕНДУЕМЫЕ'}
            {language === 'en' && 'RECOMMENDED'}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {similarProducts.map((sim) => (
              <div key={sim._id} className="bg-white border border-gray-200 rounded-xl p-3 md:p-5 hover:shadow-xl transition-all group flex flex-col" data-aos="zoom-in">
                <div className="bg-gray-50 h-32 sm:h-40 lg:h-48 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                  {sim.images?.[0]
                    ? <img src={sim.images[0]} alt={sim.name?.[language]} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                    : <Package size={48} className="text-gray-200" />}
                  <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
                    <span className="text-white text-xs font-bold tracking-wide">PNEUMAX</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col">
                  <h4 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm md:text-base line-clamp-2">{sim.name?.[language] || sim.name?.uz}</h4>
                  <div className="mb-3">
                    <p className="text-[#3563e9] font-bold text-sm md:text-base">{(sim.finalPrice || sim.price).toLocaleString()} so'm</p>
                    {sim.hasDiscount && (
                      <p className="text-xs text-gray-400 line-through">{sim.price.toLocaleString()} so'm</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 mt-auto">
                    {sim.isActive ? (
                      <Link to={`/catalog/${sim._id}`} onClick={() => window.scrollTo(0, 0)} className="w-full bg-[#3563e9] text-white py-2 rounded-lg font-medium hover:bg-[#2952d1] transition-colors text-xs md:text-sm text-center">
                        {language === 'uz' ? 'Buyurtma berish' : language === 'ru' ? 'Заказать' : 'Order'}
                      </Link>
                    ) : (
                      <div className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg font-medium text-xs md:text-sm text-center cursor-not-allowed">
                        {language === 'uz' ? 'Mavjud emas' : language === 'ru' ? 'Недоступно' : 'Unavailable'}
                      </div>
                    )}
                    <Link to={`/catalog/${sim._id}`} onClick={() => window.scrollTo(0, 0)} className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-xs md:text-sm text-center">
                      {language === 'uz' ? 'Batafsil' : language === 'ru' ? 'Подробнее' : 'Details'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Xoniroq Buyurtma Bering */}
        <div className="bg-white rounded-2xl p-6 md:p-12">
          <h2 className="text-xl md:text-2xl font-bold text-[#1e3d69] mb-2">
            {language === 'uz' && 'Xoniroq Buyurtma Bering'}
            {language === 'ru' && 'Закажите Сейчас'}
            {language === 'en' && 'Order Now'}
          </h2>
          <p className="text-gray-600 mb-8">
            {language === 'uz' && 'Formani to\'ldiring va biz sizga tez orada aloqaga chiqamiz. Narxni xisoblab beramiz.'}
            {language === 'ru' && 'Заполните форму и мы свяжемся с вами в ближайшее время. Рассчитаем цену.'}
            {language === 'en' && 'Fill out the form and we will contact you soon. We will calculate the price.'}
          </p>
          <div className="flex flex-col sm:flex-row items-end gap-3 md:gap-4">
            <div className="flex-1 w-full">
              <input
                type="text"
                value={consultName2}
                onChange={e => setConsultName2(e.target.value)}
                placeholder={language === 'uz' ? 'Ismingizni kiriting' : language === 'ru' ? 'Введите ваше имя' : 'Enter your name'}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3563e9]"
              />
            </div>
            <div className="flex-1 w-full">
              <input
                type="tel"
                value={consultPhone2}
                onChange={e => setConsultPhone2(formatPhoneNumber(e.target.value))}
                placeholder="+998901234567"
                title="Enter valid phone: +998XXXXXXXXX or XXXXXXXXX"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3563e9]"
              />
            </div>
            {consult2Submitted ? (
              <div className="w-full sm:w-auto bg-green-50 border border-green-200 text-green-700 px-8 py-3 rounded-xl font-semibold text-center">
                {language === 'uz' ? 'Qabul qilindi!' : language === 'ru' ? 'Принято!' : 'Received!'}
              </div>
            ) : (
              <button
                onClick={async () => {
                  if (!consultPhone2 || !isValidUzbekPhoneNumber(consultPhone2)) {
                    alert(language === 'ru' ? 'Введите корректный номер телефона' : language === 'en' ? 'Enter valid phone number' : 'To\'g\'ri telefon raqamini kiriting')
                    return
                  }
                  setConsult2Submitting(true)
                  try {
                    await requestsAPI.create({ name: consultName2, phone: consultPhone2, type: 'consultation', page: 'product-detail', comment: `Product: ${product.name?.uz || ''}` })
                    setConsult2Submitted(true); setConsultName2(''); setConsultPhone2('')
                  } catch { }
                  finally { setConsult2Submitting(false) }
                }}
                disabled={consult2Submitting || !consultPhone2}
                className="w-full sm:w-auto bg-[#10b981] text-white px-8 md:px-12 py-3 rounded-xl font-semibold hover:bg-[#059669] transition-colors shadow-lg disabled:opacity-60"
              >
                {consult2Submitting ? '...' : language === 'uz' ? 'Konsultatsiya olish' : language === 'ru' ? 'Получить консультацию' : 'Get consultation'}
              </button>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-[#1e3d69]">
                {language === 'uz' ? 'Buyurtma berish' : language === 'ru' ? 'Оформить заказ' : 'Place Order'}
              </h2>
              <button onClick={() => setShowOrderModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 rounded-xl p-3 text-sm text-[#1e3d69] font-medium">
                {product.name?.[language] || product.name?.uz} &times; {quantity}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">*{language === 'uz' ? 'Ismingiz' : language === 'ru' ? 'Ваше имя' : 'Your name'}</label>
                <input type="text" value={orderName} onChange={e => setOrderName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3563e9]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">*{language === 'uz' ? 'Telefon raqamingiz' : language === 'ru' ? 'Ваш номер телефона' : 'Your phone number'}</label>
                <input type="tel" value={orderPhone} onChange={e => setOrderPhone(formatPhoneNumber(e.target.value))}
                  placeholder="+998901234567"
                  title="Enter valid phone: +998XXXXXXXXX or XXXXXXXXX"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3563e9]" />
              </div>
              <button
                disabled={ordering || !orderPhone || !orderName}
                onClick={async () => {
                  if (!orderPhone || !orderName) return
                  if (!isValidUzbekPhoneNumber(orderPhone)) {
                    alert(language === 'ru' ? 'Введите корректный номер телефона' : language === 'en' ? 'Enter valid phone number' : 'To\'g\'ri telefon raqamini kiriting')
                    return
                  }
                  setOrdering(true)
                  try {
                    await requestsAPI.create({
                      name: orderName,
                      phone: orderPhone,
                      productModel: product.name?.[language] || product.name?.uz,
                      productQuantity: String(quantity),
                      type: 'consultation',
                      page: 'product-detail',
                    })
                    setOrdered(true)
                    setShowOrderModal(false)
                    setOrderName('')
                    setOrderPhone('')
                  } catch { }
                  finally { setOrdering(false) }
                }}
                className="w-full bg-[#3563e9] text-white py-3 rounded-xl font-semibold hover:bg-[#2952d1] transition-colors disabled:opacity-60"
              >
                {ordering ? '...' : language === 'uz' ? 'Buyurtmani yuborish' : language === 'ru' ? 'Отправить заказ' : 'Submit Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
