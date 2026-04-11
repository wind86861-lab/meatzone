import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Phone, Mail, MapPin, Clock, Send, ChevronRight, CheckCircle2,
  MessageCircle, Wrench, Hammer, Paintbrush, PlugZap, Package, Building2
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

const imageStripItems = [
  { gradient: 'from-blue-400 to-blue-600', icon: Wrench },
  { gradient: 'from-amber-400 to-amber-600', icon: Hammer },
  { gradient: 'from-teal-400 to-teal-600', icon: Paintbrush },
  { gradient: 'from-red-400 to-red-600', icon: PlugZap },
  { gradient: 'from-blue-400 to-blue-600', icon: Package },
  { gradient: 'from-emerald-400 to-emerald-600', icon: Building2 },
]

const partners = ['BOSCH', 'MAKITA', 'DeWALT', 'KNAUF', 'HENKEL']

export default function ContactsPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const fadeRef1 = useFadeIn()
  const fadeRef2 = useFadeIn()

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-light-50">
      <Header />

      {/* ───── Dark Hero Banner ───── */}
      <section className="relative bg-dark-900 pt-32 pb-14 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.15),transparent_70%)]" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-dark-400 mb-8">
            <Link to="/" className="hover:text-white transition-colors">Главная</Link>
            <ChevronRight size={14} />
            <span className="text-white font-medium">Контакты</span>
          </div>
        </div>
      </section>

      {/* ───── Market Images Gallery ───── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl text-dark-900 font-bold mb-3">Наш магазин</h2>
            <p className="text-dark-500 text-base">Широкий ассортимент строительных материалов и инструментов</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="group relative aspect-square rounded-2xl overflow-hidden shadow-soft hover:shadow-hover transition-all duration-300">
              <img
                src="https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=600&fit=crop"
                alt="Электроинструменты"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-dark-900/20 to-transparent" />
              <p className="absolute bottom-4 left-4 text-white font-bold text-sm">Электроинструменты</p>
            </div>
            <div className="group relative aspect-square rounded-2xl overflow-hidden shadow-soft hover:shadow-hover transition-all duration-300">
              <img
                src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&h=600&fit=crop"
                alt="Крепёж и метизы"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-dark-900/20 to-transparent" />
              <p className="absolute bottom-4 left-4 text-white font-bold text-sm">Крепёж и метизы</p>
            </div>
            <div className="group relative aspect-square rounded-2xl overflow-hidden shadow-soft hover:shadow-hover transition-all duration-300">
              <img
                src="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&h=600&fit=crop"
                alt="Краски и лаки"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-dark-900/20 to-transparent" />
              <p className="absolute bottom-4 left-4 text-white font-bold text-sm">Краски и лаки</p>
            </div>
            <div className="group relative aspect-square rounded-2xl overflow-hidden shadow-soft hover:shadow-hover transition-all duration-300">
              <img
                src="https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=600&fit=crop"
                alt="Стройматериалы"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-dark-900/20 to-transparent" />
              <p className="absolute bottom-4 left-4 text-white font-bold text-sm">Стройматериалы</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Contact Info + Form ───── */}
      <section ref={fadeRef1} className="fade-in-section py-16 md:py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">

            {/* Left: Contact Us */}
            <div>
              <h2 className="font-heading text-3xl md:text-4xl text-dark-900 font-bold mb-6 uppercase tracking-tight">
                Свяжитесь с нами
              </h2>
              <p className="text-dark-500 leading-relaxed mb-10 text-base">
                Если вы хотите узнать больше о наших товарах или услугах, свяжитесь с нами любым удобным способом.
                Мы ответим в кратчайшие сроки.
              </p>

              <div className="space-y-7">
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-dark-900 flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-dark-900 font-bold text-base mb-1">Адрес</h4>
                    <p className="text-dark-500 text-sm leading-relaxed">
                      г. Ташкент, ул. Навои, 42<br />
                      Ориентир: рядом со станцией метро
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-dark-900 flex items-center justify-center shrink-0">
                    <Phone size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-dark-900 font-bold text-base mb-1">Телефон</h4>
                    <a href="tel:+998901234567" className="text-dark-500 text-sm hover:text-primary transition-colors">
                      +998 (90) 123-45-67
                    </a>
                  </div>
                </div>

                {/* Open Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-dark-900 flex items-center justify-center shrink-0">
                    <Clock size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-dark-900 font-bold text-base mb-1">Режим работы</h4>
                    <p className="text-dark-500 text-sm">Пн – Пт: 09:00 – 19:00</p>
                    <p className="text-dark-500 text-sm">Сб – Вс: 10:00 – 18:00</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-dark-900 flex items-center justify-center shrink-0">
                    <Mail size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-dark-900 font-bold text-base mb-1">Email</h4>
                    <a href="mailto:info@stroymarket.uz" className="text-dark-500 text-sm hover:text-primary transition-colors">
                      info@stroymarket.uz
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Contact Form */}
            <div>
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-accent-green/10 flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} className="text-accent-green" />
                  </div>
                  <h3 className="font-heading text-2xl text-dark-900 font-bold mb-2">Спасибо!</h3>
                  <p className="text-dark-500 text-sm mb-6">Мы свяжемся с вами в кратчайшие сроки</p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', message: '' }) }}
                    className="btn-ghost text-sm"
                  >
                    Отправить ещё
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="font-heading text-3xl md:text-4xl text-dark-900 font-bold mb-8 uppercase tracking-tight">
                    Написать нам
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Ваше имя"
                      className="w-full px-5 py-4 bg-light-50 border border-dark-200 rounded-xl text-dark-900 text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-dark-400"
                    />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="Ваш email"
                      className="w-full px-5 py-4 bg-light-50 border border-dark-200 rounded-xl text-dark-900 text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-dark-400"
                    />
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Ваше сообщение"
                      className="w-full px-5 py-4 bg-light-50 border border-dark-200 rounded-xl text-dark-900 text-sm focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-dark-400"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-primary to-primary-600 text-white font-bold text-sm uppercase tracking-wider hover:shadow-hover hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={16} />
                          Отправить сообщение
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ───── Image Strip ───── */}
      <section className="overflow-hidden">
        <div className="flex">
          {imageStripItems.map((item, i) => (
            <div key={i} className={`group relative flex-1 h-32 md:h-44 bg-gradient-to-br ${item.gradient} flex items-center justify-center cursor-pointer`}>
              <item.icon size={36} strokeWidth={1.2} className="text-white/30 group-hover:text-white/70 group-hover:scale-125 transition-all duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* ───── Partners ───── */}
      <section ref={fadeRef2} className="fade-in-section py-12 md:py-16 bg-white border-t border-dark-100">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {partners.map((p, i) => (
              <span key={i} className="font-heading text-xl md:text-2xl text-dark-300 font-bold tracking-wider hover:text-dark-900 transition-colors cursor-pointer">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Full-width Map (Moved to Bottom) ───── */}
      <section className="w-full h-[350px] md:h-[500px] bg-dark-100 relative">
        <iframe
          title="СтройМаркет на карте"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2996.7!2d69.2795!3d41.3111!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDE4JzQwLjAiTiA2OcKwMTYnNDYuMiJF!5e0!3m2!1sru!2s!4v1700000000000"
          className="w-full h-full border-0"
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
        </div>
      </section>

      <Footer />
    </div>
  )
}
