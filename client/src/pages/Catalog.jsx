import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Star, ShoppingCart, Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, SearchX, Package, Zap, Sparkles } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { mockProducts } from '../data/mockData'

// ─── Categories ─────────────────────────────────────────────
const sidebarCategories = [
  { id: 'all', name: 'Все товары', count: null },
  { id: 'tools', name: 'Инструменты', count: 245 },
  { id: 'plumbing', name: 'Сантехника', count: 189 },
  { id: 'electrical', name: 'Электрика', count: 156 },
  { id: 'materials', name: 'Стройматериалы', count: 312 },
  { id: 'paints', name: 'Краски', count: 98 },
  { id: 'fasteners', name: 'Крепёж', count: 421 },
  { id: 'lighting', name: 'Освещение', count: 134 },
  { id: 'garden', name: 'Сад и огород', count: 87 },
]

const filterGroups = [
  {
    id: 'tools',
    title: 'ИНСТРУМЕНТЫ',
    categoryId: 'tools',
    subcategories: ['Перфораторы', 'Дрели', 'Шуруповерты', 'Уровни'],
  },
  {
    id: 'plumbing',
    title: 'САНТЕХНИКА',
    categoryId: 'plumbing',
    subcategories: ['Смесители', 'Трубы', 'Клапаны', 'Сифоны'],
  },
  {
    id: 'electrical',
    title: 'ЭЛЕКТРО ТОВАР',
    categoryId: 'electrical',
    subcategories: ['Розетки', 'Выключатели', 'Кабели', 'Автоматы'],
  },
  {
    id: 'materials',
    title: 'СТРОЙМАТЕРИАЛЫ',
    categoryId: 'materials',
    subcategories: ['Цемент', 'Шпаклевка', 'Гипсокартон', 'Сухие смеси'],
  },
  {
    id: 'paints',
    title: 'КРАСКИ И ПОКРЫТИЯ',
    categoryId: 'paints',
    subcategories: ['Интерьерные краски', 'Эмали', 'Грунтовки', 'Лаки'],
  },
  {
    id: 'fasteners',
    title: 'КРЕПЁЖ',
    categoryId: 'fasteners',
    subcategories: ['Саморезы', 'Дюбели', 'Болты', 'Анкеры'],
  },
  {
    id: 'lighting',
    title: 'ОСВЕЩЕНИЕ',
    categoryId: 'lighting',
    subcategories: ['Светильники', 'LED панели', 'Лампы', 'Прожекторы'],
  },
  {
    id: 'garden',
    title: 'САД И ОГОРОД',
    categoryId: 'garden',
    subcategories: ['Шланги', 'Опрыскиватели', 'Секаторы', 'Лейки'],
  },
]

const sortOptions = [
  { value: 'default', label: 'По умолчанию' },
  { value: 'price_asc', label: 'Цена: по возрастанию' },
  { value: 'price_desc', label: 'Цена: по убыванию' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'new', label: 'Новинки' },
]

const ITEMS_PER_PAGE = 9

export default function Catalog() {
  const { addItem } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 0])
  const [draggingHandle, setDraggingHandle] = useState(null)
  const [expandedGroups, setExpandedGroups] = useState({
    tools: false,
    plumbing: false,
    electrical: false,
    materials: false,
    paints: false,
    fasteners: true,
    lighting: false,
    garden: false,
  })
  const sliderTrackRef = useRef(null)

  // URL-synced state
  const activeCategory = searchParams.get('category') || 'all'
  const activeSubcategory = searchParams.get('subcategory') || ''
  const activeSort = searchParams.get('sort') || 'default'
  const activePage = parseInt(searchParams.get('page') || '1', 10)
  const searchQuery = searchParams.get('q') || ''
  const minPriceParam = parseInt(searchParams.get('minPrice') || '0', 10)
  const maxPriceParam = parseInt(searchParams.get('maxPrice') || '0', 10)

  const absoluteMaxPrice = useMemo(() => {
    return Math.max(...mockProducts.map(product => product.finalPrice || product.price || 0), 0)
  }, [])

  useEffect(() => {
    const nextMin = Number.isFinite(minPriceParam) ? minPriceParam : 0
    const nextMax = Number.isFinite(maxPriceParam) && maxPriceParam > 0 ? maxPriceParam : absoluteMaxPrice
    setPriceRange([Math.max(0, nextMin), Math.max(nextMin, nextMax)])
  }, [minPriceParam, maxPriceParam, absoluteMaxPrice])

  const updateParams = useCallback((updates) => {
    setAnimating(true)
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([k, v]) => {
      if (!v || v === 'all' || v === 'default' || v === '1') next.delete(k)
      else next.set(k, v)
    })
    setSearchParams(next, { replace: true })
    setTimeout(() => setAnimating(false), 300)
  }, [searchParams, setSearchParams])

  const handleAddToCart = useCallback((product) => {
    addItem({ _id: product._id, name: product.name?.ru || product.name, finalPrice: product.finalPrice || product.price, images: product.images || [] })
  }, [addItem])

  // Filter + sort + paginate
  const filtered = useMemo(() => {
    let items = [...mockProducts]
    if (activeCategory !== 'all') items = items.filter(p => p.category === activeCategory)
    if (activeSubcategory) {
      const normalizedSubcategory = activeSubcategory.toLowerCase()
      const matchedItems = items.filter((p) => {
        const name = (p.name?.ru || p.name || '').toLowerCase()
        return name.includes(normalizedSubcategory)
      })
      if (matchedItems.length > 0) items = matchedItems
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter(p => {
        const name = p.name?.ru || p.name || ''
        return name.toLowerCase().includes(q)
      })
    }
    items = items.filter(item => {
      const currentPrice = item.finalPrice || item.price || 0
      return currentPrice >= priceRange[0] && currentPrice <= priceRange[1]
    })
    switch (activeSort) {
      case 'price_asc': items.sort((a, b) => a.price - b.price); break
      case 'price_desc': items.sort((a, b) => b.price - a.price); break
      case 'rating': items.sort((a, b) => b.rating - a.rating); break
      case 'new': items.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break
      default: break
    }
    return items
  }, [activeCategory, activeSubcategory, activeSort, searchQuery, priceRange])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(activePage, totalPages)
  const paginatedProducts = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const resetFilters = () => {
    setSearchParams({}, { replace: true })
    setAnimating(true)
    setTimeout(() => setAnimating(false), 300)
  }

  const applyPriceRange = useCallback((nextMin, nextMax) => {
    const safeMin = Math.max(0, Math.min(nextMin, nextMax))
    const safeMax = Math.max(safeMin, nextMax)
    setPriceRange([safeMin, safeMax])
    updateParams({ minPrice: String(safeMin), maxPrice: safeMax >= absoluteMaxPrice ? '' : String(safeMax), page: '1' })
  }, [absoluteMaxPrice, updateParams])

  const updatePriceFromPointer = useCallback((clientX, handle) => {
    const track = sliderTrackRef.current
    if (!track || absoluteMaxPrice <= 0) return

    const rect = track.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const nextValue = Math.round(ratio * absoluteMaxPrice)

    if (handle === 'min') {
      applyPriceRange(Math.min(nextValue, priceRange[1]), priceRange[1])
      return
    }

    applyPriceRange(priceRange[0], Math.max(nextValue, priceRange[0]))
  }, [absoluteMaxPrice, applyPriceRange, priceRange])

  useEffect(() => {
    if (!draggingHandle) return

    const handlePointerMove = (event) => {
      updatePriceFromPointer(event.clientX, draggingHandle)
    }

    const handlePointerUp = () => {
      setDraggingHandle(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [draggingHandle, updatePriceFromPointer])

  const selectedFiltersCount = [activeCategory !== 'all', Boolean(activeSubcategory), priceRange[0] > 0 || priceRange[1] < absoluteMaxPrice].filter(Boolean).length

  const categoryLabelMap = useMemo(() => {
    return Object.fromEntries(sidebarCategories.map((category) => [category.id, category.name]))
  }, [])

  const toggleGroup = useCallback((groupId) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }, [])

  // Sidebar content (reusable for mobile + desktop)
  const SidebarContent = ({ onClose }) => (
    <div className="rounded-[1.75rem] border border-dark-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] overflow-hidden">
      <div className="px-6 py-5 border-b border-dark-100">
        <h3 className="font-heading text-2xl text-primary-900 tracking-tight font-bold uppercase">Категории</h3>
      </div>

      <div className="px-6 py-5 border-b border-dark-100 space-y-5">
        <h4 className="text-primary-900 text-base font-bold uppercase tracking-wide">Narx oraligi</h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-dark-500 font-semibold uppercase tracking-wider">
            <span>Min</span>
            <span>Max</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input
                type="number"
                min={0}
                max={priceRange[1]}
                value={priceRange[0]}
                onChange={(e) => applyPriceRange(Number(e.target.value || 0), priceRange[1])}
                className="w-full rounded-xl border-2 border-dark-200 bg-white px-3 py-2.5 text-sm text-dark-900 font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="0"
              />
            </div>
            <div className="relative">
              <input
                type="number"
                min={priceRange[0]}
                max={absoluteMaxPrice}
                value={priceRange[1]}
                onChange={(e) => applyPriceRange(priceRange[0], Number(e.target.value || absoluteMaxPrice))}
                className="w-full rounded-xl border-2 border-dark-200 bg-white px-3 py-2.5 text-sm text-dark-900 font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder={String(absoluteMaxPrice)}
              />
            </div>
          </div>

          <div className="relative h-11 mt-2 select-none">
            <div
              ref={sliderTrackRef}
              className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary-100"
              onPointerDown={(event) => {
                const minDistance = Math.abs(event.clientX - ((sliderTrackRef.current?.getBoundingClientRect().left || 0) + ((absoluteMaxPrice ? priceRange[0] / absoluteMaxPrice : 0) * (sliderTrackRef.current?.getBoundingClientRect().width || 0))))
                const maxDistance = Math.abs(event.clientX - ((sliderTrackRef.current?.getBoundingClientRect().left || 0) + ((absoluteMaxPrice ? priceRange[1] / absoluteMaxPrice : 0) * (sliderTrackRef.current?.getBoundingClientRect().width || 0))))
                updatePriceFromPointer(event.clientX, minDistance <= maxDistance ? 'min' : 'max')
              }}
            />
            <div
              className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary transition-all duration-150"
              style={{
                left: `${absoluteMaxPrice ? (priceRange[0] / absoluteMaxPrice) * 100 : 0}%`,
                right: `${absoluteMaxPrice ? 100 - (priceRange[1] / absoluteMaxPrice) * 100 : 0}%`
              }}
            />

            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault()
                setDraggingHandle('min')
              }}
              className="dual-range-handle"
              style={{ left: `${absoluteMaxPrice ? (priceRange[0] / absoluteMaxPrice) * 100 : 0}%` }}
              aria-label="Minimum price"
            />

            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault()
                setDraggingHandle('max')
              }}
              className="dual-range-handle"
              style={{ left: `${absoluteMaxPrice ? (priceRange[1] / absoluteMaxPrice) * 100 : 0}%` }}
              aria-label="Maximum price"
            />
          </div>
        </div>
      </div>

      <div className="px-0 py-2">
        <div className="px-6 py-3 border-b border-dark-100">
          <button
            onClick={() => {
              updateParams({ category: 'all', subcategory: '', page: '1' })
              onClose?.()
            }}
            className={`w-full flex items-center justify-between text-left py-1 text-base font-bold uppercase transition-colors ${activeCategory === 'all' && !activeSubcategory ? 'text-primary' : 'text-primary-900 hover:text-primary'}`}
          >
            <span>Все товары</span>
            <span className="text-xs text-dark-400">{mockProducts.length}</span>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto md:max-h-none md:overflow-visible custom-scrollbar">
          {filterGroups.map((group) => {
            const isExpanded = expandedGroups[group.id]
            const isGroupActive = activeCategory === group.categoryId
            return (
              <div key={group.id} className="border-b border-dark-100 px-6 py-4 last:border-b-0">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className={`text-[15px] font-bold uppercase tracking-wide ${isGroupActive ? 'text-primary' : 'text-primary-900'}`}>
                    {group.title}
                  </span>
                  <ChevronRight size={18} className={`text-dark-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="pt-4 space-y-1">
                    {group.subcategories.map((subcategory) => {
                      const isSubcategoryActive = activeCategory === group.categoryId && activeSubcategory === subcategory
                      return (
                        <label key={subcategory} className="flex items-center gap-3 rounded-2xl px-1 py-2.5 cursor-pointer hover:bg-light-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={isSubcategoryActive}
                            onChange={() => {
                              updateParams({
                                category: group.categoryId,
                                subcategory: isSubcategoryActive ? '' : subcategory,
                                page: '1'
                              })
                              onClose?.()
                            }}
                            className="w-5 h-5 rounded-md border-dark-300 text-primary focus:ring-primary/20"
                          />
                          <span className={`text-sm ${isSubcategoryActive ? 'text-primary font-semibold' : 'text-dark-600'}`}>{subcategory}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {(activeCategory !== 'all' || activeSubcategory || priceRange[0] > 0 || priceRange[1] < absoluteMaxPrice) && (
          <button
            onClick={() => { resetFilters(); onClose?.() }}
            className="mx-6 mt-5 mb-4 w-[calc(100%-3rem)] rounded-2xl border border-primary/15 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary-100 transition-colors"
          >
            Сбросить фильтры
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-light-50">
      <Header />

      <div className="mt-[120px] md:mt-[130px]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          {/* Mobile filter button */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="flex items-center gap-3 bg-white border border-dark-200 px-5 py-3.5 rounded-2xl text-base font-medium text-dark-700 hover:text-dark-900 hover:bg-light-100 transition-colors w-fit shadow-sm"
            >
              <SlidersHorizontal size={18} className="text-primary" />
              Filtrni yopish
              {selectedFiltersCount > 0 && (
                <span className="bg-gradient-to-r from-primary to-primary-600 text-white text-xs font-bold min-w-[22px] h-5 rounded-full flex items-center justify-center px-1.5 shadow-soft">{selectedFiltersCount}</span>
              )}
            </button>
          </div>

          <div className="flex gap-8">
            {/* ─── Desktop Sidebar ─── */}
            <aside className="hidden md:block w-[320px] shrink-0">
              <div className="sticky top-[140px]">
                <SidebarContent />
              </div>
            </aside>

            {/* ─── Main Content ─── */}
            <div className="flex-1 min-w-0">
              {/* Top toolbar */}
              <div className="mb-6 md:mb-8 rounded-[1.75rem] border border-primary-100 bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/20 p-4 sm:p-5 shadow-[0_16px_50px_rgba(59,130,246,0.08)]">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-700">
                        Каталог
                      </span>
                      {selectedFiltersCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-dark-600 border border-dark-200">
                          Активных фильтров: {selectedFiltersCount}
                        </span>
                      )}
                    </div>

                    <div>
                      <h2 className="text-2xl md:text-3xl font-black tracking-tight text-dark-900">
                        Найдено <span className="text-primary">{filtered.length}</span> товаров
                      </h2>
                      <p className="text-sm md:text-[15px] text-dark-500 mt-1">
                        Подберите нужный товар по категории, цене и удобной сортировке
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-2xl bg-white/90 border border-dark-100 px-3 py-2 text-xs font-semibold text-dark-600 shadow-sm">
                        {activeCategory === 'all' ? 'Все категории' : categoryLabelMap[activeCategory] || activeCategory}
                      </span>
                      {activeSubcategory && (
                        <span className="inline-flex items-center rounded-2xl bg-white/90 border border-dark-100 px-3 py-2 text-xs font-semibold text-dark-600 shadow-sm">
                          {activeSubcategory}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full lg:w-auto lg:min-w-[280px]">
                    <div className="rounded-[1.4rem] border border-dark-100 bg-white/95 p-3 shadow-sm backdrop-blur-sm">
                      <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-dark-400 mb-2">
                        Сортировка
                      </span>
                      <div className="relative">
                        <select
                          value={activeSort}
                          onChange={(e) => updateParams({ sort: e.target.value, page: '1' })}
                          className="appearance-none w-full bg-light-50 border border-dark-200 rounded-2xl px-4 py-3 pr-11 text-sm font-semibold text-dark-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 cursor-pointer transition-all"
                        >
                          {sortOptions.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-dark-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product grid */}
              {paginatedProducts.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 rounded-full bg-light-100 border border-dark-200 flex items-center justify-center mb-6">
                    <SearchX size={32} className="text-dark-400" />
                  </div>
                  <h3 className="text-dark-900 font-heading text-2xl mb-2 font-bold">Товары не найдены</h3>
                  <p className="text-dark-600 text-sm mb-6">Попробуйте изменить параметры поиска</p>
                  <button onClick={resetFilters} className="btn-primary text-sm">Сбросить фильтры</button>
                </div>
              ) : (
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 transition-opacity duration-300 ${animating ? 'opacity-40' : 'opacity-100'}`}>
                  {paginatedProducts.map((product) => (
                    <div
                      key={product._id}
                      className="group relative bg-white rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl flex flex-col border border-dark-100 hover:border-primary/30"
                    >
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-transparent group-hover:to-secondary/5 transition-all duration-500 pointer-events-none rounded-3xl" />

                      <Link to={`/catalog/${product._id}`} className="block flex-1 flex flex-col relative z-10">
                        {/* Image Container */}
                        <div className="relative aspect-square bg-gradient-to-br from-slate-50 via-white to-primary-50/30 overflow-hidden group-hover:shadow-inner transition-all duration-500">
                          {/* Discount Badge */}
                          {product.hasDiscount && (
                            <div className="absolute top-4 left-4 z-20">
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-secondary to-secondary-600 blur-md opacity-60" />
                                <span className="relative flex items-center gap-2 bg-gradient-to-r from-secondary to-secondary-600 text-white text-sm font-black px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-sm">
                                  <Zap size={14} fill="currentColor" />
                                  −{product.discountPercent}%
                                </span>
                              </div>
                            </div>
                          )}

                          {/* New Badge */}
                          {product.isNew && (
                            <div className="absolute top-4 right-4 z-20">
                              <span className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-lg">
                                <Sparkles size={11} fill="currentColor" />
                                NEW
                              </span>
                            </div>
                          )}

                          {/* Image */}
                          <div className="absolute inset-0 flex items-center justify-center p-6">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name?.ru || product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                              />
                            ) : (
                              <Package size={72} className="text-dark-200 opacity-40" />
                            )}
                          </div>

                          {/* Gradient overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-transparent to-transparent group-hover:from-black/5 transition-all duration-500" />
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col flex-1 bg-gradient-to-b from-white to-slate-50/50">
                          <h3 className="text-sm md:text-base font-semibold text-dark-900 line-clamp-2 mb-4 min-h-[2.8rem] leading-snug group-hover:text-primary transition-colors duration-300">
                            {product.name?.ru || product.name}
                          </h3>

                          {/* Category & Price Section */}
                          <div className="mt-auto space-y-2">
                            {/* Category Name */}
                            <div className="text-xs font-medium text-primary bg-primary-50 px-2 py-1 rounded-md inline-block">
                              {categoryLabelMap[product.category] || product.category}
                            </div>
                            {product.hasDiscount && product.price && (
                              <div className="flex items-center gap-2">
                                <span className="text-dark-400 text-xs line-through">{product.price.toLocaleString()} сум</span>
                              </div>
                            )}
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl md:text-3xl font-black bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
                                {(product.finalPrice || product.price).toLocaleString()}
                              </span>
                              <span className="text-sm font-medium text-dark-500">сум</span>
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Action Button */}
                      <div className="px-5 pb-5 relative z-10">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleAddToCart(product)
                          }}
                          className="w-full bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group/btn"
                        >
                          <ShoppingCart size={18} className="group-hover/btn:rotate-12 transition-transform duration-300" />
                          <span className="text-sm">В корзину</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => updateParams({ page: String(safePage - 1) })}
                    disabled={safePage <= 1}
                    className="w-10 h-10 rounded-xl bg-white border border-dark-200 flex items-center justify-center text-dark-500 hover:text-primary hover:border-primary hover:bg-primary-50 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    if (totalPages <= 7 || p === 1 || p === totalPages || (p >= safePage - 1 && p <= safePage + 1)) {
                      return (
                        <button
                          key={p}
                          onClick={() => updateParams({ page: String(p) })}
                          className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${p === safePage
                            ? 'bg-gradient-to-r from-primary to-primary-600 text-white shadow-soft'
                            : 'bg-white border border-dark-200 text-dark-700 hover:text-dark-900 hover:border-primary shadow-sm'
                            }`}
                        >
                          {p}
                        </button>
                      )
                    }
                    if (p === safePage - 2 || p === safePage + 2) {
                      return <span key={p} className="text-dark-400 text-sm px-1">...</span>
                    }
                    return null
                  })}

                  <button
                    onClick={() => updateParams({ page: String(safePage + 1) })}
                    disabled={safePage >= totalPages}
                    className="w-10 h-10 rounded-xl bg-white border border-dark-200 flex items-center justify-center text-dark-500 hover:text-primary hover:border-primary hover:bg-primary-50 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-[#f8fafc] border-t border-dark-200 rounded-t-[2rem] max-h-[85vh] overflow-y-auto p-5 animate-slide-up shadow-hover">
            <div className="w-14 h-1.5 rounded-full bg-dark-200 mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-2xl text-dark-900 font-bold">Фильтры</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="w-10 h-10 rounded-2xl bg-white border border-dark-200 flex items-center justify-center text-dark-600 hover:text-dark-900 hover:bg-light-200 shadow-sm">
                <X size={18} />
              </button>
            </div>
            <SidebarContent onClose={() => setMobileFilterOpen(false)} />
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
