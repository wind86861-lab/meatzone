import { useState, useEffect, useCallback } from 'react'
import { operatorAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import {
  LogOut, RefreshCw, Phone, MapPin, Package, Clock,
  CheckCircle, Truck, Banknote, CreditCard, ChevronDown,
  ChevronUp, User, AlertCircle, XCircle
} from 'lucide-react'

const fmt = (n) => Number(n || 0).toLocaleString('ru-RU')

const STATUS_LABELS = {
  new: { label: 'Yangi', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Tayyorlanmoqda', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Tasdiqlangan', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Bekor', color: 'bg-red-100 text-red-700' },
}

const DELIVERY_LABELS = {
  pending: { label: 'Kutilmoqda', color: 'text-gray-500' },
  assigned: { label: 'Kuryer belgilangan', color: 'text-blue-600' },
  in_transit: { label: 'Yo\'lda', color: 'text-amber-600' },
  delivered: { label: 'Yetkazildi', color: 'text-emerald-600' },
  failed: { label: 'Muvaffaqiyatsiz', color: 'text-red-600' },
}

function OrderCard({ order, drivers, onRefresh }) {
  const [expanded, setExpanded] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(order.assignedDriver?._id || '')
  const [assigning, setAssigning] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  const st = STATUS_LABELS[order.status] || STATUS_LABELS.new
  const dt = DELIVERY_LABELS[order.deliveryStatus] || DELIVERY_LABELS.pending

  const handleAssignDriver = async () => {
    if (!selectedDriver) return
    setAssigning(true)
    try {
      await operatorAPI.assignDriver(order._id, selectedDriver)
      onRefresh()
    } catch (e) {
      alert(e.response?.data?.message || 'Xato')
    } finally { setAssigning(false) }
  }

  const handleConfirmCash = async () => {
    if (!confirm("Naqd to'lov qabul qilindimi?")) return
    setConfirming(true)
    try {
      await operatorAPI.confirmCash(order._id)
      onRefresh()
    } catch (e) {
      alert(e.response?.data?.message || 'Xato')
    } finally { setConfirming(false) }
  }

  const handleStatus = async (status) => {
    setStatusLoading(true)
    try {
      await operatorAPI.updateStatus(order._id, status)
      onRefresh()
    } catch (e) {
      alert(e.response?.data?.message || 'Xato')
    } finally { setStatusLoading(false) }
  }

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 60000)
    if (diff < 1) return 'Hozir'
    if (diff < 60) return `${diff} daq oldin`
    return `${Math.floor(diff / 60)} soat oldin`
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${order.status === 'new' ? 'border-blue-200' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-gray-900">#{String(order._id).slice(-6).toUpperCase()}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
            {order.paymentMethod === 'cash' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium flex items-center gap-1">
                <Banknote size={11} /> Naqd
              </span>
            )}
            {order.paymentStatus === 'paid' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">To'langan</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
            <span className="flex items-center gap-1"><User size={13} /> {order.customerName}</span>
            <a href={`tel:${order.customerPhone}`} className="flex items-center gap-1 text-blue-600">
              <Phone size={13} /> {order.customerPhone}
            </a>
            <span className="flex items-center gap-1 text-gray-400"><Clock size={13} /> {timeAgo(order.createdAt)}</span>
          </div>
          <div className="flex items-start gap-1 text-xs text-gray-500 mt-1">
            <MapPin size={12} className="mt-0.5 shrink-0" />
            <span>{order.address}, {order.district}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-gray-900">{fmt(order.totalPrice)} so'm</div>
          <div className="text-xs text-gray-400">{order.items?.length || 0} ta mahsulot</div>
          <button onClick={() => setExpanded(p => !p)}
            className="mt-1 text-gray-400 hover:text-gray-600 flex items-center gap-0.5 text-xs ml-auto">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Yopish' : 'Batafsil'}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
          {/* Items */}
          {order.items?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Mahsulotlar</p>
              <div className="space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{item.name} × {item.quantity}</span>
                    <span className="text-gray-900 font-medium">{fmt(item.price * item.quantity)} so'm</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-sm font-semibold">
                <span>Jami</span>
                <span>{fmt(order.totalPrice)} so'm</span>
              </div>
            </div>
          )}

          {order.comment && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
              💬 {order.comment}
            </div>
          )}

          {/* Delivery status */}
          <div className="flex items-center gap-2">
            <Truck size={14} className="text-gray-400" />
            <span className={`text-sm font-medium ${dt.color}`}>{dt.label}</span>
            {order.assignedDriver && (
              <span className="text-xs text-gray-500">— {order.assignedDriver.name}</span>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Assign driver */}
            {order.status !== 'cancelled' && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Kuryer belgilash</p>
                <div className="flex gap-2">
                  <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="">Kuryer tanlang...</option>
                    {drivers.map(d => (
                      <option key={d._id} value={d._id}>{d.name} {d.phone ? `(${d.phone})` : ''}</option>
                    ))}
                  </select>
                  <button onClick={handleAssignDriver} disabled={assigning || !selectedDriver}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {assigning ? '...' : 'Belgilash'}
                  </button>
                </div>
              </div>
            )}

            {/* Status buttons */}
            <div className="flex gap-2 flex-wrap">
              {order.status === 'new' && (
                <button onClick={() => handleStatus('processing')} disabled={statusLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium hover:bg-amber-200 disabled:opacity-50">
                  <Package size={13} /> Tayyorlanmoqda
                </button>
              )}
              {order.status === 'processing' && (
                <button onClick={() => handleStatus('confirmed')} disabled={statusLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium hover:bg-emerald-200 disabled:opacity-50">
                  <CheckCircle size={13} /> Tasdiqlash
                </button>
              )}
              {order.status !== 'cancelled' && (
                <button onClick={() => handleStatus('cancelled')} disabled={statusLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 disabled:opacity-50">
                  <XCircle size={13} /> Bekor qilish
                </button>
              )}

              {/* Confirm cash */}
              {order.paymentMethod === 'cash' && order.paymentStatus !== 'paid' && (
                <button onClick={handleConfirmCash} disabled={confirming}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-lg text-xs font-medium hover:bg-orange-200 disabled:opacity-50">
                  <Banknote size={13} /> {confirming ? '...' : "Naqd tasdiqlash"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OperatorDashboard() {
  const [orders, setOrders] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [filter, setFilter] = useState('all')
  const logout = useAuthStore(s => s.logout)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [feedRes, driversRes] = await Promise.all([
        operatorAPI.getFeed(),
        operatorAPI.getDrivers(),
      ])
      setOrders(feedRes.data.orders || [])
      setDrivers(driversRes.data.drivers || [])
      setLastRefresh(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // auto-refresh every 30s
    return () => clearInterval(interval)
  }, [fetchData])

  const filtered = orders.filter(o => {
    if (filter === 'all') return true
    if (filter === 'new') return o.status === 'new'
    if (filter === 'cash') return o.paymentMethod === 'cash' && o.paymentStatus !== 'paid'
    if (filter === 'no_driver') return !o.assignedDriver
    return true
  })

  const counts = {
    all: orders.length,
    new: orders.filter(o => o.status === 'new').length,
    cash: orders.filter(o => o.paymentMethod === 'cash' && o.paymentStatus !== 'paid').length,
    no_driver: orders.filter(o => !o.assignedDriver).length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="font-bold text-gray-900 text-lg">Operator Panel</div>
          <div className="text-xs text-gray-400">
            {lastRefresh ? `Yangilandi: ${lastRefresh.toLocaleTimeString('uz-UZ')}` : 'Yuklanmoqda...'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={loading}
            className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-50">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
            <LogOut size={15} /> Chiqish
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-4 py-3 grid grid-cols-4 gap-2">
        {[
          { key: 'all', label: 'Hammasi', color: 'text-gray-900' },
          { key: 'new', label: 'Yangi', color: 'text-blue-600' },
          { key: 'cash', label: 'Naqd', color: 'text-orange-600' },
          { key: 'no_driver', label: 'Kuryersiz', color: 'text-red-600' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`text-center p-2 rounded-xl border transition-all ${filter === f.key ? 'bg-white shadow-sm border-gray-300' : 'bg-transparent border-transparent'}`}>
            <div className={`text-xl font-bold ${f.color}`}>{counts[f.key]}</div>
            <div className="text-xs text-gray-400 mt-0.5">{f.label}</div>
          </button>
        ))}
      </div>

      {/* Order list */}
      <div className="px-4 pb-8 space-y-3">
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <RefreshCw size={32} className="animate-spin mb-3" />
            <p>Yuklanmoqda...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <AlertCircle size={36} className="mb-3 opacity-40" />
            <p className="font-medium">Buyurtmalar yo'q</p>
            <p className="text-sm mt-1">Hozircha bu filtda buyurtma topilmadi</p>
          </div>
        ) : (
          filtered.map(order => (
            <OrderCard key={order._id} order={order} drivers={drivers} onRefresh={fetchData} />
          ))
        )}
      </div>
    </div>
  )
}
