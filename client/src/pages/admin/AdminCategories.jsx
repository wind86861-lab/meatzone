import { useEffect, useState } from 'react'
import { categoriesAPI, uploadAPI } from '../../services/api'
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronRight, FolderOpen, Folder, Search, Tag, ImageIcon } from 'lucide-react'

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [expandedCategories, setExpandedCategories] = useState({})
  const [activeTab, setActiveTab] = useState('tree')
  const [form, setForm] = useState({
    name: { uz: '', ru: '', en: '' },
    parent: '',
    order: 0,
    isActive: true,
    image: '',
  })
  const [imageUploading, setImageUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState('')

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await categoriesAPI.getAll()
      setCategories(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const parentCategories = categories.filter(c => !c.parent)
  const subcategoriesOf = (parentId) => categories.filter(c => {
    const pid = c.parent?._id || c.parent
    return pid === parentId
  })

  const filteredParents = parentCategories.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.name?.uz?.toLowerCase().includes(q) ||
      c.name?.ru?.toLowerCase().includes(q) ||
      c.name?.en?.toLowerCase().includes(q)
  })

  const filteredAll = categories.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.name?.uz?.toLowerCase().includes(q) ||
      c.name?.ru?.toLowerCase().includes(q) ||
      c.name?.en?.toLowerCase().includes(q)
  })

  const toggleExpand = (id) => setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }))

  const openCreate = (parentId = '') => {
    setEditing(null)
    setForm({ name: { uz: '', ru: '', en: '' }, parent: parentId, order: 0, isActive: true, image: '' })
    setImagePreview('')
    setShowModal(true)
  }

  const openEdit = (cat) => {
    setEditing(cat._id)
    setForm({
      name: cat.name || { uz: '', ru: '', en: '' },
      parent: cat.parent?._id || cat.parent || '',
      order: cat.order || 0,
      isActive: cat.isActive !== false,
      image: cat.image || '',
    })
    setImagePreview(cat.image || '')
    setShowModal(true)
  }

  const handleImageUpload = async (file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return }
    setImagePreview(URL.createObjectURL(file))
    setImageUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await uploadAPI.single(fd)
      setForm(f => ({ ...f, image: res.data.url }))
    } catch { setImagePreview(form.image || ''); alert('Upload failed') }
    finally { setImageUploading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { ...form, parent: form.parent || null, order: Number(form.order) }
      if (editing) await categoriesAPI.update(editing, data)
      else await categoriesAPI.create(data)
      setShowModal(false)
      fetchCategories()
    } catch (err) { alert(err.response?.data?.message || 'Error') }
  }

  const removeImage = () => {
    setForm(f => ({ ...f, image: '' }))
    setImagePreview('')
  }

  const handleDelete = async (id) => {
    const subs = subcategoriesOf(id)
    if (subs.length > 0) {
      if (!confirm(`У этой категории ${subs.length} подкатегорий. Удалить всё равно?`)) return
    } else {
      if (!confirm('Удалить эту категорию?')) return
    }
    try { await categoriesAPI.delete(id); fetchCategories() }
    catch (err) { alert('Error deleting') }
  }

  const toggleActive = async (cat) => {
    try {
      await categoriesAPI.update(cat._id, { ...cat, isActive: !cat.isActive, parent: cat.parent?._id || cat.parent || null })
      fetchCategories()
    } catch (err) { alert('Error updating') }
  }

  const totalCategories = parentCategories.length
  const totalSubcategories = categories.filter(c => c.parent).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Категории</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            <span className="font-medium text-blue-600">{totalCategories}</span> категорий &middot;{' '}
            <span className="font-medium text-purple-600">{totalSubcategories}</span> подкатегорий
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openCreate('')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={16} /> Добавить категорию
          </button>
        </div>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск категорий..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
          <button onClick={() => setActiveTab('tree')} className={`px-3 py-1.5 rounded-md font-medium transition-all ${activeTab === 'tree' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Дерево</button>
          <button onClick={() => setActiveTab('flat')} className={`px-3 py-1.5 rounded-md font-medium transition-all ${activeTab === 'flat' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Список</button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">Загрузка...</div>
      ) : activeTab === 'tree' ? (
        /* Tree View */
        <div className="space-y-3">
          {filteredParents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">Категории не найдены</div>
          ) : filteredParents.map(cat => {
            const subs = subcategoriesOf(cat._id)
            const isExpanded = expandedCategories[cat._id] === true
            return (
              <div key={cat._id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Category row */}
                <div className="flex items-center gap-3 p-4 hover:bg-gray-50">
                  <button onClick={() => toggleExpand(cat._id)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {cat.image
                      ? <img src={cat.image} alt="" className="w-full h-full object-cover" />
                      : <FolderOpen size={16} className="text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{cat.name?.uz}</p>
                    <p className="text-xs text-gray-500">{cat.name?.ru} · {cat.name?.en}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full font-medium">{subs.length} sub</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Order: {cat.order}</span>
                    <button
                      onClick={() => toggleActive(cat)}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {cat.isActive ? 'Активен' : 'Неактивен'}
                    </button>
                    <button onClick={() => openCreate(cat._id)} className="p-1.5 hover:bg-purple-50 rounded-lg text-purple-600" title="Добавить подкатегорию"><Plus size={15} /></button>
                    <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(cat._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={15} /></button>
                  </div>
                </div>
                {/* Subcategory rows */}
                {isExpanded && subs.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    {subs.map((sub, idx) => (
                      <div key={sub._id} className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-100/60 ${idx < subs.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="w-6 flex-shrink-0" />
                        <div className="w-px h-6 bg-gray-300 flex-shrink-0" />
                        <div className="w-7 h-7 bg-purple-100 rounded-md flex items-center justify-center flex-shrink-0">
                          <Tag size={13} className="text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm">{sub.name?.uz}</p>
                          <p className="text-xs text-gray-400">{sub.name?.ru} · {sub.name?.en}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Order: {sub.order}</span>
                          <button
                            onClick={() => toggleActive(sub)}
                            className={`text-xs px-2 py-1 rounded-full font-medium ${sub.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                          >
                            {sub.isActive ? 'Активен' : 'Неактивен'}
                          </button>
                          <button onClick={() => openEdit(sub)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(sub._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isExpanded && subs.length === 0 && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-12 py-3 text-xs text-gray-400 flex items-center gap-2">
                    <span>Подкатегорий нет.</span>
                    <button onClick={() => openCreate(cat._id)} className="text-purple-600 hover:underline font-medium">+ Добавить</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* Flat List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 font-medium text-gray-600">Тип</th>
                <th className="text-left p-4 font-medium text-gray-600">Название (UZ)</th>
                <th className="text-left p-4 font-medium text-gray-600">Название (RU)</th>
                <th className="text-left p-4 font-medium text-gray-600">Родитель</th>
                <th className="text-left p-4 font-medium text-gray-600">Порядок</th>
                <th className="text-left p-4 font-medium text-gray-600">Статус</th>
                <th className="text-right p-4 font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAll.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">Категории не найдены</td></tr>
              ) : filteredAll.map(cat => (
                <tr key={cat._id} className={`hover:bg-gray-50 ${cat.parent ? 'bg-gray-50/30' : ''}`}>
                  <td className="p-4">
                    {cat.parent
                      ? <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-medium flex items-center gap-1 w-fit"><Tag size={11} /> Sub</span>
                      : <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium flex items-center gap-1 w-fit"><Folder size={11} /> Cat</span>
                    }
                  </td>
                  <td className="p-4 font-medium text-gray-900">{cat.name?.uz}</td>
                  <td className="p-4 text-gray-700">{cat.name?.ru}</td>
                  <td className="p-4 text-gray-500">{cat.parent?.name?.uz || <span className="text-gray-300">—</span>}</td>
                  <td className="p-4 text-gray-500">{cat.order}</td>
                  <td className="p-4">
                    <button onClick={() => toggleActive(cat)} className={`text-xs px-2 py-1 rounded-full font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(cat)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(cat._id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-bold">{editing ? 'Редактировать' : 'Добавить'} {form.parent ? 'подкатегорию' : 'категорию'}</h2>
                {form.parent && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    В составе: <span className="font-medium text-blue-600">{parentCategories.find(c => c._id === form.parent)?.name?.uz}</span>
                  </p>
                )}
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название</label>
                <input placeholder="Name (UZ)" value={form.name.uz} onChange={e => setForm(f => ({ ...f, name: { ...f.name, uz: e.target.value } }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <input placeholder="Name (RU)" value={form.name.ru} onChange={e => setForm(f => ({ ...f, name: { ...f.name, ru: e.target.value } }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <input placeholder="Name (EN)" value={form.name.en} onChange={e => setForm(f => ({ ...f, name: { ...f.name, en: e.target.value } }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rasm (Ixtiyoriy)</label>
                {imagePreview ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200">
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                    {imageUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e.target.files[0])} />
                    {imageUploading
                      ? <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      : <>
                        <ImageIcon size={28} className="text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500 font-medium">Rasm yuklash</span>
                        <span className="text-xs text-gray-400 mt-1">Max 5MB</span>
                      </>
                    }
                  </label>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Родительская категория</label>
                  <select value={form.parent} onChange={e => setForm(f => ({ ...f, parent: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Нет (верхний уровень)</option>
                    {parentCategories.filter(c => c._id !== editing).map(c => (
                      <option key={c._id} value={c._id}>{c.name?.uz}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Порядок</label>
                  <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-700">Активен (видно пользователям)</span>
              </label>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Отмена</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">{editing ? 'Обновить' : 'Создать'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
