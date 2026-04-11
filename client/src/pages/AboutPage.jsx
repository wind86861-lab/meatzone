import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Star, CheckCircle2, ChevronRight, Quote,
  Package, Truck, Headphones, Award, Users, Heart,
  Wrench, Paintbrush, Hammer, PlugZap, Clock, Zap,
  ArrowRight, Building2
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

function useFadeIn() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el) }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

const galleryItems = [
  { icon: Wrench, label: 'Инструменты', gradient: 'from-slate-700 to-slate-900', accent: 'bg-amber-400' },
  { icon: Paintbrush, label: 'Отделка', gradient: 'from-sky-600 to-sky-800', accent: 'bg-sky-300' },
  { icon: Hammer, label: 'Стройматериалы', gradient: 'from-orange-600 to-orange-800', accent: 'bg-orange-300' },
  { icon: PlugZap, label: 'Электроинструмент', gradient: 'from-blue-600 to-blue-800', accent: 'bg-blue-300' },
  { icon: Package, label: 'Сантехника', gradient: 'from-teal-600 to-teal-800', accent: 'bg-teal-300' },
]

const highlights = [
  {
    icon: Clock,
    num: '16+',
    title: 'Лет опыта',
    desc: 'Более 16 лет работы на рынке строительных материалов Узбекистана. Мы знаем потребности каждого клиента.',
  },
  {
    icon: Users,
    num: '50K+',
    title: 'Довольных клиентов',
    desc: 'Тысячи выполненных заказов и положительных отзывов. Нам доверяют частные клиенты и компании.',
  },
]

const testimonials = [
  {
    text: 'СтройМаркет — наш постоянный поставщик уже 5 лет. Отличное качество материалов, быстрая доставка и всегда компетентные консультации. Рекомендуем!',
    name: 'Рустам Алиев',
    role: 'Директор «РемСтрой»',
    initials: 'РА',
  },
  {
    text: 'Заказывали материалы для капитального ремонта офиса. Всё было доставлено вовремя, качество на высоте. Отдельное спасибо менеджеру за подробную консультацию.',
    name: 'Наргиза Хамидова',
    role: 'Дизайнер интерьеров',
    initials: 'НХ',
  },
]

const stats = [
  { value: 16, suffix: '+', label: 'лет на рынке' },
  { value: 10, suffix: 'K+', label: 'товаров в каталоге' },
  { value: 24, suffix: '/7', label: 'поддержка клиентов' },
  { value: 50, suffix: 'K+', label: 'довольных клиентов' },
]

const team = [
  { name: 'Алишер Каримов', role: 'Генеральный директор', initials: 'АК', color: 'from-primary to-primary-700' },
  { name: 'Дильноза Рахимова', role: 'Менеджер по продажам', initials: 'ДР', color: 'from-secondary to-secondary-700' },
  { name: 'Бахтиёр Усманов', role: 'Главный консультант', initials: 'БУ', color: 'from-teal-500 to-teal-700' },
  { name: 'Малика Азимова', role: 'Логистика и доставка', initials: 'МА', color: 'from-amber-500 to-amber-700' },
]

const imageStripItems = [
  { gradient: 'from-blue-400 to-blue-600', icon: Wrench },
  { gradient: 'from-amber-400 to-amber-600', icon: Hammer },
  { gradient: 'from-teal-400 to-teal-600', icon: Paintbrush },
  { gradient: 'from-red-400 to-red-600', icon: PlugZap },
  { gradient: 'from-blue-400 to-blue-600', icon: Package },
  { gradient: 'from-emerald-400 to-emerald-600', icon: Building2 },
]

const partners = [
  'BOSCH', 'MAKITA', 'DeWALT', 'KNAUF', 'HENKEL',
]

function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 2000
          const start = performance.now()
          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count}{suffix}</span>
}

export default function AboutPage() {
  const fadeRef1 = useFadeIn()
  const fadeRef2 = useFadeIn()
  const fadeRef3 = useFadeIn()
  const fadeRef4 = useFadeIn()
  const fadeRef5 = useFadeIn()
  const fadeRef6 = useFadeIn()

  return (
    <div className="min-h-screen bg-light-50">
      <Header />

      {/* ───── Dark Hero Banner ───── */}
      <section className="relative bg-gradient-to-br from-dark-900 via-dark-900 to-primary-900/20 pt-32 pb-14 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-dark-400 mb-8">
            <Link to="/" className="hover:text-white transition-colors">Главная</Link>
            <ChevronRight size={14} />
            <span className="text-white font-medium">О нас</span>
          </div>
        </div>
      </section>

      {/* ───── Our History ───── */}
      <section ref={fadeRef1} className="fade-in-section py-16 md:py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <p className="text-primary font-bold text-sm uppercase tracking-widest mb-3">Наша история</p>
            <h2 className="font-heading text-3xl md:text-5xl text-dark-900 font-bold mb-6">
              Мы — бренд строительных инструментов и материалов
            </h2>
            <p className="text-dark-500 leading-relaxed text-base md:text-lg">
              СтройМаркет начал свою деятельность в 2010 году как небольшой магазин строительных материалов.
              За более чем 16 лет работы мы выросли в одного из ведущих поставщиков Узбекистана с ассортиментом
              более 10 000 товаров. Мы стали частью тысяч строительных и ремонтных проектов — от квартир до крупных
              коммерческих объектов.
            </p>
          </div>

          {/* Photo Gallery Grid (VITIC-style asymmetric) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {/* Top-left: 2 small stacked */}
            <div className="col-span-1 flex flex-col gap-4 md:gap-5">
              {galleryItems.slice(0, 2).map((item, i) => (
                <div key={i} className={`group relative rounded-2xl bg-gradient-to-br ${item.gradient} aspect-square flex items-center justify-center overflow-hidden cursor-pointer`}>
                  <div className={`absolute top-3 left-3 w-2 h-2 rounded-full ${item.accent}`} />
                  <item.icon size={48} strokeWidth={1} className="text-white/30 group-hover:text-white/60 group-hover:scale-110 transition-all duration-500" />
                  <p className="absolute bottom-3 left-3 text-white/80 text-xs font-bold">{item.label}</p>
                </div>
              ))}
            </div>
            {/* Top-right: 1 large */}
            <div className="col-span-1 md:col-span-2">
              {(() => {
                const CenterIcon = galleryItems[2].icon
                return (
                  <div className={`group relative rounded-2xl bg-gradient-to-br ${galleryItems[2].gradient} h-full min-h-[280px] md:min-h-0 flex items-center justify-center overflow-hidden cursor-pointer`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.12),transparent_60%)]" />
                    <CenterIcon size={80} strokeWidth={1} className="text-white/20 group-hover:text-white/50 group-hover:scale-110 transition-all duration-500" />
                    <p className="absolute bottom-4 left-4 text-white/90 text-sm font-bold">{galleryItems[2].label}</p>
                    <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${galleryItems[2].accent}`} />
                  </div>
                )
              })()}
            </div>
            {/* Bottom-right */}
            <div className="col-span-1 flex flex-col gap-4 md:gap-5">
              {galleryItems.slice(3, 5).map((item, i) => (
                <div key={i} className={`group relative rounded-2xl bg-gradient-to-br ${item.gradient} aspect-square flex items-center justify-center overflow-hidden cursor-pointer`}>
                  <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${item.accent}`} />
                  <item.icon size={48} strokeWidth={1} className="text-white/30 group-hover:text-white/60 group-hover:scale-110 transition-all duration-500" />
                  <p className="absolute bottom-3 left-3 text-white/80 text-xs font-bold">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── Experience Highlights (2 cards) ───── */}
      <section ref={fadeRef2} className="fade-in-section py-16 md:py-20 bg-light-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {highlights.map((h, i) => (
              <div key={i} className="group bg-white border border-dark-200 rounded-2xl p-8 md:p-10 hover:shadow-hover hover:-translate-y-1 transition-all duration-500">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-dark-800 to-dark-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <h.icon size={26} className="text-white" />
                  </div>
                  <span className="font-heading text-3xl md:text-4xl text-dark-900 font-bold">{h.num}</span>
                </div>
                <h3 className="font-heading text-xl text-dark-900 font-bold mb-3">{h.title}</h3>
                <p className="text-dark-500 leading-relaxed text-sm">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── What Clients Say ───── */}
      <section ref={fadeRef3} className="fade-in-section py-16 md:py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl text-dark-900 font-bold mb-3">
              Что говорят наши клиенты
            </h2>
            <p className="text-dark-500 max-w-md mx-auto">Отзывы реальных клиентов о работе с нами</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="group relative bg-light-50 border border-dark-100 rounded-2xl p-8 hover:shadow-hover hover:-translate-y-1 transition-all duration-500">
                <Quote size={32} className="text-primary/15 mb-4" />
                <p className="text-dark-700 leading-relaxed mb-8 text-base">{t.text}</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-soft">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-dark-900 font-bold text-sm">{t.name}</p>
                    <p className="text-dark-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Dark Industry Banner ───── */}
      <section className="relative py-20 md:py-28 bg-dark-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(99,102,241,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(236,72,153,0.08),transparent_60%)]" />
        <div className="absolute top-6 left-6 w-24 h-24 rounded-full border border-white/5 hidden lg:block" />
        <div className="absolute bottom-6 right-6 w-40 h-40 rounded-full border border-white/5 hidden lg:block" />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-dark-400 text-sm font-bold uppercase tracking-widest mb-4">Фокус на</p>
          <h2 className="font-heading text-4xl md:text-6xl lg:text-7xl text-white font-bold mb-4">
            Строительные <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient-text">материалы</span>
          </h2>
          <p className="font-heading text-2xl md:text-3xl text-dark-400 font-bold uppercase tracking-wider">
            и инструменты
          </p>
        </div>
      </section>

      {/* ───── Stats Strip ───── */}
      <section className="py-16 md:py-20 bg-white border-b border-dark-100">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="font-heading text-4xl md:text-5xl text-dark-900 font-bold mb-1">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-dark-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Team Section ───── */}
      <section ref={fadeRef4} className="fade-in-section py-16 md:py-24 bg-light-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-primary font-bold text-sm uppercase tracking-widest mb-3">Наша команда</p>
            <h2 className="font-heading text-3xl md:text-4xl text-dark-900 font-bold mb-3">Профессиональная команда</h2>
            <p className="text-dark-500 max-w-lg text-base">
              Опытные специалисты, которые знают всё о строительных материалах и готовы помочь вам с любым проектом.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {team.map((person, i) => (
              <div key={i} className="group text-center">
                <div className="relative mx-auto mb-5">
                  <div className={`w-36 h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-br ${person.color} flex items-center justify-center mx-auto text-white font-heading text-4xl font-bold shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-500`}>
                    {person.initials}
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full px-4 py-1 shadow-card border border-dark-100">
                    <p className="text-primary text-[11px] font-bold whitespace-nowrap">{person.role}</p>
                  </div>
                </div>
                <h3 className="text-dark-900 font-bold mt-4 text-base">{person.name}</h3>
              </div>
            ))}
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
      <section ref={fadeRef5} className="fade-in-section py-12 md:py-16 bg-white border-t border-dark-100">
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

      <Footer />
    </div>
  )
}
