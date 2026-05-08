import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ordersAPI } from '../../services/api'
import { Printer, ArrowLeft, Phone } from 'lucide-react'

export default function AdminCheck() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [qrUrl, setQrUrl] = useState('')
  const [loading, setLoading] = useState(true)

  const fmt = (n) => Number(n || 0).toLocaleString('ru-RU')

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [orderRes, qrRes] = await Promise.all([
        ordersAPI.getById(id),
        ordersAPI.getQr(id).catch(() => ({ data: null })),
      ])
      setOrder(orderRes.data.order)
      setItems(orderRes.data.items || [])
      setQrUrl(qrRes.data?.qr || '')
    } catch {
      alert('Buyurtma ma\'lumotlarini yuklashda xatolik')
    }
    setLoading(false)
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) return null

  const d = new Date(order.createdAt || Date.now())
  const dateStr = d.toLocaleDateString('ru-RU')
  const timeStr = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const checkId = order._id?.slice(-6).toUpperCase()

  const paid = (order.paymentHistory || []).reduce((s, p) => s + (p.amount || 0), 0)
  const debt = Math.max(0, (order.totalPrice || 0) - paid)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-6 px-4 print:py-0 print:bg-white">
      {/* Toolbar */}
      <div className="w-full max-w-[400px] flex items-center justify-between mb-4 print:hidden">
        <button
          onClick={() => navigate(`/admin/orders/${id}`)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} /> Orqaga
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
        >
          <Printer size={16} /> Chop etish
        </button>
      </div>

      {/* Receipt */}
      <div
        className="w-full max-w-[360px] bg-white shadow-lg print:shadow-none print:max-w-none print:w-[72mm] print:text-[11px]"
        style={{ fontFamily: "'Courier New', Courier, monospace" }}
      >
        {/* ─── Header ─── */}
        <div className="px-5 pt-4 pb-2 text-center">
          <h1 className="text-xl font-black tracking-tight text-red-600 leading-none" style={{ fontFamily: "sans-serif" }}>
            MeatZone
          </h1>
          <p className="text-[10px] text-gray-500 italic" style={{ fontFamily: "sans-serif" }}>
            Fresh food products
          </p>
        </div>

        {/* Dashed line */}
        <div className="px-5">
          <div className="border-b-2 border-dashed border-gray-800 my-1" />
        </div>

        {/* Meta info */}
        <div className="px-5 py-2 text-[11px]">
          <div className="flex justify-between">
            <span>Sana:</span>
            <span>{dateStr}</span>
          </div>
          <div className="flex justify-between">
            <span>Vaqt:</span>
            <span>{timeStr}</span>
          </div>
          <div className="flex justify-between">
            <span>Check №:</span>
            <span className="font-bold">ORD-{checkId}</span>
          </div>
        </div>

        {/* Dashed line */}
        <div className="px-5">
          <div className="border-b-2 border-dashed border-gray-800 my-1" />
        </div>

        {/* ─── Customer ─── */}
        <div className="px-5 py-2 text-[11px]">
          <p className="font-bold text-gray-800 mb-1 uppercase tracking-wide text-[10px]">MIJOZ MA'LUMOTLARI:</p>
          <p>Ism: <span className="font-medium">{order.customerName || '—'}</span></p>
          <p>Tel: <span className="font-medium">{order.customerPhone || '—'}</span></p>
        </div>

        {/* Dashed line */}
        <div className="px-5">
          <div className="border-b-2 border-dashed border-gray-800 my-1" />
        </div>

        {/* ─── Items ─── */}
        <div className="px-5 py-2">
          <p className="font-bold text-gray-800 mb-1 uppercase tracking-wide text-[10px] text-center">
            ─── MAHSULOTLAR ───
          </p>
          <div className="space-y-2">
            {items.map((item, i) => {
              const lineTotal = (item.price || 0) * (item.quantity || 1)
              return (
                <div key={i} className="text-[11px] leading-snug">
                  {/* Item name + qty (like "1. Anjir 40ta. 1650so'm") */}
                  <div className="flex justify-start gap-1">
                    <span className="font-bold">{i + 1}.</span>
                    <span className="flex-1">{item.name} {item.quantity > 1 ? item.quantity + 'ta.' : ''}</span>
                  </div>
                  {/* Price line (like "1 x 66 000   66 000 so'm") */}
                  <div className="flex justify-between items-baseline pl-4">
                    <span>{item.quantity} x {fmt(item.price)}</span>
                    <span className="font-bold text-gray-800">{fmt(lineTotal)} so'm</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Dashed line */}
        <div className="px-5">
          <div className="border-b-2 border-dashed border-gray-800 my-2" />
        </div>

        {/* ─── Totals ─── */}
        <div className="px-5 pb-2 text-[11px]">
          <div className="flex justify-between py-0.5">
            <span>Buyurtma narxi:</span>
            <span className="font-bold">{fmt(order.subTotal || order.totalPrice)} so'm</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span>To'langan:</span>
            <span>{fmt(paid)} so'm</span>
          </div>
          <div className="flex justify-between py-0.5 font-bold text-black">
            <span>Umumiy qarzdorlik:</span>
            <span>{fmt(debt || order.totalPrice)} so'm</span>
          </div>
        </div>

        {/* Dashed line */}
        <div className="px-5">
          <div className="border-b-2 border-dashed border-gray-800 my-2" />
        </div>

        {/* ─── Thank you ─── */}
        <div className="text-center px-5 py-2">
          <p className="text-xs font-bold text-gray-800 italic mb-2">Haridingiz uchun RAHMAT!</p>
          <p className="text-[9px] text-gray-600 mb-0.5">Murojaat uchun:</p>
          <p className="text-[10px] font-bold text-gray-700">+998 90 123-45-67</p>
          <p className="text-[10px] font-bold text-gray-700">+998 91 234-56-78</p>
          <p className="text-[9px] text-gray-400 mt-1">{dateStr} {timeStr}</p>
        </div>

        {/* Dashed line */}
        <div className="px-5">
          <div className="border-b-2 border-dashed border-gray-800 my-1" />
        </div>

        {/* ─── Quality footer ─── */}
        <div className="text-center px-5 py-2 pb-4">
          <p className="text-[8px] text-gray-500 italic">
            Sifatli muzlatilgan mahsulotlar bilan<br />xizmatdamiz!
          </p>
        </div>

        {/* QR */}
        {qrUrl && (
          <div className="flex flex-col items-center py-3 border-t border-dashed border-gray-200">
            <img src={qrUrl} alt="QR" className="w-28 h-28" />
            <p className="text-[9px] text-gray-400 mt-1">Skanerlang va buyurtmani kuzating</p>
          </div>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body > div { visibility: hidden !important; }
          body > div > div:last-child { visibility: visible !important; position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none !important; }
          body > div > div:last-child * { visibility: visible !important; }
        }
      `}</style>
    </div>
  )
}
