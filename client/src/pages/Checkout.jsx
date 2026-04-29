import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Phone, CreditCard, Banknote, CheckCircle, User, Building } from 'lucide-react'
import { Button } from '../components/ui'
import { useCart } from '../store/cartStore'
import { ordersAPI } from '../services/api'
import { formatSum, haptic } from '../utils/format'

export default function Checkout() {
  const navigate = useNavigate()
  const items = useCart(s => s.items)
  const total = useCart(s => s.total())
  const clear = useCart(s => s.clear)
  const [method, setMethod] = useState('cash')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [name, setName] = useState('')
  const [district, setDistrict] = useState('')
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (items.length === 0 && !done) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-bg">
        <div className="px-4 pt-safe pb-4 flex items-center gap-3 bg-primary-600">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white tap">
            <ArrowLeft size={18} />
          </button>
          <div className="font-display text-2xl tracking-wide text-white">Buyurtma</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-5xl mb-3">🛒</div>
          <h2 className="font-display text-2xl text-ink mb-2">Savat bo'sh</h2>
          <Button variant="primary" onClick={() => navigate('/catalog')}>Katalogga o'tish</Button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-bg"
      >
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-success" />
        </div>
        <h2 className="font-display text-3xl text-ink mb-2">Buyurtma qabul qilindi!</h2>
        <p className="text-sm text-ink-dim mb-8">Tez orada operator siz bilan bog'lanadi</p>
        <Button variant="primary" onClick={() => navigate('/orders')}>Buyurtmalarim</Button>
        <button onClick={() => navigate('/')} className="mt-3 text-sm text-ink-dim underline">Asosiy sahifaga</button>
      </motion.div>
    )
  }

  const handleSubmit = async () => {
    if (!phone || !name || !address || !district || items.length === 0) return
    setSubmitting(true)
    try {
      await ordersAPI.create({
        items: items.map(i => ({ productId: i.id, quantity: i.qty })),
        customerPhone: phone,
        customerName: name,
        address,
        district,
        comment: note,
        paymentMethod: method,
      })
      haptic('success')
      localStorage.setItem('mz_phone', phone)
      clear()
      setDone(true)
    } catch (e) {
      alert('Buyurtma yuborishda xatolik. Iltimos, qayta urinib ko\'ring.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-[100dvh] flex flex-col bg-bg pb-28"
    >
      <div className="px-4 pt-safe pb-4 flex items-center gap-3 bg-primary-600">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white tap">
          <ArrowLeft size={18} />
        </button>
        <div className="font-display text-2xl tracking-wide text-white">Buyurtma</div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Contact */}
        <div className="bg-bg-surface rounded-lg border border-ink-line p-4 space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <User size={16} className="text-primary" />
              <span className="text-sm font-bold text-ink">Ismingiz</span>
            </div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Misol: Asadbek"
              className="w-full bg-bg-surface3 border border-ink-line rounded-md px-3 h-11 text-sm text-ink placeholder:text-ink-mute outline-none"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Phone size={16} className="text-primary" />
              <span className="text-sm font-bold text-ink">Telefon raqam</span>
            </div>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+998 __ ___ __ __"
              className="w-full bg-bg-surface3 border border-ink-line rounded-md px-3 h-11 text-sm text-ink placeholder:text-ink-mute outline-none"
            />
          </div>
        </div>

        {/* Address */}
        <div className="bg-bg-surface rounded-lg border border-ink-line p-4 space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MapPin size={16} className="text-primary" />
              <span className="text-sm font-bold text-ink">Yetkazib berish manzili</span>
            </div>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Ko'cha, uy, xonadon, qavat..."
              className="w-full bg-bg-surface3 border border-ink-line rounded-md px-3 h-11 text-sm text-ink placeholder:text-ink-mute outline-none"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Building size={16} className="text-primary" />
              <span className="text-sm font-bold text-ink">Tuman</span>
            </div>
            <input
              value={district}
              onChange={e => setDistrict(e.target.value)}
              placeholder="Misol: Chilonzor tumani"
              className="w-full bg-bg-surface3 border border-ink-line rounded-md px-3 h-11 text-sm text-ink placeholder:text-ink-mute outline-none"
            />
          </div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Qo'shimcha eslatma (ixtiyoriy)"
            rows={2}
            className="w-full bg-bg-surface3 border border-ink-line rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-mute outline-none resize-none"
          />
        </div>

        {/* Payment */}
        <div className="bg-bg-surface rounded-lg border border-ink-line p-4">
          <div className="text-sm font-bold text-ink mb-3">To'lov usuli</div>
          <div className="flex gap-2">
            {[
              { id: 'cash', label: 'Naqd pul', icon: Banknote },
              { id: 'card', label: 'Karta', icon: CreditCard },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => { setMethod(m.id); haptic('light') }}
                className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-lg border text-sm font-bold tap ${method === m.id ? 'bg-primary border-primary text-white' : 'bg-bg-surface3 border-ink-line text-ink-dim'
                  }`}
              >
                <m.icon size={16} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-bg-surface rounded-lg border border-ink-line p-4">
          <div className="text-sm font-bold text-ink mb-3">Buyurtma tarkibi</div>
          {items.map(i => (
            <div key={i.id} className="flex justify-between text-sm mb-1">
              <span className="text-ink-dim">{i.name} × {i.qty}</span>
              <span className="text-ink font-medium tabular">{formatSum(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="h-px bg-ink-line my-2" />
          <div className="flex justify-between items-center">
            <span className="text-ink font-bold">Jami</span>
            <span className="font-display text-xl text-ink tabular">{formatSum(total)}</span>
          </div>
        </div>
      </div>

      {/* Sticky action */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-bg-surface/95 backdrop-blur-lg border-t border-ink-line px-4 py-3 pb-safe">
        <div className="max-w-[480px] mx-auto">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!phone || !name || !address || !district || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Yuborilmoqda...' : `Buyurtma berish — ${formatSum(total)}`}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
