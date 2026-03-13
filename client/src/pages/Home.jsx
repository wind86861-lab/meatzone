import { useState, useEffect } from 'react'
import { MapPin, TrendingUp, Package, Truck, CreditCard, ChevronDown, Phone, Shield, Globe, Wrench, Zap } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { faqsAPI, productsAPI, branchesAPI, blogsAPI, pageContentAPI, requestsAPI, uploadAPI, categoriesAPI } from '../services/api'
import { formatPhoneNumber, isValidUzbekPhoneNumber } from '../utils/phoneValidation'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import header1 from '../image/header1.jpg'
import header2 from '../image/header2.jpg'
import header3 from '../image/header3.jpg'
import pr1 from '../image/pr1.png'
import pr2 from '../image/pr2.png'

const ICON_MAP = {
  TrendingUp, Truck, Package, CreditCard, Shield, Globe, Wrench, Zap,
}

export default function Home() {
  const { language, t } = useLanguage()
  const [openFaq, setOpenFaq] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showcaseSlide, setShowcaseSlide] = useState(0)
  const [partnerSlide, setPartnerSlide] = useState(0)
  const [faqs, setFaqs] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [branches, setBranches] = useState([])
  const [blogs, setBlogs] = useState([])
  const [categories, setCategories] = useState([])
  const [cms, setCms] = useState({})
  const [consultForm, setConsultForm] = useState({ name: '', phone: '', productName: '', quantity: '' })
  const [consultImage, setConsultImage] = useState(null)
  const [consultImagePreview, setConsultImagePreview] = useState(null)
  const [consultUploading, setConsultUploading] = useState(false)
  const [consultSubmitting, setConsultSubmitting] = useState(false)
  const [consultSubmitted, setConsultSubmitted] = useState(false)
  const fallbackBgImages = [header1, header2, header3]
  const fallbackShowcaseImages = [pr1, pr2]

  const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index)

  useEffect(() => {
    pageContentAPI.getAll({ page: 'home' }).then(res => {
      const map = {}
        ; (res.data || []).forEach(item => { map[item.section] = item.content || {} })
      setCms(map)
    }).catch(() => { })
    faqsAPI.getAll({ active: 'true' }).then(res => setFaqs(res.data || [])).catch(() => { })
    productsAPI.getAll({ featured: 'true', active: 'true' }).then(res => setTopProducts(res.data?.products || [])).catch(() => { })
    branchesAPI.getAll({ showOnHomepage: 'true' }).then(res => setBranches(res.data || [])).catch(() => { })
    blogsAPI.getAll({ published: 'true', featured: 'true', limit: 3 }).then(res => setBlogs(res.data?.blogs || [])).catch(() => { })
    categoriesAPI.getAll({ parent: 'null', active: 'true' }).then(res => setCategories(res.data || [])).catch(() => { })
  }, [])

  const heroImages = (cms.hero?.bgImages?.length > 0) ? cms.hero.bgImages : fallbackBgImages
  const showcaseImages = (cms.showcase?.images?.length > 0) ? cms.showcase.images : fallbackShowcaseImages

  useEffect(() => {
    if (heroImages.length <= 1) return
    const interval = setInterval(() => setCurrentSlide(p => (p + 1) % heroImages.length), 4000)
    return () => clearInterval(interval)
  }, [heroImages.length])


  const hero = cms.hero || {}
  const features = cms.features || {}
  const featureItems = features.items || []
  const advantages = cms.advantages || {}
  const advantageItems = advantages.items || []
  const showcase = cms.showcase || {}
  const consultation = cms.consultation || {}
  const branchesSection = cms.branches || {}
  const topProductsSection = cms.topProducts || {}
  const partners = cms.partners || {}
  const partnerItems = partners.items?.filter(p => p.logo || p.name) || []
  const PARTNERS_PER_PAGE = 5
  const partnerPages = Math.ceil(partnerItems.length / PARTNERS_PER_PAGE)
  const showcasePages = Math.ceil(showcaseImages.length / 2)
  const visibleShowcase = showcaseImages.slice(showcaseSlide * 2, showcaseSlide * 2 + 2)

  useEffect(() => {
    if (showcaseImages.length <= 2) return
    const interval = setInterval(() => setShowcaseSlide(p => (p + 1) % Math.ceil(showcaseImages.length / 2)), 4000)
    return () => clearInterval(interval)
  }, [showcaseImages.length])

  useEffect(() => {
    if (partnerPages <= 1) return
    const interval = setInterval(() => setPartnerSlide(p => (p + 1) % partnerPages), 3000)
    return () => clearInterval(interval)
  }, [partnerPages])

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* HERO */}
      <section className="relative bg-[#1e3d69] h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] xl:h-[820px] overflow-hidden">
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
              <img src={image} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className="relative h-full flex items-center">
          <div className="bg-[#1e3d69]/95 rounded-r-xl pt-5 px-5 pb-5 sm:pt-6 sm:px-6 sm:pb-6 md:pt-7 md:px-7 md:pb-7 lg:pt-9 lg:px-9 lg:pb-9 xl:pt-10 xl:px-10 xl:pb-10 w-full sm:w-[500px] md:w-[550px] lg:w-[600px] xl:w-[900px] flex flex-col justify-between h-auto">
            <div>
              <h2 className="text-[20px] sm:text-[28px] md:text-[36px] lg:text-[44px] xl:text-[48px] font-bold uppercase leading-tight">
                <span className="bg-gradient-to-r from-[#6b7ff5] via-[#42ade2] to-[#83bf4f] bg-clip-text text-transparent">
                  {hero.line1?.[language] || hero.line1?.uz || 'SANOAT EHTIYOT QISMLARI-'}
                </span>
              </h2>
              <p className="text-[50px] sm:text-[52px] md:text-[64px] lg:text-[76px] xl:text-[130px] font-black text-white tracking-wide">
                {hero.line2?.[language] || hero.line2?.uz || 'PNEUMAX'}
              </p>
              <p className="text-[16px] sm:text-[20px] md:text-[24px] lg:text-[28px] xl:text-[48px] font-normal text-[#42ade2]">
                {hero.line3?.[language] || hero.line3?.uz || 'Tez, ishonchli va hamyonbop.'}
              </p>
            </div>
            <Link to="/catalog" className="bg-[#3563e9] text-white w-full py-3 sm:py-3.5 md:py-2 lg:py-3 rounded-lg font-semibold text-base sm:text-lg md:text-xl lg:text-2xl shadow-lg hover:bg-[#2952d1] transition-all hover:shadow-xl mt-5 sm:mt-6 md:mt-7 lg:mt-8 text-center block">
              {hero.buttonText?.[language] || hero.buttonText?.uz || 'Buyurtma berish'}
            </Link>
          </div>
        </div>
      </section>

      {/* KATEGORIYALAR */}
      {categories.length > 0 && (
        <section className="py-10 md:py-14 lg:py-16 px-4 sm:px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto" data-aos="fade-up">
          <div className="flex items-end justify-between mb-6 md:mb-10">
            <div>
              <p className="text-[#3563e9] font-semibold text-sm md:text-base mb-1 tracking-wide uppercase">
                {language === 'uz' ? 'Mahsulotlarimiz' : language === 'ru' ? 'Наши продукты' : 'Our Products'}
              </p>
              <h3 className="text-[22px] sm:text-[28px] md:text-[34px] lg:text-[40px] font-black text-[#1e3d69] uppercase leading-tight">
                {language === 'uz' ? 'Kategoriyalar' : language === 'ru' ? 'Категории' : 'Categories'}
              </h3>
            </div>
            <Link
              to="/catalog"
              className="flex items-center gap-2 text-[#3563e9] font-semibold text-sm md:text-base hover:underline shrink-0"
            >
              {language === 'uz' ? 'Barchasi' : language === 'ru' ? 'Все' : 'Browse all'}
              <span className="text-lg">→</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
            {categories.map((cat, i) => {
              const gradients = [
                'from-[#6b7ff5] to-[#4f5fd4]',
                'from-[#42ade2] to-[#2185c5]',
                'from-[#f5826b] to-[#d45f40]',
                'from-[#7cc97f] to-[#4ea85a]',
                'from-[#c97cc9] to-[#a050a0]',
                'from-[#f5c46b] to-[#d49f40]',
                'from-[#6bc9c9] to-[#40a0a0]',
                'from-[#f57c9a] to-[#d44068]',
              ]
              const grad = gradients[i % gradients.length]
              const name = cat.name?.[language] || cat.name?.uz || cat.name?.ru || ''
              return (
                <Link
                  key={cat._id}
                  to={`/catalog?category=${cat._id}`}
                  className="group flex flex-col items-center bg-white border border-gray-100 rounded-2xl p-4 md:p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  data-aos="zoom-in"
                  data-aos-delay={Math.min(i * 60, 360)}
                >
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center mb-3 md:mb-4 overflow-hidden shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    {cat.image
                      ? <img src={cat.image} alt={name} className="w-full h-full object-cover" />
                      : <span className="text-white text-2xl md:text-3xl font-black select-none">{name.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <p className="text-center text-xs sm:text-sm font-semibold text-gray-800 group-hover:text-[#3563e9] transition-colors leading-snug line-clamp-2">{name}</p>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section className="py-10 md:py-16 lg:py-20 px-4 sm:px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto bg-[#f5f7fa]" data-aos="fade-up">
        <div className="max-w-[1200px] mx-auto">
          <h3 className="text-[16px] sm:text-[20px] md:text-[24px] lg:text-[28px] font-bold text-[#1e3d69] text-center mb-2 md:mb-4 uppercase">
            {features.title?.[language] || features.title?.uz || 'GLOBAL HAMKORLIK, KAFOLATLANGAN SIFAT VA'}
          </h3>
          <h4 className="text-[16px] sm:text-[20px] md:text-[24px] lg:text-[28px] font-bold text-[#1e3d69] text-center mb-8 md:mb-16 uppercase">
            {features.subtitle?.[language] || features.subtitle?.uz || "PROFESSIONAL TA'MINOT."}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
            {(featureItems.length > 0 ? featureItems : [
              { title: { uz: "To'g'ridan To'g'ri IMPORT", ru: 'Прямой ИМПОРТ', en: 'Direct IMPORT' }, description: { uz: "Ehtiyot Qismlari Ishlab Chiqaruvchilardan Bevosita Olib Kiramiz!", ru: 'Закупаем запчасти напрямую у производителей!', en: 'We purchase spare parts directly from manufacturers!' }, icon: 'TrendingUp' },
              { title: { uz: 'Maxsus Buyurtma Xizmati.', ru: 'Услуга специального заказа.', en: 'Custom Order Service.' }, description: { uz: "Omborda Bo'lmagan Texnologiya Ehtiyot Qismlarini Siz Uchun Keltrib Beramiz!", ru: 'Доставим технологические запчасти специально для вас!', en: 'We will bring technology spare parts especially for you!' }, icon: 'Truck' },
              { title: { uz: 'Sifat kafolati', ru: 'Гарантия качества', en: 'Quality guarantee' }, description: { uz: 'Barcha mahsulotlar sifat sertifikatiga ega.', ru: 'Все товары имеют сертификат качества.', en: 'All products have a quality certificate.' }, icon: 'Package' },
              { title: { uz: "Qulay to'lov", ru: 'Удобная оплата', en: 'Easy payment' }, description: { uz: "Turli to'lov usullari mavjud.", ru: 'Доступны различные способы оплаты.', en: 'Various payment methods available.' }, icon: 'CreditCard' },
            ]).map((item, i) => {
              const IconComp = ICON_MAP[item.icon] || Package
              const title = typeof item.title === 'object' ? (item.title[language] || item.title.uz || '') : item.title
              const desc = typeof item.description === 'object' ? (item.description[language] || item.description.uz || '') : item.description
              return (
                <div key={i} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow" data-aos="fade-up" data-aos-delay={i * 100}>
                  <div className="w-16 h-16 bg-[#7c8ff5] rounded-full flex items-center justify-center mb-6">
                    <IconComp size={32} className="text-white" />
                  </div>
                  <h5 className="text-xl font-bold text-gray-900 mb-3">{title}</h5>
                  <p className="text-gray-600 leading-relaxed">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* TOP PRODUCTS */}
      <section className="py-10 md:py-16 lg:py-20 px-4 sm:px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto" data-aos="fade-up">
        <h3 className="text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] font-bold text-[#1e3d69] uppercase mb-6 md:mb-12">
          {topProductsSection.title?.[language] || topProductsSection.title?.uz || 'Top mahsulotlar'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
          {topProducts.map((product) => (
            <div key={product._id} className="bg-white border border-gray-200 rounded-xl p-3 md:p-5 hover:shadow-xl transition-all group flex flex-col" data-aos="zoom-in">
              <div className="bg-gray-50 h-32 sm:h-40 lg:h-48 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                {product.images?.[0]
                  ? <img src={product.images[0]} alt={product.name?.ru || product.name?.uz} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                  : <Package size={48} className="text-gray-300" />}
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
                    <Link to={`/catalog/${product._id}`} onClick={() => window.scrollTo(0, 0)} className="w-full bg-[#3563e9] text-white py-2 rounded-lg font-medium hover:bg-[#2952d1] transition-colors text-xs md:text-sm text-center">
                      {language === 'uz' ? 'Buyurtma berish' : language === 'ru' ? 'Заказать' : 'Order'}
                    </Link>
                  ) : (
                    <div className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg font-medium text-xs md:text-sm text-center cursor-not-allowed">
                      {language === 'uz' ? 'Mavjud emas' : language === 'ru' ? 'Недоступно' : 'Unavailable'}
                    </div>
                  )}
                  <Link to={`/catalog/${product._id}`} onClick={() => window.scrollTo(0, 0)} className="w-full bg-white border-2 border-[#3563e9] text-[#3563e9] py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-xs md:text-sm text-center">
                    {language === 'uz' ? 'Batafsil' : language === 'ru' ? 'Подробнее' : 'Details'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ADVANTAGES */}
      <section className="bg-gradient-to-br from-[#1e3d69] via-[#2952d1] to-[#1e3d69] py-16 md:py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20">
          <div className="text-center mb-12 md:mb-20" data-aos="fade-down">
            <h3 className="text-[28px] sm:text-[36px] md:text-[44px] lg:text-[52px] font-black text-white mb-4">
              {advantages.title?.[language] || advantages.title?.uz || 'Преимущества'}
            </h3>
            <p className="text-white/90 text-base md:text-xl max-w-2xl mx-auto">
              {advantages.subtitle?.[language] || advantages.subtitle?.uz || 'Почему клиенты выбирают именно нас?'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8">
            {(advantageItems.length > 0 ? advantageItems : [
              { title: { uz: '20+', ru: '20+', en: '20+' }, subtitle: { uz: 'Yil tajriba', ru: 'Лет опыта', en: 'Years experience' }, icon: '🏆' },
              { title: { uz: '5000+', ru: '5000+', en: '5000+' }, subtitle: { uz: 'Ehtiyot qismlar', ru: 'Запчастей', en: 'Spare parts' }, icon: '📦' },
              { title: { uz: 'Buyurtma', ru: 'Заказ', en: 'Order' }, subtitle: { uz: 'Moslashuvchan', ru: 'Гибкий', en: 'Flexible' }, icon: '⚡' },
              { title: { uz: 'Tez', ru: 'Быстро', en: 'Fast' }, subtitle: { uz: 'Yetkazib berish', ru: 'Доставка', en: 'Delivery' }, icon: '🚀' },
              { title: { uz: "To'lov", ru: 'Оплата', en: 'Payment' }, subtitle: { uz: 'Turi ixtiyoriy', ru: 'Любой способ', en: 'Any method' }, icon: '💳' },
            ]).map((item, index) => {
              const title = typeof item.title === 'object' ? (item.title[language] || item.title.uz || '') : item.title
              const subtitle = typeof item.subtitle === 'object' ? (item.subtitle[language] || item.subtitle.uz || '') : item.subtitle
              return (
                <div key={index} className="group" data-aos="fade-up" data-aos-delay={index * 100}>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 text-center hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-white/20">
                    <div className="text-5xl md:text-6xl mb-4">{item.icon || '✨'}</div>
                    <h4 className="text-white text-2xl md:text-3xl lg:text-4xl font-black mb-2">{title}</h4>
                    <p className="text-white/80 text-sm md:text-base font-medium">{subtitle}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* SHOWCASE */}
      <section className="py-10 md:py-16 lg:py-20 px-4 sm:px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto" data-aos="fade-up">
        <h3 className="text-[18px] sm:text-[22px] md:text-[26px] lg:text-[32px] font-bold text-[#1e3d69] mb-2 md:mb-4 uppercase">
          {showcase.title?.[language] || showcase.title?.uz || 'Ishonchli sanoat ehtiyot qismlari, qulay narxlarda va'}
        </h3>
        <h4 className="text-[18px] sm:text-[22px] md:text-[26px] lg:text-[32px] font-bold text-[#1e3d69] mb-6 md:mb-12 uppercase">
          {showcase.subtitle?.[language] || showcase.subtitle?.uz || 'barqaror yetkazib berish tizimi.'}
        </h4>
        <p className="text-gray-600 mb-6 md:mb-12 max-w-3xl text-sm md:text-base">
          {showcase.description?.[language] || showcase.description?.uz || "Sertifikatlangan sanoat ehtiyot qismlari, professional maslahat va barqaror ta'minot xizmati."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
          {visibleShowcase.map((img, i) => (
            <div key={i} data-aos="zoom-in" data-aos-delay={i * 200}>
              <img src={img} alt="" className="w-full h-[300px] object-contain rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]" />
            </div>
          ))}
        </div>
      </section>

      {/* BRANCHES */}
      {branches.length > 0 && (
        <section className="py-10 md:py-16 lg:py-20 px-4 sm:px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto bg-white" data-aos="fade-up">
          <h3 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[36px] font-bold text-[#1e3d69] mb-6 md:mb-12 uppercase border-b-4 border-[#3563e9] inline-block pb-2">
            {branchesSection.title?.[language] || branchesSection.title?.uz || (language === 'uz' ? 'Filiallarimiz' : language === 'ru' ? 'Наши филиалы' : 'Our Branches')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-12">
            {branches.map((branch) => (
              <div key={branch._id} className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 col-span-1 sm:col-span-2" data-aos="fade-right">
                <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow h-[250px] sm:h-[300px] lg:h-[350px]">
                  <div className="bg-gradient-to-br from-[#1e3d69] to-[#2d5a8f] p-6 md:p-10 text-white h-full flex flex-col justify-between">
                    <div>
                      <h4 className="text-lg md:text-2xl font-bold mb-3 md:mb-6">{branch.title?.[language] || branch.title?.uz}</h4>
                      <div className="flex items-start gap-3 mb-4">
                        <MapPin className="text-white mt-1" size={20} />
                        <p className="text-sm opacity-90">{branch.fullAddress}</p>
                      </div>
                      {branch.phones?.[0] && (
                        <div className="flex items-center gap-3">
                          <Phone className="text-white" size={20} />
                          <p>{branch.phones[0]}</p>
                        </div>
                      )}
                    </div>
                    <Link to="/branches" className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors mt-8 self-end">
                      <span className="text-[#1e3d69] text-xl">→</span>
                    </Link>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow h-[250px] sm:h-[300px] lg:h-[350px]">
                  {branch.image
                    ? <img src={branch.image} alt={branch.title?.ru || branch.title?.uz} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-[#1e3d69] to-[#2d5a8f] flex items-center justify-center"><MapPin size={64} className="text-white/20" /></div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CONSULTATION / CUSTOM ORDER */}
      <section className="py-10 md:py-16 lg:py-20 px-4 sm:px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto">
        <h3 className="text-[16px] sm:text-[20px] md:text-[24px] lg:text-[28px] font-semibold text-[#1e3d69] mb-2 md:mb-4">
          {consultation.title?.[language] || consultation.title?.uz || "O'zingizga kerak maxsulot topilmadimi?"}
        </h3>
        <h4 className="text-[22px] sm:text-[28px] md:text-[34px] lg:text-[42px] font-bold text-[#1e3d69] mb-6 md:mb-12">
          {consultation.subtitle?.[language] || consultation.subtitle?.uz || 'Maxsus buyurtma xizmatidan foydalaning'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2">*{language === 'uz' ? 'Ismingiz' : language === 'ru' ? 'Ваше имя' : 'Your name'}</label>
              <input type="text" value={consultForm.name} onChange={e => setConsultForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3563e9]" required />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">*{language === 'uz' ? 'Telefon nomeringiz' : language === 'ru' ? 'Ваш номер телефона' : 'Your phone number'}</label>
              <input
                type="tel"
                value={consultForm.phone}
                onChange={e => setConsultForm({ ...consultForm, phone: formatPhoneNumber(e.target.value) })}
                pattern="^(\+998[0-9]{9}|[0-9]{9})$"
                placeholder="+998901234567"
                title="Enter valid phone: +998XXXXXXXXX or XXXXXXXXX"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3563e9]"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">*{language === 'uz' ? 'Tovar nomi, Modeli' : language === 'ru' ? 'Название товара, модель' : 'Product name, Model'}</label>
              <input type="text" value={consultForm.productName} onChange={e => setConsultForm(f => ({ ...f, productName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3563e9]" required />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">*{language === 'uz' ? 'Mahsulot miqdori' : language === 'ru' ? 'Количество товара' : 'Product quantity'}</label>
              <input type="number" min="1" value={consultForm.quantity} onChange={e => setConsultForm(f => ({ ...f, quantity: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3563e9]" required />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2 text-sm">{language === 'uz' ? 'Mahsulot rasmini yuklang (Ixtiyoriy)' : language === 'ru' ? 'Фото товара (Необязательно)' : 'Product image (Optional)'}</label>
              <label className="border-2 border-dashed border-gray-300 rounded-xl h-[300px] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100/50 cursor-pointer hover:border-[#3563e9] hover:bg-blue-50/30 transition-all overflow-hidden relative group">
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return }
                  setConsultImagePreview(URL.createObjectURL(file))
                  setConsultUploading(true)
                  try {
                    const fd = new FormData(); fd.append('image', file)
                    const res = await uploadAPI.single(fd)
                    setConsultImage(res.data.url)
                  } catch { setConsultImagePreview(null) }
                  finally { setConsultUploading(false) }
                }} />
                {consultImagePreview
                  ? <img src={consultImagePreview} className="w-full h-full object-cover" alt="preview" />
                  : consultUploading
                    ? <div className="animate-spin w-8 h-8 border-4 border-[#3563e9] border-t-transparent rounded-full" />
                    : <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-gray-400 group-hover:text-[#3563e9] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500 group-hover:text-[#3563e9] transition-colors font-medium">{language === 'uz' ? 'Rasmni yuklash' : language === 'ru' ? 'Загрузить фото' : 'Upload image'}</p>
                      <p className="text-xs text-gray-400">Max 5MB</p>
                    </div>
                }
              </label>
            </div>
            {consultSubmitted ? (
              <div className="bg-green-50 border border-green-200 rounded-xl py-4 text-center text-green-700 font-semibold">
                {language === 'uz' ? 'Buyurtmangiz qabul qilindi!' : language === 'ru' ? 'Заявка принята!' : 'Request received!'}
              </div>
            ) : (
              <button
                disabled={consultSubmitting || !consultForm.name || !consultForm.phone || !consultForm.productName || !consultForm.quantity}
                onClick={async () => {
                  if (!consultForm.name || !consultForm.phone || !consultForm.productName || !consultForm.quantity) {
                    alert(language === 'uz' ? 'Iltimos, barcha maydonlarni to\'ldiring' : language === 'ru' ? 'Пожалуйста, заполните все поля' : 'Please fill all required fields')
                    return
                  }
                  const phoneRegex = /^(\+998[0-9]{9}|[0-9]{9,12})$/
                  if (!phoneRegex.test(consultForm.phone)) {
                    alert(language === 'uz' ? 'Telefon raqami noto\'g\'ri formatda. Masalan: +998977455874 yoki 987412587' : language === 'ru' ? 'Неверный формат телефона. Например: +998977455874 или 987412587' : 'Invalid phone format. Example: +998977455874 or 987412587')
                    return
                  }
                  setConsultSubmitting(true)
                  try {
                    await requestsAPI.create({ name: consultForm.name, phone: consultForm.phone, productModel: consultForm.productName, productQuantity: consultForm.quantity, type: 'consultation', page: 'home', image: consultImage || undefined })
                    setConsultSubmitted(true)
                    setConsultForm({ name: '', phone: '', productName: '', quantity: '' })
                    setConsultImage(null); setConsultImagePreview(null)
                  } catch { }
                  finally { setConsultSubmitting(false) }
                }}
                className="w-full bg-[#3563e9] text-white py-4 rounded-lg font-medium hover:bg-[#2952d1] transition-colors disabled:opacity-60"
              >
                {consultSubmitting ? '...' : consultation.buttonText?.[language] || consultation.buttonText?.uz || 'Yuborish'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* NEWS */}
      <section className="py-10 md:py-16 lg:py-20 px-4 sm:px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto bg-gray-50">
        <h3 className="text-[24px] sm:text-[30px] md:text-[36px] lg:text-[42px] font-bold text-[#1e3d69] mb-6 md:mb-12">
          {language === 'uz' ? 'Yangiliklar' : language === 'ru' ? 'Новости' : 'News'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          {blogs.map((blog) => (
            <Link key={blog._id} to={`/blog/${blog._id}`} className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-shadow block">
              <div className="bg-gradient-to-br from-[#1e3d69] to-[#3563e9] h-48 flex items-center justify-center overflow-hidden">
                {blog.image
                  ? <img src={blog.image} alt={blog.title?.[language]} className="w-full h-full object-cover" />
                  : <Package size={64} className="text-white/40" />}
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-2">{new Date(blog.createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'uz-UZ')}</p>
                <h4 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{blog.title?.[language] || blog.title?.uz}</h4>
                <span className="text-[#3563e9] font-medium hover:underline">
                  {language === 'uz' ? 'Batafsil →' : language === 'ru' ? 'Подробнее →' : 'Read more →'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* PARTNERS */}
      {partnerItems.length > 0 && (
        <section className="py-10 md:py-16 bg-white border-t border-gray-100">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20">
            <h3 className="text-[22px] sm:text-[26px] md:text-[30px] font-bold text-[#1e3d69] mb-8 md:mb-12">
              {partners.title?.[language] || partners.title?.uz || 'Hamkorlarimiz'}
            </h3>
            <div className="relative overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${partnerSlide * 100}%)` }}
              >
                {Array.from({ length: partnerPages }).map((_, pageIdx) => (
                  <div key={pageIdx} className="w-full flex-shrink-0 flex flex-wrap justify-center items-start gap-4 md:gap-5">
                    {partnerItems.slice(pageIdx * PARTNERS_PER_PAGE, pageIdx * PARTNERS_PER_PAGE + PARTNERS_PER_PAGE).map((partner, i) => (
                      <div key={i} className="w-[calc(50%-8px)] sm:w-[calc(33.333%-12px)] lg:w-[calc(20%-16px)] flex flex-col items-center justify-between gap-3 px-4 py-5 rounded-2xl border border-gray-100 hover:border-[#8a7dff]/40 hover:shadow-lg transition-all group bg-white">
                        <div className="w-full h-24 flex items-center justify-center">
                          {partner.logo
                            ? <img src={partner.logo} alt={partner.name || ''} className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                            : <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-lg font-bold">{(partner.name || '?').charAt(0)}</div>
                          }
                        </div>
                        {partner.name && (
                          <p className="text-[11px] md:text-xs uppercase tracking-wide text-[#49566f] text-center font-medium line-clamp-2">{partner.name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            {partnerPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: partnerPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPartnerSlide(i)}
                    className={`transition-all rounded-full ${i === partnerSlide ? 'w-6 h-2 bg-[#3563e9]' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-10 md:py-16 lg:py-20 px-4 sm:px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto">
        <h3 className="text-[22px] sm:text-[28px] md:text-[34px] lg:text-[42px] font-bold text-[#1e3d69] mb-6 md:mb-12">Eng ko'p beriladigan savollar</h3>
        <div className="max-w-4xl">
          {faqs.map((faq, index) => (
            <div key={faq._id || index} className="border-b border-gray-200 last:border-0">
              <button onClick={() => toggleFaq(index)} className="w-full flex items-center justify-between py-6 text-left hover:text-[#3563e9] transition-colors">
                <span className="text-lg font-semibold text-gray-900">{faq.question?.[language] || faq.question?.uz}</span>
                <ChevronDown className={`text-gray-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} size={24} />
              </button>
              {openFaq === index && (
                <div className="pb-6 text-gray-600 leading-relaxed">{faq.answer?.[language] || faq.answer?.uz}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
