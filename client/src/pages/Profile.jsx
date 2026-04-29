import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Phone, HelpCircle, FileText, Star, ChevronRight } from 'lucide-react'

const MENU = [
  { icon: MapPin,       label: 'Manzillarim',     desc: 'Saqlangan yetkazish manzillari' },
  { icon: Phone,        label: 'Telefon raqam',   desc: '+998 90 123 45 67' },
  { icon: Star,         label: 'Baholarim',       desc: '12 ta baho qoldirildi' },
  { icon: FileText,     label: 'Buyurtma tarixi', desc: 'Oxirgi 30 kun' },
  { icon: HelpCircle,   label: 'Yordam',          desc: 'Operator bilan bog\'lanish' },
]

export default function Profile() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-[100dvh] flex flex-col bg-bg pb-20"
    >
      <div className="px-4 pt-safe pb-4 flex items-center gap-3 bg-primary-600">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white tap">
          <ArrowLeft size={18} />
        </button>
        <div className="font-display text-2xl tracking-wide text-white">Profil</div>
      </div>

      {/* User card */}
      <div className="px-4 pt-5">
        <div className="bg-bg-surface rounded-xl border border-ink-line p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center text-2xl">
            🥩
          </div>
          <div>
            <div className="font-display text-xl text-ink tracking-wide">MEATZONE Mijoz</div>
            <div className="text-xs text-ink-dim">Toshkent, Uzbekiston</div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 pt-4 flex flex-col gap-2">
        {MENU.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-bg-surface rounded-lg border border-ink-line p-3.5 flex items-center gap-3 text-left tap"
          >
            <div className="w-9 h-9 rounded-md bg-bg-surface3 border border-ink-line flex items-center justify-center text-ink-dim">
              <item.icon size={16} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-ink">{item.label}</div>
              <div className="text-[11px] text-ink-dim">{item.desc}</div>
            </div>
            <ChevronRight size={16} className="text-ink-dim" />
          </motion.button>
        ))}
      </div>

      {/* Language */}
      <div className="px-4 pt-4">
        <div className="bg-bg-surface rounded-lg border border-ink-line p-3 flex items-center justify-between">
          <span className="text-sm font-bold text-ink">Til</span>
          <div className="flex gap-2">
            <span className="px-2 py-1 rounded bg-primary text-white text-xs font-bold">UZ</span>
            <span className="px-2 py-1 rounded bg-bg-surface3 text-ink-dim text-xs font-medium">RU</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
