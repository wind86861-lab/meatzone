import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Minus, Plus, Trash2, Tag, ChevronRight } from 'lucide-react'
import { Button } from '../components/ui'
import { useCart } from '../store/cartStore'
import { formatSum, haptic, cn } from '../utils/format'

export default function Cart() {
  const navigate = useNavigate()
  const items = useCart(s => s.items)
  const remove = useCart(s => s.remove)
  const setQty = useCart(s => s.setQty)
  const total = useCart(s => s.total())
  const [promo, setPromo] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)

  const discount = promoApplied ? Math.round(total * 0.1) : 0
  const final = total - discount

  if (items.length === 0) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-bg">
        <div className="px-4 pt-safe pb-4 flex items-center gap-3 bg-primary-600">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white tap">
            <ArrowLeft size={18} />
          </button>
          <div className="font-display text-2xl tracking-wide text-white">Savat</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="font-display text-2xl text-ink mb-2">Savat bo'sh</h2>
          <p className="text-sm text-ink-dim mb-6">Mahsulotlarni katalogdan tanlang</p>
          <Button variant="primary" onClick={() => navigate('/catalog')}>Katalogga o'tish</Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-[100dvh] flex flex-col bg-bg pb-32"
    >
      {/* Header */}
      <div className="px-4 pt-safe pb-4 flex items-center gap-3 bg-primary-600">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white tap">
          <ArrowLeft size={18} />
        </button>
        <div className="font-display text-2xl tracking-wide text-white">Savat</div>
        <div className="ml-auto text-sm text-white/80 font-medium">{items.length} ta</div>
      </div>

      {/* Items */}
      <div className="px-4 pt-4 flex flex-col gap-3">
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
              className="bg-bg-surface rounded-lg border border-ink-line p-3 flex items-center gap-3"
            >
              <div className="text-3xl">{item.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-ink truncate">{item.name}</div>
                <div className="text-[11px] text-ink-dim">{item.meta}</div>
                <div className="text-sm font-bold text-ink tabular mt-1">{formatSum(item.price)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty(item.id, item.qty - 1)}
                  className="w-7 h-7 rounded-md bg-bg-surface3 border border-ink-line text-ink tap flex items-center justify-center"
                >
                  <Minus size={14} />
                </button>
                <span className="min-w-[20px] text-center font-bold text-sm tabular">{item.qty}</span>
                <button
                  onClick={() => setQty(item.id, item.qty + 1)}
                  className="w-7 h-7 rounded-md bg-bg-surface3 border border-ink-line text-ink tap flex items-center justify-center"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button onClick={() => { remove(item.id); haptic('medium') }} className="w-8 h-8 rounded-md bg-primary/10 text-primary tap flex items-center justify-center">
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Promo */}
      <div className="px-4 pt-4">
        <div className="bg-bg-surface rounded-lg border border-ink-line p-3 flex items-center gap-2">
          <Tag size={16} className="text-ink-dim" />
          <input
            value={promo}
            onChange={e => setPromo(e.target.value)}
            placeholder="Promo-kod"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-mute outline-none"
          />
          <button
            onClick={() => { if (promo.trim()) { setPromoApplied(!promoApplied); haptic('light') } }}
            className={cn(
              "px-3 h-8 rounded-md text-xs font-bold tap",
              promoApplied ? "bg-success text-white" : "bg-primary text-white"
            )}
          >
            {promoApplied ? 'Olib tashlash' : 'Qo\'llash'}
          </button>
        </div>
      </div>

      {/* Summary sticky */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-bg-surface/95 backdrop-blur-lg border-t border-ink-line px-4 py-3 pb-safe">
        <div className="max-w-[480px] mx-auto">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-ink-dim">Mahsulotlar</span>
            <span className="text-ink font-bold tabular">{formatSum(total)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-ink-dim">Chegirma</span>
              <span className="text-success font-bold tabular">−{formatSum(discount)}</span>
            </div>
          )}
          <div className="h-px bg-ink-line my-2" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-ink font-bold">Jami</span>
            <span className="font-display text-2xl text-ink tabular">{formatSum(final)}</span>
          </div>
          <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/checkout')}>
            Buyurtma berish <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
