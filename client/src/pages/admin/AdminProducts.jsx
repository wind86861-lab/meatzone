import { useEffect, useState } from 'react'
import { productsAPI, categoriesAPI, uploadAPI } from '../../services/api'
import { Plus, Pencil, Trash2, Search, X, Upload, Star, StarOff, Package, ChevronDown } from 'lucide-react'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [formParentCat, setFormParentCat] = useState('')
  const [form, setForm] = useState({
    name: { uz: '', ru: '', en: '' },
    description: { uz: '', ru: '', en: '' },
    price: '',
    discountValue: '',
    discountType: 'percentage',
    category: '',
    images: [],
    stock: '',
    isFeatured: false,
    isActive: true,
  })

  const parentCategories = categories.filter(c => !c.parent)
  const subcategoriesOf = (parentId) => categories.filter(c => {
    const pid = c.parent?._id || c.parent
    return pid === parentId
  })

  useEffect(() => {
    fetchProducts()
  }, [page, search, filterCategory])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = { page, limit: 10, search }
      if (filterCategory) params.category = filterCategory
      const res = await productsAPI.getAll(params)
      setProducts(res.data.products || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.getAll()
      setCategories(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setFormParentCat('')
    setForm({
      name: { uz: '', ru: '', en: '' },
      description: { uz: '', ru: '', en: '' },
      price: '',
      discountValue: '',
      discountType: 'percentage',
      category: '',
      images: [],
      stock: '',
      isFeatured: false,
      isActive: true,
    })
    setShowModal(true)
  }

  const openEdit = (product) => {
    setEditing(product._id)
    const subcat = product.category
    const parentId = subcat?.parent?._id || subcat?.parent || ''
    setFormParentCat(parentId)
    setForm({
      name: product.name || { uz: '', ru: '', en: '' },
      description: product.description || { uz: '', ru: '', en: '' },
      price: product.price || '',
      discountValue: product.discountValue || '',
      discountType: product.discountType || 'percentage',
      category: subcat?._id || subcat || '',
      images: product.images || [],
      stock: product.stock || '',
      isFeatured: product.isFeatured || false,
      isActive: product.isActive !== false,
    })
    setShowModal(true)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: 10MB.\n\nTip: Use online tools like TinyPNG or Squoosh to compress images before uploading.`)
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await uploadAPI.single(fd)
      setForm(prev => ({ ...prev, images: [...prev.images, res.data.url] }))
    } catch (err) {
      alert('Ошибка загрузки')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.category) {
      alert('Пожалуйста, выберите категорию и подкатегорию')
      return
    }

    try {
      const data = {
        ...form,
        price: Number(form.price),
        discountValue: form.discountValue ? Number(form.discountValue) : null,
        stock: Number(form.stock) || 0,
      }
      if (editing) {
        await productsAPI.update(editing, data)
      } else {
        await productsAPI.create(data)
      }
      setShowModal(false)
      fetchProducts()
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка сохранения товара')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить этот товар?')) return
    try {
      await productsAPI.delete(id)
      fetchProducts()
    } catch (err) {
      alert('Ошибка удаления товара')
    }
  }

  const toggleFeatured = async (product) => {
    try {
      await productsAPI.update(product._id, { ...product, isFeatured: !product.isFeatured, category: product.category?._id || product.category })
      fetchProducts()
    } catch (err) {
      alert('Ошибка обновления товара')
    }
  }

  const toggleActive = async (product) => {
    try {
      await productsAPI.update(product._id, { ...product, isActive: !product.isActive, category: product.category?._id || product.category })
      fetchProducts()
    } catch (err) {
      alert('Ошибка обновления товара')
    }
  }

  const totalPages = Math.ceil(total / 10)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Товары</h1>
          <p className="text-gray-600 text-sm">Всего {total} товаров</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={18} /> Добавить товар
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск товаров..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:min-w-[200px] sm:w-auto"
        >
          <option value="">Все категории</option>
          {parentCategories.map(cat => (
            <optgroup key={cat._id} label={cat.name?.uz}>
              {subcategoriesOf(cat._id).map(sub => (
                <option key={sub._id} value={sub._id}>{sub.name?.uz}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 font-medium text-gray-600">Фото</th>
                <th className="text-left p-4 font-medium text-gray-600">Название (UZ)</th>
                <th className="text-left p-4 font-medium text-gray-600">Категория</th>
                <th className="text-left p-4 font-medium text-gray-600">Цена</th>
                <th className="text-left p-4 font-medium text-gray-600">Склад</th>
                <th className="text-left p-4 font-medium text-gray-600">Избранный</th>
                <th className="text-left p-4 font-medium text-gray-600">Статус</th>
                <th className="text-right p-4 font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">Загрузка...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-400">Товары не найдены</td></tr>
              ) : products.map(product => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-gray-900">{product.name?.uz || '—'}</td>
                  <td className="p-4">
                    {product.category ? (
                      <div>
                        {product.category.parent && (
                          <p className="text-xs text-gray-400">{product.category.parent?.name?.uz}</p>
                        )}
                        <p className="text-sm text-gray-700 font-medium">{product.category.name?.uz}</p>
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="p-4">
                    {product.hasDiscount ? (
                      <div className="flex flex-col">
                        <span className="text-gray-700 font-semibold">{product.finalPrice?.toLocaleString()} so'm</span>
                        <span className="text-xs text-gray-400 line-through">{product.price?.toLocaleString()} so'm</span>
                        <span className="text-xs text-green-600">-{product.discountType === 'percentage' ? `${product.discountValue}%` : `${product.discountValue?.toLocaleString()} so'm`}</span>
                      </div>
                    ) : (
                      <span className="text-gray-700">{product.price?.toLocaleString()} so'm</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-700">{product.stock}</td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleFeatured(product)}
                      className="p-1 hover:bg-yellow-50 rounded transition-colors"
                      title={product.isFeatured ? 'Убрать из избранных' : 'Добавить в избранные'}
                    >
                      {product.isFeatured ? <Star size={18} className="text-yellow-500 fill-yellow-500" /> : <StarOff size={18} className="text-gray-300" />}
                    </button>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleActive(product)}
                      className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${product.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      title={product.isActive ? 'Нажмите чтобы отключить' : 'Нажмите чтобы включить'}
                    >
                      {product.isActive ? 'Активен' : 'Неактивен'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(product)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(product._id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">Стр. {page} из {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50">Назад</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50">Вперёд</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4 pt-10">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Редактировать товар' : 'Добавить товар'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название товара</label>
                <div className="space-y-2">
                  <input placeholder="Nomi (UZ)" value={form.name.uz} onChange={e => setForm(f => ({ ...f, name: { ...f.name, uz: e.target.value } }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  <input placeholder="Nomi (RU)" value={form.name.ru} onChange={e => setForm(f => ({ ...f, name: { ...f.name, ru: e.target.value } }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  <input placeholder="Nomi (EN)" value={form.name.en} onChange={e => setForm(f => ({ ...f, name: { ...f.name, en: e.target.value } }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                <div className="space-y-2">
                  <textarea placeholder="Ta'rif (UZ)" value={form.description.uz} onChange={e => setForm(f => ({ ...f, description: { ...f.description, uz: e.target.value } }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
                  <textarea placeholder="Ta'rif (RU)" value={form.description.ru} onChange={e => setForm(f => ({ ...f, description: { ...f.description, ru: e.target.value } }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
                  <textarea placeholder="Ta'rif (EN)" value={form.description.en} onChange={e => setForm(f => ({ ...f, description: { ...f.description, en: e.target.value } }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Цена</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Склад</label>
                  <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип скидки</label>
                  <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="fixed">Фиксированная сумма</option>
                    <option value="percentage">Процент %</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Скидка {form.discountType === 'percentage' ? '(%)' : '(Сумма)'}
                  </label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={form.discountType === 'percentage' ? 'Пример: 10 (для 10%)' : 'Пример: 50000'}
                    max={form.discountType === 'percentage' ? '100' : undefined}
                    min="0"
                  />
                  {form.price && form.discountValue && (
                    <p className="text-xs text-gray-500 mt-1">
                      Итоговая цена: <span className="font-semibold text-green-600">
                        {form.discountType === 'percentage'
                          ? Math.round(Number(form.price) * (1 - Math.min(Number(form.discountValue), 100) / 100)).toLocaleString()
                          : Math.max(0, Number(form.price) - Number(form.discountValue)).toLocaleString()
                        } so'm
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                  <select
                    value={formParentCat}
                    onChange={e => { setFormParentCat(e.target.value); setForm(f => ({ ...f, category: '' })) }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Выберите категорию</option>
                    {parentCategories.map(c => <option key={c._id} value={c._id}>{c.name?.uz}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Подкатегория</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!formParentCat}
                  >
                    <option value="">{formParentCat ? 'Выберите подкатегорию' : '← Сначала выберите категорию'}</option>
                    {subcategoriesOf(formParentCat).map(c => <option key={c._id} value={c._id}>{c.name?.uz}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Изображения</label>
                <div className="flex flex-wrap gap-3">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                    </div>
                  ))}
                  <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400">
                    {uploading ? <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" /> : <Upload size={20} className="text-gray-400" />}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="rounded" />
                  <span className="text-gray-700">Избранный товар</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                  <span className="text-gray-700">Активен</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm">Отмена</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">{editing ? 'Обновить' : 'Создать'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
