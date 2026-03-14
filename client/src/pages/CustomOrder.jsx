import { useState, useEffect } from 'react'
import { formatPhoneNumber } from '../utils/phoneValidation'
import { useLanguage } from '../context/LanguageContext'
import { faqsAPI, productsAPI, requestsAPI, uploadAPI, pageContentAPI } from '../services/api'
import { Link } from 'react-router-dom'
import { Heart, Upload, ChevronDown, X, CheckCircle, Package, Users, CreditCard, Target, Shield, Globe, Wrench, Zap } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ICON_MAP = {
  Package, Handshake: Users, CreditCard, Target, Shield, Globe, Wrench, Zap
}
import product1 from '../image/Top mahsulotlar1.png'
import product2 from '../image/Top mahsulotlar2.png'
import product3 from '../image/Top mahsulotlar3.png'
import product4 from '../image/Top mahsulotlar4.png'

export default function CustomOrder() {
  const { t, language } = useLanguage()
  const [openFaq, setOpenFaq] = useState(null)
  const [faqs, setFaqs] = useState([])
  const [topProducts, setTopProducts] = useState([])

  const [content, setContent] = useState({})

  useEffect(() => {
    faqsAPI.getAll({ active: 'true' }).then(res => setFaqs(res.data || [])).catch(() => { })
    productsAPI.getAll({ active: 'true', limit: 20 }).then(res => {
      const all = res.data?.products || []
      const shuffled = all.sort(() => Math.random() - 0.5).slice(0, 4)
      setTopProducts(shuffled)
    }).catch(() => { })
    pageContentAPI.getAll({ page: 'customOrder' }).then(res => {
      const map = {}
        ; (res.data || []).forEach(item => { map[item.section] = item.content || {} })
      setContent(map)
    }).catch(() => { })
  }, [])

  const [formData, setFormData] = useState({ name: '', phone: '', productName: '', quantity: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const MAX_SIZE_MB = 5

  const handleImageSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadError('')
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(language === 'uz' ? `Rasm hajmi ${MAX_SIZE_MB}MB dan oshmasligi kerak` : language === 'ru' ? `Размер файла не должен превышать ${MAX_SIZE_MB}МБ` : `File size must not exceed ${MAX_SIZE_MB}MB`)
      return
    }
    setImagePreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await uploadAPI.single(fd)
      setImage(res.data.url)
    } catch {
      setUploadError(language === 'uz' ? 'Yuklash xatosi' : language === 'ru' ? 'Ошибка загрузки' : 'Upload failed')
      setImagePreview(null)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
    setUploadError('')
  }


  const benefits = content.benefits?.items || [
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


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="w-full bg-gradient-to-r from-[#1e3d69] to-[#3563e9] py-10 md:py-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20">
          <p className="text-white/80 mb-2 text-sm md:text-base">
            {language === 'uz' && 'O\'zingizga kerak maxsulot topilmadimi?'}
            {language === 'ru' && 'Не нашли нужный товар?'}
            {language === 'en' && 'Didn\'t find the product you need?'}
          </p>
          <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-white uppercase">
            {language === 'uz' && 'MAXSUS BUYURTMA XIZMATIDAN FOYDALANING'}
            {language === 'ru' && 'ВОСПОЛЬЗУЙТЕСЬ УСЛУГОЙ СПЕЦИАЛЬНОГО ЗАКАЗА'}
            {language === 'en' && 'USE THE CUSTOM ORDER SERVICE'}
          </h1>
        </div>
      </div>

      <div className="w-full bg-[#EFF3FD] py-6 md:py-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">
                  {language === 'uz' && 'Ismingiz'}
                  {language === 'ru' && 'Ваше имя'}
                  {language === 'en' && 'Your name'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder={language === 'uz' ? 'Ismingizni kiriting' : language === 'ru' ? 'Введите ваше имя' : 'Enter your name'}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3563e9] focus:ring-2 focus:ring-[#3563e9]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">
                  <span className="text-red-500">*</span> {language === 'uz' && 'Telefon nomeringiz'}
                  {language === 'ru' && 'Ваш телефон'}
                  {language === 'en' && 'Your phone'}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                  pattern="^(\+998[0-9]{9}|[0-9]{9})$"
                  placeholder="+998 90 123 45 67"
                  title="Enter valid phone: +998XXXXXXXXX or XXXXXXXXX"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3563e9] focus:ring-2 focus:ring-[#3563e9]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">
                  <span className="text-red-500">*</span> {language === 'uz' && 'Tovar nomi, Modeli'}
                  {language === 'ru' && 'Название товара, Модель'}
                  {language === 'en' && 'Product name, Model'}
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={e => setFormData({ ...formData, productName: e.target.value })}
                  placeholder={language === 'uz' ? 'Masalan: Silindr ISO 6432' : language === 'ru' ? 'Например: Цилиндр ISO 6432' : 'e.g. Cylinder ISO 6432'}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3563e9] focus:ring-2 focus:ring-[#3563e9]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">
                  <span className="text-red-500">*</span> {language === 'uz' && 'Mahsulot miqdori'}
                  {language === 'ru' && 'Количество товара'}
                  {language === 'en' && 'Product quantity'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder={language === 'uz' ? 'Miqdorni kiriting' : language === 'ru' ? 'Введите количество' : 'Enter quantity'}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3563e9] focus:ring-2 focus:ring-[#3563e9]/20 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex-1 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden hover:border-[#3563e9] transition-colors cursor-pointer relative" style={{ minHeight: '160px' }}>
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" disabled={uploading} />
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img src={imagePreview} alt="preview" className="w-full h-48 object-cover" />
                    {uploading && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-4 border-[#3563e9] border-t-transparent rounded-full" />
                      </div>
                    )}
                    {!uploading && image && (
                      <div className="absolute top-2 right-2 flex gap-2">
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle size={12} />
                          {language === 'uz' ? 'Yuklandi' : language === 'ru' ? 'Загружено' : 'Uploaded'}
                        </span>
                      </div>
                    )}
                    <button type="button" onClick={(e) => { e.preventDefault(); removeImage() }} className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 h-full">
                    <Upload size={40} className="text-gray-400 mb-3" />
                    <p className="text-gray-500 text-center font-medium">
                      <span className="text-red-500">*</span> {language === 'uz' ? 'Mahsulot rasmini yuklang' : language === 'ru' ? 'Загрузите фото товара' : 'Upload product image'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {language === 'uz' ? `(Majburiy, max ${MAX_SIZE_MB}MB)` : language === 'ru' ? `(Обязательно, макс. ${MAX_SIZE_MB}МБ)` : `(Required, max ${MAX_SIZE_MB}MB)`}
                    </p>
                  </div>
                )}
              </label>
              {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
              {submitAttempted && !image && !imagePreview && (
                <p className="text-red-500 text-xs -mt-2">
                  {language === 'uz' ? '* Rasm yuklash majburiy' : language === 'ru' ? '* Загрузка фото обязательна' : '* Image upload is required'}
                </p>
              )}
              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-xl py-4 text-center text-green-700 font-semibold">
                  {language === 'uz' ? 'Buyurtmangiz qabul qilindi!' : language === 'ru' ? 'Заявка принята!' : 'Order received!'}
                </div>
              ) : (
                <button
                  onClick={async () => {
                    setSubmitAttempted(true)
                    if (!formData.phone || !image) return
                    setSubmitting(true)
                    try {
                      await requestsAPI.create({ name: formData.name, phone: formData.phone, productModel: formData.productName, productQuantity: formData.quantity, type: 'custom-order', page: 'custom-order', image: image || undefined })
                      setSubmitted(true)
                      setFormData({ name: '', phone: '', productName: '', quantity: '' })
                      setImage(null)
                      setImagePreview(null)
                    } catch { }
                    finally { setSubmitting(false) }
                  }}
                  disabled={submitting}
                  className="bg-[#10b981] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#059669] transition-colors disabled:opacity-60"
                >
                  {submitting ? '...' : language === 'uz' ? 'Buyurtma berish' : language === 'ru' ? 'Заказать' : 'Order'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-6 md:py-12">
        <div className="mb-16">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1e3d69] mb-5 md:mb-8 uppercase">
            {language === 'uz' && 'TAFSIYA QILINADI'}
            {language === 'ru' && 'РЕКОМЕНДУЕМЫЕ'}
            {language === 'en' && 'RECOMMENDED'}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {topProducts.map((product) => (
              <div key={product._id} className="bg-white border border-gray-200 rounded-xl p-3 md:p-5 hover:shadow-xl transition-all group relative flex flex-col">
                <div className="bg-gray-50 h-32 sm:h-40 lg:h-48 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                  {product.images?.[0]
                    ? <img src={product.images[0]} alt={product.name?.[language]} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                    : <Heart size={48} className="text-gray-200" />}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-4 -rotate-12 scale-125 opacity-90">
                      {[...Array(12)].map((_, i) => (
                        <span key={i} className="text-sm md:text-base font-bold tracking-wider select-none whitespace-nowrap" style={{ color: 'rgba(30, 61, 105, 0.15)', textShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                          PNEUMAX
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col">
                  <h4 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm md:text-base line-clamp-2">{product.name?.[language] || product.name?.uz}</h4>
                  <div className="mb-3">
                    <p className="text-[#3563e9] font-bold text-sm md:text-base">{(product.finalPrice || product.price).toLocaleString()} so'm</p>
                    {product.hasDiscount && (
                      <p className="text-xs text-gray-400 line-through">{product.price.toLocaleString()} so'm</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 mt-auto">
                    {product.isActive ? (
                      <Link to={`/catalog/${product._id}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full bg-[#3563e9] text-white py-2 rounded-lg font-medium hover:bg-[#2952d1] transition-colors text-xs md:text-sm text-center">
                        {language === 'uz' ? 'Buyurtma berish' : language === 'ru' ? 'Заказать' : 'Order'}
                      </Link>
                    ) : (
                      <div className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg font-medium text-xs md:text-sm text-center cursor-not-allowed">
                        {language === 'uz' ? 'Mavjud emas' : language === 'ru' ? 'Недоступно' : 'Unavailable'}
                      </div>
                    )}
                    <Link to={`/catalog/${product._id}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-xs md:text-sm text-center">
                      {language === 'uz' ? 'Batafsil' : language === 'ru' ? 'Подробнее' : 'Details'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1e3d69] mb-5 md:mb-8 uppercase">
            {language === 'uz' && 'GLOBAL HAMKORLIK, KAFOLATLANGAN SIFAT VA PROFESSIONAL TAMINOT'}
            {language === 'ru' && 'ГЛОБАЛЬНОЕ ПАРТНЕРСТВО, ГАРАНТИРОВАННОЕ КАЧЕСТВО И ПРОФЕССИОНАЛЬНЫЕ ПОСТАВКИ'}
            {language === 'en' && 'GLOBAL PARTNERSHIP, GUARANTEED QUALITY AND PROFESSIONAL SUPPLY'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {benefits.map((benefit, index) => {
              const IconComp = ICON_MAP[benefit.icon] || Package
              const title = benefit.title?.[language] || benefit.title?.uz || ''
              const desc = benefit.desc?.[language] || benefit.desc?.uz || ''
              return (
                <div key={index} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-[#3563e9]/10 rounded-full flex items-center justify-center text-[#3563e9] mb-6">
                    <IconComp size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-[#1e3d69] mb-2">{title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-[#1e3d69] mb-8">
            {language === 'uz' && 'Eng ko\'p beriladigan savollar'}
            {language === 'ru' && 'Часто задаваемые вопросы'}
            {language === 'en' && 'Frequently asked questions'}
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq._id} className="bg-white rounded-lg overflow-hidden border border-gray-200">
                <button
                  onClick={() => setOpenFaq(openFaq === faq._id ? null : faq._id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-[#1e3d69] text-lg">{faq.question?.[language] || faq.question?.uz}</span>
                  <ChevronDown
                    className={`text-gray-400 transition-transform flex-shrink-0 ml-4 ${openFaq === faq._id ? 'rotate-180' : ''}`}
                    size={24}
                  />
                </button>
                {openFaq === faq._id && (
                  <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                    {faq.answer?.[language] || faq.answer?.uz}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
