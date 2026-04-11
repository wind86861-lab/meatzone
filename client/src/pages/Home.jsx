import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Truck, CreditCard, Headphones, Star,
  ChevronLeft, ChevronRight, ArrowRight,
  Wrench, Droplets, Zap, Layers, Paintbrush, Hammer, Lightbulb, Trees,
  ShoppingCart, Package, Sparkles
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { mockAPI, mockProducts } from '../data/mockData'
import heroBg1 from '../image/image copy 2.png'
import heroBg2 from '../image/image copy 3.png'
import heroBg3 from '../image/image copy 4.png'
import heroBg4 from '../image/image copy 5.png'

// ─── Categories ────────────────────────────────────────────────
const categories = [
  { id: 'tools', name: 'Инструменты', count: 245, Icon: Wrench },
  { id: 'plumbing', name: 'Сантехника', count: 189, Icon: Droplets },
  { id: 'electrical', name: 'Электрика', count: 156, Icon: Zap },
  { id: 'materials', name: 'Стройматериалы', count: 312, Icon: Layers },
  { id: 'paints', name: 'Краски', count: 98, Icon: Paintbrush },
  { id: 'fasteners', name: 'Крепёж', count: 421, Icon: Hammer },
  { id: 'lighting', name: 'Освещение', count: 134, Icon: Lightbulb },
  { id: 'garden', name: 'Сад и огород', count: 76, Icon: Trees },
]

const reviews = [
  { id: 1, text: 'Отличный магазин! Быстрая доставка и качественные материалы. Заказываю уже не первый раз и всегда доволен.', author: 'Александр К.', date: '15 марта 2026', rating: 5 },
  { id: 2, text: 'Очень удобный каталог, нашёл всё что нужно для ремонта ванной комнаты. Цены приемлемые, доставка вовремя.', author: 'Мария С.', date: '10 марта 2026', rating: 5 },
  { id: 3, text: 'Профессиональные консультанты помогли подобрать инструмент. Рекомендую всем кто делает ремонт!', author: 'Дмитрий В.', date: '5 марта 2026', rating: 4 },
  { id: 4, text: 'Широкий ассортимент строительных материалов. Особенно порадовали скидки на краску и крепёж.', author: 'Елена П.', date: '1 марта 2026', rating: 5 },
]

const advantages = [
  { Icon: Shield, title: 'Гарантия качества', desc: 'Сертифицированные товары от проверенных производителей' },
  { Icon: Truck, title: 'Быстрая доставка', desc: 'Доставим по Ташкенту за 24 часа, по регионам — за 3 дня' },
  { Icon: CreditCard, title: 'Удобная оплата', desc: 'Наличные, карта, перевод — выбирайте удобный способ' },
  { Icon: Headphones, title: 'Поддержка 24/7', desc: 'Наши специалисты всегда на связи и готовы помочь' },
]

// ─── Intersection Observer hook ─────────────────────────────
function useFadeIn() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.unobserve(el) } },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

// ─── Animated Counter ───────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const duration = 2000
        const startTime = performance.now()
        const numTarget = parseInt(target)
        const step = (now) => {
          const elapsed = now - startTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(eased * numTarget))
          if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }
    }, { threshold: 0.5 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count}{suffix}</span>
}

// ─── Product Card ───────────────────────────────────────────
function ProductCard({ product, onAdd }) {
  return (
    <div className="group relative bg-blue-50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col border border-blue-100">
      {/* Discount Badge - Top Left */}
      {product.hasDiscount && (
        <div className="absolute top-3 left-3 z-20">
          <span className="flex items-center gap-1 bg-red-400 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
            <Zap size={10} fill="currentColor" />
            −{product.discountPercent}%
          </span>
        </div>
      )}

      {/* New Badge - Top Right */}
      {product.isNew && (
        <div className="absolute top-3 right-3 z-20">
          <span className="bg-rose-300 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
            NEW
          </span>
        </div>
      )}

      <Link to={`/catalog/${product._id}`} className="block flex-1 flex flex-col relative z-10">
        {/* Image Container */}
        <div className="relative aspect-square bg-blue-50 overflow-hidden p-4">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name?.ru || product.name}
              className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-100 rounded-xl">
              <Package size={48} className="text-blue-300" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pb-3 flex flex-col flex-1">
          {/* Rating */}
          <div className="flex items-center gap-1 mb-1">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-dark-600">{product.rating || '4.7'}</span>
          </div>

          {/* Product Name */}
          <h3 className="text-xs font-semibold text-dark-900 line-clamp-2 mb-2 leading-snug">
            {product.name?.ru || product.name}
          </h3>

          {/* Price Section */}
          <div className="mt-auto">
            {product.hasDiscount && product.price && (
              <div className="text-dark-400 text-xs line-through mb-0.5">
                {product.price.toLocaleString()} сум
              </div>
            )}
            <div className="text-emerald-500 text-sm font-bold">
              {(product.finalPrice || product.price).toLocaleString()} сум
            </div>
          </div>
        </div>
      </Link>

      {/* Action Button - White with border */}
      <div className="px-4 pb-4">
        <button
          onClick={(e) => {
            e.preventDefault()
            onAdd(product)
          }}
          className="w-full bg-white border border-dark-200 text-dark-700 font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-dark-50 hover:border-dark-300 transition-all duration-200"
        >
          <ShoppingCart size={16} />
          <span className="text-sm">В корзину</span>
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────
export default function Home() {
  const { addItem } = useCart()
  const [reviewIdx, setReviewIdx] = useState(0)
  const scrollRef = useRef(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [saleSlide, setSaleSlide] = useState(0)
  const autoSlideInterval = useRef(null)
  const saleAutoSlideInterval = useRef(null)
  const reviewAutoSlideInterval = useRef(null)

  const handleAddToCart = useCallback((product) => {
    addItem({ _id: product._id, name: product.name?.ru || product.name, finalPrice: product.finalPrice || product.price, images: product.images || [] })
  }, [addItem])

  // Auto-slide carousel for popular products
  const productsToShow = mockProducts.slice(0, 8)
  const itemsPerView = 4
  const maxSlide = Math.max(0, productsToShow.length - itemsPerView)

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev >= maxSlide ? 0 : prev + 1))
  }, [maxSlide])

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev <= 0 ? maxSlide : prev - 1))
  }, [maxSlide])

  useEffect(() => {
    autoSlideInterval.current = setInterval(nextSlide, 4000)
    return () => {
      if (autoSlideInterval.current) clearInterval(autoSlideInterval.current)
    }
  }, [nextSlide])

  // Auto-slide carousel for sale section
  const saleProducts = mockProducts.filter(p => p.hasDiscount)
  const saleItemsPerView = 4
  const maxSaleSlide = Math.max(0, saleProducts.length - saleItemsPerView)

  const nextSaleSlide = useCallback(() => {
    setSaleSlide(prev => (prev >= maxSaleSlide ? 0 : prev + 1))
  }, [maxSaleSlide])

  const prevSaleSlide = useCallback(() => {
    setSaleSlide(prev => (prev <= 0 ? maxSaleSlide : prev - 1))
  }, [maxSaleSlide])

  const handleSaleManualNav = useCallback((direction) => {
    if (saleAutoSlideInterval.current) {
      clearInterval(saleAutoSlideInterval.current)
    }
    if (direction === 'next') nextSaleSlide()
    else prevSaleSlide()
    saleAutoSlideInterval.current = setInterval(nextSaleSlide, 4000)
  }, [nextSaleSlide, prevSaleSlide])

  useEffect(() => {
    saleAutoSlideInterval.current = setInterval(nextSaleSlide, 4000)
    return () => {
      if (saleAutoSlideInterval.current) clearInterval(saleAutoSlideInterval.current)
    }
  }, [nextSaleSlide])

  const maxReviewIdx = Math.max(0, reviews.length - 4)

  const nextReviewSlide = useCallback(() => {
    setReviewIdx(prev => (prev >= maxReviewIdx ? 0 : prev + 1))
  }, [maxReviewIdx])

  const pauseReviewAutoSlide = useCallback(() => {
    if (reviewAutoSlideInterval.current) {
      clearInterval(reviewAutoSlideInterval.current)
      reviewAutoSlideInterval.current = null
    }
  }, [])

  const resumeReviewAutoSlide = useCallback(() => {
    if (!reviewAutoSlideInterval.current) {
      reviewAutoSlideInterval.current = setInterval(nextReviewSlide, 4000)
    }
  }, [nextReviewSlide])

  useEffect(() => {
    reviewAutoSlideInterval.current = setInterval(nextReviewSlide, 4000)
    return () => {
      if (reviewAutoSlideInterval.current) clearInterval(reviewAutoSlideInterval.current)
    }
  }, [nextReviewSlide])

  const handleManualNav = useCallback((direction) => {
    if (autoSlideInterval.current) clearInterval(autoSlideInterval.current)
    if (direction === 'next') nextSlide()
    else prevSlide()
    autoSlideInterval.current = setInterval(nextSlide, 4000)
  }, [nextSlide, prevSlide])

  // Fade-in refs for sections
  const heroRef = useFadeIn()
  const catRef = useFadeIn()
  const prodRef = useFadeIn()
  const advRef = useFadeIn()
  const saleRef = useFadeIn()
  const aboutRef = useFadeIn()
  const reviewRef = useFadeIn()
  const ctaRef = useFadeIn()

  // Hero image carousel
  const heroImages = [heroBg1, heroBg2, heroBg3, heroBg4]
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Auto-rotate images every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-light-50">
      <Header />

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="fade-in-section visible relative w-full h-screen flex items-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50">
        {/* Floating Decorative Icons */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block">
          {/* Left Side - Top */}
          <div className="absolute top-1/4 left-8 w-16 h-16 rounded-full bg-gradient-to-br from-accent-orange to-amber-600 flex items-center justify-center shadow-lg animate-float">
            <Paintbrush size={28} className="text-white" strokeWidth={2} />
          </div>
          {/* Left Side - Middle */}
          <div className="absolute top-1/2 left-12 w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-lg" style={{ animationDelay: '0.5s' }}>
            <Wrench size={32} className="text-white" strokeWidth={2} />
          </div>
          {/* Left Side - Bottom */}
          <div className="absolute bottom-24 left-16 w-18 h-18 rounded-full bg-gradient-to-br from-accent-blue to-blue-600 flex items-center justify-center shadow-lg animate-float" style={{ animationDelay: '1s' }}>
            <Zap size={30} className="text-white" strokeWidth={2} />
          </div>
          {/* Right Side - Middle */}
          <div className="absolute top-1/2 right-12 w-16 h-16 rounded-full bg-gradient-to-br from-accent-green to-green-600 flex items-center justify-center shadow-lg" style={{ animationDelay: '1.5s' }}>
            <Droplets size={28} className="text-white" strokeWidth={2} />
          </div>
          {/* Right Side - Bottom */}
          <div className="absolute bottom-32 right-20 w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center shadow-lg animate-float" style={{ animationDelay: '2s' }}>
            <Lightbulb size={32} className="text-white" strokeWidth={2} />
          </div>
          {/* Bottom Center-Right */}
          <div className="absolute bottom-20 right-1/3 w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-secondary-600 flex items-center justify-center shadow-lg" style={{ animationDelay: '2.5s' }}>
            <Hammer size={28} className="text-white" strokeWidth={2} />
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div>
              <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-dark-900 leading-[0.95] mb-5 tracking-tight">
                Всё для стройки и ремонта <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">в одном месте</span>
              </h1>
              <p className="text-dark-600 text-base md:text-lg mb-8 max-w-xl leading-relaxed font-medium">
                Профессиональные инструменты, материалы и сантехника с доставкой по всему Узбекистану
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/catalog" className="btn-primary text-base px-8 py-3.5 rounded-3xl hover:scale-105 transition-transform">
                  Перейти в каталог <ArrowRight size={18} className="ml-1" />
                </Link>
                <Link to="/about" className="btn-ghost text-base px-8 py-3.5 rounded-3xl hover:scale-105 transition-transform">
                  О нас
                </Link>
              </div>
            </div>

            {/* Right: Image Carousel */}
            <div className="hidden lg:block relative">
              <div className="relative h-[500px] flex items-center justify-center">
                {heroImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`СтройМаркет ${index + 1}`}
                    className={`absolute w-full h-auto object-contain transition-all duration-1000 ${index === currentImageIndex
                      ? 'opacity-100 scale-100 translate-x-0'
                      : index === (currentImageIndex - 1 + heroImages.length) % heroImages.length
                        ? 'opacity-0 scale-95 -translate-x-10'
                        : 'opacity-0 scale-95 translate-x-10'
                      }`}
                  />
                ))}
              </div>
              {/* Carousel Indicators - Hidden */}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ POPULAR CATEGORIES ═══ */}
      <section ref={catRef} className="fade-in-section py-16 md:py-20 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl text-dark-900 font-bold">Популярные категории</h2>
              <p className="text-dark-600 text-sm mt-2">Выбирайте нужную категорию товаров</p>
            </div>
            <Link to="/catalog" className="hidden sm:flex items-center gap-2 px-6 py-3 border-2 border-dark-200 rounded-3xl text-dark-700 text-sm font-semibold hover:border-primary hover:text-primary transition-all">
              Все товары
            </Link>
          </div>

          {/* Categories Grid - 2 rows of 4 - High Level UI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {categories.map(({ id, name, Icon, count }) => (
              <Link
                key={id}
                to={`/catalog?category=${id}`}
                className="group relative flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-dark-200 bg-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-primary"
                style={{ aspectRatio: '1 / 1.1' }}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-light-100 group-hover:bg-primary-50 group-hover:shadow-md transition-all duration-300 mb-3">
                  <Icon size={24} className="text-dark-600 group-hover:text-primary transition-colors" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col items-center">
                  <h3 className="text-dark-900 text-xs sm:text-sm font-bold text-center whitespace-nowrap">{name}</h3>
                  <span className="text-dark-400 text-[10px] sm:text-xs font-medium mt-1">{count} товаров</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ POPULAR PRODUCTS ═══ */}
      <section ref={prodRef} className="fade-in-section py-16 md:py-20 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl text-dark-900 font-bold">Популярные товары</h2>
              <p className="text-dark-600 text-sm mt-2">Лучшие предложения месяца</p>
            </div>
            <Link to="/catalog" className="hidden sm:flex items-center gap-2 px-6 py-3 border-2 border-dark-200 rounded-3xl text-dark-700 text-sm font-semibold hover:border-primary hover:text-primary transition-all">
              Все товары
            </Link>
          </div>

          {/* 4 Column Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {productsToShow.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} onAdd={handleAddToCart} />
            ))}
          </div>

          <Link to="/catalog" className="lg:hidden flex items-center justify-center gap-2 mt-8 text-primary text-sm font-bold">
            Все товары <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ═══ ADVANTAGES ═══ */}
      <section ref={advRef} className="fade-in-section py-16 md:py-20 bg-white border-y border-dark-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-3">Наши преимущества</h2>
          <p className="section-subtitle text-center mb-12">Почему выбирают нас</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {advantages.map(({ Icon, title, desc }, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-br from-light-50 to-white border border-dark-100 hover:shadow-soft transition-all duration-300 group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-all shadow-soft">
                  <Icon size={28} className="text-white" />
                </div>
                <h3 className="text-dark-900 font-bold text-base mb-2">{title}</h3>
                <p className="text-dark-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SALE SECTION ═══ */}
      <section ref={saleRef} className="fade-in-section py-16 md:py-24 relative overflow-hidden bg-gradient-to-br from-secondary-50 via-light-50 to-primary-50">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5" />
        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="inline-block bg-gradient-to-r from-secondary to-secondary-600 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-3 shadow-soft">🔥 СКИДКИ</span>
              <h2 className="section-title">Спец предложение</h2>
            </div>
            <Link to="/catalog?sale=true" className="hidden sm:flex items-center gap-2 text-primary text-sm font-bold hover:gap-3 transition-all">
              Все товары <ArrowRight size={16} />
            </Link>
          </div>

          {/* Desktop Carousel */}
          <div className="hidden lg:block relative">
            <div className="overflow-hidden">
              <div
                className="flex gap-5 transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${saleSlide * (100 / saleItemsPerView)}%)` }}
              >
                {saleProducts.map((product) => (
                  <div key={product._id} className="flex-shrink-0" style={{ width: `calc(${100 / saleItemsPerView}% - ${(5 * (saleItemsPerView - 1)) / saleItemsPerView}px)` }}>
                    <ProductCard product={product} onAdd={handleAddToCart} />
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={() => handleSaleManualNav('prev')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-white shadow-lg border border-dark-200 flex items-center justify-center text-dark-700 hover:text-primary hover:border-primary hover:shadow-xl transition-all z-10 group"
            >
              <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => handleSaleManualNav('next')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-white shadow-lg border border-dark-200 flex items-center justify-center text-dark-700 hover:text-primary hover:border-primary hover:shadow-xl transition-all z-10 group"
            >
              <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Slide Indicators */}
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: maxSaleSlide + 1 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSaleSlide(idx)}
                  className={`h-2 rounded-full transition-all ${idx === saleSlide
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-dark-300 hover:bg-dark-400'
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Mobile/Tablet Grid */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {saleProducts.slice(0, 6).map((product) => (
              <ProductCard key={product._id} product={product} onAdd={handleAddToCart} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ABOUT COMPANY ═══ */}
      <section ref={aboutRef} className="fade-in-section py-16 md:py-24 bg-white overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[2rem] border border-primary-100 bg-gradient-to-br from-white via-primary-50/40 to-secondary-50/30 p-6 md:p-8 lg:p-10 shadow-[0_20px_80px_rgba(59,130,246,0.08)]">
            <div className="absolute -top-20 -right-16 w-56 h-56 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-16 w-56 h-56 bg-secondary/10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-12 items-center">
              <div>
                <span className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-primary/20 mb-5">
                  О компании
                </span>

                <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl text-dark-900 font-bold leading-tight mb-5 max-w-2xl">
                  СтройМаркет — надёжный партнёр для ремонта и строительства
                </h2>

                <p className="text-dark-600 text-sm md:text-base leading-7 mb-4 max-w-2xl">
                  СтройМаркет — один из ведущих поставщиков строительных материалов в Узбекистане. Мы работаем с 2010 года и за это время заслужили доверие тысяч клиентов.
                </p>
                <p className="text-dark-600 text-sm md:text-base leading-7 mb-8 max-w-2xl">
                  Наш ассортимент включает более 10 000 наименований товаров от ведущих мировых производителей. Мы гарантируем качество каждого товара и обеспечиваем быструю доставку по всей стране.
                </p>

                <div className="flex flex-wrap gap-3 mb-8">
                  <div className="px-4 py-2 rounded-full bg-white border border-dark-100 text-dark-700 text-sm font-semibold shadow-sm">
                    Сертифицированные товары
                  </div>
                  <div className="px-4 py-2 rounded-full bg-white border border-dark-100 text-dark-700 text-sm font-semibold shadow-sm">
                    Официальные поставщики
                  </div>
                  <div className="px-4 py-2 rounded-full bg-white border border-dark-100 text-dark-700 text-sm font-semibold shadow-sm">
                    Доставка по Узбекистану
                  </div>
                </div>

                <Link to="/about" className="group inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-600 text-white text-sm md:text-base font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300">
                  <span>Узнать больше</span>
                  <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                    <ArrowRight size={16} />
                  </span>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-5">
                {[
                  { value: '16', suffix: '+', label: 'лет на рынке' },
                  { value: '10', suffix: 'K+', label: 'товаров' },
                  { value: '24', suffix: '/7', label: 'поддержка' },
                  { value: '50', suffix: 'K+', label: 'довольных клиентов' },
                ].map((stat, i) => (
                  <div key={i} className="group rounded-[1.75rem] border border-white/80 bg-white/85 backdrop-blur-sm p-6 md:p-8 text-center shadow-[0_12px_40px_rgba(15,23,42,0.06)] hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(59,130,246,0.16)] transition-all duration-300">
                    <div className="font-heading font-black text-4xl md:text-5xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3 group-hover:scale-105 transition-transform duration-300">
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                    </div>
                    <p className="text-dark-600 text-sm md:text-base font-semibold">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ REVIEWS ═══ */}
      <section ref={reviewRef} className="fade-in-section py-16 md:py-24 bg-gradient-to-b from-light-50 to-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-3">Отзывы наших клиентов</h2>
          <p className="section-subtitle text-center mb-12">Нам доверяют тысячи людей по всему Узбекистану</p>

          <div className="relative" onMouseEnter={pauseReviewAutoSlide} onMouseLeave={resumeReviewAutoSlide}>
            <div className="hidden lg:block overflow-hidden">
              <div
                className="flex gap-5 transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${reviewIdx * 25}%)` }}
              >
                {reviews.map((review) => (
                  <div key={review.id} className="w-1/4 flex-shrink-0">
                    <div className="bg-white border border-dark-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-hover h-full">
                      <div className="flex items-center gap-1 mb-4">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} size={14} className={s < review.rating ? 'text-accent-orange fill-accent-orange' : 'text-dark-200'} />
                        ))}
                      </div>
                      <p className="text-dark-700 text-sm leading-relaxed mb-5 line-clamp-3">{review.text}</p>
                      <div>
                        <p className="text-dark-900 text-sm font-bold">{review.author}</p>
                        <p className="text-dark-500 text-xs mt-0.5">{review.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:hidden">
              {reviews.slice(0, 4).map((review) => (
                <div key={review.id} className="bg-white border border-dark-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-hover">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={14} className={s < review.rating ? 'text-accent-orange fill-accent-orange' : 'text-dark-200'} />
                    ))}
                  </div>
                  <p className="text-dark-700 text-sm leading-relaxed mb-5 line-clamp-3">{review.text}</p>
                  <div>
                    <p className="text-dark-900 text-sm font-bold">{review.author}</p>
                    <p className="text-dark-500 text-xs mt-0.5">{review.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA BANNER ═══ */}
      <section ref={ctaRef} className="fade-in-section">
        <div className="bg-gradient-to-r from-primary via-primary-600 to-secondary py-14 md:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.08),transparent_50%)]" />
          <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-heading text-3xl md:text-5xl text-white tracking-tight mb-4 font-bold">
              Не нашли нужный товар?
            </h2>
            <p className="text-white/90 text-sm md:text-base mb-8 max-w-xl mx-auto font-medium">
              Свяжитесь с нами, и наши специалисты помогут подобрать именно то, что вам нужно
            </p>
            <Link to="/contacts" className="btn-white text-base px-10 py-4 inline-block shadow-hover">
              Связаться с нами
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
