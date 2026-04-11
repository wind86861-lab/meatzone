import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Truck, Store, CreditCard, Banknote, Building2, CalendarClock,
  ChevronRight, Shield, Clock, MapPin, Package, CheckCircle2, Sparkles, Globe, Zap, ArrowRight
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

function useFadeIn() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el) } }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

const deliveryMethods = [
  {
    icon: Truck,
    title: 'Курьерская доставка',
    badge: '1–2 дня',
    badgeColor: 'bg-accent-green/10 text-accent-green',
    items: [
      'По Ташкенту — БЕСПЛАТНО',
      'За пределами города — от 20 000 сум (2 000 сум/км)',
      'Ташкентская область — от 30 000 сум',
      'Доставка в тот же день при заказе до 14:00',
    ],
  },
  {
    icon: Store,
    title: 'Самовывоз из магазина',
    badge: 'Доступно сейчас',
    badgeColor: 'bg-accent-green/10 text-accent-green',
    items: [
      'Бесплатно',
      'Адрес: г. Ташкент, ул. Навои, 42',
      'Пн–Пт: 09:00–19:00 | Сб–Вс: 10:00–18:00',
      'Доступно сразу после подтверждения заказа',
    ],
  },
]

const nationwideData = [
  { name: 'BTS Express', time: '1–3 дня', price: 'Индивидуальный расчёт' },
  { name: 'Fargo', time: '1–3 дня', price: 'Индивидуальный расчёт' },
  { name: 'Почта Узбекистана', time: '3–7 дней', price: 'По региону' },
]

const paymentMethods = [
  {
    icon: CreditCard,
    title: 'Онлайн-оплата',
    desc: 'Uzcard / Humo / Visa / MasterCard',
    note: 'Безопасная оплата через SSL',
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Banknote,
    title: 'Наличными',
    desc: 'Курьеру или при самовывозе',
    note: 'Оплата при получении товара',
    gradient: 'from-green-500 to-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: Building2,
    title: 'Банковский перевод',
    desc: 'Для юр. лиц и ИП',
    note: 'Полный пакет документов, НДС',
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: CalendarClock,
    title: 'Рассрочка',
    desc: 'От 1 000 000 сум | До 12 месяцев',
    note: 'Без первоначального взноса',
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50',
  },
]

export default function DeliveryPage() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('delivery')
  const deliveryRef = useFadeIn()
  const nationwideRef = useFadeIn()
  const paymentRef = useFadeIn()

  useEffect(() => {
    if (location.hash === '#guarantee') setActiveTab('guarantee')
    else setActiveTab('delivery')
  }, [location.hash])

  return (
    <div className="min-h-screen bg-light-50">
      <Header />

      {/* Page Header */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-40 pb-20 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl hidden lg:block" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-3xl hidden lg:block" />
        <div className="absolute top-1/2 right-1/4 pointer-events-none hidden lg:block opacity-10">
          <Truck size={200} strokeWidth={0.5} className="text-primary" />
        </div>
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-dark-500 mb-4">
            <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
            <ChevronRight size={14} />
            <span className="text-dark-900 font-medium">Доставка и оплата</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-primary to-primary-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-soft">
              <Sparkles size={12} /> Бесплатная доставка по Ташкенту
            </span>
          </div>
          <h1 className="font-heading text-4xl md:text-6xl text-dark-900 font-bold tracking-tight mb-3">
            Доставка и <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">оплата</span>
          </h1>
          <p className="text-dark-600 text-lg max-w-xl">
            Удобные способы получения и оплаты заказов
          </p>
        </div>
      </section>

      {/* Sticky Tabs */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-dark-200 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {[
              { id: 'delivery', label: 'Доставка', hash: '' },
              { id: 'guarantee', label: 'Оплата', hash: '' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 text-sm font-bold border-b-2 transition-all ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-dark-500 hover:text-dark-900'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {activeTab === 'delivery' ? (
          <div className="space-y-16">
            {/* Delivery Methods */}
            <div ref={deliveryRef} className="fade-in-section grid grid-cols-1 md:grid-cols-2 gap-6">
              {deliveryMethods.map((method, i) => (
                <div key={i} className="group relative bg-white border border-dark-200 rounded-3xl p-7 md:p-9 hover:shadow-hover hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <method.icon size={30} className="text-white" />
                      </div>
                      <span className={`text-xs font-bold px-4 py-2 rounded-full ${method.badgeColor} flex items-center gap-1.5 shadow-sm`}>
                        <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                        {method.badge}
                      </span>
                    </div>
                    <h3 className="font-heading text-2xl text-dark-900 font-bold mb-5">{method.title}</h3>
                    <ul className="space-y-4">
                      {method.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-3 text-dark-700 text-sm group/item">
                          <div className="w-6 h-6 rounded-full bg-accent-green/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-accent-green/20 transition-colors">
                            <CheckCircle2 size={14} className="text-accent-green" />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Zap, label: 'Быстрая доставка', value: '1–2 дня', color: 'from-amber-500 to-amber-600' },
                { icon: Shield, label: 'Гарантия', value: 'Сохранность', color: 'from-green-500 to-green-600' },
                { icon: Globe, label: 'Покрытие', value: 'Вся страна', color: 'from-blue-500 to-blue-600' },
                { icon: Sparkles, label: 'По Ташкенту', value: 'Бесплатно', color: 'from-blue-500 to-blue-600' },
              ].map((stat, i) => (
                <div key={i} className="bg-white border border-dark-200 rounded-2xl p-5 text-center hover:shadow-card transition-all group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-3 shadow-soft group-hover:scale-110 transition-transform`}>
                    <stat.icon size={22} className="text-white" />
                  </div>
                  <p className="text-dark-900 font-bold text-lg">{stat.value}</p>
                  <p className="text-dark-500 text-xs">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Nationwide Delivery */}
            <div ref={nationwideRef} className="fade-in-section relative bg-white border border-dark-200 rounded-3xl p-7 md:p-9 overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-5">
                <Globe size={200} strokeWidth={0.5} className="text-primary" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-secondary-600 flex items-center justify-center shadow-lg">
                    <Package size={26} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading text-2xl text-dark-900 font-bold">Доставка по Узбекистану</h3>
                    <p className="text-dark-500 text-sm">Работаем с лучшими службами доставки</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-dark-200">
                        <th className="text-left py-4 px-5 text-dark-500 font-bold text-xs uppercase tracking-wider">Служба доставки</th>
                        <th className="text-left py-4 px-5 text-dark-500 font-bold text-xs uppercase tracking-wider">Срок доставки</th>
                        <th className="text-left py-4 px-5 text-dark-500 font-bold text-xs uppercase tracking-wider">Стоимость</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nationwideData.map((row, i) => (
                        <tr key={i} className="border-b border-dark-100 last:border-0 hover:bg-primary-50/50 transition-colors group">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-light-100 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                                <Truck size={16} className="text-dark-500 group-hover:text-primary transition-colors" />
                              </div>
                              <span className="text-dark-900 font-bold">{row.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <span className="inline-flex items-center gap-1.5 text-dark-700 bg-light-100 px-3 py-1 rounded-full text-xs font-medium">
                              <Clock size={12} className="text-primary" /> {row.time}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-dark-700 font-medium">{row.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Payment Tab */
          <div ref={paymentRef} className="fade-in-section">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl text-dark-900 font-bold mb-3">Удобные способы оплаты</h2>
              <p className="text-dark-600 max-w-md mx-auto">Выберите наиболее удобный способ оплаты</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {paymentMethods.map((method, i) => (
                <div key={i} className={`group relative ${method.bg} border border-dark-100 rounded-3xl p-7 hover:shadow-hover hover:-translate-y-2 transition-all duration-500 overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/50 to-transparent rounded-bl-full" />
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${method.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                      <method.icon size={30} className="text-white" />
                    </div>
                    <h3 className="text-dark-900 font-bold text-lg mb-2">{method.title}</h3>
                    <p className="text-dark-700 text-sm mb-3">{method.desc}</p>
                    <div className="flex items-center gap-1.5 text-dark-500 text-xs bg-white/70 rounded-full px-3 py-1.5 w-fit">
                      <Shield size={12} className="text-accent-green" /> {method.note}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Banner */}
            <div className="mt-12 bg-gradient-to-r from-primary via-primary-600 to-secondary rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
              <div className="relative">
                <h3 className="font-heading text-2xl md:text-3xl text-white font-bold mb-3">Нужна помощь с оплатой?</h3>
                <p className="text-white/80 mb-6 max-w-md mx-auto">Наши специалисты помогут выбрать оптимальный способ оплаты</p>
                <Link to="/contacts" className="btn-white inline-flex items-center gap-2 text-sm px-8 py-3">
                  Связаться с нами <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
