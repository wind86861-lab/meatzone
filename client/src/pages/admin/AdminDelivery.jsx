import { useState, useEffect } from 'react'
import { deliveryAPI, coinsAPI, promosAPI } from '../../services/api'
import {
  Truck, Coins, Tag, Save, Check, Plus, Trash2,
  ToggleLeft, ToggleRight, MapPin, DollarSign, Gift
} from 'lucide-react'

const TAB = { delivery: 'delivery', coins: 'coins', promos: 'promos' }

const fmt = (n) => Number(n || 0).toLocaleString('ru-RU')

// ─── Delivery Settings ────────────────────────────────────────────────────────
function DeliveryTab() {
  const [cfg, setCfg] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    deliveryAPI.getSettings().then(r => {
      setCfg(r.data)
      setForm({
        delivery_enabled: r.data.enabled,
        delivery_price_per_km: r.data.pricePerKm,
        delivery_free_threshold: r.data.freeThreshold,
        delivery_min_fee: r.data.minFee,
        delivery_free_until: r.data.freeUntil ? new Date(r.data.freeUntil).toISOString().slice(0, 10) : '',
        store_lat: r.data.storeLat,
        store_lng: r.data.storeLng,
      })
    }).catch(() => { })
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await deliveryAPI.updateSettings({
        ...form,
        delivery_enabled: form.delivery_enabled,
        delivery_free_until: form.delivery_free_until || null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { alert('Xato saqlashda') }
    finally { setSaving(false) }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  if (!cfg) return <div className="flex justify-center p-10"><div className="animate-spin w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent" /></div>

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Yetkazib berish</p>
            <p className="text-sm text-gray-500 mt-0.5">Yoqilganda mijozlardan yetkazish haqqi olinadi</p>
          </div>
          <button
            onClick={() => f('delivery_enabled', !form.delivery_enabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${form.delivery_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
          >
            {form.delivery_enabled ? <><ToggleRight size={20} /> Yoqilgan</> : <><ToggleLeft size={20} /> O'chirilgan</>}
          </button>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><DollarSign size={18} className="text-blue-600" /> Narx sozlamalari</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">1 km narxi (so'm)</label>
            <input type="number" value={form.delivery_price_per_km || ''} onChange={e => f('delivery_price_per_km', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Minimal haq (so'm)</label>
            <input type="number" value={form.delivery_min_fee || ''} onChange={e => f('delivery_min_fee', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Bepul yetkazish (sum dan)</label>
            <input type="number" value={form.delivery_free_threshold || ''} onChange={e => f('delivery_free_threshold', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Free promo period */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Gift size={18} className="text-emerald-600" /> Bepul yetkazish muddati</h3>
        <p className="text-sm text-gray-500">Shu sanagacha barcha yetkazishlar bepul bo'ladi</p>
        <input type="date" value={form.delivery_free_until || ''} onChange={e => f('delivery_free_until', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {form.delivery_free_until && new Date(form.delivery_free_until) > new Date() && (
          <p className="text-sm text-emerald-600 font-medium">✓ Hozir bepul yetkazish davri aktiv</p>
        )}
      </div>

      {/* Store location */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><MapPin size={18} className="text-red-500" /> Do'kon joylashuvi</h3>
        <p className="text-sm text-gray-500">Google Maps havolasini joylang. Kenglik va uzunlik avto aniqlanadi.</p>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Google Maps havolasi</label>
          <input
            type="text"
            value={form.store_map_url || ''}
            onChange={e => {
              const url = e.target.value
              const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
              if (match) {
                setForm(p => ({ ...p, store_lat: parseFloat(match[1]), store_lng: parseFloat(match[2]) }))
              }
            }}
            placeholder="https://maps.app.goo.gl/..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {form.store_lat && form.store_lng && (
            <div className="mt-2 flex items-center gap-3">
              <p className="text-xs text-green-600">Kenglik: {form.store_lat}, Uzunlik: {form.store_lng}</p>
              {form.store_lat && form.store_lng && (
                <a
                  href={`https://www.google.com/maps?q=${form.store_lat},${form.store_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                >
                  <MapPin size={12} />
                  Xaritada ochish
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50">
        {saved ? <><Check size={16} /> Saqlandi!</> : saving ? 'Saqlanmoqda...' : <><Save size={16} /> Saqlash</>}
      </button>
    </div>
  )
}

// ─── Coin Settings ────────────────────────────────────────────────────────────
function CoinsTab() {
  const [form, setForm] = useState({ coin_rate: 1, coin_max_percent: 30 })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    coinsAPI.getSettings().then(r => setForm({ coin_rate: r.data.rate, coin_max_percent: r.data.maxPercent })).catch(() => { })
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await coinsAPI.updateSettings(form)
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch { alert('Xato') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Coin tizimi qanday ishlaydi?</p>
        <ul className="space-y-1 list-disc list-inside text-blue-700">
          <li>Har 1 000 so'm sarflanganda → <strong>Coin rate</strong> soncha coin beriladi</li>
          <li>Checkout da coinlar bilan to'lash mumkin (max <strong>Coin max %</strong>)</li>
          <li>1 coin = 1 so'm chegirma</li>
        </ul>
      </div>

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">Coin sozlamalari</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Har 1 000 so'mga coin miqdori</label>
            <input type="number" min="0" step="0.1" value={form.coin_rate}
              onChange={e => setForm(p => ({ ...p, coin_rate: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-400 mt-1">Misol: 1 → 83,000 so'm zakaz = 83 coin</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Maksimal chegirma foizi (%)</label>
            <input type="number" min="1" max="100" value={form.coin_max_percent}
              onChange={e => setForm(p => ({ ...p, coin_max_percent: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-400 mt-1">Misol: 30 → zakaz summasidan max 30% coinlar bilan to'lash</p>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50">
        {saved ? <><Check size={16} /> Saqlandi!</> : saving ? 'Saqlanmoqda...' : <><Save size={16} /> Saqlash</>}
      </button>
    </div>
  )
}

// ─── Promo Codes ──────────────────────────────────────────────────────────────
function PromosTab() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ code: '', discountType: 'percent', discountValue: '', maxUses: '', validUntil: '', firstOrderOnly: false })
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const fetch = async () => {
    setLoading(true)
    try { const r = await promosAPI.getAll(); setPromos(r.data.promos || []) } catch { } finally { setLoading(false) }
  }
  useEffect(() => { fetch() }, [])

  const handleCreate = async () => {
    if (!form.code || !form.discountValue) return alert("Kod va chegirma kerak")
    setCreating(true)
    try {
      await promosAPI.create(form)
      setForm({ code: '', discountType: 'percent', discountValue: '', maxUses: '', validUntil: '', firstOrderOnly: false })
      setShowForm(false)
      fetch()
    } catch (e) { alert(e.response?.data?.message || 'Xato') } finally { setCreating(false) }
  }

  const handleToggle = async (id) => {
    await promosAPI.toggle(id); fetch()
  }
  const handleDelete = async (id) => {
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return
    await promosAPI.delete(id); fetch()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{promos.length} ta promo-kod</p>
        <button onClick={() => setShowForm(p => !p)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> Yangi kod
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Yangi promo-kod</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Kod</label>
              <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="BLOGGER2026" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white uppercase" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Chegirma turi</label>
              <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="percent">Foiz (%)</option>
                <option value="fixed">Summa (so'm)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Chegirma miqdori</label>
              <input type="number" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))}
                placeholder={form.discountType === 'percent' ? '10' : '15000'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Foydalanish limiti (bo'sh = cheksiz)</label>
              <input type="number" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                placeholder="100" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Muddat (bo'sh = cheksiz)</label>
              <input type="date" value={form.validUntil} onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" id="fto" checked={form.firstOrderOnly} onChange={e => setForm(p => ({ ...p, firstOrderOnly: e.target.checked }))} className="w-4 h-4" />
              <label htmlFor="fto" className="text-sm text-gray-700">Faqat birinchi zakaz uchun</label>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={creating}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {creating ? 'Yaratilmoqda...' : 'Yaratish'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-lg text-sm border hover:bg-gray-50">Bekor</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-10"><div className="animate-spin w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent" /></div>
      ) : promos.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-gray-400">
          <Tag size={32} className="mx-auto mb-2 opacity-40" />
          <p>Promo-kodlar yo'q</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map(p => (
            <div key={p._id} className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-gray-900 text-base">{p.code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isActive ? 'Aktiv' : 'Nofaol'}
                  </span>
                  {p.firstOrderOnly && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">1-zakaz</span>}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">
                  {p.discountType === 'percent' ? `${p.discountValue}% chegirma` : `${fmt(p.discountValue)} so'm chegirma`}
                  {p.maxUses !== null && ` · ${p.usedCount}/${p.maxUses} marta`}
                  {p.validUntil && ` · ${new Date(p.validUntil).toLocaleDateString('ru-RU')} gacha`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleToggle(p._id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${p.isActive ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}>
                  {p.isActive ? 'O\'chirish' : 'Yoqish'}
                </button>
                <button onClick={() => handleDelete(p._id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminDelivery() {
  const [tab, setTab] = useState(TAB.delivery)

  const tabs = [
    { id: TAB.delivery, label: 'Yetkazib berish', icon: Truck },
    { id: TAB.coins, label: 'Coin tizimi', icon: Gift },
    { id: TAB.promos, label: 'Promo-kodlar', icon: Tag },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Yetkazib berish & Bonuslar</h1>
        <p className="text-gray-500 text-sm mt-0.5">GPS narx kalkulyator, coin tizimi va promo-kodlar</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === TAB.delivery && <DeliveryTab />}
      {tab === TAB.coins && <CoinsTab />}
      {tab === TAB.promos && <PromosTab />}
    </div>
  )
}
