import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Send } from 'lucide-react'

const catalogLinks = [
  { to: '/catalog?category=tools', label: 'Инструменты' },
  { to: '/catalog?category=plumbing', label: 'Сантехника' },
  { to: '/catalog?category=electrical', label: 'Электрика' },
  { to: '/catalog?category=materials', label: 'Стройматериалы' },
  { to: '/catalog?category=paints', label: 'Краски' },
]

const infoLinks = [
  { to: '/delivery', label: 'Доставка' },
  { to: '/guarantee', label: 'Гарантия' },
  { to: '/about', label: 'О компании' },
  { to: '/contacts', label: 'Контакты' },
]

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-dark-50 via-white to-primary-50 border-t border-dark-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Logo + tagline */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-600 rounded-xl flex items-center justify-center font-heading text-white text-lg group-hover:scale-110 group-hover:rotate-3 transition-all shadow-soft">
                СМ
              </div>
              <span className="font-heading text-dark-900 text-xl tracking-tight">СтройМаркет</span>
            </Link>
            <p className="text-dark-600 text-sm leading-relaxed mb-5">
              Строительные материалы, инструменты и сантехника с доставкой по всему Узбекистану.
            </p>
            <div className="flex gap-3">
              {['facebook', 'instagram', 'telegram', 'youtube'].map((s) => (
                <a key={s} href="#" className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-dark-400 hover:text-white hover:bg-gradient-to-r hover:from-primary hover:to-primary-600 transition-all shadow-sm hover:shadow-md border border-dark-100">
                  <Send size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Catalog */}
          <div>
            <h4 className="font-heading text-lg text-dark-900 tracking-tight mb-5 font-bold">Каталог</h4>
            <ul className="space-y-3">
              {catalogLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-dark-600 text-sm hover:text-primary hover:translate-x-1 inline-block transition-all">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-heading text-lg text-dark-900 tracking-tight mb-5 font-bold">Информация</h4>
            <ul className="space-y-3">
              {infoLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-dark-600 text-sm hover:text-primary hover:translate-x-1 inline-block transition-all">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-lg text-dark-900 tracking-tight mb-5 font-bold">Контакты</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-primary" />
                </div>
                <span className="text-dark-600 text-sm">г. Ташкент, ул. Строителей, 42</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                  <Phone size={16} className="text-primary" />
                </div>
                <a href="tel:+998998107090" className="text-dark-600 text-sm hover:text-primary font-medium transition-colors">+998 99 810 70 90</a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                  <Mail size={16} className="text-primary" />
                </div>
                <a href="mailto:info@stroymarket.uz" className="text-dark-600 text-sm hover:text-primary transition-colors">info@stroymarket.uz</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-dark-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-dark-500 text-xs">&copy; 2010–2026 СтройМаркет. Все права защищены.</p>
          <div className="flex items-center gap-4 text-xs text-dark-500">
            <Link to="/privacy" className="hover:text-primary transition-colors">Политика конфиденциальности</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Условия использования</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
