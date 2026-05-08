import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, Clock, Package, MapPin, CreditCard, XCircle, Truck } from 'lucide-react'

const STATUS_CONFIG = {
  new:        { label: 'Yangi buyurtma',   color: 'bg-blue-100 text-blue-700',     icon: Clock },
  processing: { label: 'Tayyorlanmoqda',  color: 'bg-yellow-100 text-yellow-700', icon: Package },
  confirmed:  { label: 'Tasdiqlangan',    color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  completed:  { label: 'Yakunlangan',     color: 'bg-green-100 text-green-700',   icon: CheckCircle },
  delivered:  { label: 'Yetkazildi',      color: 'bg-emerald-100 text-emerald-700', icon: Truck },
  cancelled:  { label: 'Bekor qilindi',   color: 'bg-red-100 text-red-700',       icon: XCircle },
}

const PAYMENT_LABELS = {
  cash: 'Naqd pul',
  card: 'Karta',
  online: 'Online',
  payme: 'Payme',
  click: 'Click',
}

export default function AfterSales() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fmt = (n) => Number(n || 0).toLocaleString('ru-RU')

  useEffect(() => {
    fetch(`/api/orders/service/${token}`)
      .then(r => {
        if (!r.ok) throw new Error('Buyurtma topilmadi')
        return r.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-xs">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="text-red-500" size={32} />
          </div>
          <h1 className="font-bold text-gray-900 text-lg">Buyurtma topilmadi</h1>
          <p className="text-gray-500 text-sm">Ushbu QR kod haqiqiy emas yoki buyurtma o'chirilgan.</p>
        </div>
      </div>
    )
  }

  const { order, items } = data
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.new
  const StatusIcon = statusCfg.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 text-white px-4 py-5 text-center">
        <p className="text-red-200 text-xs uppercase tracking-widest mb-1">MeatZone</p>
        <h1 className="text-xl font-bold">Buyurtma ma'lumoti</h1>
        <p className="text-red-200 text-sm mt-1">#{order.shortId}</p>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Status card */}
        <div className="bg-white rounded-2xl border p-5 text-center shadow-sm">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${statusCfg.color}`}>
            <StatusIcon size={16} />
            {statusCfg.label}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {new Date(order.createdAt).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
          {order.deliveryTime && (
            <p className="text-xs text-green-600 mt-1">
              Yetkazish vaqti: {new Date(order.deliveryTime).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
          )}
        </div>

        {/* Customer info */}
        <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-3">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <MapPin size={15} className="text-red-500" /> Yetkazib berish
          </h2>
          <div className="space-y-1 text-sm">
            <p className="font-medium text-gray-900">{order.customerName}</p>
            <p className="text-gray-600">{order.address}{order.district ? `, ${order.district}` : ''}</p>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-3">
            <Package size={15} className="text-red-500" /> Mahsulotlar
          </h2>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {item.image && (
                  <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-contain bg-gray-50 border" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{fmt(item.price)} × {item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-gray-900 shrink-0">{fmt(item.price * item.quantity)} so'm</p>
              </div>
            ))}
          </div>

          {/* Pricing breakdown */}
          <div className="border-t mt-4 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Mahsulotlar</span>
              <span>{fmt(order.subTotal)} so'm</span>
            </div>
            {order.promoDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Promo chegirma</span>
                <span>−{fmt(order.promoDiscount)} so'm</span>
              </div>
            )}
            {order.coinDiscount > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Coin chegirma</span>
                <span>−{fmt(order.coinDiscount)} so'm</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Yetkazib berish</span>
              <span>{order.isFreeDelivery ? <span className="text-green-600">Bepul</span> : `${fmt(order.deliveryFee)} so'm`}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2">
              <span>Jami</span>
              <span>{fmt(order.totalPrice)} so'm</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-3">
            <CreditCard size={15} className="text-red-500" /> To'lov
          </h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Usul:</span>
            <span className="font-medium">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || '—'}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Holat:</span>
            <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
              order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
              order.paymentStatus === 'refunded' ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {order.paymentStatus === 'paid' ? 'To\'langan' :
               order.paymentStatus === 'refunded' ? 'Qaytarildi' : 'Kutilmoqda'}
            </span>
          </div>
        </div>

        {order.comment && (
          <div className="bg-white rounded-2xl border p-5 shadow-sm text-sm">
            <p className="font-bold text-gray-900 mb-1">Izoh</p>
            <p className="text-gray-600">{order.comment}</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">MeatZone © {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
