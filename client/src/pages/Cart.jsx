import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Minus, Plus, Trash2, Tag, Send, CheckCircle,
  User, Phone, MapPin, Navigation, CreditCard, Banknote, ChevronRight, AlertCircle
} from 'lucide-react'
import { Button } from '../components/ui'
import { useCart } from '../store/cartStore'
import { useLangStore } from '../store/langStore'
import { useAuthStore } from '../store/authStore'
import { t } from '../utils/i18n'
import { formatSum, haptic, cn, lineTotal, qtyLabel } from '../utils/format'
import { ordersAPI, promosAPI, deliveryAPI } from '../services/api'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const PAYMENT_METHODS = [
  { id: 'cash', label: { uz: 'Naqd', ru: 'Наличные', en: 'Cash' }, icon: Banknote, color: 'bg-emerald-500' },
  { id: 'click', label: { uz: 'Click', ru: 'Click', en: 'Click' }, icon: CreditCard, color: 'bg-sky-500' },
]

export default function Cart() {
  const navigate = useNavigate()
  const { lang } = useLangStore()
  const { telegramUser, isTelegram, requestTelegramPhone, requestTelegramLocation, syncTelegramProfile } = useAuthStore()
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
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [payCheck, setPayCheck] = useState(null) // null | 'checking' | 'paid' | 'unpaid'
  const [pending, setPending] = useState(null)   // { id, link, total } — order awaiting payment

  // Open a payment URL. Inside Telegram use openLink so it goes to the real browser
  // (the in-app webview can't handle Click's app deep-links → ERR_UNKNOWN_URL_SCHEME).
  const openPayment = (url) => {
    const tg = window.Telegram?.WebApp
    if (tg && typeof tg.openLink === 'function') tg.openLink(url)
    else window.location.href = url
  }

  // Customer info
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [phoneRequested, setPhoneRequested] = useState(false)

  // Location
  const [location, setLocation] = useState(null) // { lat, lng, address }
  const [locLoading, setLocLoading] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [isFreeDelivery, setIsFreeDelivery] = useState(false)
  const [distance, setDistance] = useState(null)
  const [duration, setDuration] = useState(null)
  const [geometry, setGeometry] = useState(null)
  const [storeLoc, setStoreLoc] = useState(null)
  const [mapboxToken, setMapboxToken] = useState(null)

  // Map
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('cash')

  useEffect(() => {
    if (telegramUser) {
      const fullName = `${telegramUser.firstName || ''} ${telegramUser.lastName || ''}`.trim()
      if (fullName) setCustomerName(fullName)
    }
  }, [telegramUser])

  // Load any awaiting-payment order from storage
  useEffect(() => {
    const raw = localStorage.getItem('mz_pending')
    if (!raw) return
    try {
      const p = JSON.parse(raw)
      setPending(p)
      if (new URLSearchParams(window.location.search).get('status') === 'paid') setPayCheck('checking')
    } catch { localStorage.removeItem('mz_pending') }
  }, [])

  // Poll the real payment status while an order is awaiting payment
  useEffect(() => {
    if (!pending) return
    let stop = false
    let tries = 0
    const tick = async () => {
      if (stop) return
      tries++
      try {
        const r = await ordersAPI.paymentStatus(pending.id)
        if (r.data?.paymentStatus === 'paid') {
          clear()
          localStorage.removeItem('mz_pending')
          setPending(null)
          setPayCheck('paid')
          return
        }
      } catch { /* ignore */ }
      if (tries >= 90) { setPayCheck(c => (c === 'checking' ? 'unpaid' : c)); return }
      setTimeout(tick, 2000)
    }
    tick()
    return () => { stop = true }
  }, [pending]) // eslint-disable-line

  // Fetch delivery settings (store location + mapbox token)
  useEffect(() => {
    deliveryAPI.getSettings().then(res => {
      setStoreLoc({ lat: res.data.storeLat, lng: res.data.storeLng })
      setMapboxToken(res.data.mapboxToken || null)
    }).catch(() => { })
  }, [])

  const discount = promoApplied ? promoDiscount : 0
  const grandTotal = total + deliveryFee - discount

  const handleRequestPhone = async () => {
    setPhoneRequested(true)
    const result = await requestTelegramPhone()
    if (result.success) {
      setCustomerPhone(result.phone)
    } else {
      setPhoneRequested(false)
    }
  }

  const handleGetLocation = async () => {
    setLocLoading(true)
    setError('')
    try {
      const result = await requestTelegramLocation()
      if (result.success) {
        const loc = { lat: result.lat, lng: result.lng, address: '' }
        setLocation(loc)
        // Sync to server
        await syncTelegramProfile({ location: loc })
        // Calculate delivery cost
        await calculateDelivery(loc)
      } else {
        setError(lang === 'uz' ? 'Joylashuv olishda xatolik' : lang === 'en' ? 'Failed to get location' : 'Ошибка получения локации')
      }
    } catch {
      setError(lang === 'uz' ? 'Joylashuv olishda xatolik' : lang === 'en' ? 'Failed to get location' : 'Ошибка получения локации')
    } finally {
      setLocLoading(false)
    }
  }

  const calculateDelivery = async (loc) => {
    try {
      console.log('[cart] calculating delivery for', loc, 'total:', total)
      const res = await deliveryAPI.estimate({ lat: loc.lat, lng: loc.lng, orderTotal: total })
      console.log('[cart] delivery response:', res.data)
      const data = res.data
      setDeliveryFee(data.fee ?? 0)
      setIsFreeDelivery(data.isFree ?? false)
      setDistance(data.distance ?? null)
      setDuration(data.duration ?? null)
      setGeometry(data.geometry || null)
    } catch (err) {
      console.error('[cart] delivery error:', err?.response?.data || err.message)
      setDeliveryFee(0)
      setDuration(null)
    }
  }

  // Initialize route map when location + store + token available
  useEffect(() => {
    if (!mapContainerRef.current || !mapboxToken || !storeLoc || !location) return

    mapboxgl.accessToken = mapboxToken
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [(storeLoc.lng + location.lng) / 2, (storeLoc.lat + location.lat) / 2],
      zoom: 12,
    })
    mapRef.current = map

    // Shop marker
    new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([storeLoc.lng, storeLoc.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(lang === 'uz' ? 'Do\'kon' : lang === 'en' ? 'Shop' : 'Магазин'))
      .addTo(map)

    // Customer marker
    new mapboxgl.Marker({ color: '#22c55e' })
      .setLngLat([location.lng, location.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(lang === 'uz' ? 'Siz' : lang === 'en' ? 'You' : 'Вы'))
      .addTo(map)

    // Fit bounds to show both markers
    const bounds = new mapboxgl.LngLatBounds()
    bounds.extend([storeLoc.lng, storeLoc.lat])
    bounds.extend([location.lng, location.lat])
    map.fitBounds(bounds, { padding: 40, maxZoom: 14 })

    map.on('load', () => {
      if (geometry && geometry.coordinates) {
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry }
        })
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#ef4444', 'line-width': 4 }
        })
      }
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [location, storeLoc, mapboxToken, geometry, lang])

  const handleSubmitOrder = async () => {
    if (submitting) return
    if (!customerName.trim()) {
      setError(lang === 'uz' ? 'Ismingizni kiriting' : lang === 'en' ? 'Enter your name' : 'Введите ваше имя')
      return
    }
    if (!customerPhone.trim()) {
      setError(lang === 'uz' ? 'Telefon raqamini kiriting' : lang === 'en' ? 'Enter your phone number' : 'Введите номер телефона')
      return
    }
    if (!location) {
      setError(lang === 'uz' ? 'Joylashuvni ulashing (talab etiladi)' : lang === 'en' ? 'Share your location (required)' : 'Поделитесь локацией (обязательно)')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const response = await ordersAPI.createOrder({
        items: items.map(i => ({ productId: i.id, quantity: i.qty })),
        customerPhone: customerPhone.trim(),
        customerName: customerName.trim(),
        address: location.address || '',
        district: '',
        latitude: location.lat,
        longitude: location.lng,
        paymentMethod,
        promoCode: promoApplied ? promo : '',
        telegramId: telegramUser?.telegramId || '',
        username: telegramUser?.username || '',
      })

      haptic('success')
      const data = response.data
      const newOrderId = data.order?._id || data.orderId || data._id || ''
      const links = data.paymentLinks || {}

      // Online payment (Click): keep the cart, save as pending, redirect to checkout.
      // The cart is only cleared once payment is confirmed (on return).
      if (paymentMethod === 'click' && links.click) {
        const payTotal = data.order?.totalPrice || total
        const p = { id: newOrderId, link: links.click, total: payTotal }
        localStorage.setItem('mz_pending', JSON.stringify(p))
        setPending(p)
        setSubmitting(false)
        openPayment(links.click)
        return
      }

      // Cash (or no link): show success screen
      clear()
      setOrderId(newOrderId)
      setSuccess(true)
    } catch (err) {
      setError(lang === 'uz' ? "Xatolik yuz berdi. Qayta urinib ko'ring." : 'Произошла ошибка. Попробуйте снова.')
      setSubmitting(false)
    }
  }

  // Payment-status screen (after returning from Click)
  if (payCheck) {
    const cfg = {
      checking: { icon: '⏳', bg: 'bg-amber-500/10', title: lang === 'ru' ? 'Проверяем оплату...' : lang === 'en' ? 'Checking payment...' : "To'lov tekshirilmoqda...", sub: lang === 'ru' ? 'Подождите немного' : lang === 'en' ? 'Please wait' : 'Biroz kuting' },
      paid: { icon: '✅', bg: 'bg-success/10', title: lang === 'ru' ? 'Оплата получена!' : lang === 'en' ? 'Payment received!' : "To'lov qabul qilindi!", sub: lang === 'ru' ? 'Спасибо за заказ' : lang === 'en' ? 'Thank you for your order' : 'Buyurtmangiz uchun rahmat' },
      unpaid: { icon: '⚠️', bg: 'bg-amber-500/10', title: lang === 'ru' ? 'Оплата не завершена' : lang === 'en' ? 'Payment not completed' : "To'lov yakunlanmadi", sub: lang === 'ru' ? 'Вы можете продолжить оплату или вернуться в корзину' : lang === 'en' ? 'You can continue the payment or go back to the cart' : "To'lovni davom ettiring yoki savatga qayting" },
    }[payCheck]
    return (
      <div className="min-h-[100dvh] flex flex-col bg-bg items-center justify-center px-6 text-center">
        <div className={cn('w-20 h-20 rounded-full flex items-center justify-center mb-6 text-4xl', cfg.bg, payCheck === 'checking' && 'animate-pulse')}>{cfg.icon}</div>
        <h2 className="font-display text-2xl text-ink mb-2">{cfg.title}</h2>
        <p className="text-sm text-ink-dim mb-6">{cfg.sub}</p>
        {payCheck === 'unpaid' && pending ? (
          <div className="flex flex-col gap-3 w-full max-w-[280px]">
            <Button variant="primary" onClick={() => { openPayment(pending.link) }}>
              {lang === 'ru' ? 'Продолжить оплату' : lang === 'en' ? 'Continue payment' : "To'lovni davom ettirish"}
            </Button>
            <button onClick={() => setPayCheck(null)} className="text-sm text-ink-dim underline">
              {lang === 'ru' ? 'Вернуться в корзину' : lang === 'en' ? 'Back to cart' : 'Savatga qaytish'}
            </button>
          </div>
        ) : payCheck === 'checking' ? null : (
          <Button variant="primary" onClick={() => navigate('/catalog')}>{t(lang, 'cart.goToCatalog')}</Button>
        )}
      </div>
    )
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-bg items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
        >
          <CheckCircle size={40} className="text-success" />
        </motion.div>
        <h2 className="font-display text-2xl text-ink mb-2">
          {lang === 'uz' ? 'Buyurtma qabul qilindi!' : lang === 'en' ? 'Order received!' : 'Заказ принят!'}
        </h2>
        <p className="text-sm text-ink-dim mb-2">
          {lang === 'uz' ? 'Tez orada operator bog`lanadi' : lang === 'en' ? 'An operator will contact you soon' : 'Оператор скоро свяжется с вами'}
        </p>
        {orderId && (
          <p className="text-xs text-ink-mute font-mono mb-6">ID: {orderId}</p>
        )}
        <Button variant="primary" onClick={() => navigate('/catalog')}>
          {t(lang, 'cart.goToCatalog')}
        </Button>
      </div>
    )
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
      className="min-h-[100dvh] flex flex-col bg-bg"
    >
      {/* Header */}
      <div className="px-4 pt-safe pb-4 flex items-center gap-3 bg-primary-600 shrink-0">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white tap">
          <ArrowLeft size={18} />
        </button>
        <div className="font-display text-2xl tracking-wide text-white">{t(lang, 'cart.title')}</div>
        <div className="ml-auto text-sm text-white/80 font-medium">{items.length} {t(lang, 'cart.items')}</div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-[320px] flex flex-col gap-4">

          {/* Unfinished payment — resume */}
          {pending && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3">
              <div className="text-2xl shrink-0">⏳</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-ink">{lang === 'ru' ? 'Незавершённая оплата' : lang === 'en' ? 'Unfinished payment' : "To'lanmagan buyurtma"}</div>
                <div className="text-xs text-ink-dim truncate">{formatSum(pending.total)} • {lang === 'ru' ? 'продолжите оплату' : lang === 'en' ? 'continue the payment' : "to'lovni davom ettiring"}</div>
              </div>
              <button onClick={() => { openPayment(pending.link) }} className="shrink-0 bg-primary text-white text-xs font-bold px-3 py-2 rounded-lg tap">
                {lang === 'ru' ? 'Оплатить' : lang === 'en' ? 'Pay' : "To'lash"}
              </button>
              <button onClick={() => { localStorage.removeItem('mz_pending'); setPending(null) }} className="shrink-0 text-ink-dim p-1 tap" aria-label="dismiss">
                <Trash2 size={16} />
              </button>
            </div>
          )}

          {/* Items */}
          <AnimatePresence>
            {items.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                className="bg-bg-surface rounded-xl border border-ink-line p-3 flex items-center gap-3"
              >
                <div className="text-3xl">{item.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-ink truncate">{item.name}</div>
                  <div className="text-[11px] text-ink-dim">{formatSum(item.price)} / {item.unit === 'kg' ? 'kg' : 'dona'}</div>
                  <div className="text-sm font-bold text-ink tabular mt-1">{formatSum(lineTotal(item))}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(item.id, item.qty - (item.unit === 'kg' ? 100 : 1))}
                    className="w-8 h-8 rounded-lg bg-bg-surface3 border border-ink-line text-ink tap flex items-center justify-center active:scale-95"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="min-w-[44px] text-center font-bold text-sm tabular">{qtyLabel(item.unit, item.qty)}</span>
                  <button
                    onClick={() => setQty(item.id, item.qty + (item.unit === 'kg' ? 100 : 1))}
                    className="w-8 h-8 rounded-lg bg-bg-surface3 border border-ink-line text-ink tap flex items-center justify-center active:scale-95"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button onClick={() => { remove(item.id); haptic('medium') }} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 tap flex items-center justify-center">
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Section: Customer Info */}
          <div className="bg-bg-surface rounded-xl border border-ink-line overflow-hidden">
            <div className="px-4 py-2.5 border-b border-ink-line/60 bg-bg-surface3/40">
              <span className="text-xs font-bold text-ink-dim uppercase tracking-wider">
                {lang === 'uz' ? 'Mijoz ma\'lumotlari' : lang === 'en' ? 'Customer info' : 'Данные клиента'}
              </span>
            </div>
            <div className="p-3 flex flex-col gap-3">
              {/* Name */}
              <div className="flex items-center gap-3">
                <User size={16} className="text-ink-dim shrink-0" />
                <input
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder={lang === 'uz' ? 'Ismingiz' : lang === 'en' ? 'Your name' : 'Ваше имя'}
                  className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-mute outline-none"
                />
              </div>
              {/* Phone */}
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-ink-dim shrink-0" />
                {isTelegram && !customerPhone ? (
                  <button
                    onClick={handleRequestPhone}
                    disabled={phoneRequested}
                    className="flex-1 text-left text-sm text-primary font-bold"
                  >
                    {phoneRequested
                      ? (lang === 'uz' ? 'So`ralmoqda...' : lang === 'en' ? 'Requesting...' : 'Запрашиваем...')
                      : (lang === 'uz' ? 'Telegramdan olish' : lang === 'en' ? 'Get from Telegram' : 'Получить из Telegram')
                    }
                  </button>
                ) : (
                  <input
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder={lang === 'uz' ? 'Telefon' : lang === 'en' ? 'Phone' : 'Телефон'}
                    className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-mute outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section: Location (REQUIRED) */}
          <div className={cn(
            "bg-bg-surface rounded-xl border overflow-hidden",
            location ? "border-primary/40 ring-1 ring-primary/10" : "border-ink-line"
          )}>
            <div className="px-4 py-2.5 border-b border-ink-line/60 bg-bg-surface3/40 flex items-center justify-between">
              <span className="text-xs font-bold text-ink-dim uppercase tracking-wider flex items-center gap-1.5">
                <Navigation size={12} />
                {lang === 'uz' ? 'Yetkazib berish manzili' : lang === 'en' ? 'Delivery address' : 'Адрес доставки'}
              </span>
              {location && (
                <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                  {lang === 'uz' ? 'Olingan' : lang === 'en' ? 'Received' : 'Получен'}
                </span>
              )}
            </div>
            <div className="p-3">
              {!location ? (
                <button
                  onClick={handleGetLocation}
                  disabled={locLoading}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-lg h-11 text-sm font-bold tap active:scale-[0.98]"
                >
                  {locLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {lang === 'uz' ? 'Aniqlanmoqda...' : lang === 'en' ? 'Locating...' : 'Определяем...'}
                    </>
                  ) : (
                    <>
                      <MapPin size={16} />
                      {lang === 'uz' ? 'Joylashuvni ulashish (talab etiladi)' : lang === 'en' ? 'Share location (required)' : 'Поделиться локацией (обязательно)'}
                    </>
                  )}
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-ink font-medium">
                        {lang === 'uz' ? 'Joylashuv olindi' : lang === 'en' ? 'Location received' : 'Локация получена'}
                      </p>
                      {distance !== null && (
                        <p className="text-xs text-ink-dim">
                          🚗 {typeof distance === 'number' ? distance.toFixed(1) : distance} km {lang === 'uz' ? 'do`kondan' : lang === 'en' ? 'from shop' : 'от магазина'}
                          {duration ? ` • ~${duration}` : ''}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleGetLocation}
                      className="text-xs text-primary font-bold px-2 py-1 rounded-md bg-primary/10 tap"
                    >
                      {lang === 'uz' ? 'Yangilash' : lang === 'en' ? 'Update' : 'Обновить'}
                    </button>
                  </div>
                  <input
                    value={location.address || ''}
                    onChange={e => setLocation(prev => ({ ...prev, address: e.target.value }))}
                    placeholder={lang === 'uz' ? 'Aniq manzil (ko\'cha, uy)' : lang === 'en' ? 'Exact address (street, house)' : 'Точный адрес (улица, дом)'}
                    className="w-full bg-bg-surface3 border border-ink-line rounded-lg px-3 h-10 text-sm text-ink placeholder:text-ink-mute outline-none"
                  />
                  {/* Route Map */}
                  {mapboxToken ? (
                    <div className="mt-2 rounded-lg overflow-hidden border border-ink-line">
                      <div className="px-2 py-1 bg-bg-surface3/40 border-b border-ink-line/60 flex items-center gap-1.5">
                        <Navigation size={10} className="text-ink-dim" />
                        <span className="text-[10px] font-bold text-ink-dim uppercase tracking-wider">
                          {lang === 'uz' ? 'Yo\'nalish' : lang === 'en' ? 'Route' : 'Маршрут'}
                        </span>
                      </div>
                      <div ref={mapContainerRef} className="w-full h-[220px] bg-gray-100" />
                    </div>
                  ) : (
                    <p className="text-[10px] text-ink-mute mt-1">
                      {lang === 'uz' ? 'Xarita yuklanmadi' : lang === 'en' ? 'Map not loaded' : 'Карта не загружена'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section: Payment */}
          <div className="bg-bg-surface rounded-xl border border-ink-line overflow-hidden">
            <div className="px-4 py-2.5 border-b border-ink-line/60 bg-bg-surface3/40">
              <span className="text-xs font-bold text-ink-dim uppercase tracking-wider">
                {lang === 'uz' ? 'To\'lov usuli' : lang === 'en' ? 'Payment method' : 'Способ оплаты'}
              </span>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {PAYMENT_METHODS.map(m => {
                const Icon = m.icon
                const isActive = paymentMethod === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => { setPaymentMethod(m.id); haptic('light') }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left tap transition-all",
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-ink-line bg-bg-surface3/30 hover:bg-bg-surface3/60"
                    )}
                  >
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0", m.color)}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-ink">{m.label[lang] || m.label.uz}</div>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                      isActive ? "border-primary" : "border-ink-line"
                    )}>
                      {isActive && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Promo (after Payment) */}
          <div className="bg-bg-surface rounded-xl border border-ink-line p-3 flex items-center gap-2">
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
                  setPromoApplied(false); setPromoDiscount(0); setPromoError(''); haptic('light'); return
                }
                if (!promo.trim()) return
                setPromoLoading(true); setPromoError('')
                try {
                  const res = await promosAPI.validate({ code: promo.trim(), orderTotal: total })
                  if (res.data.valid) { setPromoDiscount(res.data.discount); setPromoApplied(true); haptic('success') }
                  else { setPromoError(res.data.message || 'Noto\'g\'ri kod'); haptic('error') }
                } catch {
                  setPromoError(lang === 'uz' ? 'Xatolik yuz berdi' : 'Ошибка проверки'); haptic('error')
                } finally { setPromoLoading(false) }
              }}
              className={cn(
                "px-3 h-8 rounded-lg text-xs font-bold tap whitespace-nowrap",
                promoApplied ? "bg-success text-white" : "bg-primary text-white",
                promoLoading && "opacity-60 pointer-events-none"
              )}
            >
              {promoLoading ? '...' : promoApplied ? t(lang, 'cart.remove') : t(lang, 'cart.apply')}
            </button>
          </div>
          {promoError && <p className="text-xs text-red-500 px-1 -mt-2">{promoError}</p>}
          {promoApplied && (
            <p className="text-xs text-success px-1 -mt-2">✅ {lang === 'uz' ? `Chegirma: −${formatSum(promoDiscount)}` : `Скидка: −${formatSum(promoDiscount)}`}</p>
          )}

          {/* Spacer for bottom bar */}
          <div className="h-4" />
        </div>
      </div>

      {/* Sticky bottom summary */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-bg-surface/95 backdrop-blur-xl border-t border-ink-line">
        <div className="max-w-[480px] mx-auto px-4 py-3 pb-safe">
          <div className="flex flex-col gap-1.5 mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-ink-dim">{t(lang, 'cart.products')}</span>
              <span className="text-ink font-bold tabular">{formatSum(total)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-ink-dim">
                  {lang === 'uz' ? 'Yetkazib berish' : lang === 'en' ? 'Delivery' : 'Доставка'}
                  {distance !== null && (
                    <span className="text-[10px] text-ink-mute ml-1">
                      ({typeof distance === 'number' ? distance.toFixed(1) : distance} km)
                    </span>
                  )}
                </span>
                <span className="text-ink font-bold tabular">{formatSum(deliveryFee)}</span>
              </div>
            )}
            {isFreeDelivery && (
              <div className="flex justify-between text-sm">
                <span className="text-ink-dim">
                  {lang === 'uz' ? 'Yetkazib berish' : lang === 'en' ? 'Delivery' : 'Доставка'}
                  {distance !== null && (
                    <span className="text-[10px] text-ink-mute ml-1">
                      ({typeof distance === 'number' ? distance.toFixed(1) : distance} km)
                    </span>
                  )}
                </span>
                <span className="text-success font-bold tabular">{lang === 'uz' ? 'Bepul' : lang === 'en' ? 'Free' : 'Бесплатно'}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-ink-dim">{t(lang, 'cart.discount')}</span>
                <span className="text-success font-bold tabular">−{formatSum(discount)}</span>
              </div>
            )}
            <div className="h-px bg-ink-line my-1" />
            <div className="flex justify-between items-center">
              <span className="text-ink font-bold text-sm">{t(lang, 'cart.total')}</span>
              <span className="font-display text-xl text-ink tabular">{formatSum(grandTotal)}</span>
            </div>
          </div>

          {error && (
            <div className="mb-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center flex items-center justify-center gap-1.5">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSubmitOrder}
            disabled={submitting || !location}
          >
            <Send size={16} />
            {submitting
              ? (lang === 'uz' ? 'Yuklanmoqda...' : 'Загрузка...')
              : !location
                ? (lang === 'uz' ? 'Joylashuv talab etiladi' : lang === 'en' ? 'Location required' : 'Требуется локация')
                : t(lang, 'cart.order')
            }
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
