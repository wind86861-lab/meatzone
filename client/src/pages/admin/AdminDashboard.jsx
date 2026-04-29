import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { ordersAPI } from '../../services/api'
import {
  Package,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  ArrowRight,
  Users,
  Activity,
  TrendingUp,
  BarChart3,
  MapPin,
  CreditCard,
} from 'lucide-react'

const MONTH_NAMES = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}
const STATUS_LABELS = {
  new: 'Новый', processing: 'В обработке', confirmed: 'Подтверждён', completed: 'Выполнен', cancelled: 'Отменён',
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [analyticsRes, ordersRes] = await Promise.allSettled([
        api.get('/analytics/dashboard'),
        ordersAPI.getAll({ limit: 5 }),
      ])
      if (analyticsRes.status === 'fulfilled') setData(analyticsRes.value.data)
      if (ordersRes.status === 'fulfilled') setRecentOrders(ordersRes.value.data.orders || [])
    } catch { }
    setLoading(false)
  }

  const fmt = (n) => Number(n || 0).toLocaleString('ru-RU')

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>

  const s = data?.summary || {}

  const mainCards = [
    { name: 'Заказы', value: s.totalOrders || 0, sub: `${s.newOrders || 0} новых`, icon: ShoppingBag, color: 'from-blue-500 to-blue-600', link: '/admin/orders' },
    { name: 'Выручка (месяц)', value: `${fmt(s.monthlyRevenue)} сум`, sub: `Всего: ${fmt(s.totalRevenue)} сум`, icon: DollarSign, color: 'from-emerald-500 to-emerald-600', link: '/admin/orders' },
    { name: 'Пользователи', value: s.totalUsers || 0, sub: 'всего', icon: Users, color: 'from-violet-500 to-violet-600', link: '/admin/users' },
    { name: 'Средний чек', value: `${fmt(s.avgOrderValue)} сум`, sub: `Сегодня: ${fmt(s.todayRevenue)} сум`, icon: TrendingUp, color: 'from-orange-500 to-orange-600', link: '/admin/orders' },
  ]

  const maxRevenue = Math.max(...(data?.revenueByMonth || []).map(m => m.revenue), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink font-display tracking-wide">Панель управления</h1>
          <p className="text-ink-dim mt-1">Обзор e-commerce</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-ink-dim">
          <Activity size={16} />
          <span>{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.name} to={card.link} className="group relative overflow-hidden bg-bg-surface rounded-2xl p-5 shadow-card border border-ink-line hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div className={`bg-gradient-to-br ${card.color} p-2.5 rounded-xl shadow-lg`}><Icon className="text-white" size={20} /></div>
                <ArrowUpRight size={16} className="text-ink-line group-hover:text-ink-dim transition-colors" />
              </div>
              <p className="text-2xl font-bold text-ink font-display">{card.value}</p>
              <p className="text-sm text-ink-dim mt-0.5">{card.name}</p>
              {card.sub && <p className="text-xs text-ink-mute mt-1">{card.sub}</p>}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </Link>
          )
        })}
      </div>

      {/* Revenue chart + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by month */}
        <div className="lg:col-span-2 bg-bg-surface rounded-2xl shadow-card border border-ink-line p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-emerald-600" />
            <h2 className="text-lg font-semibold text-ink">Выручка по месяцам</h2>
          </div>
          <div className="flex items-end gap-2 h-48">
            {Array.from({ length: 12 }, (_, i) => {
              const m = (data?.revenueByMonth || []).find(r => r._id === i + 1)
              const rev = m?.revenue || 0
              const h = maxRevenue > 0 ? (rev / maxRevenue * 100) : 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    {false && <span className="text-[10px] text-ink-mute mb-1">{(rev / 1000000).toFixed(1)}M</span>}
                    <div className={`w-full max-w-[32px] rounded-t-lg transition-all ${rev > 0 ? 'bg-gradient-to-t from-emerald-500 to-emerald-400' : 'bg-bg-surface2'}`} style={{ height: `${Math.max(h, 4)}%` }} />
                  </div>
                  <span className="text-[10px] text-ink-mute">{MONTH_NAMES[i]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-bg-surface rounded-2xl shadow-card border border-ink-line">
          <div className="flex items-center justify-between p-5 border-b border-ink-line">
            <h2 className="font-semibold text-ink flex items-center gap-2"><ShoppingBag size={16} className="text-blue-600" /> Новые заказы</h2>
            <Link to="/admin/orders" className="text-sm text-primary flex items-center gap-1"><ArrowRight size={14} /></Link>
          </div>
          <div className="divide-y divide-ink-line">
            {recentOrders.length > 0 ? recentOrders.map(order => (
              <Link key={order._id} to={`/admin/orders/${order._id}`} className="p-3 flex items-center justify-between hover:bg-bg-surface2 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium text-ink text-sm truncate">{order.customerName || '—'}</p>
                  <p className="text-xs text-ink-mute">{order.customerPhone}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="font-bold text-sm text-ink">{fmt(order.totalPrice)}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-bg-surface2'}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
              </Link>
            )) : <div className="p-6 text-center text-ink-mute text-sm">Нет заказов</div>}
          </div>
        </div>
      </div>

      {/* Bottom row: Top Products + Districts + Payment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="bg-bg-surface rounded-2xl shadow-card border border-ink-line p-5">
          <h2 className="font-semibold text-ink flex items-center gap-2 mb-3"><Package size={16} className="text-primary" /> Топ товары</h2>
          <div className="space-y-2">
            {(data?.topProducts || []).slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-ink-dim truncate flex-1">{i + 1}. {p.name}</span>
                <span className="font-bold text-ink ml-2">{p.totalSold} шт</span>
              </div>
            ))}
            {(!data?.topProducts || data.topProducts.length === 0) && <p className="text-ink-mute text-sm">Нет данных</p>}
          </div>
        </div>

        {/* Districts */}
        <div className="bg-bg-surface rounded-2xl shadow-card border border-ink-line p-5">
          <h2 className="font-semibold text-ink flex items-center gap-2 mb-3"><MapPin size={16} className="text-amber-600" /> Районы</h2>
          <div className="space-y-2">
            {(data?.ordersByDistrict || []).slice(0, 5).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-ink-dim truncate flex-1">{d._id}</span>
                <span className="font-bold text-ink ml-2">{d.count}</span>
              </div>
            ))}
            {(!data?.ordersByDistrict || data.ordersByDistrict.length === 0) && <p className="text-ink-mute text-sm">Нет данных</p>}
          </div>
        </div>

        {/* Payment methods */}
        <div className="bg-bg-surface rounded-2xl shadow-card border border-ink-line p-5">
          <h2 className="font-semibold text-ink flex items-center gap-2 mb-3"><CreditCard size={16} className="text-emerald-600" /> Оплата</h2>
          <div className="space-y-3">
            {(data?.ordersByPayment || []).map((p, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-ink-dim uppercase">{p._id}</span>
                <span className="font-bold text-ink">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
