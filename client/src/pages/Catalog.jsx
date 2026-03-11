import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { Search, SlidersHorizontal, Package, ChevronDown, X, ShoppingCart } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { productsAPI, categoriesAPI, requestsAPI, uploadAPI } from '../services/api'
import { useCart } from '../context/CartContext'

export default function Catalog() {
  const { t, language } = useLanguage()
  const { addItem } = useCart()
  const [addedIds, setAddedIds] = useState(new Set())

  const handleAddToCart = (product) => {
    addItem(product, 1)
    setAddedIds(prev => new Set(prev).add(product._id))
    setTimeout(() => setAddedIds(prev => { const n = new Set(prev); n.delete(product._id); return n }), 2000)
  }
  const [searchParams] = useSearchParams()
  // selection: { type: 'all'|'parent'|'sub', id: '' }
  const [isFilterOpen, setIsFilterOpen] = useState(true)
  const [expandedParents, setExpandedParents] = useState(new Set())
  const [selectedSubs, setSelectedSubs] = useState(new Set())
  const MAX_PRICE = 10000000
  const [priceMin, setPriceMin] = useState(0)
  const [priceMax, setPriceMax] = useState(10000000)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [randomProducts, setRandomProducts] = useState([])
  const [consultName, setConsultName] = useState('')
  const [consultPhone, setConsultPhone] = useState('')
  const [consultSubmitting, setConsultSubmitting] = useState(false)
  const [consultSubmitted, setConsultSubmitted] = useState(false)
  const [catOrderForm, setCatOrderForm] = useState({ name: '', phone: '', productName: '', quantity: '' })
  const [catOrderSubmitting, setCatOrderSubmitting] = useState(false)
  const [catOrderSubmitted, setCatOrderSubmitted] = useState(false)
  const [catOrderImage, setCatOrderImage] = useState(null)
  const [catOrderImagePreview, setCatOrderImagePreview] = useState(null)
  const [catOrderUploading, setCatOrderUploading] = useState(false)

  useEffect(() => {
    categoriesAPI.getAll().then(res => setCategories(res.data || [])).catch(() => { })
    productsAPI.getAll({ active: 'true', limit: 20 }).then(res => {
      const all = res.data?.products || []
      setRandomProducts(all.sort(() => Math.random() - 0.5).slice(0, 4))
    }).catch(() => { })
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = { active: 'true', limit: 12, page }
    if (selectedSubs.size > 0) params.categories = Array.from(selectedSubs).join(',')
    if (search) params.search = search
    if (priceMin > 0) params.minPrice = priceMin
    if (priceMax < MAX_PRICE) params.maxPrice = priceMax
    productsAPI.getAll(params)
      .then(res => {
        setProducts(res.data?.products || [])
        setTotalPages(res.data?.pages || 1)
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [selectedSubs, search, page, priceMin, priceMax])

  const parentCategories = categories.filter(c => !c.parent)
  const childCategories = (parentId) => categories.filter(c => c.parent?._id === parentId || c.parent === parentId)

  const toggleParent = (parentId) => {
    setExpandedParents(prev => {
      const next = new Set(prev)
      if (next.has(parentId)) next.delete(parentId)
      else next.add(parentId)
      return next
    })
  }

  const toggleSub = (subId) => {
    setSelectedSubs(prev => {
      const next = new Set(prev)
      if (next.has(subId)) next.delete(subId)
      else next.add(subId)
      return next
    })
    setPage(1)
  }

  const clearFilters = () => {
    setSelectedSubs(new Set())
    setPriceMin(0)
    setPriceMax(MAX_PRICE)
    setPage(1)
  }

  const activeFilterCount = selectedSubs.size + (priceMin > 0 ? 1 : 0) + (priceMax < MAX_PRICE ? 1 : 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="bg-gradient-to-r from-[#1e3d69] to-[#2d5a8f] py-8 md:py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4">{t.nav.catalog}</h1>
          <p className="text-white/90 text-sm md:text-lg">
            {language === 'uz' && 'Barcha mahsulotlar katalogi'}
            {language === 'ru' && 'Каталог всех продуктов'}
            {language === 'en' && 'Complete product catalog'}
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-6 md:py-12">
        <div className="relative mb-4 md:mb-6">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder={language === 'uz' ? 'Mahsulot qidirish...' : language === 'ru' ? 'Поиск товаров...' : 'Search products...'}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#3563e9] bg-white"
          />
        </div>
        {/* Filter Toggle Button */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2.5 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal size={17} className="text-[#3563e9]" />
            {language === 'uz' ? (isFilterOpen ? 'Filtrni yopish' : 'Filtr') : language === 'ru' ? (isFilterOpen ? 'Скрыть фильтр' : 'Фильтр') : (isFilterOpen ? 'Hide filter' : 'Filter')}
            {activeFilterCount > 0 && (
              <span className="bg-[#3563e9] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
              <X size={14} />
              {language === 'uz' ? 'Tozalash' : language === 'ru' ? 'Очистить' : 'Clear all'}
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          <div className={`w-full md:w-72 lg:w-80 md:shrink-0 ${isFilterOpen ? 'block' : 'hidden'}`}>
            <style>{`
              .range-slider { pointer-events: none; -webkit-appearance: none; appearance: none; background: transparent; position: absolute; width: 100%; height: 0; }
              .range-slider::-webkit-slider-thumb { pointer-events: all; -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #3563e9; cursor: pointer; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.25); }
              .range-slider::-moz-range-thumb { pointer-events: all; width: 14px; height: 14px; border-radius: 50%; background: #3563e9; cursor: pointer; border: 2px solid white; border: none; box-shadow: 0 1px 4px rgba(0,0,0,0.25); }
            `}</style>
            <div className="bg-white rounded-xl shadow-sm md:sticky md:top-6 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-[#1e3d69] text-base">
                  {language === 'uz' ? 'KATEGORIYALAR' : language === 'ru' ? 'КАТЕГОРИИ' : 'CATEGORIES'}
                </h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 transition-colors">
                    {language === 'uz' ? 'Tozalash' : language === 'ru' ? 'Очистить' : 'Clear'}
                  </button>
                )}
              </div>

              {/* Price Range */}
              <div className="px-5 py-4 border-b border-gray-100">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">
                  {language === 'uz' ? 'Narx oraligi' : language === 'ru' ? 'Ценовой диапазон' : 'Price range'}
                </h4>
                <div className="flex justify-between text-xs text-gray-500 mb-3 font-medium">
                  <span>{priceMin > 0 ? priceMin.toLocaleString() + " so'm" : language === 'uz' ? 'Min' : 'Min'}</span>
                  <span>{priceMax < MAX_PRICE ? priceMax.toLocaleString() + " so'm" : 'Max'}</span>
                </div>
                <div className="relative h-6 flex items-center">
                  <div className="absolute w-full h-1.5 bg-gray-200 rounded-full" />
                  <div
                    className="absolute h-1.5 bg-[#3563e9] rounded-full"
                    style={{ left: `${(priceMin / MAX_PRICE) * 100}%`, right: `${100 - (priceMax / MAX_PRICE) * 100}%` }}
                  />
                  <input type="range" min={0} max={MAX_PRICE} step={100000} value={priceMin}
                    onChange={e => { setPriceMin(Math.min(Number(e.target.value), priceMax - 100000)); setPage(1) }}
                    className="range-slider" style={{ zIndex: priceMin > MAX_PRICE / 2 ? 5 : 3 }}
                  />
                  <input type="range" min={0} max={MAX_PRICE} step={100000} value={priceMax}
                    onChange={e => { setPriceMax(Math.max(Number(e.target.value), priceMin + 100000)); setPage(1) }}
                    className="range-slider" style={{ zIndex: 4 }}
                  />
                </div>
              </div>

              {/* Category Sections */}
              <div className="overflow-y-auto max-h-[55vh]">
                {parentCategories.map(parent => {
                  const children = childCategories(parent._id)
                  const isExpanded = expandedParents.has(parent._id)
                  const checkedCount = children.filter(c => selectedSubs.has(c._id)).length
                  return (
                    <div key={parent._id} className="border-b border-gray-100 last:border-0">
                      <button
                        onClick={() => toggleParent(parent._id)}
                        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1e3d69] text-sm uppercase tracking-wide">{parent.name?.[language] || parent.name?.uz}</span>
                          {checkedCount > 0 && (
                            <span className="bg-[#10b981] text-white text-xs font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center">{checkedCount}</span>
                          )}
                        </div>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      {isExpanded && children.length > 0 && (
                        <div className="pb-2 px-3 bg-gray-50/50">
                          {children.map(child => {
                            const isChecked = selectedSubs.has(child._id)
                            return (
                              <button
                                key={child._id}
                                onClick={() => toggleSub(child._id)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white transition-colors text-left"
                              >
                                <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${isChecked ? 'bg-[#10b981] border-[#10b981]' : 'border-gray-300 bg-white'}`}>
                                  {isChecked && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span className={`text-sm ${isChecked ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                                  {child.name?.[language] || child.name?.uz}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex-1">
            {/* Active Filter Pills */}
            {selectedSubs.size > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.from(selectedSubs).map(subId => {
                  const cat = categories.find(c => c._id === subId)
                  if (!cat) return null
                  return (
                    <button
                      key={subId}
                      onClick={() => toggleSub(subId)}
                      className="flex items-center gap-1.5 bg-[#3563e9]/10 text-[#3563e9] px-3 py-1 rounded-full text-xs font-medium hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      {cat.name?.[language] || cat.name?.uz}
                      <X size={12} />
                    </button>
                  )
                })}
                <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-500 px-2 transition-colors">
                  {language === 'uz' ? 'Barchasini tozalash' : language === 'ru' ? 'Сбросить всё' : 'Clear all'}
                </button>
              </div>
            )}
            {loading ? (
              <div className="col-span-3 py-20 text-center text-gray-400">Yuklanmoqda...</div>
            ) : products.length === 0 ? (
              <div className="col-span-3 py-20 text-center text-gray-400">
                {language === 'uz' ? 'Mahsulot topilmadi' : language === 'ru' ? 'Товары не найдены' : 'No products found'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {products.map(product => (
                  <div key={product._id} className="bg-white border border-gray-200 rounded-xl p-3 md:p-5 hover:shadow-xl transition-all group relative flex flex-col" data-aos="fade-up">
                    <div className="bg-gray-50 h-32 sm:h-40 lg:h-48 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {product.images?.[0]
                        ? <img src={product.images[0]} alt={product.name?.ru || product.name?.uz} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                        : <Package size={48} className="text-gray-200" />}
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
                          <button
                            onClick={() => handleAddToCart(product)}
                            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium text-xs md:text-sm transition-all ${addedIds.has(product._id)
                              ? 'bg-green-500 text-white'
                              : 'bg-[#3563e9] text-white hover:bg-[#2952d1]'
                              }`}
                          >
                            <ShoppingCart size={14} />
                            {addedIds.has(product._id)
                              ? (language === 'ru' ? 'Добавлено ✓' : language === 'en' ? 'Added ✓' : 'Qo\'shildi ✓')
                              : (language === 'uz' ? 'Savatga' : language === 'ru' ? 'В корзину' : 'Add to Cart')}
                          </button>
                        ) : (
                          <div className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg font-medium text-xs md:text-sm text-center cursor-not-allowed">
                            {language === 'uz' ? 'Mavjud emas' : language === 'ru' ? 'Недоступно' : 'Unavailable'}
                          </div>
                        )}
                        <Link to={`/catalog/${product._id}`} className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-xs md:text-sm text-center">
                          {language === 'uz' ? 'Batafsil' : language === 'ru' ? 'Подробнее' : 'Details'}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg font-semibold ${p === page ? 'bg-[#3563e9] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hoziroq Buyurtma bering Section */}
      <section className="bg-gray-100 py-8 md:py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20">
          <div className="bg-white rounded-2xl p-6 md:p-12">
            <h3 className="text-xl font-semibold text-[#1e3d69] mb-2">
              {language === 'uz' && 'Hoziroq Buyurtma bering'}
              {language === 'ru' && 'Закажите сейчас'}
              {language === 'en' && 'Order now'}
            </h3>
            <p className="text-gray-600 mb-8">
              {language === 'uz' && 'Formani to\'ldiring va biz sizga tez orada aloqaga chiqamiz. Narxni xisoblab beramiz.'}
              {language === 'ru' && 'Заполните форму и мы свяжемся с вами в ближайшее время. Рассчитаем цену.'}
              {language === 'en' && 'Fill out the form and we will contact you soon. We will calculate the price.'}
            </p>
            <div className="flex flex-col sm:flex-row items-end gap-3 md:gap-4">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  value={consultName}
                  onChange={e => setConsultName(e.target.value)}
                  placeholder={language === 'uz' ? 'Ismingizni kiriting' : language === 'ru' ? 'Введите ваше имя' : 'Enter your name'}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3563e9]"
                />
              </div>
              <div className="flex-1 w-full">
                <input
                  type="tel"
                  value={consultPhone}
                  onChange={e => setConsultPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                  pattern="^(\+998[0-9]{9}|[0-9]{9})$"
                  placeholder="+998901234567"
                  title="Enter valid phone: +998XXXXXXXXX or XXXXXXXXX"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3563e9]"
                />
              </div>
              {consultSubmitted ? (
                <div className="w-full sm:w-auto bg-green-50 border border-green-200 text-green-700 px-8 py-3 rounded-xl font-semibold text-center">
                  {language === 'uz' ? 'Qabul qilindi!' : language === 'ru' ? 'Принято!' : 'Received!'}
                </div>
              ) : (
                <button
                  onClick={async () => {
                    if (!consultPhone) return
                    setConsultSubmitting(true)
                    try {
                      await requestsAPI.create({ name: consultName, phone: consultPhone, type: 'consultation', page: 'catalog' })
                      setConsultSubmitted(true); setConsultName(''); setConsultPhone('')
                    } catch { }
                    finally { setConsultSubmitting(false) }
                  }}
                  disabled={consultSubmitting}
                  className="w-full sm:w-auto bg-[#10b981] text-white px-8 md:px-12 py-3 rounded-xl font-semibold hover:bg-[#059669] transition-colors shadow-lg disabled:opacity-60"
                >
                  {consultSubmitting ? '...' : language === 'uz' ? 'Konsultatsiya olish' : language === 'ru' ? 'Получить консультацию' : 'Get consultation'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ARZON NARKLARDA Section */}
      <section className="py-8 md:py-16 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1e3d69] mb-6 md:mb-8 uppercase">
            {language === 'uz' && 'TAFSIYA QILINADI'}
            {language === 'ru' && 'РЕКОМЕНДУЕМЫЕ'}
            {language === 'en' && 'RECOMMENDED'}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {randomProducts.map(product => (
              <div key={`disc-${product._id}`} className="bg-white border border-gray-200 rounded-xl p-3 md:p-5 hover:shadow-xl transition-all group relative flex flex-col">
                <div className="bg-gray-50 h-32 sm:h-40 lg:h-48 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  {product.images?.[0]
                    ? <img src={product.images[0]} alt={product.name?.ru || product.name?.uz} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                    : <Package size={48} className="text-gray-200" />}
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
                      <Link to={`/catalog/${product._id}`} className="w-full bg-[#3563e9] text-white py-2 rounded-lg font-medium hover:bg-[#2952d1] transition-colors text-xs md:text-sm text-center">
                        {language === 'uz' ? 'Buyurtma berish' : language === 'ru' ? 'Заказать' : 'Order'}
                      </Link>
                    ) : (
                      <div className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg font-medium text-xs md:text-sm text-center cursor-not-allowed">
                        {language === 'uz' ? 'Mavjud emas' : language === 'ru' ? 'Недоступно' : 'Unavailable'}
                      </div>
                    )}
                    <Link to={`/catalog/${product._id}`} className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-xs md:text-sm text-center">
                      {language === 'uz' ? 'Batafsil' : language === 'ru' ? 'Подробнее' : 'Details'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Order Form Section */}
      <section className="py-8 md:py-16 bg-gray-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20">
          <div className="bg-white rounded-2xl p-6 md:p-12">
            <h3 className="text-lg md:text-2xl font-semibold text-[#1e3d69] mb-2">
              {language === 'uz' && 'O\'zingizga kerak maxsulot topilmadimi?'}
              {language === 'ru' && 'Не нашли нужный товар?'}
              {language === 'en' && 'Didn\'t find the product you need?'}
            </h3>
            <h2 className="text-xl md:text-3xl font-bold text-[#1e3d69] mb-5 md:mb-8">
              {language === 'uz' && 'MAXSUS BUYURTMA XIZMATIDAN FOYDALANING'}
              {language === 'ru' && 'ВОСПОЛЬЗУЙТЕСЬ УСЛУГОЙ СПЕЦИАЛЬНОГО ЗАКАЗА'}
              {language === 'en' && 'USE THE CUSTOM ORDER SERVICE'}
            </h2>
            {catOrderSubmitted ? (
              <div className="bg-green-50 border border-green-200 rounded-xl py-8 text-center">
                <p className="text-green-700 font-bold text-lg">{language === 'uz' ? 'Buyurtmangiz qabul qilindi!' : language === 'ru' ? 'Ваш заказ принят!' : 'Order received!'}</p>
                <p className="text-green-600 text-sm mt-1">{language === 'uz' ? 'Tez orada siz bilan bog\'lanamiz.' : language === 'ru' ? 'Скоро свяжемся с вами.' : 'We will contact you soon.'}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-gray-700 mb-2 text-sm md:text-base">*{language === 'uz' ? 'Ismingiz' : language === 'ru' ? 'Ваше имя' : 'Your name'}</label>
                  <input type="text" value={catOrderForm.name} onChange={e => setCatOrderForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm md:text-base focus:outline-none focus:border-[#3563e9]" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 text-sm md:text-base">*{language === 'uz' ? 'Telefon nomeringiz' : language === 'ru' ? 'Ваш телефон' : 'Your phone'}</label>
                  <input type="tel" value={catOrderForm.phone}
                    onChange={e => setCatOrderForm(f => ({ ...f, phone: e.target.value.replace(/[^0-9+]/g, '') }))}
                    pattern="^(\+998[0-9]{9}|[0-9]{9})$"
                    placeholder="+998901234567"
                    title="Enter valid phone: +998XXXXXXXXX or XXXXXXXXX"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm md:text-base focus:outline-none focus:border-[#3563e9]" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 text-sm md:text-base">*{language === 'uz' ? 'Tovar nomi, Modeli' : language === 'ru' ? 'Название товара, Модель' : 'Product name, Model'}</label>
                  <input type="text" value={catOrderForm.productName} onChange={e => setCatOrderForm(f => ({ ...f, productName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm md:text-base focus:outline-none focus:border-[#3563e9]" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 text-sm md:text-base">*{language === 'uz' ? 'Mahsulot miqdori' : language === 'ru' ? 'Количество товара' : 'Product quantity'}</label>
                  <input type="number" min="1" value={catOrderForm.quantity} onChange={e => setCatOrderForm(f => ({ ...f, quantity: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm md:text-base focus:outline-none focus:border-[#3563e9]" />
                </div>
                <div className="flex flex-col justify-between gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm">{language === 'uz' ? 'Mahsulot rasmini yuklang (Ixtiyoriy)' : language === 'ru' ? 'Фото товара (Необязательно)' : 'Product image (Optional)'}</label>
                    <label className="border-2 border-dashed border-gray-300 rounded-xl h-[140px] flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:border-[#3563e9] transition-all overflow-hidden relative group">
                      <input type="file" accept="image/*" className="hidden" onChange={async e => {
                        const file = e.target.files[0]
                        if (!file) return
                        if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return }
                        setCatOrderImagePreview(URL.createObjectURL(file))
                        setCatOrderUploading(true)
                        try {
                          const fd = new FormData(); fd.append('image', file)
                          const res = await uploadAPI.single(fd)
                          setCatOrderImage(res.data.url)
                        } catch { setCatOrderImagePreview(null) }
                        finally { setCatOrderUploading(false) }
                      }} />
                      {catOrderImagePreview
                        ? <img src={catOrderImagePreview} className="w-full h-full object-cover" alt="preview" />
                        : catOrderUploading
                          ? <div className="animate-spin w-7 h-7 border-4 border-[#3563e9] border-t-transparent rounded-full" />
                          : <div className="flex flex-col items-center gap-1">
                            <svg className="w-9 h-9 text-gray-400 group-hover:text-[#3563e9] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <p className="text-sm text-gray-500">{language === 'uz' ? 'Rasmni yuklash' : language === 'ru' ? 'Загрузить фото' : 'Upload'}</p>
                            <p className="text-xs text-gray-400">Max 5MB</p>
                          </div>
                      }
                    </label>
                  </div>
                  <button
                    disabled={catOrderSubmitting || !catOrderForm.name || !catOrderForm.phone || !catOrderForm.productName || !catOrderForm.quantity}
                    onClick={async () => {
                      if (!catOrderForm.name || !catOrderForm.phone || !catOrderForm.productName || !catOrderForm.quantity) {
                        alert(language === 'uz' ? 'Iltimos, barcha maydonlarni to\'ldiring' : language === 'ru' ? 'Заполните все поля' : 'Fill all required fields')
                        return
                      }
                      setCatOrderSubmitting(true)
                      try {
                        await requestsAPI.create({ name: catOrderForm.name, phone: catOrderForm.phone, productModel: catOrderForm.productName, productQuantity: catOrderForm.quantity, type: 'custom-order', page: 'catalog', image: catOrderImage || undefined })
                        setCatOrderSubmitted(true)
                        setCatOrderForm({ name: '', phone: '', productName: '', quantity: '' })
                        setCatOrderImage(null); setCatOrderImagePreview(null)
                      } catch { alert(language === 'uz' ? 'Xatolik yuz berdi' : 'Error') }
                      finally { setCatOrderSubmitting(false) }
                    }}
                    className="w-full bg-[#10b981] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#059669] transition-colors shadow-lg disabled:opacity-60"
                  >
                    {catOrderSubmitting ? '...' : language === 'uz' ? 'Buyurtma berish' : language === 'ru' ? 'Заказать' : 'Order'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
