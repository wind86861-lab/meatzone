import { useEffect, useState } from 'react'
import { settingsAPI, uploadAPI } from '../../services/api'
import { Save, Check, Upload, Globe, Phone, Mail, MapPin, MessageCircle, Image } from 'lucide-react'

const SETTING_GROUPS = [
  {
    id: 'contact',
    label: 'Контактная информация',
    icon: Phone,
    fields: [
      { key: 'phone1', label: 'Номер телефона 1', type: 'text', placeholder: '+998 XX XXX XX XX' },
      { key: 'phone2', label: 'Номер телефона 2', type: 'text', placeholder: '+998 XX XXX XX XX' },
      { key: 'email', label: 'Электронная почта', type: 'text', placeholder: 'info@meatzone.uz' },
      { key: 'workingHours', label: 'Часы работы', type: 'text', placeholder: 'Пн-Сб: 09:00 - 18:00' },
    ],
  },
  {
    id: 'address',
    label: 'Адрес компании',
    icon: MapPin,
    fields: [
      { key: 'address_uz', label: 'Адрес (UZ)', type: 'text' },
      { key: 'address_ru', label: 'Адрес (RU)', type: 'text' },
      { key: 'address_en', label: 'Адрес (EN)', type: 'text' },
    ],
  },
  {
    id: 'social',
    label: 'Социальные сети',
    icon: Globe,
    fields: [
      { key: 'instagram', label: 'Instagram URL', type: 'text', placeholder: 'https://instagram.com/...' },
      { key: 'facebook', label: 'Facebook URL', type: 'text', placeholder: 'https://facebook.com/...' },
      { key: 'telegram', label: 'Telegram URL', type: 'text', placeholder: 'https://t.me/...' },
      { key: 'youtube', label: 'YouTube URL', type: 'text', placeholder: 'https://youtube.com/...' },
    ],
  },
  {
    id: 'site',
    label: 'Настройки сайта',
    icon: MessageCircle,
    fields: [
      { key: 'siteName', label: 'Название сайта', type: 'text', placeholder: 'MeatZone' },
      { key: 'logoText', label: 'Текст логотипа', type: 'text', placeholder: 'MEATZONE' },
      { key: 'logoImage', label: 'Изображение логотипа', type: 'image' },
    ],
  },
]

export default function AdminSettings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await settingsAPI.getAll()
      setSettings(res.data || {})
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await uploadAPI.single(fd)
      updateSetting('logoImage', res.data.url)
    } catch (err) {
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await settingsAPI.update(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) { alert('Error saving settings') }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Настройки</h1>
          <p className="text-gray-600 text-sm">Управление всеми настройками сайта</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
        >
          {saved ? <><Check size={18} /> Сохранено!</> : saving ? 'Сохранение...' : <><Save size={18} /> Сохранить всё</>}
        </button>
      </div>

      <div className="space-y-6">
        {SETTING_GROUPS.map(group => {
          const Icon = group.icon
          return (
            <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 p-5 border-b border-gray-100">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon size={20} className="text-blue-600" />
                </div>
                <h2 className="font-semibold text-gray-900">{group.label}</h2>
              </div>
              <div className="p-5 space-y-4">
                {group.fields.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    {field.type === 'image' ? (
                      <div className="space-y-3">
                        {settings[field.key] && (
                          <div className="relative inline-block">
                            <img src={settings[field.key]} alt="Logo" className="h-16 w-auto border border-gray-200 rounded-lg" />
                          </div>
                        )}
                        <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 text-sm w-fit">
                          {uploading ? (
                            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                          ) : (
                            <Upload size={16} />
                          )}
                          <span>{settings[field.key] ? 'Сменить лого' : 'Загрузить лого'}</span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
                        </label>
                        <p className="text-xs text-gray-500">Макс. 5MB. Рекомендуется: PNG или SVG с прозрачным фоном</p>
                      </div>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={settings[field.key] || ''}
                        onChange={e => updateSetting(field.key, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    ) : (
                      <input
                        type="text"
                        value={settings[field.key] || ''}
                        onChange={e => updateSetting(field.key, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
        >
          {saved ? <><Check size={18} /> Сохранено!</> : saving ? 'Сохранение...' : <><Save size={18} /> Сохранить все настройки</>}
        </button>
      </div>
    </div>
  )
}
