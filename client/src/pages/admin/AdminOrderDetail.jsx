import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ordersAPI } from '../../services/api'
import { ArrowLeft, User, Phone, MapPin, CreditCard, Clock, CheckCircle, Package, MessageSquare, ExternalLink, RotateCcw, X } from 'lucide-react'
import api from '../../services/api'

const STATUS_LABELS = {
  new: { label: 'Новый', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'В обработке', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Подтверждён', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Выполнен', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Отменён', color: 'bg-red-100 text-red-700' },
}
const STATUS_FLOW = ['new', 'processing', 'confirmed', 'completed']

export default function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [paymentHistory, setPaymentHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [deliveryTime, setDeliveryTime] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [refundModal, setRefundModal] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)

  const fmt = (n) => Number(n || 0).toLocaleString('ru-RU')

  useEffect(() => { fetchOrder() }, [id])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await ordersAPI.getById(id)
      setOrder(res.data.order)
      setItems(res.data.items || [])
      setPaymentHistory(res.data.paymentHistory || [])
      if (res.data.order.deliveryTime) setDeliveryTime(new Date(res.data.order.deliveryTime).toISOString().slice(0, 16))
      if (res.data.order.adminNotes) setAdminNotes(res.data.order.adminNotes)
    } catch { alert('Заказ не найден') }
    setLoading(false)
  }

  const handleConfirm = async () => {
    setSaving(true)
    try {
      await ordersAPI.confirm(id, { deliveryTime, adminNotes })
      fetchOrder()
    } catch { alert('Ошибка подтверждения') }
    setSaving(false)
  }

  const handleStatusChange = async (status) => {
    try {
      await ordersAPI.update(id, { status })
      setOrder(prev => ({ ...prev, status }))
    } catch { alert('Ошибка') }
  }

  const handleRefund = async () => {
    if (!window.confirm('Точно оформить возврат?')) return
    setRefunding(true)
    try {
      await api.post(`/orders/${id}/refund`, { reason: refundReason })
      setRefundModal(false)
      setRefundReason('')
      fetchOrder()
    } catch (e) { alert(e.response?.data?.message || 'Ошибка возврата') }
    setRefunding(false)
  }

  const handleMarkPaid = async () => {
    try {
      await ordersAPI.update(id, { paymentStatus: 'paid', paymentMethod: 'cash', paidAt: new Date() })
      fetchOrder()
    } catch { alert('Ошибка') }
  }

  if (loading) return <div className="p-12 text-center text-gray-400">Загрузка...</div>
  if (!order) return <div className="p-12 text-center text-gray-400">Заказ не найден</div>

  const mapUrl = order.latitude ? `https://maps.google.com/?q=${order.latitude},${order.longitude}` : null

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/orders')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Заказ ...{order._id.slice(-6)}</h1>
          <p className="text-xs text-gray-500 font-mono">{order._id}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${(STATUS_LABELS[order.status] || STATUS_LABELS.new).color}`}>
          {(STATUS_LABELS[order.status] || STATUS_LABELS.new).label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer card */}
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><User size={16} /> Клиент</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Имя:</span> <span className="font-medium">{order.customerName || '—'}</span></div>
              <div><span className="text-gray-500">Телефон:</span> <a href={`tel:${order.customerPhone}`} className="font-medium text-blue-600">{order.customerPhone}</a></div>
              <div><span className="text-gray-500">Адрес:</span> <span className="font-medium">{order.address || '—'}</span></div>
              <div><span className="text-gray-500">Район:</span> <span className="font-medium">{order.district || '—'}</span></div>
              {order.telegramId && <div><span className="text-gray-500">Telegram:</span> <span className="font-medium">{order.telegramId}</span></div>}
            </div>
          </div>

          {/* Map */}
          {mapUrl && (
            <div className="bg-white rounded-xl border p-5">
              <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3"><MapPin size={16} /> Геолокация</h2>
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${order.latitude},${order.longitude}&zoom=15&size=600x200&markers=color:red|${order.latitude},${order.longitude}&key=placeholder`}
                  alt="Map"
                  className="w-full h-48 bg-gray-100 rounded-lg object-cover"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                  <ExternalLink size={14} /> Открыть в Google Maps ({order.latitude.toFixed(4)}, {order.longitude.toFixed(4)})
                </p>
              </a>
            </div>
          )}

          {/* Items */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3"><Package size={16} /> Товары</h2>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {item.image && <img src={item.image} alt="" className="w-12 h-12 object-contain rounded" />}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">{fmt(item.price)} x {item.quantity}</p>
                  </div>
                  <p className="font-bold text-sm">{fmt(item.price * item.quantity)} сум</p>
                </div>
              ))}
              <div className="flex justify-between pt-3 border-t font-bold">
                <span>Итого:</span>
                <span>{fmt(order.totalPrice)} сум</span>
              </div>
            </div>
          </div>

          {/* Payment history */}
          {paymentHistory.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3"><CreditCard size={16} /> История оплат</h2>
              <div className="space-y-2">
                {paymentHistory.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <span className="font-medium uppercase">{p.provider}</span>
                      <span className="text-gray-500 ml-2">ID: {p.transactionId || '—'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{fmt(p.amount)} сум</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'paid' ? 'bg-green-100 text-green-700' :
                        p.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                          p.status === 'refunded' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                        }`}>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — Actions */}
        <div className="space-y-6">
          {/* Status controls */}
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><CheckCircle size={16} /> Управление</h2>
            <div className="space-y-2">
              {STATUS_FLOW.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={order.status === s}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${order.status === s ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                >
                  {(STATUS_LABELS[s] || {}).label}
                </button>
              ))}
              <button
                onClick={() => handleStatusChange('cancelled')}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100"
              >
                Отменить заказ
              </button>
            </div>
          </div>

          {/* Confirm + Delivery time */}
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><Clock size={16} /> Подтверждение</h2>
            <label className="block text-xs text-gray-500 font-medium">Время доставки</label>
            <input
              type="datetime-local"
              value={deliveryTime}
              onChange={e => setDeliveryTime(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <label className="block text-xs text-gray-500 font-medium">Заметки</label>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : 'Подтвердить заказ'}
            </button>
          </div>

          {/* Payment actions */}
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><CreditCard size={16} /> Оплата</h2>
            <div className="text-sm space-y-1">
              <p><span className="text-gray-500">Статус:</span> <span className="font-medium">{order.paymentStatus}</span></p>
              <p><span className="text-gray-500">Метод:</span> <span className="font-medium">{order.paymentMethod || '—'}</span></p>
              {order.paidAt && <p><span className="text-gray-500">Оплачен:</span> <span className="font-medium">{new Date(order.paidAt).toLocaleString('ru-RU')}</span></p>}
            </div>
            {order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded' && (
              <button onClick={handleMarkPaid} className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                Отметить как оплачено (наличные)
              </button>
            )}
            {order.paymentStatus === 'paid' && (
              <button onClick={() => setRefundModal(true)} className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center justify-center gap-2">
                <RotateCcw size={14} /> Оформить возврат
              </button>
            )}
            {order.paymentStatus === 'refunded' && (
              <p className="text-center text-sm font-medium text-orange-600 bg-orange-50 py-2 rounded-lg">Возврат оформлен</p>
            )}
          </div>

          {/* Info */}
          {order.comment && (
            <div className="bg-white rounded-xl border p-5">
              <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-2"><MessageSquare size={16} /> Комментарий</h2>
              <p className="text-sm text-gray-700">{order.comment}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl border p-4 text-xs text-gray-500 space-y-1">
            <p>Создан: {new Date(order.createdAt).toLocaleString('ru-RU')}</p>
            {order.confirmedAt && <p>Подтверждён: {new Date(order.confirmedAt).toLocaleString('ru-RU')}</p>}
            {order.deliveryTime && <p>Доставка: {new Date(order.deliveryTime).toLocaleString('ru-RU')}</p>}
          </div>
        </div>
      </div>
      {/* Refund modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><RotateCcw size={18} className="text-red-500" /> Возврат средств</h3>
              <button onClick={() => setRefundModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-600 mb-3">Заказ: <strong>...{order._id.slice(-6)}</strong> — {fmt(order.totalPrice)} сум</p>
            <label className="block text-xs text-gray-500 font-medium mb-1">Причина возврата</label>
            <textarea
              value={refundReason}
              onChange={e => setRefundReason(e.target.value)}
              placeholder="Необязательно..."
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-red-400 focus:outline-none mb-4"
            />
            <button
              onClick={handleRefund}
              disabled={refunding}
              className="w-full py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {refunding ? 'Обработка...' : 'Подтвердить возврат'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
