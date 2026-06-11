import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TopBar } from '../components/layout/TopBar'
import BottomNav from '../components/layout/BottomNav'
import { ProductCardV } from '../components/ui/ProductCard'
import { Skeleton } from '../components/ui'
import { productsAPI, categoriesAPI } from '../services/api'
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
    unit: p.unit || 'pcs',
  }
}

function adaptCategory(c) {
  return {
    id: String(c._id || c.id || ''),
    label: typeof c.name === 'string' ? c.name : (c.name?.uz || c.name?.ru || c.name?.en || 'Kategoriya'),
    emoji: EMOJI_MAP[c.slug] || '🥩',
    image: c.image || '',
    count: c.count || 0,
    parentId: c.parent ? String(c.parent?._id || c.parent) : null,
  }
}

function CategoryAvatar({ category, active, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 w-[68px] shrink-0 tap">
      <div className={cn(
        'w-[60px] h-[60px] rounded-2xl overflow-hidden ring-2 transition-all',
        active ? 'ring-primary shadow-md scale-105' : 'ring-ink-line'
      )}>
        {category.image
          ? <img src={category.image} alt={category.label} loading="lazy" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-[#2A0E0E] to-[#140707]">{category.emoji}</div>}
      </div>
      <span className={cn('text-[10px] leading-tight text-center line-clamp-2', active ? 'text-primary font-bold' : 'text-ink-dim font-medium')}>
        {category.label}
      </span>
    </button>
  )
}

function SubChip({ category, active, onClick }) {
  return (
    <button onClick={onClick} className={cn(
      'flex items-center gap-1.5 shrink-0 py-1 pr-3 rounded-full border transition-colors tap',
      category.image ? 'pl-1' : 'pl-3',
      active ? 'bg-primary text-white border-primary' : 'bg-bg-surface text-ink-dim border-ink-line'
    )}>
      {category.image && (
        <img src={category.image} alt="" loading="lazy" className="w-6 h-6 rounded-full object-cover" />
      )}
      <span className="text-xs font-semibold whitespace-nowrap">{category.label}</span>
    </button>
  )
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

export default function Catalog() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { lang } = useLangStore()
  const [cat, setCat] = useState('all')
  const [sort, setSort] = useState('popular')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      categoriesAPI.getAll().then(r => r.data),
      productsAPI.getAll({ limit: 1000, active: 'true' }).then(r => r.data),
    ]).then(([catsRes, prodsRes]) => {
      if (!mounted) return
      setCategories((Array.isArray(catsRes) ? catsRes : (catsRes.categories || [])).map(adaptCategory))
      setProducts((prodsRes.products || []).map(adaptProduct))
      setLoading(false)

      // Set category from URL if provided
      const categoryParam = searchParams.get('category')
      if (categoryParam) {
        setCat(categoryParam)
      }
    }).catch(() => setLoading(false))
    return () => { mounted = false }
  }, [searchParams])

  const allowedIds = cat === 'all' ? null : getDescendantIds(cat, categories)
  const filtered = products.filter(p => cat === 'all' || allowedIds.includes(p.cat))
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'price_asc') return a.price - b.price
    if (sort === 'price_desc') return b.price - a.price
    return b.rating - a.rating
  })

  // Category drill-down: top-level avatars + subcategories of the active parent
  const topCats = categories.filter(c => !c.parentId)
  const selectedCat = categories.find(c => c.id === cat)
  const activeParent = cat === 'all' ? null : (selectedCat?.parentId || cat)
  const subCats = activeParent ? categories.filter(c => c.parentId === activeParent) : []

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg pb-20">
      <TopBar variant="catalog" title={t(lang, 'catalog.title')} />

      {/* Top-level category avatars (with images) */}
      <div className="px-4 pt-3 flex gap-3 overflow-x-auto no-scrollbar pb-2">
        <CategoryAvatar
          category={{ id: 'all', label: t(lang, 'catalog.all'), emoji: '🥩', image: '' }}
          active={cat === 'all'}
          onClick={() => { haptic('light'); setCat('all') }}
        />
        {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-[60px] h-[78px] rounded-2xl shrink-0" />) :
          topCats.map(c => (
            <CategoryAvatar
              key={c.id}
              category={c}
              active={cat === c.id || activeParent === c.id}
              onClick={() => { haptic('light'); setCat(c.id) }}
            />
          ))}
      </div>

      {/* Subcategories of the selected category */}
      {subCats.length > 0 && (
        <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <SubChip
            category={{ id: activeParent, label: t(lang, 'catalog.all'), image: '' }}
            active={cat === activeParent}
            onClick={() => { haptic('light'); setCat(activeParent) }}
          />
          {subCats.map(s => (
            <SubChip key={s.id} category={s} active={cat === s.id} onClick={() => { haptic('light'); setCat(s.id) }} />
          ))}
        </div>
      )}

      {/* Sort + count */}
      <div className="px-4 pt-1 pb-2 flex items-center justify-between">
        <div className="text-xs text-ink-dim font-medium">{sorted.length} {t(lang, 'catalog.count')}</div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="bg-bg-surface border border-ink-line rounded-md px-2 h-8 text-xs text-ink font-medium"
        >
          <option value="popular">{t(lang, 'catalog.popular')}</option>
          <option value="price_asc">{t(lang, 'catalog.sortPriceAsc')}</option>
          <option value="price_desc">{t(lang, 'catalog.sortPriceDesc')}</option>
        </select>
      </div>

      {/* Grid */}
      <div className="px-4 grid grid-cols-2 gap-3 flex-1 pb-6">
        {loading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-xl" />) :
          sorted.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(`/product/${p.id}`)}
            >
              <ProductCardV product={p} />
            </motion.div>
          ))}
      </div>

      {!loading && sorted.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-ink-dim text-sm py-12">
          <div className="text-4xl mb-2">🔍</div>
          <div>{t(lang, 'catalog.empty')}</div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
