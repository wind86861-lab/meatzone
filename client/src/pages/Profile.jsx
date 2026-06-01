import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Phone, HelpCircle, ChevronRight, User, Globe } from 'lucide-react'
import { useLangStore } from '../store/langStore'
import { useAuthStore } from '../store/authStore'
import { t } from '../utils/i18n'

export default function Profile() {
  const navigate = useNavigate()
  const { lang, setLang } = useLangStore()
  const { telegramUser, isTelegram, user, requestTelegramPhone, requestTelegramLocation } = useAuthStore()
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState(null)
  const [phoneRequested, setPhoneRequested] = useState(false)
  const [locRequested, setLocRequested] = useState(false)

  // Get display name from Telegram or fallback
  const displayName = telegramUser
    ? `${telegramUser.firstName} ${telegramUser.lastName || ''}`.trim()
    : user?.name || 'MEATZONE'

  const username = telegramUser?.username ? `@${telegramUser.username}` : ''
  const locationText = location
    ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
    : isTelegram
      ? 'Tap to share your location'
      : 'Tashkent, Uzbekistan'

  const handleRequestPhone = async () => {
    setPhoneRequested(true)
    const result = await requestTelegramPhone()
    if (result.success) {
      setPhone(result.phone)
    } else {
      setPhoneRequested(false)
    }
  }

  const handleRequestLocation = async () => {
    setLocRequested(true)
    const result = await requestTelegramLocation()
    if (result.success) {
      setLocation({ lat: result.lat, lng: result.lng })
    } else {
      setLocRequested(false)
    }
  }

  const MENU = [
    {
      icon: User,
      label: displayName,
      desc: username || (telegramUser ? `ID: ${telegramUser.telegramId}` : 'Guest user'),
      isHeader: true,
    },
    {
      icon: MapPin,
      label: 'My addresses',
      desc: locationText,
      onClick: isTelegram ? handleRequestLocation : undefined,
      clickable: isTelegram && !location,
    },
    {
      icon: Phone,
      label: 'Phone',
      desc: phone || (isTelegram ? 'Tap to get from Telegram' : '+998 90 123 45 67'),
      onClick: isTelegram && !phone ? handleRequestPhone : undefined,
      clickable: isTelegram && !phone,
    },
    {
      icon: HelpCircle,
      label: 'Help',
      desc: 'Contact operator',
      onClick: () => window.open('https://t.me/meatzone_support', '_blank'),
      clickable: true,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-[100dvh] flex flex-col bg-bg pb-20"
    >
      <div className="px-4 pt-safe pb-4 flex items-center gap-3 bg-primary-600">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white tap">
          <ArrowLeft size={18} />
        </button>
        <div className="font-display text-2xl tracking-wide text-white">{t(lang, 'profile.title')}</div>
      </div>

      {/* Telegram user card */}
      <div className="px-4 pt-5">
        <div className="bg-bg-surface rounded-xl border border-ink-line p-5 flex items-center gap-4">
          {telegramUser?.photoUrl ? (
            <img src={telegramUser.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center text-2xl">
              🥩
            </div>
          )}
          <div>
            <div className="font-display text-xl text-ink tracking-wide">{displayName}</div>
            <div className="text-xs text-ink-dim">
              {isTelegram
                ? (lang === 'ru' ? 'Авторизован через Telegram' : lang === 'en' ? 'Signed in via Telegram' : 'Telegram orqali tizimga kirildi')
                : (lang === 'ru' ? 'Ташкент, Узбекистан' : lang === 'en' ? 'Tashkent, Uzbekistan' : "Toshkent, O'zbekiston")
              }
            </div>
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
            onClick={item.onClick}
            disabled={!item.clickable}
            className={`bg-bg-surface rounded-lg border border-ink-line p-3.5 flex items-center gap-3 text-left tap ${item.clickable ? 'active:scale-[0.98]' : ''}`}
          >
            <div className="w-9 h-9 rounded-md bg-bg-surface3 border border-ink-line flex items-center justify-center text-ink-dim">
              <item.icon size={16} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-ink">{item.label}</div>
              <div className="text-[11px] text-ink-dim">{item.desc}</div>
            </div>
            {item.clickable && <ChevronRight size={16} className="text-ink-dim" />}
          </motion.button>
        ))}
      </div>

      {/* Language */}
      <div className="px-4 pt-4">
        <div className="bg-bg-surface rounded-lg border border-ink-line p-3 flex items-center justify-between">
          <span className="text-sm font-bold text-ink">{t(lang, 'profile.language')}</span>
          <div className="flex gap-2">
            <button onClick={() => setLang('uz')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${lang === 'uz' ? 'bg-primary text-white' : 'bg-bg-surface3 text-ink-dim'}`}>
              UZ
            </button>
            <button onClick={() => setLang('ru')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${lang === 'ru' ? 'bg-primary text-white' : 'bg-bg-surface3 text-ink-dim'}`}>
              RU
            </button>
            <button onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${lang === 'en' ? 'bg-primary text-white' : 'bg-bg-surface3 text-ink-dim'}`}>
              EN
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
