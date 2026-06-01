import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ordersAPI, usersAPI } from '../../services/api'
import {
  ArrowLeft, Phone, Mail, Calendar, User, Shield, Truck,
  UserCheck, MapPin, Package, CreditCard, TrendingUp,
  ShoppingBag, CheckCircle, XCircle, Clock, ChevronRight
} from 'lucide-react'

const ROLE_LABELS = {
  customer: { label: 'Mijoz', color: 'bg-gray-100 text-gray-700', icon: User },
  driver: { label: 'Kurer', color: 'bg-blue-100 text-blue-700', icon: Truck },
  operator: { label: 'Operator', color: 'bg-purple-100 text-purple-700', icon: UserCheck },
  manager: { label: 'Menejer', color: 'bg-orange-100 text-orange-700', icon: UserCheck },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700', icon: Shield },
}

const STATUS_LABELS = {
  new: { label: 'Yangi', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Tayyorlanmoqda', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Tasdiqlangan', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Bajarildi', color: 'bg-green-100 text-green-700' },
  delivered: { label: 'Yetkazildi', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Bekor qilindi', color: 'bg-red-100 text-red-700' },
}

const PAYMENT_LABELS = {
  pending: { label: 'Kutilmoqda', color: 'bg-gray-100 text-gray-600' },
  paid: { label: 'To\'langan', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Xatolik', color: 'bg-red-100 text-red-700' },
  refunded: { label: 'Qaytarildi', color: 'bg-orange-100 text-orange-700' },
}

function fmt(n) {
  return Number(n || 0).toLocaleString('ru-RU')
}

export default function AdminUserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(location.state?.user || null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      // If user not passed via state, fetch from users list (not ideal but works)
      if (!user) {
        const res = await usersAPI.getAll({ limit: 1000 })
        const found = (res.data.users || []).find(u => u._id === id)
        if (found) setUser(found)
      }

      // Fetch orders by phone if available
      const phone = user?.phone || location.state?.user?.phone
      if (phone) {
        const orderRes = await ordersAPI.getByPhone(phone)
        setOrders(orderRes.data.orders || [])
      } else {
        setOrders([])
      }
    } catch (err) {
      console.error('Load user detail error:', err)
      setError('Ma\'lumotlarni yuklashda xatolik')
    }
    setLoading(false)
  }

  if (loading && !user) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-gray-400 gap-3">
        <User size={48} className="text-gray-200" />
        <p>Foydalanuvchi topilmadi</p>
        <button onClick={() => navigate('/admin/users')} className="text-blue-600 text-sm font-medium">
          Foydalanuvchilar ro\'yxatiga qaytish
        </button>
      </div>
    )
  }

  const roleInfo = ROLE_LABELS[user.role] || ROLE_LABELS.customer
  const RoleIcon = roleInfo.icon

  const totalSpent = orders.reduce((s, o) => s + (o.totalPrice || 0), 0)
  const totalOrders = orders.length
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/users')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Foydalanuvchi profili</h1>
          <p className="text-xs text-gray-500 font-mono">ID: {user._id}</p>
        </div>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border shadow-sm overflow-hidden"
      >
        <div className="p-6 flex flex-col sm:flex-row gap-5 items-start">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white text-3xl font-bold shrink-0 shadow-lg">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">{user.name || '—'}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${roleInfo.color}`}>
                  <RoleIcon size={12} />
                  {roleInfo.label}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {user.isActive ? 'Faol' : 'Nofaol'}
                </span>
                {user.source === 'telegram' && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600 flex items-center gap-1">
                    <Shield size={10} /> Telegram
                  </span>
                )}
              </div>
              {user.telegramUsername && (
                <p className="text-sm text-blue-600 mt-0.5">@{user.telegramUsername}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} className="text-gray-400" />
                {user.phone ? (
                  <a href={`tel:${user.phone}`} className="text-blue-600 font-medium hover:underline">{user.phone}</a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={14} className="text-gray-400" />
                {user.email ? (
                  <span className="text-gray-700">{user.email}</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-gray-700">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={14} className="text-gray-400" />
                {user.telegramId ? (
                  <span className="text-gray-700 font-mono text-xs">TG: {user.telegramId}</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingBag}
          label="Jami buyurtmalar"
          value={totalOrders}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Jami xarid"
          value={`${fmt(totalSpent)} so'm`}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={CheckCircle}
          label="Bajarildi"
          value={completedOrders}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={XCircle}
          label="Bekor qilindi"
          value={cancelledOrders}
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* Orders Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Package size={18} className="text-primary" />
            Buyurtmalar tarixi
          </h3>
          <span className="text-sm text-gray-500">{totalOrders} ta</span>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
            <ShoppingBag size={48} className="text-gray-200" />
            <p>Buyurtmalar topilmadi</p>
            {user.phone ? null : (
              <p className="text-xs text-gray-300">Foydalanuvchiga telefon raqam biriktirilmagan</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Buyurtma</th>
                  <th className="px-4 py-3 text-left">Sana</th>
                  <th className="px-4 py-3 text-left">Manzil</th>
                  <th className="px-4 py-3 text-center">Holat</th>
                  <th className="px-4 py-3 text-center">To'lov</th>
                  <th className="px-4 py-3 text-right">Jami</th>
                  <th className="px-4 py-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(order => {
                  const status = STATUS_LABELS[order.status] || STATUS_LABELS.new
                  const payment = PAYMENT_LABELS[order.paymentStatus] || PAYMENT_LABELS.pending
                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/orders/${order._id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">#{order._id?.slice(-6).toUpperCase()}</div>
                        <div className="text-xs text-gray-500">
                          {order.items?.length || 0} ta mahsulot
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-gray-400" />
                          {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                        <div className="text-xs text-gray-400 ml-5">
                          {new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-600 max-w-[200px] truncate">
                          <MapPin size={12} className="text-gray-400 shrink-0" />
                          <span className="truncate">{order.address || '—'}</span>
                        </div>
                        {order.district && (
                          <div className="text-xs text-gray-400 ml-5">{order.district}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${payment.color}`}>
                            {payment.label}
                          </span>
                          <span className="text-[10px] text-gray-400">{order.paymentMethod || ''}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 tabular">
                        {fmt(order.totalPrice)} so'm
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ChevronRight size={16} className="text-gray-400" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border p-4 flex items-center gap-3 shadow-sm"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-lg font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </motion.div>
  )
}
