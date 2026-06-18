import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ShoppingCart, Star, Minus, Plus, Heart } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Button, Badge, Chip, Skeleton } from '../components/ui'
import { productsAPI } from '../services/api'
import { useCart } from '../store/cartStore'
import { useToastStore } from '../store/toastStore'
import { useLangStore } from '../store/langStore'
import { t } from '../utils/i18n'
import { formatSum, haptic, cn } from '../utils/format'

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
    cat: p.category?.slug || p.cat,
    badge,
    rating: p.rating || 4.5,
    reviews: p.reviews || 12,
    desc: typeof p.description === 'string' ? p.description : (p.description?.uz || p.description?.ru || p.description?.en || ''),
    images: p.images || [],
    unit: p.unit || 'pcs',
  }
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const add = useCart(s => s.add)
  const showToast = useToastStore(s => s.show)
  const { lang } = useLangStore()
  const [qty, setQty] = useState(1)
  const [liked, setLiked] = useState(false)
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setQty(1) // Reset quantity to 1 when product changes
    productsAPI.getById(id).then(res => {
      if (!mounted) return
      const p = adaptProduct(res.data)
      setProduct(p)
      setQty(p.unit === 'kg' ? 1000 : 1) // kg → grams, pcs → pieces
      // Fetch related
      productsAPI.getAll({ limit: 16 }).then(r => {
        if (!mounted) return
        const prods = (r.data.products || []).map(adaptProduct)
        setRelated(prods.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 8))
      })
      setLoading(false)
    }).catch(() => setLoading(false))
    return () => { mounted = false }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-bg">
        <TopBar variant="plain" title="Mahsulot" onBack={() => navigate(-1)} />
        <div className="px-4 pt-6 flex flex-col gap-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-bg">
        <TopBar variant="plain" title="Mahsulot" onBack={() => navigate(-1)} />
        <div className="flex-1 flex items-center justify-center text-ink-dim">Mahsulot topilmadi</div>
      </div>
    )
  }

  const handleAdd = () => {
    add(product, qty)
    haptic('success')
    showToast(product.name, product.emoji || '🥩')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-[100dvh] flex flex-col bg-bg"
    >
      {/* Hero image area */}
      <div className="relative bg-bg-surface3 h-[40vh] flex items-center justify-center overflow-hidden">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name?.uz} className="w-full h-full object-cover" />
        ) : (
          <div className="text-[100px] drop-shadow-[0_8px_24px_rgba(0,0,0,.5)]">
            {product.emoji}
          </div>
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur border border-white/10 flex items-center justify-center text-white tap"
        >
          <ArrowLeft size={18} strokeWidth={2.4} />
        </button>
        <button
          onClick={() => { setLiked(!liked); haptic('light') }}
          className={cn(
            "absolute top-4 right-4 w-9 h-9 rounded-full backdrop-blur border flex items-center justify-center tap",
            liked ? "bg-primary border-primary text-white" : "bg-black/30 border-white/10 text-white/70"
          )}
        >
          <Heart size={16} strokeWidth={2.4} fill={liked ? "currentColor" : "none"} />
        </button>
        {product.badge && (
          <div className="absolute bottom-4 left-4">
            <Badge tone={product.badge.tone}>{product.badge.label}</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-5 pb-28">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-ink-dim font-medium capitalize">{product.cat}</span>
        </div>

        <h1 className="font-display text-3xl tracking-wide text-ink mb-2">{product.name}</h1>


        <div className="flex items-baseline gap-2 mb-5">
          <div className="font-display text-4xl text-ink tabular">{formatSum(product.price)}</div>
          <span className="text-sm text-ink-dim font-medium">/ {product.unit === 'kg' ? 'kg' : 'dona'}</span>
          {product.old && (
            <div className="text-sm text-ink-dim line-through tabular">{formatSum(product.old)}</div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-ink-dim leading-relaxed mb-6">{product.desc}</p>

        {/* Qty selector */}
        {product.unit === 'kg' ? (
          <div className="bg-bg-surface rounded-lg border border-ink-line p-3 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-ink">{lang === 'ru' ? 'Количество (граммы)' : lang === 'en' ? 'Amount (grams)' : 'Miqdor (gramm)'}</span>
              <span className="text-sm font-extrabold text-primary tabular">{qty >= 1000 ? `${(qty / 1000).toFixed(qty % 1000 === 0 ? 0 : 1)} kg` : `${qty} g`}</span>
            </div>
            <div className="flex gap-2 mb-3">
              {[500, 1000, 2000, 3000].map(g => (
                <button key={g} onClick={() => setQty(g)}
                  className={cn('flex-1 py-2 rounded-md text-xs font-bold border tap transition-colors', qty === g ? 'bg-primary text-white border-primary' : 'bg-bg-surface3 text-ink-dim border-ink-line')}>
                  {g >= 1000 ? `${g / 1000} kg` : `${g} g`}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setQty(Math.max(500, qty - 100))}
                className="w-10 h-10 rounded-md bg-bg-surface3 border border-ink-line text-ink tap flex items-center justify-center"><Minus size={16} /></button>
              <span className="min-w-[90px] text-center font-bold text-lg tabular">{qty} g</span>
              <button onClick={() => setQty(qty + 100)}
                className="w-10 h-10 rounded-md bg-bg-surface3 border border-ink-line text-ink tap flex items-center justify-center"><Plus size={16} /></button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-bg-surface rounded-lg border border-ink-line p-3 mb-6">
            <span className="text-sm font-bold text-ink">{t(lang, 'product.qty')}</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 rounded-md bg-bg-surface3 border border-ink-line text-ink text-lg tap flex items-center justify-center"><Minus size={16} /></button>
              <span className="min-w-[28px] text-center font-bold text-lg tabular">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="w-9 h-9 rounded-md bg-bg-surface3 border border-ink-line text-ink text-lg tap flex items-center justify-center"><Plus size={16} /></button>
            </div>
          </div>
        )}

        {/* Related */}
        {related.length > 0 && (
          <>
            <h3 className="font-display text-lg text-ink mb-3">{t(lang, 'product.similar')}</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pb-2">
              {related.map(r => (
                <button
                  key={r.id}
                  onClick={() => { haptic('light'); navigate(`/product/${r.id}`) }}
                  className="bg-bg-surface rounded-xl border border-ink-line p-2.5 text-left tap"
                >
                  {r.images?.[0] ? (
                    <div className="w-full aspect-square mb-2 rounded-lg overflow-hidden bg-bg-surface2 flex items-center justify-center">
                      <img src={r.images[0]} alt="" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-full aspect-square mb-2 rounded-lg bg-bg-surface2 flex items-center justify-center text-3xl">{r.emoji}</div>
                  )}
                  <div className="text-[11px] font-bold text-ink line-clamp-1">{r.name}</div>
                  <div className="text-[11px] text-ink-dim mt-0.5 tabular">{formatSum(r.price)}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-bg-surface/95 backdrop-blur-lg border-t border-ink-line px-4 py-3 pb-safe">
        <div className="max-w-[480px] mx-auto flex items-center gap-3">
          <div className="flex-1">
            <div className="text-[11px] text-ink-dim">{t(lang, 'product.total')}</div>
            <div className="font-display text-2xl text-ink tabular">{formatSum(product.unit === 'kg' ? Math.round(product.price * qty / 1000) : product.price * qty)}</div>
          </div>
          <Button variant="primary" size="lg" className="flex-[1.5] gap-2" onClick={handleAdd}>
            <ShoppingCart size={18} />
            {t(lang, 'product.addToCart')}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
