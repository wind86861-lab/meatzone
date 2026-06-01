import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TopBar, SearchBar } from '../components/layout/TopBar'
import BottomNav from '../components/layout/BottomNav'
import { ProductCardH, PromoCard } from '../components/ui/ProductCard'
import { SectionHeader, Skeleton } from '../components/ui'
import { productsAPI, categoriesAPI, bannersAPI } from '../services/api'
import { useLangStore } from '../store/langStore'
import { t } from '../utils/i18n'
import { haptic, cn } from '../utils/format'

const EMOJI_MAP = {
  beef: '🥩', mutton: '🐑', chicken: '🍗', sausage: '🌭', ready: '🥘', frozen: '❄️',
}

function adaptProduct(p) {
  const name = typeof p.name === 'string' ? p.name : (p.name?.uz || p.name?.ru || p.name?.en || 'Mahsulot')
  const meta = ''
  const finalPrice = p.finalPrice ?? p.price
  const hasDiscount = finalPrice < p.price
  const badge = hasDiscount
    ? { tone: 'red', label: `−${Math.round((1 - finalPrice / p.price) * 100)}%` }
    : (p.isFeatured ? { tone: 'green', label: 'HIT' } : null)
  return {
    id: p._id || p.id,
    name,
    meta,
    emoji: EMOJI_MAP[p.category?.slug || p.cat] || '🥩',
    price: finalPrice,
    old: hasDiscount ? p.price : null,
    cat: String(p.category?._id || p.category || p.cat || ''),
    badge,
    rating: p.rating || 4.5,
    reviews: p.reviews || 12,
    desc: typeof p.description === 'string' ? p.description : (p.description?.uz || p.description?.ru || p.description?.en || ''),
    images: p.images || [],
  }
}

function adaptCategory(c) {
  return {
    id: String(c._id || c.id || ''),
    label: typeof c.name === 'string' ? c.name : (c.name?.uz || c.name?.ru || c.name?.en || 'Kategoriya'),
    emoji: EMOJI_MAP[c.slug] || '🥩',
    image: c.image || '',
    count: c.count || 0,
    gradient: 'from-[#1A0A0A] to-[#2D1510]',
    parentId: c.parent ? String(c.parent?._id || c.parent) : null,
  }
}

// Get all descendant category IDs (parent + all subcategories recursively)
function getDescendantIds(catId, allCats, visited = new Set()) {
  if (visited.has(catId)) return []
  visited.add(catId)
  const ids = [catId]
  const children = allCats.filter(c => c.parentId === catId)
  for (const child of children) {
    ids.push(...getDescendantIds(child.id, allCats, visited))
  }
  return ids
}

function adaptBanner(b) {
  return {
    id: b._id,
    tag: b.tag || 'Taklif',
    title: b.title || '',
    sub: b.subtitle || '',
    emoji: b.emoji || '🥩',
    variant: b.variant || 'red',
    image: b.image || '',
    link: b.link || '/catalog',
  }
}

function CategoryCard({ category, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full h-[92px] rounded-2xl overflow-hidden text-left tap shadow-sm',
        'transition-transform duration-200 active:scale-[0.97] ring-1 ring-inset',
        active ? 'ring-2 ring-primary' : 'ring-white/10'
      )}
    >
      {category.image ? (
        <img
          src={category.image}
          alt={category.label}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className={cn('absolute inset-0 bg-gradient-to-br flex items-center justify-center text-[42px]', category.gradient)}>
          {category.emoji}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <div className="text-white text-[12.5px] font-extrabold leading-[1.15] line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.75)]">
          {category.label}
        </div>
      </div>
    </button>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { lang } = useLangStore()
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('all')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      categoriesAPI.getAll({ parent: 'null' }).then(r => r.data),
      productsAPI.getAll({ limit: 20 }).then(r => r.data),
      bannersAPI.getAll().then(r => r.data).catch(() => []),
    ]).then(([catsRes, prodsRes, bannersRes]) => {
      if (!mounted) return
      setCategories((Array.isArray(catsRes) ? catsRes : (catsRes.categories || [])).map(adaptCategory))
      setProducts((prodsRes.products || []).map(adaptProduct))
      setBanners((bannersRes || []).map(adaptBanner))
      setLoading(false)
    }).catch(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  const allowedIds = cat === 'all' ? null : getDescendantIds(cat, categories)
  const filtered = products.filter(p =>
    (cat === 'all' || allowedIds.includes(p.cat)) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const picks = products.filter(p => p.rating >= 4.8).slice(0, 5)

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg pb-20">
      <TopBar variant="home">
        <SearchBar value={search} onChange={e => setSearch(e.target.value)} />
      </TopBar>

      {/* Promos */}
      <div className="px-4 pt-4 pb-1">
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
          {banners.length > 0 ? banners.map(p => (
            <div key={p.id} className="snap-start" onClick={() => { haptic('light'); const link = p.link || '/catalog'; if (/^https?:\/\//i.test(link)) window.location.href = link; else navigate(link) }}>
              <PromoCard promo={p} />
            </div>
          )) : (
            <div className="flex gap-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="w-[200px] h-[120px] rounded-xl shrink-0" />)}
            </div>
          )}
        </div>
      </div>

      {/* Categories — top 6, static grid */}
      <SectionHeader title={t(lang, 'home.categories')} action={t(lang, 'home.all')} onAction={() => navigate('/catalog')} />
      <div className="px-4 grid grid-cols-3 gap-2.5 mb-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[92px] rounded-2xl" />)
          : categories.slice(0, 6).map(c => (
              <CategoryCard key={c.id} category={c} onClick={() => { haptic('light'); navigate(`/catalog?category=${c.id}`) }} />
            ))}
      </div>

      {/* Top picks horizontal scroll */}
      <SectionHeader title={t(lang, 'home.topProducts')} action={t(lang, 'home.all')} onAction={() => navigate('/catalog')} />
      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 pb-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-[164px] h-[220px] rounded-xl shrink-0" />) :
          picks.map(p => (
            <div key={p.id} className="snap-start" onClick={() => navigate(`/product/${p.id}`)}>
              <ProductCardH product={p} />
            </div>
          ))}
      </div>

      {/* Featured / Quick picks grid */}
      <SectionHeader title={t(lang, 'home.forYou')} />
      <div className="px-4 grid grid-cols-2 gap-3 pb-6">
        {loading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-xl" />) :
          filtered.slice(0, 6).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/product/${p.id}`)}
            >
              <ProductCardH product={p} />
            </motion.div>
          ))}
      </div>

      <BottomNav />
    </div>
  )
}
