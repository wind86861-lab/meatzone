import { useState, useEffect } from 'react'
import { Package, Users, CreditCard, Target } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { requestsAPI, teamAPI, pageContentAPI } from '../services/api'

export default function About() {
  const { language } = useLanguage()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [teamMembers, setTeamMembers] = useState([])
  const [content, setContent] = useState({})

  useEffect(() => {
    teamAPI.getAll({ active: 'true' }).then(res => setTeamMembers(res.data || [])).catch(() => { })
    pageContentAPI.getAll({ page: 'about' }).then(res => {
      const map = {}
        ; (res.data || []).forEach(item => { map[item.section] = item.content || {} })
      setContent(map)
    }).catch(() => { })
  }, [])

  const c = (section, key, lang) => {
    const val = content[section]?.[key]
    if (!val) return ''
    if (lang) return val[lang] || val.uz || ''
    return val
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!phone) return
    setSubmitting(true)
    try {
      await requestsAPI.create({ name, phone, type: 'consultation', page: 'about' })
      setSubmitted(true)
      setName(''); setPhone('')
    } catch { }
    finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-6 md:py-12">
        <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-[#1e3d69] mb-6 md:mb-12 uppercase" data-aos="fade-down">
          {language === 'uz' && 'BIZ XAQIMIZDA'}
          {language === 'ru' && 'О НАС'}
          {language === 'en' && 'ABOUT US'}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-10 md:mb-16">
          <div className="space-y-6" data-aos="fade-right">
            <div>
              <p className="text-gray-700 leading-relaxed mb-4">
                <span className="font-bold text-[#1e3d69]">Pneumax</span>
                {' '}{c('companyInfo', 'paragraph1', language) ||
                  (language === 'uz' ? '– sanoat, ishlab chiqarish va qurilish sohalari uchun yuqori sifatli sanoat ehtiyot qismlarini xalqaro miqyosda yetkazib beruvchi kompaniya.' :
                    language === 'ru' ? '– компания, поставляющая высококачественные промышленные запчасти для промышленности, производства и строительства в международном масштабе.' :
                      '– a company supplying high-quality industrial spare parts for industry, manufacturing and construction on an international scale.')}
              </p>
              {(c('companyInfo', 'paragraph2', language)) && (
                <p className="text-gray-700 leading-relaxed mb-4">{c('companyInfo', 'paragraph2', language)}</p>
              )}
              {(c('companyInfo', 'paragraph3', language)) && (
                <div className="bg-[#f8f9fa] p-4 rounded-lg border-l-4 border-[#3563e9]">
                  <p className="text-gray-700"><span className="font-bold text-[#1e3d69]">Pneumax</span>{' '}{c('companyInfo', 'paragraph3', language)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6" data-aos="fade-left">
            <div className="rounded-2xl h-[250px] md:h-[400px] overflow-hidden">
              {c('companyInfo', 'image')
                ? <img src={c('companyInfo', 'image')} alt="Kompaniya" className="w-full h-full object-cover" />
                : <div className="bg-gradient-to-br from-[#1e3d69] to-[#3563e9] w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="text-4xl md:text-6xl font-bold mb-4">PNEUMAX</div>
                    <div className="text-xl opacity-90">
                      {language === 'uz' && 'Sanoat Ehtiyot Qismlari'}
                      {language === 'ru' && 'Промышленные Запчасти'}
                      {language === 'en' && 'Industrial Spare Parts'}
                    </div>
                  </div>
                </div>
              }
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-bold text-[#1e3d69] mb-3">
                {c('companyInfo', 'strategicTitle', language) ||
                  (language === 'uz' ? 'Strategik yondashuv' : language === 'ru' ? 'Стратегический подход' : 'Strategic approach')}
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                {c('companyInfo', 'strategicText1', language) ||
                  (language === 'uz' ? 'Pneumax faqat mahsulot yetkazib berish bilan chegaralanmaydi. Biz har bir mijozning ehtiyojlariga individual yondashamiz va texnik yechimlarni taklif qilamiz.' :
                    language === 'ru' ? 'Pneumax не ограничивается только поставкой продукции. Мы индивидуально подходим к потребностям каждого клиента и предлагаем технические решения.' :
                      'Pneumax is not limited to product delivery only. We take an individual approach to each client\'s needs and offer technical solutions.')}
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                {c('companyInfo', 'strategicText2', language) ||
                  (language === 'uz' ? 'Bizning ustuvor maqsadimiz – kompaniyaning uzoq muddatli biznes tizimini shakllantirish va samaradorligini oshirish.' :
                    language === 'ru' ? 'Наша приоритетная цель – формирование долгосрочной бизнес-системы компании и повышение ее эффективности.' :
                      'Our priority goal is to form a long-term business system of the company and increase its efficiency.')}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-10 md:mb-16">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-3 md:mb-4 uppercase">
            <span className="bg-gradient-to-r from-[#3563e9] via-[#42ade2] to-[#10b981] bg-clip-text text-transparent">
              {c('globalSection', 'title1', language) || (language === 'uz' ? 'GLOBAL HAMKORLIK, KAFOLATLANGAN SIFAT VA' : language === 'ru' ? 'ГЛОБАЛЬНОЕ ПАРТНЕРСТВО, ГАРАНТИРОВАННОЕ КАЧЕСТВО И' : 'GLOBAL PARTNERSHIP, GUARANTEED QUALITY AND')}
            </span>
          </h2>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center text-[#1e3d69] mb-6 md:mb-12 uppercase">
            {c('globalSection', 'title2', language) || (language === 'uz' ? 'PROFESSIONAL TAMINOT' : language === 'ru' ? 'ПРОФЕССИОНАЛЬНЫЕ ПОСТАВКИ' : 'PROFESSIONAL SUPPLY')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-[#3563e9]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#3563e9]">
                <Package size={32} />
              </div>
              <h3 className="font-bold text-[#1e3d69] mb-2">
                {language === 'uz' && "Tezkor To'g'ri IMPORT"}
                {language === 'ru' && 'Быстрая Доставка ИМПОРТ'}
                {language === 'en' && 'Fast IMPORT Delivery'}
              </h3>
              <p className="text-sm text-gray-600">
                {language === 'uz' && 'Bizdan buyurtma qilgan mahsulotlaringizni tez orada yetqazib beramiz'}
                {language === 'ru' && 'Мы быстро доставим заказанные товары'}
                {language === 'en' && 'We will deliver your ordered products quickly'}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-[#3563e9]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#3563e9]">
                <Users size={32} />
              </div>
              <h3 className="font-bold text-[#1e3d69] mb-2">
                {language === 'uz' && 'Maxsus Buyurtma Xizmati'}
                {language === 'ru' && 'Услуга Специального Заказа'}
                {language === 'en' && 'Custom Order Service'}
              </h3>
              <p className="text-sm text-gray-600">
                {language === 'uz' && 'Sizga kerakli mahsulotni topib beramiz'}
                {language === 'ru' && 'Найдем нужный товар для вас'}
                {language === 'en' && 'We will find the product you need'}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-[#3563e9]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#3563e9]">
                <CreditCard size={32} />
              </div>
              <h3 className="font-bold text-[#1e3d69] mb-2">
                {language === 'uz' && 'Qulay To\'lov Shartlari'}
                {language === 'ru' && 'Выгодные Условия Оплаты'}
                {language === 'en' && 'Flexible Payment Terms'}
              </h3>
              <p className="text-sm text-gray-600">
                {language === 'uz' && 'Hamkorlik uchun maxsus shartlar va qulay to\'lov usullari'}
                {language === 'ru' && 'Специальные условия для партнерства и удобные способы оплаты'}
                {language === 'en' && 'Special terms for partnership and convenient payment methods'}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-[#3563e9]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#3563e9]">
                <Target size={32} />
              </div>
              <h3 className="font-bold text-[#1e3d69] mb-2">
                {language === 'uz' && 'Professional Xizmat'}
                {language === 'ru' && 'Профессиональное Обслуживание'}
                {language === 'en' && 'Professional Service'}
              </h3>
              <p className="text-sm text-gray-600">
                {language === 'uz' && 'Mutaxassislarimiz tomonidan professional xizmat va maslahat'}
                {language === 'ru' && 'Профессиональное обслуживание и консультации от наших специалистов'}
                {language === 'en' && 'Professional service and consultation from our specialists'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#1e3d69] to-[#2d5a8f] rounded-2xl p-6 md:p-12 mb-10 md:mb-16 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
              {c('advantages', 'title', language) || (language === 'uz' ? 'Afzalliklar' : language === 'ru' ? 'Преимущества' : 'Advantages')}
            </h2>
            <p className="text-white/80 mb-6 md:mb-12 text-sm md:text-base">
              {c('advantages', 'subtitle', language) || (language === 'uz' ? 'Nega mijozlar aynan bizni tanlaydi?' : language === 'ru' ? 'Почему клиенты выбирают именно нас?' : 'Why do customers choose us?')}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8 text-center text-white">
              {(content.advantages?.items || [
                { title: { uz: '20+', ru: '20+', en: '20+' }, subtitle: { uz: 'Yil tajriba', ru: 'Лет опыта', en: 'Years' } },
                { title: { uz: '5000+', ru: '5000+', en: '5000+' }, subtitle: { uz: 'Ehtiyot qismlar', ru: 'Запчастей', en: 'Parts' } },
                { title: { uz: 'Buyurtma', ru: 'Заказ', en: 'Order' }, subtitle: { uz: 'Moslashtirilgan', ru: 'Индивидуальный', en: 'Custom' } },
                { title: { uz: 'Tez', ru: 'Быстро', en: 'Fast' }, subtitle: { uz: 'Yetkazib berish', ru: 'Доставка', en: 'Delivery' } },
                { title: { uz: 'To\'lov', ru: 'Оплата', en: 'Payment' }, subtitle: { uz: 'Turli ixtiyoriy', ru: 'Разные способы', en: 'Various' } },
              ]).map((item, index) => (
                <div key={index}>
                  <div className="w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full border-4 border-white/30 flex items-center justify-center mx-auto mb-4 hover:border-white/60 transition-colors">
                    <div>
                      <div className="text-xl md:text-2xl lg:text-3xl font-bold">
                        {item.title?.[language] || item.title?.uz || item.title || ''}
                      </div>
                      <div className="text-[10px] md:text-xs opacity-90">
                        {item.subtitle?.[language] || item.subtitle?.uz || item.subtitle || ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {teamMembers.length > 0 && (
          <div className="mb-10 md:mb-16">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1e3d69] mb-6 md:mb-12 text-center uppercase">
              {language === 'uz' && 'BIZNING JAMOA'}
              {language === 'ru' && 'НАША КОМАНДА'}
              {language === 'en' && 'OUR TEAM'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {teamMembers.map((member) => (
                <div key={member._id} className="bg-white rounded-2xl p-6 md:p-8 text-center shadow-sm hover:shadow-lg transition-shadow">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-100 mx-auto mb-4 md:mb-6 overflow-hidden flex items-center justify-center">
                    {member.image ? (
                      <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1e3d69] to-[#3563e9] flex items-center justify-center text-white text-2xl md:text-3xl font-bold">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="mb-2 text-xs text-gray-500 uppercase tracking-wide">
                    {member.title?.[language] || member.title?.uz || member.title?.ru || 'Expert'}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-[#1e3d69] mb-3 md:mb-4">{member.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {member.description?.[language] || member.description?.uz || member.description?.ru || ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-2xl p-6 md:p-12">
          <h2 className="text-xl md:text-2xl font-bold text-[#1e3d69] mb-2">
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
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-xl py-3 text-center text-green-700 font-semibold text-sm md:text-base">
                {language === 'uz' ? 'Arizangiz qabul qilindi!' : language === 'ru' ? 'Заявка принята!' : 'Request received!'}
              </div>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#10b981] text-white py-3 md:py-4 rounded-xl font-semibold text-base md:text-lg hover:bg-[#059669] transition-colors disabled:opacity-60"
              >
                {submitting ? '...' : language === 'uz' ? 'Ariza Yuborish' : language === 'ru' ? 'Отправить заявку' : 'Send request'}
              </button>
            )}
          </form>
        </div>
      </div>

      <Footer />
    </div>
  )
}
