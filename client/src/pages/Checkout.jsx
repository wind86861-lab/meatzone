import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Phone, CreditCard, Banknote, CheckCircle, User, Building, Truck, Gift, Tag, Coins, Navigation, Loader2, X } from 'lucide-react'
import { Button } from '../components/ui'
import { useCart } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { ordersAPI, deliveryAPI, coinsAPI, promosAPI } from '../services/api'
import { useLangStore } from '../store/langStore'
import { t } from '../utils/i18n'
import { formatSum, haptic } from '../utils/format'

export default function Checkout() {
  const navigate = useNavigate()
  const { lang } = useLangStore()
  const items = useCart(s => s.items)
  const total = useCart(s => s.total())
  const clear = useCart(s => s.clear)

  const subTotal = total
  const authUser = useAuthStore(s => s.user)

  // ── Form state ──────────────────────────────────────────────────────────────
  const [method, setMethod] = useState('cash')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [name, setName] = useState('')
  const [district, setDistrict] = useState('')
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // ── GPS delivery ────────────────────────────────────────────────────────────
  const [gps, setGps] = useState(null)          // { lat, lng }
  const [gpsLoading, setGpsLoading] = useState(false)
  const [delivery, setDelivery] = useState(null) // estimate result
  const [deliveryLoading, setDeliveryLoading] = useState(false)

  // ── Promo ───────────────────────────────────────────────────────────────────
  const [promoCode, setPromoCode] = useState('')
  const [promoResult, setPromoResult] = useState(null)
  const [promoLoading, setPromoLoading] = useState(false)

  // ── Coins ───────────────────────────────────────────────────────────────────
  const [coinBalance, setCoinBalance] = useState(0)
  const [coinSettings, setCoinSettings] = useState({ maxPercent: 30 })
  const [useCoins, setUseCoins] = useState(false)

  // Fetch delivery estimate whenever GPS or subTotal changes
  const estimateDelivery = useCallback(async (lat, lng) => {
    setDeliveryLoading(true)
    try {
      const r = await deliveryAPI.estimate({ lat, lng, orderTotal: subTotal })
      setDelivery(r.data)
    } catch { setDelivery(null) }
    finally { setDeliveryLoading(false) }
  }, [subTotal])

  // Initial: fetch delivery without GPS (min fee or free), and coin balance (only if logged in)
  useEffect(() => {
    estimateDelivery(null, null)
    if (authUser) {
      coinsAPI.getBalance().then(r => setCoinBalance(r.data.balance || 0)).catch(() => { })
      coinsAPI.getSettings().then(r => setCoinSettings(r.data)).catch(() => { })
    }
  }, [subTotal, authUser])

  const requestGPS = () => {
    if (gpsLoading) return  // prevent double-tap
    setGpsLoading(true)
    const tg = window.Telegram?.WebApp

    const onSuccess = (lat, lng) => {
      setGps({ lat, lng })
      setGpsLoading(false)
      estimateDelivery(lat, lng)
    }
    const onFail = (silent = false) => {
      setGpsLoading(false)
      if (!silent) alert(t(lang, 'checkout.gpsDenied'))
    }

    // Telegram LocationManager (Bot API 8.0+)
    const lm = tg?.LocationManager
    if (lm) {
      const getLoc = () => {
        if (!lm.isLocationAvailable) { onFail(); return }
        lm.getLocation(loc => {
          if (loc?.latitude != null) onSuccess(loc.latitude, loc.longitude)
          else onFail()
        })
      }
      if (!lm.isInited) lm.init(getLoc)
      else getLoc()
      return
    }

    // Fallback: browser geolocation (works on desktop/web)
    if (!navigator.geolocation) { onFail(true); return }
    navigator.geolocation.getCurrentPosition(
      pos => onSuccess(pos.coords.latitude, pos.coords.longitude),
      () => onFail(),
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const validatePromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    try {
      const r = await promosAPI.validate({ code: promoCode, orderTotal: subTotal })
      setPromoResult(r.data)
    } catch (e) {
      setPromoResult({ valid: false, message: e.response?.data?.message || t(lang, 'checkout.check') + ' error' })
    } finally { setPromoLoading(false) }
  }

  // Derived totals
  const deliveryFee = delivery?.fee ?? 0
  const isFreeDelivery = delivery?.isFree ?? true
  const promoDiscount = promoResult?.valid ? (promoResult.discount || 0) : 0
  const maxCoinDiscount = Math.round((subTotal * (coinSettings.maxPercent || 30)) / 100)
  const coinDiscount = useCoins ? Math.min(coinBalance, maxCoinDiscount) : 0
  const finalTotal = Math.max(0, subTotal - promoDiscount - coinDiscount) + deliveryFee

  // ── Empty cart ──────────────────────────────────────────────────────────────
  if (items.length === 0 && !done) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-bg">
        <div className="px-4 pt-safe pb-4 flex items-center gap-3 bg-primary-600">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white tap">
            <ArrowLeft size={18} />
          </button>
          <div className="font-display text-2xl tracking-wide text-white">{t(lang, 'checkout.title')}</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-5xl mb-3">🛒</div>
          <h2 className="font-display text-2xl text-ink mb-2">{t(lang, 'checkout.emptyCart')}</h2>
          <Button variant="primary" onClick={() => navigate('/catalog')}>{t(lang, 'cart.goToCatalog')}</Button>
        </div>
      </div>
    )
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  const isTelegramApp = !!window.Telegram?.WebApp
  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-bg"
      >
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h2 className="font-display text-3xl text-ink mb-2">{t(lang, 'checkout.success')}</h2>
        <p className="text-sm text-ink-dim mb-8">{t(lang, 'checkout.successDesc')}</p>
        {isTelegramApp ? (
          <Button variant="primary" onClick={() => window.Telegram.WebApp.close()}>
            ← Telegramga qaytish
          </Button>
        ) : (
          <Button variant="primary" onClick={() => navigate('/')}>{t(lang, 'checkout.backHome')}</Button>
        )}
      </motion.div>
    )
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (submitting) return  // guard double-tap
    if (!phone.trim() || !name.trim() || !address.trim() || !district.trim()) {
      setSubmitError(t(lang, 'checkout.enterDetails'))
      return
    }
    setSubmitError('')
    setSubmitting(true)
    try {
      await ordersAPI.createOrder({
        items: items.map(i => ({ productId: i.id, quantity: i.qty })),
        customerPhone: phone,
        customerName: name,
        address,
        district,
        comment: note,
        paymentMethod: method,
        latitude: gps?.lat || null,
        longitude: gps?.lng || null,
        promoCode: promoResult?.valid ? promoCode : null,
        useCoins: useCoins && coinDiscount > 0,
        userId: authUser?._id || null,
      })
      haptic('success')
      try { localStorage.setItem('mz_phone', phone) } catch { /* storage may be restricted */ }
      // setDone BEFORE clear() — prevents empty-cart screen flash
      setDone(true)
      clear()
      // Auto-close Telegram Mini App after 2s so user sees success
      if (window.Telegram?.WebApp) {
        setTimeout(() => { try { window.Telegram.WebApp.close() } catch { } }, 2000)
      }
    } catch (err) {
      setSubmitError(err?.response?.data?.message || t(lang, 'checkout.submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-[100dvh] flex flex-col bg-bg pb-28"
    >
      {/* Header */}
      <div className="px-4 pt-safe pb-4 flex items-center gap-3 bg-primary-600">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white tap">
          <ArrowLeft size={18} />
        </button>
        <div className="font-display text-2xl tracking-wide text-white">{t(lang, 'checkout.title')}</div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Contact */}
        <div className="bg-bg-surface rounded-lg border border-ink-line p-4 space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <User size={16} className="text-primary" />
              <span className="text-sm font-bold text-ink">{t(lang, 'checkout.name')}</span>
            </div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={t(lang, 'checkout.namePlaceholder')}
              className="w-full bg-bg-surface3 border border-ink-line rounded-md px-3 h-11 text-sm text-ink placeholder:text-ink-mute outline-none" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Phone size={16} className="text-primary" />
              <span className="text-sm font-bold text-ink">{t(lang, 'checkout.phone')}</span>
            </div>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder={t(lang, 'checkout.phonePlaceholder')}
              className="w-full bg-bg-surface3 border border-ink-line rounded-md px-3 h-11 text-sm text-ink placeholder:text-ink-mute outline-none" />
          </div>
        </div>

        {/* Address + GPS */}
        <div className="bg-bg-surface rounded-lg border border-ink-line p-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                <span className="text-sm font-bold text-ink">{t(lang, 'checkout.address')}</span>
              </div>
              <button onClick={requestGPS} disabled={gpsLoading}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${gps ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-ink-line text-ink-dim hover:bg-bg-surface2'}`}>
                {gpsLoading ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                {gps ? t(lang, 'checkout.gpsDone') + ' ✓' : t(lang, 'checkout.gps')}
              </button>
            </div>
            <input value={address} onChange={e => setAddress(e.target.value)}
              placeholder={t(lang, 'checkout.addressPlaceholder')}
              className="w-full bg-bg-surface3 border border-ink-line rounded-md px-3 h-11 text-sm text-ink placeholder:text-ink-mute outline-none" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Building size={16} className="text-primary" />
              <span className="text-sm font-bold text-ink">{t(lang, 'checkout.district')}</span>
            </div>
            <input value={district} onChange={e => setDistrict(e.target.value)}
              placeholder={t(lang, 'checkout.districtPlaceholder')}
              className="w-full bg-bg-surface3 border border-ink-line rounded-md px-3 h-11 text-sm text-ink placeholder:text-ink-mute outline-none" />
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder={t(lang, 'checkout.note')} rows={2}
            className="w-full bg-bg-surface3 border border-ink-line rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-mute outline-none resize-none" />
        </div>

        {/* Payment */}
        <div className="bg-bg-surface rounded-lg border border-ink-line p-4">
          <div className="text-sm font-bold text-ink mb-3">{t(lang, 'checkout.payment')}</div>
          <div className="flex gap-2">
            {[{ id: 'cash', label: t(lang, 'checkout.cash'), icon: Banknote }, { id: 'card', label: t(lang, 'checkout.card'), icon: CreditCard }].map(m => (
              <button key={m.id} onClick={() => { setMethod(m.id); haptic('light') }}
                className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-lg border text-sm font-bold tap ${method === m.id ? 'bg-primary border-primary text-white' : 'bg-bg-surface3 border-ink-line text-ink-dim'}`}>
                <m.icon size={16} /> {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Promo code */}
        <div className="bg-bg-surface rounded-lg border border-ink-line p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Tag size={16} className="text-primary" />
            <span className="text-sm font-bold text-ink">{t(lang, 'checkout.promo')}</span>
          </div>
          <div className="flex gap-2">
            <input value={promoCode} onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null) }}
              placeholder={t(lang, 'checkout.promoPlaceholder')}
              className="flex-1 bg-bg-surface3 border border-ink-line rounded-md px-3 h-10 text-sm text-ink placeholder:text-ink-mute outline-none uppercase tracking-widest" />
            <button onClick={validatePromo} disabled={promoLoading || !promoCode.trim()}
              className="px-4 h-10 bg-primary text-white rounded-md text-sm font-medium disabled:opacity-50 tap">
              {promoLoading ? <Loader2 size={14} className="animate-spin" /> : t(lang, 'checkout.check')}
            </button>
            {promoResult && (
              <button onClick={() => { setPromoResult(null); setPromoCode('') }} className="w-10 h-10 flex items-center justify-center border border-ink-line rounded-md text-ink-mute hover:bg-bg-surface2">
                <X size={14} />
              </button>
            )}
          </div>
          {promoResult && (
            <p className={`text-xs font-medium flex items-center gap-1.5 ${promoResult.valid ? 'text-emerald-600' : 'text-red-500'}`}>
              {promoResult.valid ? <CheckCircle size={13} /> : null}
              {promoResult.message}
            </p>
          )}
        </div>

        {/* Coins */}
        {coinBalance > 0 && (
          <button onClick={() => setUseCoins(p => !p)}
            className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors tap ${useCoins ? 'bg-amber-50 border-amber-300' : 'bg-bg-surface border-ink-line'}`}>
            <div className="flex items-center gap-2">
              <Gift size={16} className={useCoins ? 'text-amber-600' : 'text-ink-dim'} />
              <span className={`text-sm font-bold ${useCoins ? 'text-amber-800' : 'text-ink'}`}>
                {t(lang, 'checkout.useCoins')}
              </span>
              <span className="text-xs text-ink-mute">({coinBalance} {t(lang, 'checkout.coinsAvailable')})</span>
            </div>
            <div className={`text-sm font-bold ${useCoins ? 'text-amber-700' : 'text-ink-mute'}`}>
              {useCoins ? `−${formatSum(coinDiscount)}` : `max ${formatSum(maxCoinDiscount)}`}
            </div>
          </button>
        )}

        {/* Summary */}
        <div className="bg-white/50 rounded-2xl border border-ink-line/60 p-4 mb-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">{t(lang, 'checkout.total')}</div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-mute">{t(lang, 'checkout.subtotal')}</span>
            <span className="text-ink font-medium tabular">{formatSum(subTotal)}</span>
          </div>

          {promoDiscount > 0 && (
            <div className="flex items-center justify-between text-sm text-emerald-600">
              <span className="flex items-center gap-1.5"><Tag size={13} /> {t(lang, 'checkout.promoDiscount')}</span>
              <span className="font-medium">−{formatSum(promoDiscount)}</span>
            </div>
          )}

          {coinDiscount > 0 && (
            <div className="flex items-center justify-between text-sm text-amber-600">
              <span className="flex items-center gap-1.5"><Gift size={13} /> {t(lang, 'checkout.coinDiscount')}</span>
              <span className="font-medium">−{formatSum(coinDiscount)}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-mute flex items-center gap-1.5">
              <Truck size={14} />
              {deliveryLoading ? t(lang, 'checkout.calculating') : t(lang, 'checkout.delivery')}
              {delivery?.distance && (
                <span className="text-ink-mute">
                  ({delivery.distance} km{delivery.duration ? ` · ~${delivery.duration}` : ''})
                </span>
              )}
            </span>
            {deliveryLoading ? (
              <Loader2 size={14} className="animate-spin text-ink-mute" />
            ) : isFreeDelivery ? (
              <span className="text-emerald-600 font-medium flex items-center gap-1"><Gift size={14} /> {t(lang, 'checkout.free')}</span>
            ) : (
              <span className="text-ink font-medium tabular">{formatSum(deliveryFee)}</span>
            )}
          </div>

          <div className="border-t border-ink-line/40 pt-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">{t(lang, 'checkout.total')}</span>
            <span className="text-xl font-display text-ink tabular">{formatSum(finalTotal)}</span>
          </div>

          {isFreeDelivery && delivery?.reason && (
            <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700 flex items-center gap-1.5">
              <CheckCircle size={13} />
              {delivery.reason === 'promo_period' ? t(lang, 'checkout.freePromoPeriod') :
                delivery.reason === 'free_threshold' ? t(lang, 'checkout.freeThreshold') :
                  delivery.reason === 'disabled' ? t(lang, 'checkout.deliveryDisabled') :
                    t(lang, 'checkout.deliveryFree')}
            </div>
          )}
        </div>
      </div>

      {/* Sticky submit */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-bg-surface/95 backdrop-blur-lg border-t border-ink-line px-4 py-3 pb-safe">
        <div className="max-w-[480px] mx-auto">
          {submitError && (
            <div className="mb-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
              {submitError}
            </div>
          )}
          <Button type="button" variant="primary" fullWidth className="text-base" disabled={submitting} onClick={handleSubmit}>
            {submitting ? t(lang, 'checkout.submit') + '...' : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle size={18} />
                {t(lang, 'checkout.submitTotal')} — {formatSum(finalTotal)}
              </span>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
