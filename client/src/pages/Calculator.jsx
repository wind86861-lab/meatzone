import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { faqsAPI, branchesAPI, requestsAPI, teamAPI } from '../services/api'
import { ImageIcon, MapPin, Phone, ChevronRight } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import branch1 from '../image/filyal1.jpg'
import branch2 from '../image/filyal2.jpg'

export default function Calculator() {
  const { t, language } = useLanguage()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [productModel, setProductModel] = useState('')
  const [comment, setComment] = useState('')
  const [openFaq, setOpenFaq] = useState(null)
  const [faqs, setFaqs] = useState([])
  const [branches, setBranches] = useState([])
  const [expert, setExpert] = useState(null)

  useEffect(() => {
    faqsAPI.getAll({ active: 'true' }).then(res => setFaqs(res.data || [])).catch(() => { })
    branchesAPI.getAll().then(res => setBranches(res.data || [])).catch(() => { })
    teamAPI.getAll({ active: 'true' }).then(res => { const members = res.data || []; if (members.length > 0) setExpert(members[0]) }).catch(() => { })
  }, [])


  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!phone) return
    setSubmitting(true)
    try {
      await requestsAPI.create({ name, phone, productModel, comment, type: 'calculator', page: 'calculator' })
      setSubmitted(true)
      setName(''); setPhone(''); setProductModel(''); setComment('')
    } catch { }
    finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="w-full bg-gradient-to-r from-[#1e3d69] to-[#3563e9] py-10 md:py-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20">
          <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-white mb-3 md:mb-4">
            {language === 'uz' && 'Ekspert orqali narx hisoblatish'}
            {language === 'ru' && 'Расчет цены через эксперта'}
            {language === 'en' && 'Price calculation via expert'}
          </h1>
          <p className="text-white/90 text-lg">
            {language === 'uz' && 'Formani to\'ldiring va biz sizga 15 daqiqa ichida qo\'ng\'iroq qilamiz, konsultatsiya beramiz'}
            {language === 'ru' && 'Заполните форму и мы перезвоним вам в течение 15 минут, проконсультируем'}
            {language === 'en' && 'Fill out the form and we will call you back within 15 minutes, consult'}
          </p>
        </div>
      </div>

      <div className="w-full bg-[#EFF3FD] py-6 md:py-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full mb-4 overflow-hidden bg-gray-100 flex items-center justify-center">
                  {expert?.image
                    ? <img src={expert.image} alt={expert.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-[#1e3d69] to-[#3563e9] flex items-center justify-center text-white text-4xl font-bold">
                      {expert ? expert.name.charAt(0) : <ImageIcon size={40} className="text-white/60" />}
                    </div>
                  }
                </div>
                <h3 className="text-xl font-bold text-[#1e3d69] mb-1">
                  {expert?.name || (language === 'uz' ? 'Ekspert' : language === 'ru' ? '\u042d\u043a\u0441\u043f\u0435\u0440\u0442' : 'Expert')}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  {expert ? (expert.title?.[language] || expert.title?.uz || expert.title?.ru || 'Expert') : (language === 'uz' ? 'Ekspert' : language === 'ru' ? '\u042d\u043a\u0441\u043f\u0435\u0440\u0442' : 'Expert')}
                </p>
                <div className="text-sm text-gray-600 space-y-2">
                  {expert ? (
                    <p>{expert.description?.[language] || expert.description?.uz || expert.description?.ru}</p>
                  ) : (
                    <>
                      <p>
                        {language === 'uz' && 'Uskuna va ehtiyot qismlar narxini hamda yetkazib berish xarajatlarini hisoblab beraman.'}
                        {language === 'ru' && '\u0420\u0430\u0441\u0441\u0447\u0438\u0442\u0430\u044e \u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c \u043e\u0431\u043e\u0440\u0443\u0434\u043e\u0432\u0430\u043d\u0438\u044f \u0438 \u0437\u0430\u043f\u0447\u0430\u0441\u0442\u0435\u0439.'}
                        {language === 'en' && 'I will calculate the cost of equipment and spare parts, as well as delivery costs.'}
                      </p>
                      <p>
                        {language === 'uz' && 'Sizni qaysi turdagi ehtiyot qismi qiziqtiryapti?'}
                        {language === 'ru' && '\u041a\u0430\u043a\u043e\u0439 \u0442\u0438\u043f \u0437\u0430\u043f\u0447\u0430\u0441\u0442\u0435\u0439 \u0432\u0430\u0441 \u0438\u043d\u0442\u0435\u0440\u0435\u0441\u0443\u0435\u0442?'}
                        {language === 'en' && 'What type of spare parts are you interested in?'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl p-6 md:p-8 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div className="flex flex-col gap-4 md:gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm md:text-base">
                      {language === 'uz' && 'Ismingiz'}
                      {language === 'ru' && 'Ваше имя'}
                      {language === 'en' && 'Your name'}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm md:text-base focus:outline-none focus:border-[#3563e9]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm md:text-base">
                      {language === 'uz' && '*Telefon nomeringiz'}
                      {language === 'ru' && '*Ваш телефон'}
                      {language === 'en' && '*Your phone'}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                      pattern="^(\+998[0-9]{9}|[0-9]{9})$"
                      placeholder="+998901234567"
                      title="Enter valid phone: +998XXXXXXXXX or XXXXXXXXX"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm md:text-base focus:outline-none focus:border-[#3563e9]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    {language === 'uz' && '*Tovar turi, Modeli'}
                    {language === 'ru' && '*Тип товара, Модель'}
                    {language === 'en' && '*Product type, Model'}
                  </label>
                  <input
                    type="text"
                    value={productModel}
                    onChange={(e) => setProductModel(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3563e9]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    {language === 'uz' && 'Izoh qoldirish'}
                    {language === 'ru' && 'Оставить комментарий'}
                    {language === 'en' && 'Leave a comment'}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="4"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3563e9]"
                  />
                </div>

                {submitted ? (
                  <div className="w-full bg-green-50 border border-green-200 rounded-xl py-4 text-center text-green-700 font-semibold">
                    {language === 'uz' ? 'Arizangiz qabul qilindi!' : language === 'ru' ? 'Заявка принята!' : 'Request received!'}
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#10b981] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#059669] transition-colors shadow-lg disabled:opacity-60"
                  >
                    {submitting ? '...' : language === 'uz' ? 'Konsultatsiya olish' : language === 'ru' ? 'Получить консультацию' : 'Get consultation'}
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-6 md:py-12">
        <div className="mb-16">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1e3d69] mb-6 md:mb-8 uppercase border-b-4 border-[#3563e9] inline-block pb-2">
            {language === 'uz' && 'FILIALLARIMIZ'}
            {language === 'ru' && 'НАШИ ФИЛИАЛЫ'}
            {language === 'en' && 'OUR BRANCHES'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-12">
            {branches.map((branch, idx) => (
              <React.Fragment key={branch._id}>
                <Link to={`/branches#branch-${branch._id}`} className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow h-[250px] md:h-[350px] cursor-pointer">
                  <div className="bg-gradient-to-br from-[#1e3d69] to-[#2d5a8f] p-6 md:p-10 text-white h-full flex flex-col justify-between">
                    <div>
                      <h4 className="text-2xl font-bold mb-6">{branch.title?.[language] || branch.title?.uz}</h4>
                      <div className="flex items-start gap-3 mb-4">
                        <MapPin size={20} className="text-white mt-1" />
                        <p className="text-sm opacity-90">{branch.fullAddress}</p>
                      </div>
                      {branch.phones?.[0] && (
                        <div className="flex items-center gap-3">
                          <Phone size={20} className="text-white" />
                          <p>{branch.phones[0]}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
                <Link to={`/branches#branch-${branch._id}`} className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow h-[250px] md:h-[350px] cursor-pointer">
                  <img src={branch.image || (idx === 0 ? branch1 : branch2)} alt={branch.title?.uz} className="w-full h-full object-cover" />
                </Link>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1e3d69] mb-6 md:mb-8 uppercase">
            {language === 'uz' && 'ENG KO\'P BERILADIGAN SAVOLLAR'}
            {language === 'ru' && 'ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ'}
            {language === 'en' && 'FREQUENTLY ASKED QUESTIONS'}
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === faq._id ? null : faq._id)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.question?.[language] || faq.question?.uz}</span>
                  <ChevronRight
                    className={`text-gray-400 transition-transform ${openFaq === faq._id ? 'rotate-90' : ''}`}
                    size={20}
                  />
                </button>
                {openFaq === faq._id && (
                  <div className="px-6 pb-6 text-gray-600">
                    {faq.answer?.[language] || faq.answer?.uz}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
