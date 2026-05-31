import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, Clock, CheckCircle, Truck, Search } from 'lucide-react'
import { ordersAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useLangStore } from '../store/langStore'
import { t } from '../utils/i18n'
import BottomNav from '../components/layout/BottomNav'

const statusMap = {
  new: { bg: 'bg-primary/15', text: 'text-primary', icon: Clock, label: 'Yangi' },
  processing: { bg: 'bg-warning/15', text: 'text-warning', icon: Package, label: 'Tayyorlanmoqda' },
  confirmed: { bg: 'bg-primary/15', text: 'text-primary', icon: CheckCircle, label: 'Tasdiqlangan' },
  completed: { bg: 'bg-success/15', text: 'text-success', icon: CheckCircle, label: 'Yetkazildi' },
  cancelled: { bg: 'bg-danger/15', text: 'text-danger', icon: Clock, label: 'Bekor qilindi' },
}

function adaptOrder(o) {
  const s = statusMap[o.status] || statusMap.new
  const items = (o.items || []).map(i => `${i.name?.uz || i.name} × ${i.quantity}`).join(', ')
  return {
    id: `#${String(o._id).slice(-6)}`,
    fullId: String(o._id),
    date: new Date(o.createdAt).toLocaleDateString('ru-RU'),
    items: items || 'Buyurtma',
    total: o.totalPrice || 0,
    status: o.status,
    statusLabel: s.label,
    icon: s.icon,
    bg: s.bg,
    text: s.text,
  }
}

const isTelegramApp = () => !!(window.Telegram?.WebApp?.initData)

export default function Orders() {
  const navigate = useNavigate()
  const { lang } = useLangStore()
  const { token, telegramAutoLogin } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [query, setQuery] = useState(localStorage.getItem('mz_phone') || '')
  const [autoMode, setAutoMode] = useState(false)

  // Auto-fetch orders for Telegram Mini App users
  useEffect(() => {
    if (!isTelegramApp()) return

    const load = async () => {
      setLoading(true)
      setAutoMode(true)
      try {
        // Ensure Telegram auto-login completed (idempotent if already done)
        if (!token) await telegramAutoLogin()

        const res = await ordersAPI.getMyOrders()
        const raw = res.data?.orders || []
        setOrders(raw.map(adaptOrder))
        setSearched(true)
      } catch {
        setSearched(true)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, []) // eslint-disable-line

  const fetchOrders = async () => {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setSearched(true)
    setAutoMode(false)
    localStorage.setItem('mz_phone', q)
    try {
      const res = await ordersAPI.getByPhone(q)
      const raw = res.data?.orders || []
      setOrders(raw.map(adaptOrder))
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter') fetchOrders() }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg pb-24">
      <div className="px-4 pt-safe pb-4 flex items-center gap-3 bg-primary-600">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white tap">
          <ArrowLeft size={18} />
        </button>
        <div className="font-display text-2xl tracking-wide text-white">{t(lang, 'orders.title')}</div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Order count for Telegram users */}
        {autoMode && orders.length > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-bold text-primary">
              {lang === 'uz' ? 'Sizning buyurtmalaringiz' : lang === 'en' ? 'Your orders' : 'Ваши заказы'}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-primary text-white text-xs font-bold">
              {orders.length}
            </span>
          </div>
        )}

        {/* Search box — always visible */}
        <div className="bg-bg-surface rounded-lg border border-ink-line p-4">
          <label className="block text-sm font-bold text-ink mb-2">
            {t(lang, 'orders.phone')}
          </label>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="+998 __ ___ __ __"
              className="flex-1 bg-bg-surface3 border border-ink-line rounded-md px-3 h-11 text-sm text-ink placeholder:text-ink-mute outline-none"
            />
            <button
              onClick={fetchOrders}
              disabled={!query.trim() || loading}
              className="h-11 px-4 rounded-md bg-primary text-white text-sm font-bold flex items-center gap-1.5 disabled:opacity-50 tap"
            >
              <Search size={16} />
              {loading ? '...' : t(lang, 'orders.find')}
            </button>
          </div>
          {autoMode && orders.length > 0 && (
            <p className="mt-2 text-xs text-ink-dim">
              {lang === 'ru' ? '✅ Заказы загружены по вашему аккаунту Telegram' : '✅ Buyurtmalar Telegram akkauntingiz bo\'yicha yuklandi'}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-ink-dim text-sm">{t(lang, 'orders.loading')}</div>
        ) : searched && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-ink-dim text-sm">{t(lang, 'orders.noOrders')}</p>
            <button onClick={() => navigate('/catalog')} className="mt-3 text-sm text-primary font-bold">{t(lang, 'orders.goToCatalog')}</button>
          </div>
        ) : !searched ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-ink-dim text-sm">{t(lang, 'orders.enterPhone')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map(o => {
              const Icon = o.icon
              return (
                <motion.div
                  key={o.fullId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-bg-surface border border-ink-line rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-ink tabular">{o.id}</span>
                    <span className="text-xs text-ink-dim">{o.date}</span>
                  </div>
                  <div className="text-sm text-ink mb-3 line-clamp-2">{o.items}</div>
                  <div className="flex items-center justify-between">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold ${o.bg} ${o.text}`}>
                      <Icon size={12} />
                      {t(lang, `orders.status.${o.status}`) || o.statusLabel}
                    </div>
                    <span className="font-display text-lg text-ink tabular">{o.total.toLocaleString('ru-RU')} <span className="text-xs font-body">so'm</span></span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
