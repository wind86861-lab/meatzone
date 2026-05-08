import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Minus, Plus, Trash2, Tag, Send } from 'lucide-react'
import { Button } from '../components/ui'
import { useCart } from '../store/cartStore'
import { useLangStore } from '../store/langStore'
import { t } from '../utils/i18n'
import { formatSum, haptic, cn } from '../utils/format'
import { ordersAPI, promosAPI } from '../services/api'

export default function Cart() {
  const navigate = useNavigate()
  const { lang } = useLangStore()
  const items = useCart(s => s.items)
  const remove = useCart(s => s.remove)
  const setQty = useCart(s => s.setQty)
  const total = useCart(s => s.total())
  const clear = useCart(s => s.clear)
  const [promo, setPromo] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoError, setPromoError] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const discount = promoApplied ? promoDiscount : 0
  const final = total - discount

  const handleOrderViaTelegram = async () => {
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const response = await ordersAPI.createOrder({
        items: items.map(i => ({ productId: i.id, quantity: i.qty })),
        customerPhone: '',
        customerName: '',
        address: '',
        district: '',
        paymentMethod: 'cash',
        promoCode: promoApplied ? promo : '',
      })

      haptic('success')
      clear()  // empty cart immediately

      const deepLink = response.data.deepLink  // https://t.me/botname?start=token
      const tg = window.Telegram?.WebApp

      if (tg) {
        // Open the bot link then force-close the Mini App
        tg.openTelegramLink(deepLink)
        tg.close()
      } else {
        // Regular browser fallback
        window.location.href = deepLink
      }
    } catch (err) {
      setError(lang === 'uz' ? "Xatolik yuz berdi. Qayta urinib ko'ring." : 'Произошла ошибка. Попробуйте снова.')
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-bg">
        <div className="px-4 pt-safe pb-4 flex items-center gap-3 bg-primary-600">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white tap">
            <ArrowLeft size={18} />
          </button>
          <div className="font-display text-2xl tracking-wide text-white">{t(lang, 'cart.title')}</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="font-display text-2xl text-ink mb-2">{t(lang, 'cart.empty')}</h2>
          <p className="text-sm text-ink-dim mb-6">{t(lang, 'cart.emptyDesc')}</p>
          <Button variant="primary" onClick={() => navigate('/catalog')}>{t(lang, 'cart.goToCatalog')}</Button>
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
        <div className="font-display text-2xl tracking-wide text-white">{t(lang, 'cart.title')}</div>
        <div className="ml-auto text-sm text-white/80 font-medium">{items.length} {t(lang, 'cart.items')}</div>
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
            onChange={e => { setPromo(e.target.value); if (promoApplied) { setPromoApplied(false); setPromoDiscount(0); setPromoError('') } }}
            placeholder={t(lang, 'cart.promo')}
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-mute outline-none"
          />
          <button
            onClick={async () => {
              if (promoApplied) {
                setPromoApplied(false)
                setPromoDiscount(0)
                setPromoError('')
                haptic('light')
                return
              }
              if (!promo.trim()) return
              setPromoLoading(true)
              setPromoError('')
              try {
                const res = await promosAPI.validate({ code: promo.trim(), orderTotal: total })
                if (res.data.valid) {
                  setPromoDiscount(res.data.discount)
                  setPromoApplied(true)
                  haptic('success')
                } else {
                  setPromoError(res.data.message || 'Noto\'g\'ri kod')
                  haptic('error')
                }
              } catch {
                setPromoError(lang === 'uz' ? 'Xatolik yuz berdi' : 'Ошибка проверки')
                haptic('error')
              } finally {
                setPromoLoading(false)
              }
            }}
            className={cn(
              "px-3 h-8 rounded-md text-xs font-bold tap whitespace-nowrap",
              promoApplied ? "bg-success text-white" : "bg-primary text-white",
              promoLoading && "opacity-60 pointer-events-none"
            )}
          >
            {promoLoading ? '...' : promoApplied ? t(lang, 'cart.remove') : t(lang, 'cart.apply')}
          </button>
        </div>
        {promoError && (
          <p className="text-xs text-red-500 mt-1 px-1">{promoError}</p>
        )}
        {promoApplied && (
          <p className="text-xs text-success mt-1 px-1">
            ✅ {lang === 'uz' ? `Chegirma: −${formatSum(promoDiscount)}` : `Скидка: −${formatSum(promoDiscount)}`}
          </p>
        )}
      </div>

      {/* Summary sticky */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-bg-surface/95 backdrop-blur-lg border-t border-ink-line px-4 py-3 pb-safe">
        <div className="max-w-[480px] mx-auto">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-ink-dim">{t(lang, 'cart.products')}</span>
            <span className="text-ink font-bold tabular">{formatSum(total)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-ink-dim">{t(lang, 'cart.discount')}</span>
              <span className="text-success font-bold tabular">−{formatSum(discount)}</span>
            </div>
          )}
          <div className="h-px bg-ink-line my-2" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-ink font-bold">{t(lang, 'cart.total')}</span>
            <span className="font-display text-2xl text-ink tabular">{formatSum(final)}</span>
          </div>
          {error && (
            <div className="mb-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
              {error}
            </div>
          )}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleOrderViaTelegram}
            disabled={submitting}
          >
            <Send size={16} />
            {submitting ? (lang === 'uz' ? 'Yuklanmoqda...' : 'Загрузка...') : t(lang, 'cart.order')}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
