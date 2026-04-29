import React from 'react'
import { Plus, Star, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from './index'
import { useCart } from '../../store/cartStore'
import { formatPrice, haptic, cn } from '../../utils/format'

/* Hook: returns qty in cart for a given product id */
function useCartQty(id) {
  return useCart((s) => s.items.find((i) => i.id === id)?.qty || 0)
}

/* ─────────── Horizontal product card (compact, 160px wide) ─────────── */
export function ProductCardH({ product, onClick }) {
  const add = useCart((s) => s.add)
  const qty = useCartQty(product.id)
  const handleAdd = (e) => {
    e.stopPropagation()
    add(product)
    haptic('light')
  }
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group shrink-0 w-[164px] bg-bg-surface rounded-xl overflow-hidden border border-ink-line cursor-pointer relative"
    >
      {/* Image */}
      <div className="relative h-[128px] bg-gradient-to-br from-bg-surface3 to-bg-surface2 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 stripes opacity-[0.35]" />
        <div className="absolute -inset-x-6 -bottom-6 h-12 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="text-[60px] drop-shadow-[0_8px_18px_rgba(0,0,0,.55)] translate-y-1 group-hover:scale-105 transition-transform duration-300">
          {product.emoji}
        </div>

        {/* Badge top-left */}
        {product.badge && (
          <div className="absolute top-2 left-2 z-[1]">
            <Badge tone={product.badge.tone}>{product.badge.label}</Badge>
          </div>
        )}

        {/* Rating chip top-right */}
        {product.rating && (
          <div className="absolute top-2 right-2 z-[1] flex items-center gap-0.5 bg-black/55 backdrop-blur-sm border border-white/10 rounded-md px-1.5 h-5 text-[10px] font-bold text-white">
            <Star size={9} className="fill-amber text-amber" strokeWidth={0} />
            {product.rating}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-2.5 pt-2">
        <div className="text-[12px] font-bold text-ink mb-0.5 line-clamp-1 leading-tight">{product.name}</div>
        <div className="text-[10px] text-ink-mute font-medium mb-2 line-clamp-1">{product.meta}</div>

        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            {product.old && (
              <div className="text-[9px] text-ink-mute line-through tabular leading-none">
                {formatPrice(product.old)}
              </div>
            )}
            <div className="font-display text-[18px] text-ink tabular leading-none mt-1 truncate">
              {formatPrice(product.price)}
              <span className="font-body text-[9px] text-ink-mute font-semibold ml-0.5">so'm</span>
            </div>
          </div>

          <AddButton qty={qty} onClick={handleAdd} compact />
        </div>
      </div>
    </motion.div>
  )
}

/* ─────────── Vertical product card (grid, premium) ─────────── */
export function ProductCardV({ product, onClick }) {
  const add = useCart((s) => s.add)
  const qty = useCartQty(product.id)
  const handleAdd = (e) => {
    e.stopPropagation()
    add(product)
    haptic('light')
  }

  const discount = product.old ? Math.round((1 - product.price / product.old) * 100) : null

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative bg-bg-surface rounded-xl overflow-hidden border border-ink-line cursor-pointer transition-shadow hover:shadow-card"
    >
      {/* Hero image area */}
      <div className="relative aspect-[4/3.4] bg-gradient-to-br from-bg-surface3 to-bg-surface2 overflow-hidden">
        {/* Pattern */}
        <div className="absolute inset-0 stripes opacity-[0.4]" />
        {/* Bottom darken for badge legibility */}
        <div className="absolute -inset-x-6 -bottom-6 h-16 bg-gradient-to-t from-black/45 to-transparent" />

        {/* Emoji as product art */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            whileHover={{ scale: 1.06, rotate: -3 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-[68px] drop-shadow-[0_10px_24px_rgba(0,0,0,.55)] translate-y-1"
          >
            {product.emoji}
          </motion.div>
        </div>

        {/* Badge — top-left */}
        {product.badge && (
          <div className="absolute top-2.5 left-2.5 z-[1]">
            <Badge tone={product.badge.tone}>{product.badge.label}</Badge>
          </div>
        )}

        {/* Discount pill — bottom-left over image when no badge */}
        {!product.badge && discount && (
          <div className="absolute top-2.5 left-2.5 z-[1] bg-primary text-white text-[10px] font-extrabold px-1.5 h-5 rounded-md flex items-center">
            −{discount}%
          </div>
        )}

        {/* Rating chip — top-right */}
        {product.rating && (
          <div className="absolute top-2.5 right-2.5 z-[1] flex items-center gap-0.5 bg-black/55 backdrop-blur-sm border border-white/10 rounded-md px-1.5 h-5 text-[10px] font-bold text-white">
            <Star size={10} className="fill-amber text-amber" strokeWidth={0} />
            {product.rating}
          </div>
        )}

        {/* Floating add button — sits on the image edge */}
        <button
          onClick={handleAdd}
          aria-label="Savatga qo'shish"
          className={cn(
            'absolute bottom-2.5 right-2.5 z-[2] w-10 h-10 rounded-full flex items-center justify-center shadow-pop tap',
            'transition-all duration-200',
            qty > 0
              ? 'bg-success text-white'
              : 'bg-primary text-white hover:bg-primary-600 active:scale-90'
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {qty > 0 ? (
              <motion.div
                key="qty"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="flex items-center gap-0.5 text-[13px] font-extrabold tabular"
              >
                <Check size={12} strokeWidth={3} />
                {qty}
              </motion.div>
            ) : (
              <motion.div
                key="add"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
              >
                <Plus size={18} strokeWidth={2.8} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Body */}
      <div className="p-3 pt-2.5">
        <div className="text-[13.5px] font-bold text-ink leading-snug line-clamp-1 mb-0.5">
          {product.name}
        </div>
        <div className="text-[10.5px] text-ink-mute font-medium mb-2.5 line-clamp-1">
          {product.meta}{product.reviews ? ` · ${product.reviews} baho` : ''}
        </div>

        <div className="flex items-baseline gap-1.5 flex-wrap">
          <div className="font-display text-[22px] text-ink tabular leading-none">
            {formatPrice(product.price)}
          </div>
          <div className="font-body text-[10px] text-ink-mute font-semibold leading-none">so'm</div>
          {product.old && (
            <div className="text-[10px] text-ink-mute line-through tabular leading-none ml-auto">
              {formatPrice(product.old)}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ─────────── Reusable add button (compact pill) ─────────── */
function AddButton({ qty, onClick, compact }) {
  if (qty > 0) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'rounded-md bg-success text-white font-extrabold tap flex items-center gap-1 transition-colors',
          compact ? 'h-8 px-2 text-[11px]' : 'h-9 px-3 text-xs'
        )}
      >
        <Check size={compact ? 12 : 14} strokeWidth={3} />
        {qty}
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md bg-primary hover:bg-primary-600 text-white font-extrabold tap flex items-center justify-center transition-colors',
        compact ? 'w-8 h-8' : 'w-9 h-9'
      )}
      aria-label="Qo'shish"
    >
      <Plus size={compact ? 14 : 16} strokeWidth={2.8} />
    </button>
  )
}

/* ─────────── Category tile ─────────── */
export function CategoryTile({ category, active, onClick }) {
  return (
    <motion.div
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={cn(
        'rounded-md overflow-hidden border cursor-pointer transition-colors',
        active ? 'border-primary' : 'border-ink-line'
      )}
    >
      <div className={cn('aspect-square flex items-center justify-center relative bg-gradient-to-br', category.gradient)}>
        <span className="text-[40px]">{category.emoji}</span>
        <span className="absolute top-1.5 right-1.5 bg-black/50 text-ink-dim text-[9px] font-bold px-1.5 py-0.5 rounded">
          {category.count}
        </span>
      </div>
      <div className={cn(
        'py-2 px-1.5 text-center text-[11px] font-bold leading-tight bg-bg-surface',
        active ? 'text-primary' : 'text-ink-dim'
      )}>
        {category.label}
      </div>
    </motion.div>
  )
}

/* ─────────── Promo card ─────────── */
export function PromoCard({ promo, onClick }) {
  const variants = {
    red: 'bg-red-gradient',
    dark: 'bg-dark-gradient',
    amber: 'bg-amber-gradient',
  }
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="shrink-0 w-[260px] h-[140px] rounded-lg overflow-hidden relative cursor-pointer border border-white/5"
    >
      <div className={cn('w-full h-full relative p-5 flex flex-col justify-center stripes', variants[promo.variant])}>
        <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">{promo.tag}</div>
        <div className="font-display text-2xl text-white leading-[1.05] whitespace-pre-line">{promo.title}</div>
        <div className="text-[11px] text-white/55 font-medium mt-1.5">{promo.sub}</div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[52px] drop-shadow-[0_4px_12px_rgba(0,0,0,.4)]">
          {promo.emoji}
        </div>
      </div>
    </motion.div>
  )
}
