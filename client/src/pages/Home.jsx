import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TopBar, SearchBar } from '../components/layout/TopBar'
import BottomNav from '../components/layout/BottomNav'
import { ProductCardH, CategoryTile, PromoCard } from '../components/ui/ProductCard'
import { SectionHeader, Skeleton } from '../components/ui'
import { productsAPI, categoriesAPI } from '../services/api'
import { haptic } from '../utils/format'

const PROMOS = [
  { id: 1, tag: 'Bugungi taklif', title: "Mol go'shti\n−15%", sub: 'Cheklangan miqdorda', emoji: '🥩', variant: 'red' },
  { id: 2, tag: 'Yetkazish', title: 'Bepul\nyetkazish', sub: "100 000 so'mdan", emoji: '🚚', variant: 'dark' },
  { id: 3, tag: 'Haftalik taklif', title: 'Kolbasa\n−20%', sub: 'Shanba–yakshanba', emoji: '🌭', variant: 'amber' },
]

const EMOJI_MAP = {
  beef: '🥩', mutton: '🐑', chicken: '🍗', sausage: '🌭', ready: '🥘', frozen: '❄️',
}

function adaptProduct(p) {
  const name = typeof p.name === 'string' ? p.name : (p.name?.uz || p.name?.ru || p.name?.en || 'Mahsulot')
  const meta = p.stock ? `${p.stock} ta qoldi` : ''
  const badge = p.discountPrice && p.price > p.discountPrice
    ? { tone: 'red', label: `−${Math.round((1 - p.discountPrice / p.price) * 100)}%` }
    : (p.isFeatured ? { tone: 'green', label: 'HIT' } : null)
  return {
    id: p._id || p.id,
    name,
    meta,
    emoji: EMOJI_MAP[p.category?.slug || p.cat] || '🥩',
    price: p.discountPrice || p.price,
    old: p.discountPrice ? p.price : null,
    cat: p.category?.slug || p.cat,
    badge,
    rating: p.rating || 4.5,
    reviews: p.reviews || 12,
    desc: typeof p.description === 'string' ? p.description : (p.description?.uz || p.description?.ru || p.description?.en || ''),
  }
}

function adaptCategory(c) {
  return {
    id: c.slug || c._id || c.id,
    label: typeof c.name === 'string' ? c.name : (c.name?.uz || c.name?.ru || c.name?.en || 'Kategoriya'),
    emoji: EMOJI_MAP[c.slug] || '🥩',
    count: c.count || 0,
    gradient: 'from-[#1A0A0A] to-[#2D1510]',
  }
}

export default function Home() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('all')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      categoriesAPI.getAll().then(r => r.data),
      productsAPI.getAll({ limit: 20 }).then(r => r.data),
    ]).then(([catsRes, prodsRes]) => {
      if (!mounted) return
      setCategories((catsRes.categories || []).map(adaptCategory))
      setProducts((prodsRes.products || []).map(adaptProduct))
      setLoading(false)
    }).catch(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  const filtered = products.filter(p =>
    (cat === 'all' || p.cat === cat) &&
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
          {PROMOS.map(p => (
            <div key={p.id} className="snap-start" onClick={() => { haptic('light'); navigate('/catalog') }}>
              <PromoCard promo={p} />
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <SectionHeader title="Kategoriyalar" />
      <div className="px-4 grid grid-cols-3 gap-2.5 mb-1">
        <CategoryTile category={{ id: 'all', label: 'Barchasi', emoji: '🥩', count: products.length, gradient: 'from-[#1A0A0A] to-[#2D1510]' }}
          active={cat === 'all'} onClick={() => { haptic('light'); setCat('all') }} />
        {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="aspect-[1/1.1] rounded-md" />) :
          categories.map(c => (
            <CategoryTile key={c.id} category={c} active={cat === c.id} onClick={() => { haptic('light'); setCat(c.id) }} />
          ))}
      </div>

      {/* Top picks horizontal scroll */}
      <SectionHeader title="Top mahsulotlar" action="Barchasi" onAction={() => navigate('/catalog')} />
      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 pb-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-[164px] h-[220px] rounded-xl shrink-0" />) :
          picks.map(p => (
            <div key={p.id} className="snap-start" onClick={() => navigate(`/product/${p.id}`)}>
              <ProductCardH product={p} />
            </div>
          ))}
      </div>

      {/* Featured / Quick picks grid */}
      <SectionHeader title="Siz uchun" />
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
