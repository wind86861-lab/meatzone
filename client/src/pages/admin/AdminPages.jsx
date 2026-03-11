import { useEffect, useState, useCallback } from 'react'
import { pageContentAPI, uploadAPI } from '../../services/api'
import { Save, ChevronDown, ChevronRight, Check, Upload, X, Plus, Trash2 } from 'lucide-react'

// ─── Stable top-level components (no closure over parent state) ───────────────

function MultilangInput({ section, field, label, values, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="space-y-2">
        {['uz', 'ru', 'en'].map(lang => {
          const id = `${section}__${field}__${lang}`
          return (
            <div key={lang} className="flex items-center gap-2">
              <label htmlFor={id} className="text-xs text-gray-400 w-6 uppercase font-medium shrink-0">{lang}</label>
              <input
                id={id}
                name={id}
                type="text"
                value={values?.[lang] ?? ''}
                onChange={e => onChange(section, field, lang, e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MultilangTextarea({ section, field, label, values, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="space-y-2">
        {['uz', 'ru', 'en'].map(lang => {
          const id = `${section}__${field}__${lang}__ta`
          return (
            <div key={lang} className="flex items-start gap-2">
              <label htmlFor={id} className="text-xs text-gray-400 w-6 uppercase font-medium mt-2 shrink-0">{lang}</label>
              <textarea
                id={id}
                name={id}
                value={values?.[lang] ?? ''}
                onChange={e => onChange(section, field, lang, e.target.value)}
                rows={3}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPages() {
  const [activePage, setActivePage] = useState('home')
  const [openSections, setOpenSections] = useState({})
  const [contentMap, setContentMap] = useState({})
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { fetchContent() }, [activePage])

  const fetchContent = async () => {
    try {
      setLoading(true)
      const res = await pageContentAPI.getAll({ page: activePage })
      const map = {}
        ; (res.data || []).forEach(item => { map[item.section] = item.content || {} })
      setContentMap(map)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const updateContent = (section, newData) => {
    setContentMap(prev => ({ ...prev, [section]: { ...(prev[section] || {}), ...newData } }))
  }

  const updateField = useCallback((section, key, lang, value) => {
    setContentMap(prev => {
      const sectionData = { ...(prev[section] || {}) }
      if (lang) {
        sectionData[key] = { ...(sectionData[key] || {}), [lang]: value }
      } else {
        sectionData[key] = value
      }
      return { ...prev, [section]: sectionData }
    })
  }, [])

  const handleImageUpload = async (section, key) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      if (file.size > 10 * 1024 * 1024) { alert(`Maksimum: 10MB`); return }
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('image', file)
        const res = await uploadAPI.single(fd)
        updateField(section, key, null, res.data.url)
      } catch { alert('Yuklash xatosi') }
      finally { setUploading(false) }
    }
    input.click()
  }

  const handleImageArrayUpload = async (section, key) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      if (file.size > 10 * 1024 * 1024) { alert('Maksimum: 10MB'); return }
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('image', file)
        const res = await uploadAPI.single(fd)
        setContentMap(prev => {
          const current = prev[section]?.[key] || []
          const sectionData = { ...(prev[section] || {}), [key]: [...current, res.data.url] }
          return { ...prev, [section]: sectionData }
        })
      } catch { alert('Yuklash xatosi') }
      finally { setUploading(false) }
    }
    input.click()
  }

  const removeFromArray = (section, key, index) => {
    setContentMap(prev => {
      const current = prev[section]?.[key] || []
      const sectionData = { ...(prev[section] || {}), [key]: current.filter((_, i) => i !== index) }
      return { ...prev, [section]: sectionData }
    })
  }

  const saveSection = async (section) => {
    const sKey = `${activePage}-${section}`
    setSaving(prev => ({ ...prev, [sKey]: true }))
    try {
      await pageContentAPI.update({ page: activePage, section, content: contentMap[section] || {} })
      setSaved(prev => ({ ...prev, [sKey]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [sKey]: false })), 2000)
    } catch { alert('Saqlashda xatolik') }
    finally { setSaving(prev => ({ ...prev, [sKey]: false })) }
  }

  // ── Inline-only components that don't use inputs (safe to define inside) ──

  const ImageUploader = ({ section, field, label }) => {
    const url = contentMap[section]?.[field]
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="flex items-center gap-4">
          {url && (
            <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-gray-200">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => updateField(section, field, null, '')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
            </div>
          )}
          <button type="button" onClick={() => handleImageUpload(section, field)} disabled={uploading} className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500">
            <Upload size={16} /> {uploading ? 'Yuklanmoqda...' : 'Rasm yuklash'}
          </button>
        </div>
      </div>
    )
  }

  const ImageArrayUploader = ({ section, field, label }) => {
    const images = contentMap[section]?.[field] || []
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative w-32 h-20 rounded-lg overflow-hidden border border-gray-200">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeFromArray(section, field, i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
            </div>
          ))}
          <button type="button" onClick={() => handleImageArrayUpload(section, field)} disabled={uploading} className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500">
            {uploading ? <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" /> : <Plus size={20} />}
          </button>
        </div>
      </div>
    )
  }

  const SaveButton = ({ section }) => {
    const sKey = `${activePage}-${section}`
    return (
      <div className="flex justify-end pt-3 border-t border-gray-100">
        <button onClick={() => saveSection(section)} disabled={saving[sKey]} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {saved[sKey] ? <><Check size={16} /> Saqlandi</> : saving[sKey] ? 'Saqlanmoqda...' : <><Save size={16} /> Saqlash</>}
        </button>
      </div>
    )
  }

  // ── Section renderers ──────────────────────────────────────────────────────

  const renderHeroSection = () => {
    const section = 'hero'
    const data = contentMap[section] || {}
    return (
      <div className="space-y-4">
        <ImageArrayUploader section={section} field="bgImages" label="Fon rasmlari (slayder)" />
        <MultilangInput section={section} field="line1" label="1-qator (gradient matn)" values={data.line1} onChange={updateField} />
        <MultilangInput section={section} field="line2" label="2-qator (katta oq matn)" values={data.line2} onChange={updateField} />
        <MultilangInput section={section} field="line3" label="3-qator (ko'k matn)" values={data.line3} onChange={updateField} />
        <MultilangInput section={section} field="buttonText" label="Tugma matni" values={data.buttonText} onChange={updateField} />
        <SaveButton section={section} />
      </div>
    )
  }

  const renderFeaturesSection = () => {
    const section = 'features'
    const data = contentMap[section] || {}
    const items = data.items || []

    const addItem = () => updateContent(section, { items: [...items, { title: { uz: '', ru: '', en: '' }, description: { uz: '', ru: '', en: '' }, icon: 'TrendingUp' }] })
    const removeItem = (i) => updateContent(section, { items: items.filter((_, idx) => idx !== i) })
    const updateItemLang = (i, field, lang, value) => {
      const newItems = items.map((item, idx) => {
        if (idx !== i) return item
        const existing = typeof item[field] === 'object' ? item[field] : { uz: item[field] || '', ru: '', en: '' }
        return { ...item, [field]: { ...existing, [lang]: value } }
      })
      updateContent(section, { items: newItems })
    }
    const updateItemIcon = (i, value) => updateContent(section, { items: items.map((item, idx) => idx === i ? { ...item, icon: value } : item) })
    const getVal = (item, field, lang) => {
      const v = item[field]
      if (!v) return ''
      return typeof v === 'object' ? (v[lang] || '') : (lang === 'uz' ? v : '')
    }

    return (
      <div className="space-y-4">
        <MultilangInput section={section} field="title" label="Bo'lim sarlavhasi (1-qator)" values={data.title} onChange={updateField} />
        <MultilangInput section={section} field="subtitle" label="Bo'lim sarlavhasi (2-qator)" values={data.subtitle} onChange={updateField} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Xususiyat kartalari</label>
          <div className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 relative">
                <button type="button" onClick={() => removeItem(i)} className="absolute top-2 right-2 p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={14} /></button>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Icon</label>
                  <select value={item.icon || 'TrendingUp'} onChange={e => updateItemIcon(i, e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    {['TrendingUp', 'Truck', 'Package', 'CreditCard', 'Shield', 'Globe', 'Wrench', 'Zap'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-2">Sarlavha (3 tilda)</label>
                  {['uz', 'ru', 'en'].map(lang => (
                    <div key={lang} className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 w-6 uppercase font-medium">{lang}</span>
                      <input id={`feat-title-${i}-${lang}`} name={`feat-title-${i}-${lang}`} type="text" value={getVal(item, 'title', lang)} onChange={e => updateItemLang(i, 'title', lang, e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm" placeholder={`Sarlavha (${lang})`} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Tavsif (3 tilda)</label>
                  {['uz', 'ru', 'en'].map(lang => (
                    <div key={lang} className="flex items-start gap-2 mb-1">
                      <span className="text-xs text-gray-400 w-6 uppercase font-medium mt-2">{lang}</span>
                      <textarea id={`feat-desc-${i}-${lang}`} name={`feat-desc-${i}-${lang}`} value={getVal(item, 'description', lang)} onChange={e => updateItemLang(i, 'description', lang, e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm" rows={2} placeholder={`Tavsif (${lang})`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <Plus size={16} /> Karta qo'shish
          </button>
        </div>
        <SaveButton section={section} />
      </div>
    )
  }

  const renderItemsSection = (section, itemLabel = 'Element') => {
    const data = contentMap[section] || {}
    const items = data.items || []

    const addItem = () => {
      const newItem = section === 'benefits'
        ? { title: { uz: '', ru: '', en: '' }, desc: { uz: '', ru: '', en: '' }, icon: 'Package' }
        : { title: { uz: '', ru: '', en: '' }, subtitle: { uz: '', ru: '', en: '' } }
      updateContent(section, { items: [...items, newItem] })
    }
    const removeItem = (i) => updateContent(section, { items: items.filter((_, idx) => idx !== i) })
    const updateItemLang = (i, field, lang, value) => {
      const newItems = items.map((item, idx) => {
        if (idx !== i) return item
        const existing = typeof item[field] === 'object' ? item[field] : { uz: item[field] || '', ru: '', en: '' }
        return { ...item, [field]: { ...existing, [lang]: value } }
      })
      updateContent(section, { items: newItems })
    }
    const updateItemVal = (i, field, value) => updateContent(section, { items: items.map((item, idx) => idx === i ? { ...item, [field]: value } : item) })
    const getVal = (item, field, lang) => {
      const v = item[field]
      if (!v) return ''
      return typeof v === 'object' ? (v[lang] || '') : (lang === 'uz' ? v : '')
    }
    const subField = section === 'benefits' ? 'desc' : 'subtitle'

    return (
      <div className="space-y-4">
        <MultilangInput section={section} field="title" label="Sarlavha" values={data.title} onChange={updateField} />
        <MultilangInput section={section} field="subtitle" label="Qo'shimcha matn" values={data.subtitle} onChange={updateField} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">{itemLabel}lar ({items.length} ta)</label>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 relative">
                <button type="button" onClick={() => removeItem(i)} className="absolute top-2 right-2 p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={14} /></button>
                {section === 'benefits' && (
                  <div className="mb-3">
                    <label className="block text-xs text-gray-500 mb-1">Icon</label>
                    <select value={item.icon || 'Package'} onChange={e => updateItemVal(i, 'icon', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                      {['Package', 'Users', 'CreditCard', 'Target', 'Shield', 'Globe', 'Wrench', 'Zap'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                )}
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-2">Sarlavha (3 tilda)</label>
                  {['uz', 'ru', 'en'].map(lang => (
                    <div key={lang} className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 w-6 uppercase font-medium">{lang}</span>
                      <input id={`${section}-item-title-${i}-${lang}`} name={`${section}-item-title-${i}-${lang}`} type="text" value={getVal(item, 'title', lang)} onChange={e => updateItemLang(i, 'title', lang, e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm" placeholder="Sarlavha" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Tavsif (3 tilda)</label>
                  {['uz', 'ru', 'en'].map(lang => (
                    <div key={lang} className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 w-6 uppercase font-medium">{lang}</span>
                      <input id={`${section}-item-sub-${i}-${lang}`} name={`${section}-item-sub-${i}-${lang}`} type="text" value={getVal(item, subField, lang)} onChange={e => updateItemLang(i, subField, lang, e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm" placeholder="Tavsif" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <Plus size={16} /> {itemLabel} qo'shish
          </button>
        </div>
        <SaveButton section={section} />
      </div>
    )
  }

  const renderShowcaseSection = () => {
    const section = 'showcase'
    const data = contentMap[section] || {}
    return (
      <div className="space-y-4">
        <MultilangInput section={section} field="title" label="Sarlavha (1-qator)" values={data.title} onChange={updateField} />
        <MultilangInput section={section} field="subtitle" label="Sarlavha (2-qator)" values={data.subtitle} onChange={updateField} />
        <MultilangTextarea section={section} field="description" label="Tavsif matni" values={data.description} onChange={updateField} />
        <ImageArrayUploader section={section} field="images" label="Mahsulot rasmlari (slayder)" />
        <SaveButton section={section} />
      </div>
    )
  }

  const renderTopProductsSection = () => {
    const section = 'topProducts'
    const data = contentMap[section] || {}
    return (
      <div className="space-y-4">
        <MultilangInput section={section} field="title" label="Bo'lim sarlavhasi" values={data.title} onChange={updateField} />
        <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
          💡 Bu bo'limda "Taniqli" (Featured) deb belgilangan mahsulotlar avtomatik ko'rsatiladi.
          Mahsulotlarni "Taniqli" qilish uchun <strong>Mahsulotlar</strong> sahifasidagi yulduzcha belgisini bosing.
        </p>
        <SaveButton section={section} />
      </div>
    )
  }

  const renderBranchesSection = () => {
    const section = 'branches'
    const data = contentMap[section] || {}
    return (
      <div className="space-y-4">
        <MultilangInput section={section} field="title" label="Bo'lim sarlavhasi" values={data.title} onChange={updateField} />
        <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
          💡 Bosh sahifada ko'rsatiladigan filiallarni tanlash uchun <strong>Filiallar</strong> sahifasida "Bosh sahifada ko'rsatish" tugmasini yoqing.
        </p>
        <SaveButton section={section} />
      </div>
    )
  }

  const renderConsultationSection = () => {
    const section = 'consultation'
    const data = contentMap[section] || {}
    return (
      <div className="space-y-4">
        <MultilangInput section={section} field="title" label="Sarlavha (1-qator)" values={data.title} onChange={updateField} />
        <MultilangInput section={section} field="subtitle" label="Sarlavha (2-qator)" values={data.subtitle} onChange={updateField} />
        <MultilangInput section={section} field="buttonText" label="Tugma matni" values={data.buttonText} onChange={updateField} />
        <SaveButton section={section} />
      </div>
    )
  }

  const renderPartnersSection = () => {
    const section = 'partners'
    const data = contentMap[section] || {}
    const items = data.items || []

    const addPartner = () => updateContent(section, { items: [...items, { logo: '', name: '' }] })
    const removePartner = (i) => updateContent(section, { items: items.filter((_, idx) => idx !== i) })
    const updatePartner = (i, field, value) => updateContent(section, { items: items.map((p, idx) => idx === i ? { ...p, [field]: value } : p) })
    const uploadPartnerLogo = (i) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 10 * 1024 * 1024) { alert('Maksimum: 10MB'); return }
        setUploading(true)
        try {
          const fd = new FormData()
          fd.append('image', file)
          const res = await uploadAPI.single(fd)
          updatePartner(i, 'logo', res.data.url)
        } catch { alert('Yuklash xatosi') }
        finally { setUploading(false) }
      }
      input.click()
    }

    return (
      <div className="space-y-4">
        <MultilangInput section={section} field="title" label="Bo'lim sarlavhasi" values={data.title} onChange={updateField} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Hamkorlar ({items.length} ta)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((partner, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-200 relative flex flex-col items-center gap-2">
                <button type="button" onClick={() => removePartner(i)} className="absolute top-1 right-1 p-1 hover:bg-red-50 rounded text-red-400"><X size={12} /></button>
                <div onClick={() => uploadPartnerLogo(i)} className="w-full h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 overflow-hidden bg-white">
                  {partner.logo
                    ? <img src={partner.logo} alt="" className="w-full h-full object-contain p-1" />
                    : <div className="flex flex-col items-center">
                      {uploading ? <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" /> : <Upload size={18} className="text-gray-400" />}
                    </div>
                  }
                </div>
                <input
                  id={`partner-name-${i}`}
                  name={`partner-name-${i}`}
                  type="text"
                  value={partner.name || ''}
                  onChange={e => updatePartner(i, 'name', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center"
                  placeholder="Hamkor nomi"
                />
              </div>
            ))}
            <button type="button" onClick={addPartner} className="h-[108px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 gap-1">
              <Plus size={22} />
              <span className="text-xs">Qo'shish</span>
            </button>
          </div>
        </div>
        <SaveButton section={section} />
      </div>
    )
  }

  const renderGenericFields = (sectionKey, fields) => {
    const data = contentMap[sectionKey] || {}
    return (
      <div className="space-y-4">
        {fields.map(f => {
          if (f.type === 'multilang') return <MultilangInput key={f.key} section={sectionKey} field={f.key} label={f.label} values={data[f.key]} onChange={updateField} />
          if (f.type === 'multilang-textarea') return <MultilangTextarea key={f.key} section={sectionKey} field={f.key} label={f.label} values={data[f.key]} onChange={updateField} />
          if (f.type === 'image') return <ImageUploader key={f.key} section={sectionKey} field={f.key} label={f.label} />
          if (f.type === 'images') return <ImageArrayUploader key={f.key} section={sectionKey} field={f.key} label={f.label} />
          return (
            <div key={f.key}>
              <label htmlFor={`generic-${sectionKey}-${f.key}`} className="block text-sm font-medium text-gray-700 mb-2">{f.label}</label>
              <input
                id={`generic-${sectionKey}-${f.key}`}
                name={`generic-${sectionKey}-${f.key}`}
                type="text"
                value={data[f.key] || ''}
                onChange={e => updateField(sectionKey, f.key, null, e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )
        })}
        <SaveButton section={sectionKey} />
      </div>
    )
  }

  // ── Section configs ────────────────────────────────────────────────────────

  const HOME_SECTIONS = [
    { key: 'hero', label: "Hero bo'limi (Bosh ekran)", render: renderHeroSection },
    { key: 'features', label: "Xususiyatlar bo'limi (4 ta karta)", render: renderFeaturesSection },
    { key: 'topProducts', label: 'Top mahsulotlar', render: renderTopProductsSection },
    { key: 'advantages', label: "Afzalliklar bo'limi (doiralar)", render: () => renderItemsSection('advantages', 'Afzallik') },
    { key: 'showcase', label: "Mahsulot ko'rgazmasi (rasmlar)", render: renderShowcaseSection },
    { key: 'branches', label: "Filiallar bo'limi", render: renderBranchesSection },
    { key: 'consultation', label: 'Maxsus buyurtma / Konsultatsiya', render: renderConsultationSection },
    { key: 'partners', label: 'Hamkorlarimiz (slayder)', render: renderPartnersSection },
  ]

  const OTHER_PAGES = {
    about: [
      { section: 'hero', label: 'Sahifa sarlavhasi', fields: [{ key: 'title', type: 'multilang', label: 'Sarlavha' }] },
      {
        section: 'companyInfo', label: "Kompaniya ma'lumoti (matn + rasm)", fields: [
          { key: 'image', type: 'image', label: "Kompaniya rasmi (o'ng tomonda ko'rinadi)" },
          { key: 'paragraph1', type: 'multilang-textarea', label: '1-paragraf' },
          { key: 'paragraph2', type: 'multilang-textarea', label: '2-paragraf' },
          { key: 'paragraph3', type: 'multilang-textarea', label: "3-paragraf (ko'k quti)" },
          { key: 'strategicTitle', type: 'multilang', label: 'Strategik yondashuv - sarlavha' },
          { key: 'strategicText1', type: 'multilang-textarea', label: 'Strategik yondashuv - 1-paragraf' },
          { key: 'strategicText2', type: 'multilang-textarea', label: 'Strategik yondashuv - 2-paragraf' },
        ]
      },
      {
        section: 'globalSection', label: "Global hamkorlik bo'limi", fields: [
          { key: 'title1', type: 'multilang', label: 'Sarlavha 1-qator (gradient)' },
          { key: 'title2', type: 'multilang', label: 'Sarlavha 2-qator' },
        ]
      },
      { section: 'advantages', label: 'Afzalliklar (PNEUMAX background)', render: () => renderItemsSection('advantages', 'Afzallik') },
    ],
    catalog: [{ section: 'hero', label: 'Bosh qism', fields: [{ key: 'title', type: 'multilang', label: 'Sarlavha' }, { key: 'subtitle', type: 'multilang', label: "Qo'shimcha matn" }] }],
    calculator: [{ section: 'hero', label: 'Bosh qism', fields: [{ key: 'title', type: 'multilang', label: 'Sarlavha' }, { key: 'subtitle', type: 'multilang', label: "Qo'shimcha matn" }] }],
    customOrder: [
      { section: 'hero', label: 'Bosh qism', fields: [{ key: 'title', type: 'multilang', label: 'Sarlavha' }, { key: 'subtitle', type: 'multilang', label: "Qo'shimcha matn" }] },
      { section: 'benefits', label: 'Foydali jihatlar (Benefits)', render: () => renderItemsSection('benefits', 'Benefit') },
    ],
    blog: [{ section: 'hero', label: 'Bosh qism', fields: [{ key: 'title', type: 'multilang', label: 'Sarlavha' }, { key: 'subtitle', type: 'multilang', label: "Qo'shimcha matn" }] }],
  }

  const pages = ['home', 'about', 'catalog', 'calculator', 'customOrder', 'blog']
  const pageLabels = { home: 'Bosh sahifa', about: 'Biz haqimizda', catalog: 'Katalog', calculator: 'Kalkulyator', customOrder: 'Maxsus buyurtma', blog: 'Blog' }

  const renderSectionBlock = (key, label, renderFn) => {
    const isOpen = openSections[key]
    return (
      <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <button onClick={() => toggleSection(key)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
          <div className="flex items-center gap-3">
            {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            <span className="font-medium text-gray-900">{label}</span>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{key}</span>
        </button>
        {isOpen && <div className="p-4 pt-2 border-t border-gray-100">{renderFn()}</div>}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sahifa kontenti</h1>
        <p className="text-gray-600 text-sm">Har bir sahifa bo'limlarini tahrirlang</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {pages.map(p => (
          <button key={p} onClick={() => { setActivePage(p); setOpenSections({}) }} className={`px-4 py-2 rounded-lg text-sm font-medium ${activePage === p ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            {pageLabels[p] || p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Yuklanmoqda...</div>
      ) : activePage === 'home' ? (
        <div className="space-y-3">
          {HOME_SECTIONS.map(s => renderSectionBlock(s.key, s.label, s.render))}
        </div>
      ) : (
        <div className="space-y-3">
          {(OTHER_PAGES[activePage] || []).map(({ section, label, fields, render }) =>
            renderSectionBlock(section, label, render ? render : () => renderGenericFields(section, fields))
          )}
        </div>
      )}
    </div>
  )
}
