import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ordersAPI } from '../../services/api'
import { ShoppingCart, Trash2, Phone, User, Search, Eye, MapPin, CreditCard, Filter, Truck, Users, ChevronDown, ChevronUp, Package } from 'lucide-react'

const STATUS_LABELS = {
  new: { label: 'Новый', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'В обработке', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Подтверждён', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Выполнен', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Отменён', color: 'bg-red-100 text-red-700' },
}

const PAYMENT_LABELS = {
  pending: { label: 'Ожидает', color: 'bg-gray-100 text-gray-600' },
  paid: { label: 'Оплачен', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Ошибка', color: 'bg-red-100 text-red-600' },
  refunded: { label: 'Возврат', color: 'bg-orange-100 text-orange-700' },
}

export default function AdminOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [groupByUser, setGroupByUser] = useState(false)
  const [expandedUsers, setExpandedUsers] = useState(new Set())
  const [viewedIds, setViewedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('meatzone_viewed_orders') || '[]')) } catch { return new Set() }
  })

  const markViewed = (id) => {
    setViewedIds(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem('meatzone_viewed_orders', JSON.stringify([...next]))
      return next
    })
  }

  const isNewUnviewed = (order) => order.status === 'new' && !viewedIds.has(order._id)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (statusFilter) params.status = statusFilter
      if (paymentFilter) params.paymentStatus = paymentFilter
      if (searchQuery) params.search = searchQuery
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
      const res = await ordersAPI.getAll(params)
      setOrders(res.data.orders || [])
      setTotal(res.data.total || 0)
    } catch { }
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [page, statusFilter, paymentFilter, dateFrom, dateTo])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchOrders()
  }

  const handleStatusChange = async (id, status) => {
    try {
      await ordersAPI.update(id, { status })
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o))
    } catch { alert('Ошибка') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить заказ?')) return
    try { await ordersAPI.delete(id); fetchOrders() } catch { alert('Ошибка') }
  }

  const totalPages = Math.ceil(total / 20)
  const fmt = (n) => Number(n).toLocaleString('ru-RU')

  // Group orders by customer name (fallback to phone)
  const groupOrders = (list) => {
    const groups = {}
    list.forEach(o => {
      const key = (o.customerName || '—').trim() + '|' + (o.customerPhone || '—')
      if (!groups[key]) groups[key] = { name: o.customerName || '—', phone: o.customerPhone || '—', orders: [], totalSpent: 0 }
      groups[key].orders.push(o)
      groups[key].totalSpent += o.totalPrice || 0
    })
    return Object.values(groups).sort((a, b) => b.orders.length - a.orders.length)
  }

  const toggleUser = (key) => {
    setExpandedUsers(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const expandAll = () => setExpandedUsers(new Set(groupOrders(orders).map(g => g.name + '|' + g.phone)))
  const collapseAll = () => setExpandedUsers(new Set())

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Заказы</h1>
          <p className="text-gray-600 text-sm">{total} заказов</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setGroupByUser(v => !v)} className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${groupByUser ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50'}`}>
            <Users size={14} /> {groupByUser ? 'Список' : 'По клиентам'}
          </button>
          <button onClick={() => setShowFilters(f => !f)} className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
            <Filter size={14} /> Фильтры
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени, телефону или ID..."
            className="w-full pl-9 pr-3 py-2 bg-white text-gray-900 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Найти</button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Все статусы</option>
            {Object.entries(STATUS_LABELS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>
          <select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1) }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Все оплаты</option>
            {Object.entries(PAYMENT_LABELS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Загрузка...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
            <ShoppingCart size={48} className="text-gray-200" />
            <p>Заказов нет</p>
          </div>
        ) : (
          groupByUser ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-gray-500">{groupOrders(orders).length} клиентов</span>
                <div className="flex gap-2">
                  <button onClick={expandAll} className="text-xs text-blue-600 hover:underline">Развернуть все</button>
                  <button onClick={collapseAll} className="text-xs text-blue-600 hover:underline">Свернуть все</button>
                </div>
              </div>
              {groupOrders(orders).map(group => {
                const key = group.name + '|' + group.phone
                const isOpen = expandedUsers.has(key)
                return (
                  <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Customer header */}
                    <div
                      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${group.orders.some(isNewUnviewed) ? 'bg-amber-50' : ''}`}
                      onClick={() => toggleUser(key)}
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{group.name}</span>
                          <span className="text-xs text-gray-500">{group.phone}</span>
                          {group.orders.some(isNewUnviewed) && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">NEW</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <span className="flex items-center gap-1"><Package size={12} /> {group.orders.length} заказ{group.orders.length === 1 ? '' : group.orders.length < 5 ? 'а' : 'ов'}</span>
                          <span className="flex items-center gap-1"><CreditCard size={12} /> {fmt(group.totalSpent)} сум</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                      </div>
                    </div>

                    {/* Orders list */}
                    {isOpen && (
                      <div className="border-t border-gray-100">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase">
                              <tr>
                                <th className="px-4 py-2 text-left">ID</th>
                                <th className="px-4 py-2 text-left">Район</th>
                                <th className="px-4 py-2 text-right">Сумма</th>
                                <th className="px-4 py-2 text-center">Статус</th>
                                <th className="px-4 py-2 text-center">Оплата</th>
                                <th className="px-4 py-2 text-center">Доставка</th>
                                <th className="px-4 py-2 text-center">Водитель</th>
                                <th className="px-4 py-2 text-left">Дата</th>
                                <th className="px-4 py-2 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {group.orders.map(order => {
                                const s = STATUS_LABELS[order.status] || STATUS_LABELS.new
                                const p = PAYMENT_LABELS[order.paymentStatus] || PAYMENT_LABELS.pending
                                const d = order.deliveryStatus || 'pending'
                                const driverName = order.assignedDriver?.name || '—'
                                const deliveryColor = { pending: 'bg-gray-100 text-gray-600', assigned: 'bg-indigo-100 text-indigo-700', in_transit: 'bg-amber-100 text-amber-700', delivered: 'bg-emerald-100 text-emerald-700', failed: 'bg-red-100 text-red-700' }[d] || 'bg-gray-100 text-gray-600'
                                const deliveryLabel = { pending: 'Ожидает', assigned: 'Назначен', in_transit: 'В пути', delivered: 'Доставлен', failed: 'Не доставлен' }[d] || 'Ожидает'
                                return (
                                  <tr key={order._id} className={`hover:bg-gray-50 cursor-pointer ${isNewUnviewed(order) ? 'bg-amber-50' : ''}`} onClick={() => { markViewed(order._id); navigate(`/admin/orders/${order._id}`) }}>
                                    <td className="px-4 py-2 font-mono text-xs text-gray-400">...{order._id.slice(-6)}</td>
                                    <td className="px-4 py-2 text-gray-600 text-xs">{order.district || '—'}</td>
                                    <td className="px-4 py-2 text-right font-semibold text-gray-900">{fmt(order.totalPrice)}</td>
                                    <td className="px-4 py-2 text-center"><span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span></td>
                                    <td className="px-4 py-2 text-center"><span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${p.color}`}>{p.label}</span></td>
                                    <td className="px-4 py-2 text-center"><span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${deliveryColor}`}>{deliveryLabel}</span></td>
                                    <td className="px-4 py-2 text-center text-xs text-gray-600">{driverName}</td>
                                    <td className="px-4 py-2 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString('ru-RU')}</td>
                                    <td className="px-4 py-2 text-center" onClick={e => e.stopPropagation()}>
                                      <div className="flex items-center justify-center gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${order._id}`) }} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Eye size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(order._id) }} className="p-1 hover:bg-red-50 rounded text-red-400"><Trash2 size={14} /></button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Клиент</th>
                    <th className="px-4 py-3 text-left">Район</th>
                    <th className="px-4 py-3 text-right">Сумма</th>
                    <th className="px-4 py-3 text-center">Статус</th>
                    <th className="px-4 py-3 text-center">Оплата</th>
                    <th className="px-4 py-3 text-center">Доставка</th>
                    <th className="px-4 py-3 text-center">Водитель</th>
                    <th className="px-4 py-3 text-left">Дата</th>
                    <th className="px-4 py-3 text-center">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(order => {
                    const s = STATUS_LABELS[order.status] || STATUS_LABELS.new
                    const p = PAYMENT_LABELS[order.paymentStatus] || PAYMENT_LABELS.pending
                    const d = order.deliveryStatus || 'pending'
                    const driverName = order.assignedDriver?.name || '—'
                    const deliveryColor = { pending: 'bg-gray-100 text-gray-600', assigned: 'bg-indigo-100 text-indigo-700', in_transit: 'bg-amber-100 text-amber-700', delivered: 'bg-emerald-100 text-emerald-700', failed: 'bg-red-100 text-red-700' }[d] || 'bg-gray-100 text-gray-600'
                    const deliveryLabel = { pending: 'Ожидает', assigned: 'Назначен', in_transit: 'В пути', delivered: 'Доставлен', failed: 'Не доставлен' }[d] || 'Ожидает'
                    return (
                      <tr key={order._id} className={`hover:bg-gray-50 cursor-pointer ${isNewUnviewed(order) ? 'bg-amber-50' : ''}`} onClick={() => { markViewed(order._id); navigate(`/admin/orders/${order._id}`) }}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">...{order._id.slice(-6)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-400" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">{order.customerName || '—'}</p>
                                {isNewUnviewed(order) && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">NEW</span>}
                              </div>
                              <p className="text-xs text-gray-500">{order.customerPhone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{order.district || '—'}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(order.totalPrice)} <span className="text-xs font-normal">сум</span></td>
                        <td className="px-4 py-3 text-center"><span className={`text-xs px-2 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span></td>
                        <td className="px-4 py-3 text-center"><span className={`text-xs px-2 py-1 rounded-full font-medium ${p.color}`}>{p.label}</span></td>
                        <td className="px-4 py-3 text-center"><span className={`text-xs px-2 py-1 rounded-full font-medium ${deliveryColor} flex items-center justify-center gap-1`}><Truck size={12} />{deliveryLabel}</span></td>
                        <td className="px-4 py-3 text-center text-xs text-gray-600">{driverName}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString('ru-RU')}</td>
                        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${order._id}`) }} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Eye size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(order._id) }} className="p-1.5 hover:bg-red-50 rounded text-red-400"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Стр. {page} из {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50">Назад</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50">Вперёд</button>
          </div>
        </div>
      )}
    </div>
  )
}
