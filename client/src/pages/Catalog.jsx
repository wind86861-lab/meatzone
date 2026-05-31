import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TopBar } from '../components/layout/TopBar'
import BottomNav from '../components/layout/BottomNav'
import { ProductCardV } from '../components/ui/ProductCard'
import { Chip, Skeleton } from '../components/ui'
import { productsAPI, categoriesAPI } from '../services/api'
import { useLangStore } from '../store/langStore'
import { t } from '../utils/i18n'
import { haptic } from '../utils/format'

const EMOJI_MAP = {
  beef: '🥩', mutton: '🐑', chicken: '🍗', sausage: '🌭', ready: '🥘', frozen: '❄️',
}

function adaptProduct(p) {
  const name = typeof p.name === 'string' ? p.name : (p.name?.uz || p.name?.ru || p.name?.en || 'Mahsulot')
  const meta = p.stock ? `${p.stock} ta qoldi` : ''
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
    count: c.count || 0,
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
      productsAPI.getAll({ limit: 200 }).then(r => r.data),
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

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg pb-20">
      <TopBar variant="catalog" title={t(lang, 'catalog.title')} />

      {/* Cat chips */}
      <div className="px-4 pt-3 flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <Chip active={cat === 'all'} onClick={() => { haptic('light'); setCat('all') }}>{t(lang, 'catalog.all')}</Chip>
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />) :
          categories.map(c => (
            <Chip key={c.id} active={cat === c.id} onClick={() => { haptic('light'); setCat(c.id) }}>{c.emoji} {c.label}</Chip>
          ))}
      </div>

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
