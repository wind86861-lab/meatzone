import { useEffect, useState } from 'react'
import { bannersAPI, categoriesAPI, uploadAPI } from '../../services/api'
import { Plus, Trash2, Save, Check, Eye, EyeOff, GripVertical, Upload } from 'lucide-react'
import ImageCropper from '../../components/ImageCropper'

// Banner aspect ratio (matches the 260x140 promo card on the home page)
const BANNER_ASPECT = 260 / 140

const VARIANTS = [
  { value: 'red', label: 'Qizil', className: 'bg-red-600' },
  { value: 'dark', label: 'Qora', className: 'bg-gray-900' },
  { value: 'amber', label: 'Amber', className: 'bg-amber-600' },
  { value: 'green', label: 'Yashil', className: 'bg-green-600' },
  { value: 'blue', label: 'Ko\'k', className: 'bg-blue-600' },
  { value: 'purple', label: 'Siyoh', className: 'bg-purple-600' },
]

export default function AdminBanners() {
  const [banners, setBanners] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [linkModes, setLinkModes] = useState({})
  const [uploadingId, setUploadingId] = useState(null)
  const [cropperImage, setCropperImage] = useState(null)
  const [cropperBannerId, setCropperBannerId] = useState(null)

  useEffect(() => { fetchBanners(); fetchCategories() }, [])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const res = await bannersAPI.getAdmin()
      setBanners(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.getAll()
      const data = res.data
      setCategories(Array.isArray(data) ? data : (data.categories || []))
    } catch (err) { console.error(err) }
  }

  const updateBanner = (id, field, value) => {
    setBanners(prev => prev.map(b => b._id === id ? { ...b, [field]: value } : b))
  }

  const handleImageSelect = (e, id) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('Rasm juda katta (max 10MB)'); return }
    const reader = new FileReader()
    reader.onload = () => { setCropperImage(reader.result); setCropperBannerId(id) }
    reader.readAsDataURL(file)
    e.target.value = '' // allow re-selecting the same file
  }

  const handleCropComplete = async (croppedBlob) => {
    const id = cropperBannerId
    setCropperImage(null)
    if (!id) return
    setUploadingId(id)
    try {
      const fd = new FormData()
      fd.append('image', croppedBlob, 'banner.jpg')
      const res = await uploadAPI.single(fd)
      updateBanner(id, 'image', res.data.url)
    } catch { alert('Yuklashda xatolik') }
    finally { setUploadingId(null); setCropperBannerId(null) }
  }

  const addBanner = () => {
    const newBanner = {
      _id: 'new_' + Date.now(),
      title: 'Yangi taklif',
      subtitle: 'Batafsil',
      tag: 'Aksiya',
      emoji: '🥩',
      variant: 'red',
      image: '',
      link: '/catalog',
      active: true,
      order: banners.length,
      isNew: true,
    }
    setBanners(prev => [...prev, newBanner])
  }

  const removeBanner = async (id) => {
    const b = banners.find(x => x._id === id)
    if (!b) return
    if (!b.isNew) {
      if (!confirm('Banner o\'chirilsinmi?')) return
      try {
        await bannersAPI.delete(id)
      } catch (err) { alert('O\'chirishda xatolik'); return }
    }
    setBanners(prev => prev.filter(x => x._id !== id))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const b of banners) {
        const payload = {
          title: b.title || '',
          subtitle: b.subtitle || '',
          tag: b.tag || '',
          emoji: b.emoji || '',
          variant: b.variant || 'red',
          image: b.image || '',
          link: b.link || '/catalog',
          active: !!b.active,
          order: b.order ?? 0,
        }
        if (b.isNew) {
          const res = await bannersAPI.create(payload)
          b._id = res.data._id
          b.isNew = false
        } else {
          await bannersAPI.update(b._id, payload)
        }
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      await fetchBanners()
    } catch (err) {
      alert('Saqlashda xatolik')
      console.error(err)
    } finally { setSaving(false) }
  }

  const moveBanner = (index, direction) => {
    if (direction === -1 && index === 0) return
    if (direction === 1 && index === banners.length - 1) return
    setBanners(prev => {
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(index + direction, 0, moved)
      return next.map((b, i) => ({ ...b, order: i }))
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  const catName = (c) => (typeof c.name === 'string' ? c.name : (c.name?.uz || c.name?.ru || c.name?.en || 'Kategoriya'))
  const topCats = categories.filter(c => !c.parent)
  const subsOf = (id) => categories.filter(c => String(c.parent?._id || c.parent || '') === String(id))
  const linkOptions = [
    { value: '/catalog', label: 'Katalog (barchasi)' },
    ...topCats.flatMap(c => [
      { value: `/catalog?category=${c._id}`, label: catName(c) },
      ...subsOf(c._id).map(s => ({ value: `/catalog?category=${s._id}`, label: `— ${catName(s)}` })),
    ]),
  ]
  const isCategoryLink = (link) => !link || link === '/catalog' || link.startsWith('/catalog?category=')
  const getLinkMode = (b) => linkModes[b._id] ?? (isCategoryLink(b.link) ? 'category' : 'custom')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bannerlar</h1>
          <p className="text-gray-600 text-sm">Bosh sahifadagi slayder bannerlarni boshqarish</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addBanner} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
            <Plus size={18} /> Yangi banner
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
            {saved ? <><Check size={18} /> Saqlandi!</> : saving ? 'Saqlanmoqda...' : <><Save size={18} /> Saqlash</>}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {banners.map((b, i) => (
          <div key={b._id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${b.active ? 'border-gray-100' : 'border-gray-200 opacity-70'}`}>
            <div className="flex items-center gap-2 p-3 border-b border-gray-100 bg-gray-50">
              <button onClick={() => moveBanner(i, -1)} disabled={i === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><GripVertical size={16} className="-mr-3" /></button>
              <button onClick={() => moveBanner(i, 1)} disabled={i === banners.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><GripVertical size={16} className="-ml-3" /></button>
              <span className="text-xs font-bold text-gray-400 w-6">{i + 1}</span>
              <button onClick={() => updateBanner(b._id, 'active', !b.active)} className="ml-auto p-1.5 rounded-lg hover:bg-gray-200">
                {b.active ? <Eye size={16} className="text-green-600" /> : <EyeOff size={16} className="text-gray-400" />}
              </button>
              <button onClick={() => removeBanner(b._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                <Trash2 size={16} />
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Rang (variant)</label>
                    <select value={b.variant || 'red'} onChange={e => updateBanner(b._id, 'variant', e.target.value)}
                      className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {VARIANTS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-500">Havola</label>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => setLinkModes(prev => ({ ...prev, [b._id]: 'category' }))}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${getLinkMode(b) === 'category' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          Kategoriya
                        </button>
                        <button type="button" onClick={() => setLinkModes(prev => ({ ...prev, [b._id]: 'custom' }))}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${getLinkMode(b) === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          Link
                        </button>
                      </div>
                    </div>
                    {getLinkMode(b) === 'category' ? (
                      <select value={b.link || '/catalog'} onChange={e => updateBanner(b._id, 'link', e.target.value)}
                        className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {b.link && !linkOptions.some(o => o.value === b.link) && (
                          <option value={b.link}>{b.link}</option>
                        )}
                        {linkOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={b.link || ''} onChange={e => updateBanner(b._id, 'link', e.target.value)}
                        placeholder="https://... yoki /catalog"
                        className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    )}
                  </div>
                </div>
                {/* Banner image — click the box to upload; this is how it looks on the site */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Banner rasmi (bosib yuklang)</label>
                  <label className="group relative block w-full max-w-[340px] aspect-[13/7] rounded-xl overflow-hidden cursor-pointer border border-gray-200">
                    {b.image ? (
                      <img src={b.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className={`absolute inset-0 ${VARIANTS.find(v => v.value === (b.variant || 'red'))?.className || 'bg-red-600'}`} />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploadingId === b._id ? (
                        <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <span className="text-white text-xs font-semibold flex items-center gap-1.5"><Upload size={16} /> {b.image ? 'Almashtirish' : 'Rasm yuklash'}</span>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingId === b._id} onChange={e => handleImageSelect(e, b._id)} />
                  </label>
                  {b.image && (
                    <button onClick={() => updateBanner(b._id, 'image', '')} className="mt-1 text-xs text-red-500 hover:underline">Rasmni olib tashlash</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500">Bannerlar yo\'q</p>
            <button onClick={addBanner} className="mt-3 text-blue-600 text-sm hover:underline">Yangi banner qo\'shish</button>
          </div>
        )}
      </div>

      <div className="flex justify-end pb-8">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
          {saved ? <><Check size={18} /> Saqlandi!</> : saving ? 'Saqlanmoqda...' : <><Save size={18} /> Saqlash</>}
        </button>
      </div>

      {cropperImage && (
        <ImageCropper
          image={cropperImage}
          aspect={BANNER_ASPECT}
          onComplete={handleCropComplete}
          onCancel={() => { setCropperImage(null); setCropperBannerId(null) }}
        />
      )}
    </div>
  )
}
