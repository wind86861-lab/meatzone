import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { Calendar, Eye, ArrowLeft, Package } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { blogsAPI, requestsAPI } from '../services/api'

export default function BlogDetail() {
  const { language } = useLanguage()
  const { id } = useParams()
  const [blog, setBlog] = useState(null)
  const [relatedBlogs, setRelatedBlogs] = useState([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (id) {
      blogsAPI.getById(id).then(res => setBlog(res.data)).catch(() => { })
      blogsAPI.getAll({ published: 'true', limit: 3 }).then(res => setRelatedBlogs(res.data?.blogs || [])).catch(() => { })
    }
  }, [id])

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!phone) return
    setSubmitting(true)
    try {
      await requestsAPI.create({ name, phone, type: 'consultation', page: 'blog' })
      setSubmitted(true); setName(''); setPhone('')
    } catch { }
    finally { setSubmitting(false) }
  }

  if (!blog) return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-20 text-center text-gray-400">
        Yuklanmoqda...
      </div>
      <Footer />
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-6 md:py-8">
        <Link to="/blog" className="inline-flex items-center gap-2 text-[#3563e9] hover:text-[#2952d1] mb-6">
          <ArrowLeft size={20} />
          <span className="font-medium">
            {language === 'uz' && 'Orqaga'}
            {language === 'ru' && 'Назад'}
            {language === 'en' && 'Back'}
          </span>
        </Link>

        <div className="mb-8">
          <div className="w-full h-[200px] sm:h-[280px] md:h-[350px] lg:h-[400px] bg-gradient-to-br from-[#1e3d69] to-[#3563e9] rounded-2xl overflow-hidden mb-6">
            {blog.image
              ? <img src={blog.image} alt={blog.title?.[language]} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Package size={80} className="text-white/30" /></div>}
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye size={16} />
              <span>{blog.views || 0}</span>
            </div>
          </div>

          <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-[#1e3d69] mb-4 md:mb-6">
            {blog.title?.[language] || blog.title?.uz}
          </h1>

          <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4">
            <p>{blog.content?.[language] || blog.content?.uz}</p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1e3d69] mb-5 md:mb-8 uppercase">
            {language === 'uz' && 'O\'XSHASH YANGILIKLAR'}
            {language === 'ru' && 'ПОХОЖИЕ НОВОСТИ'}
            {language === 'en' && 'SIMILAR NEWS'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {relatedBlogs.map((blogItem) => (
              <Link key={blogItem._id} to={`/blog/${blogItem._id}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow block">
                <div className="h-48 bg-gray-50 flex items-center justify-center">
                  {blogItem.image
                    ? <img src={blogItem.image} alt={blogItem.title?.[language]} className="w-full h-full object-cover" />
                    : <Package size={48} className="text-gray-200" />}
                </div>
                <div className="p-5">
                  <div className="text-xs text-gray-500 mb-2">
                    {new Date(blogItem.createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'uz-UZ')}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm line-clamp-2">
                    {blogItem.title?.[language] || blogItem.title?.uz}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {blogItem.content?.[language] || blogItem.content?.uz}
                  </p>
                  <span className="block w-full bg-[#3563e9] text-white py-2.5 rounded-lg font-medium hover:bg-[#2952d1] transition-colors text-center">
                    {language === 'uz' ? 'Batafsil' : language === 'ru' ? 'Подробнее' : 'Read more'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 md:p-12">
          <h2 className="text-2xl font-bold text-[#1e3d69] mb-2">
            {language === 'uz' && 'Hamkorlik konsultatsiya oling'}
            {language === 'ru' && 'Получить консультацию по партнерству'}
            {language === 'en' && 'Get partnership consultation'}
          </h2>
          <p className="text-gray-600 mb-8">
            {language === 'uz' && 'Kompaniya haqida ko\'proq ma\'lumot olish uchun ariza qoldiring'}
            {language === 'ru' && 'Оставьте заявку, чтобы узнать больше о компании'}
            {language === 'en' && 'Leave a request to learn more about the company'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'uz' ? 'Ismingizni kiriting' : language === 'ru' ? 'Введите имя' : 'Enter name'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm md:text-base focus:outline-none focus:border-[#3563e9]"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
              pattern="^(\+998[0-9]{9}|[0-9]{9})$"
              placeholder="+998901234567"
              title="Enter valid phone: +998XXXXXXXXX or XXXXXXXXX"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm md:text-base focus:outline-none focus:border-[#3563e9]"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#10b981] text-white py-3 md:py-4 rounded-xl font-semibold text-base md:text-lg hover:bg-[#059669] transition-colors disabled:opacity-60"
            >
              {submitting ? '...' : language === 'uz' ? 'Ariza Yuborish' : language === 'ru' ? 'Отправить заявку' : 'Send request'}
            </button>
            {submitted && (
              <div className="col-span-2 bg-green-50 border border-green-200 rounded-xl py-3 text-center text-green-700 font-semibold">
                {language === 'uz' ? 'Arizangiz qabul qilindi!' : language === 'ru' ? 'Заявка принята!' : 'Request received!'}
              </div>
            )}
          </form>
        </div>
      </div>

      <Footer />
    </div>
  )
}
