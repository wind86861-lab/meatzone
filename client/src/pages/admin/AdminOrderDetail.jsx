import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api, { ordersAPI, deliveryAPI } from '../../services/api'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { ArrowLeft, CheckCircle, Clock, CreditCard, ExternalLink, MapPin, MessageSquare, Navigation, Package, Phone, Printer, QrCode, RotateCcw, Trash2, Truck, User, X } from 'lucide-react'

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
  const [drivers, setDrivers] = useState([])
  const [selectedDriver, setSelectedDriver] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [refundModal, setRefundModal] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)
  const [qrModal, setQrModal] = useState(false)
  const [qrData, setQrData] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)

  // Route map
  const [mapboxToken, setMapboxToken] = useState(null)
  const [storeLoc, setStoreLoc] = useState(null)
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)

  const fmt = (n) => Number(n || 0).toLocaleString('ru-RU')

  useEffect(() => {
    fetchOrder()
    api.get('/auth/admin/users?role=driver').then(r => setDrivers(r.data?.users || r.data || [])).catch(() => { })
  }, [id])

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

  // Fetch delivery settings (store location + mapbox token)
  useEffect(() => {
    deliveryAPI.getSettings().then(res => {
      setStoreLoc({ lat: res.data.storeLat, lng: res.data.storeLng })
      setMapboxToken(res.data.mapboxToken || null)
    }).catch(() => { })
  }, [])

  // Initialize route map when order + store + token available
  useEffect(() => {
    if (!mapContainerRef.current || !mapboxToken || !storeLoc || !order?.latitude || !order?.longitude) return

    mapboxgl.accessToken = mapboxToken
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [(storeLoc.lng + order.longitude) / 2, (storeLoc.lat + order.latitude) / 2],
      zoom: 12,
    })
    mapRef.current = map

    // Shop marker
    new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([storeLoc.lng, storeLoc.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Магазин'))
      .addTo(map)

    // Customer marker
    new mapboxgl.Marker({ color: '#22c55e' })
      .setLngLat([order.longitude, order.latitude])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Клиент'))
      .addTo(map)

    // Fit bounds
    const bounds = new mapboxgl.LngLatBounds()
    bounds.extend([storeLoc.lng, storeLoc.lat])
    bounds.extend([order.longitude, order.latitude])
    map.fitBounds(bounds, { padding: 40, maxZoom: 14 })

    // Add route geometry if available
    map.on('load', () => {
      if (order.routeGeometry && order.routeGeometry.coordinates) {
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: order.routeGeometry }
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
  }, [order, storeLoc, mapboxToken])

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

  const handleOpenQR = async () => {
    setQrLoading(true)
    setQrModal(true)
    try {
      const res = await api.get(`/orders/${id}/qr`)
      setQrData(res.data)
    } catch { alert('Ошибка генерации QR кода') }
    setQrLoading(false)
  }

  const handlePrintQR = () => {
    const d = new Date(order.createdAt || Date.now())
    const dateStr = d.toLocaleDateString('ru-RU')
    const timeStr = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    const checkId = order._id?.slice(-6).toUpperCase()
    const paid = (order.paymentHistory || []).reduce((s, p) => s + (p.amount || 0), 0)
    const debt = Math.max(0, (order.totalPrice || 0) - paid)

    const itemLines = items.map((it, i) => {
      const lt = (it.price || 0) * (it.quantity || 1)
      return `<div style="font-size:11px;margin-bottom:4px;line-height:1.3">
        <div style="display:flex;gap:4px">
          <b>${i + 1}.</b>
          <span style="flex:1">${it.name}${it.quantity > 1 ? ' ' + it.quantity + 'ta.' : ''}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding-left:16px">
          <span>${it.quantity} x ${fmt(it.price)}</span>
          <b>${fmt(lt)} so'm</b>
        </div>
      </div>`
    }).join('')

    const win = window.open('', '_blank')
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Check — Buyurtma #${checkId}</title>
        <style>
          @page { margin:0; size:72mm auto; }
          body { margin:0; font-family:'Courier New',Courier,monospace; font-size:11px; color:#111; background:#fff; width:72mm; padding:8px; }
          .center { text-align:center; }
          .logo { font-size:20px; font-weight:900; color:#dc2626; font-family:sans-serif; margin-bottom:0; }
          .sub { font-size:10px; color:#666; font-family:sans-serif; font-style:italic; }
          .dashed { border-bottom:2px dashed #333; margin:6px 0; }
          .section-title { font-weight:bold; font-size:10px; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
          .flex { display:flex; justify-content:space-between; }
          .bold { font-weight:bold; }
          .qr { text-align:center; margin:8px 0; }
          .qr img { width:140px; height:140px; }
          .footer { text-align:center; margin-top:8px; }
          .footer .thanks { font-size:13px; font-weight:bold; font-style:italic; }
          .footer .phones { font-size:10px; font-weight:bold; }
          .footer .quality { font-size:8px; color:#666; font-style:italic; margin-top:4px; }
          @media print { body { -webkit-print-color-adjust:exact; } }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="logo">MeatZone</div>
          <div class="sub">Fresh food products</div>
        </div>

        <div class="dashed"></div>

        <div class="flex"><span>Sana:</span><span>${dateStr}</span></div>
        <div class="flex"><span>Vaqt:</span><span>${timeStr}</span></div>
        <div class="flex"><span>Check №:</span><span class="bold">ORD-${checkId}</span></div>

        <div class="dashed"></div>

        <div class="section-title">MIJOZ MA'LUMOTLARI:</div>
        <div>Ism: <b>${order.customerName || '—'}</b></div>
        <div>Tel: <b>${order.customerPhone || '—'}</b></div>

        <div class="dashed"></div>

        <div class="center section-title">─── MAHSULOTLAR ───</div>
        ${itemLines}

        <div class="dashed"></div>

        <div class="flex"><span>Buyurtma narxi:</span><span class="bold">${fmt(order.subTotal || order.totalPrice)} so'm</span></div>
        <div class="flex"><span>To'langan:</span><span>${fmt(paid)} so'm</span></div>
        <div class="flex bold"><span>Umumiy qarzdorlik:</span><span>${fmt(debt || order.totalPrice)} so'm</span></div>

        <div class="dashed"></div>

        <div class="footer">
          <div class="thanks">Haridingiz uchun RAHMAT!</div>
          <div style="font-size:9px;color:#666;margin-top:4px">Murojaat uchun:</div>
          <div class="phones">+998 90 123-45-67</div>
          <div class="phones">+998 91 234-56-78</div>
          <div style="font-size:9px;color:#888;margin-top:4px">${dateStr} ${timeStr}</div>
        </div>

        <div class="dashed"></div>

        <div class="center quality">
          Sifatli muzlatilgan mahsulotlar bilan<br>xizmatdamiz!
        </div>

        <div class="qr">
          <img src="${qrData.qr}" alt="QR" />
          <div style="font-size:9px;color:#888">Skanerlang va buyurtmani kuzating</div>
        </div>

        <script>window.onload = () => { setTimeout(() => window.print(), 300); }<\/script>
      </body>
      </html>
    `)
    win.document.close()
  }

  if (loading) return <div className="p-12 text-center text-gray-400">Загрузка...</div>
  if (!order) return <div className="p-12 text-center text-gray-400">Заказ не найден</div>

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/orders')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Заказ ...{order._id.slice(-6)}</h1>
          <p className="text-xs text-gray-500 font-mono">{order._id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/orders/${id}/check`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition"
          >
            <Printer size={15} /> Check chiqarish
          </button>
          <button
            onClick={handleOpenQR}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
          >
            <QrCode size={15} /> Print QR
          </button>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${(STATUS_LABELS[order.status] || STATUS_LABELS.new).color}`}>
            {(STATUS_LABELS[order.status] || STATUS_LABELS.new).label}
          </span>
          {order.deliveryStatus && (
            <span className={`text-sm px-3 py-1 rounded-full font-medium flex items-center gap-1 ${order.deliveryStatus === 'pending' ? 'bg-gray-100 text-gray-600' :
              order.deliveryStatus === 'assigned' ? 'bg-indigo-100 text-indigo-700' :
                order.deliveryStatus === 'in_transit' ? 'bg-amber-100 text-amber-700' :
                  order.deliveryStatus === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-red-100 text-red-700'
              }`}>
              <Truck size={14} />
              {order.deliveryStatus === 'pending' ? 'Ожидает' :
                order.deliveryStatus === 'assigned' ? 'Назначен' :
                  order.deliveryStatus === 'in_transit' ? 'В пути' :
                    order.deliveryStatus === 'delivered' ? 'Доставлен' : 'Не доставлен'}
            </span>
          )}
        </div>
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

          {/* Route Map */}
          {order.latitude && order.longitude && mapboxToken && (
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900 flex items-center gap-2"><Navigation size={16} /> Маршрут доставки</h2>
                {order.distance !== null && (
                  <div className="text-sm text-gray-600">
                    🚗 {order.distance} km
                    {order.duration && ` • ~${order.duration}`}
                  </div>
                )}
              </div>
              <div ref={mapContainerRef} className="w-full h-[260px] bg-gray-100 rounded-lg" />
              <a
                href={`https://www.google.com/maps/dir/${storeLoc?.lat},${storeLoc?.lng}/${order.latitude},${order.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 mt-2 flex items-center gap-1"
              >
                <ExternalLink size={14} /> Открыть маршрут в Google Maps
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
              <div className="flex justify-between pt-2 border-t text-sm">
                <span className="text-gray-500">Подытог:</span>
                <span className="font-medium">{fmt(order.subTotal || order.totalPrice - (order.deliveryFee || 0))} сум</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Доставка:</span>
                  <span className="font-medium">{fmt(order.deliveryFee)} сум</span>
                </div>
              )}
              {order.isFreeDelivery && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Доставка бесплатно:</span>
                  <span className="font-medium">0 сум</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t font-bold">
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

          {/* Driver assignment */}
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><Truck size={16} /> Водитель</h2>
            {order.assignedDriver ? (
              <div className="text-sm space-y-1">
                <p className="font-medium text-gray-900">{order.assignedDriver.name || 'Водитель'}</p>
                {order.assignedDriver.phone && (
                  <a href={`tel:${order.assignedDriver.phone}`} className="text-blue-600 flex items-center gap-1">
                    <Phone size={14} /> {order.assignedDriver.phone}
                  </a>
                )}
              </div>
            ) : order.driverTelegramId ? (
              <div className="text-sm space-y-1">
                <p className="font-medium text-gray-900">Курьер назначен (Telegram)</p>
                <p className="text-gray-500">ID: {order.driverTelegramId}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Водитель не назначен</p>
                <div className="flex gap-2">
                  <select
                    value={selectedDriver}
                    onChange={e => setSelectedDriver(e.target.value)}
                    className="flex-1 bg-white border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Выберите водителя</option>
                    {drivers.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      if (!selectedDriver) return
                      setAssigning(true)
                      try {
                        await api.post(`/orders/${id}/assign-driver`, { driverId: selectedDriver })
                        fetchOrder()
                      } catch { alert('Ошибка назначения') }
                      finally { setAssigning(false) }
                    }}
                    disabled={!selectedDriver || assigning}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {assigning ? '...' : 'Назначить'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Confirm + Delivery time */}
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><Clock size={16} /> Подтверждение</h2>
            <label className="block text-xs text-gray-500 font-medium">Время доставки</label>
            <input
              type="datetime-local"
              value={deliveryTime}
              onChange={e => setDeliveryTime(e.target.value)}
              className="w-full bg-white text-gray-900 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <label className="block text-xs text-gray-500 font-medium">Заметки</label>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              rows={2}
              className="w-full bg-white text-gray-900 border rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
      {/* QR Print modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <QrCode size={18} className="text-red-500" /> QR — Buyurtma #{order._id.slice(-6).toUpperCase()}
              </h3>
              <button onClick={() => setQrModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {qrLoading ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Генерация QR...</p>
              </div>
            ) : qrData ? (
              <>
                <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-center mb-4">
                  <img src={qrData.qr} alt="QR Code" className="w-52 h-52" />
                </div>
                <p className="text-xs text-gray-500 text-center mb-4 break-all">{qrData.url}</p>
                <button
                  onClick={handlePrintQR}
                  className="w-full py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <QrCode size={16} /> Chop etish (Print)
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

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
              className="w-full bg-white text-gray-900 border rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-red-400 focus:outline-none mb-4"
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
