import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Phone, Search, ShoppingCart, Heart, User, Menu, X, Clock, ChevronDown, Sparkles, Zap, TrendingUp } from 'lucide-react'
import { useCart } from '../context/CartContext'

const navLinks = [
  { to: '/catalog', label: 'Каталог' },
  { to: '/delivery', label: 'Доставка' },
  { to: '/guarantee', label: 'Гарантия' },
  { to: '/contacts', label: 'Контакты' },
  { to: '/about', label: 'О нас' },
]

export default function Header() {
  const { totalItems } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'shadow-2xl' : ''}`}>
      {/* Premium Top Bar with Gradient Animation */}
      <div className={`relative bg-gradient-to-r from-primary via-primary-600 to-secondary overflow-hidden transition-all duration-500 ${scrolled ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)] animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10 text-xs text-white/90">
            <a href="tel:+998998107090" className="flex items-center gap-2 hover:text-white transition-colors font-medium group">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all">
                <Phone size={12} />
              </div>
              <span className="font-semibold">+998 99 810 70 90</span>
            </a>
            <div className="hidden sm:flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock size={13} />
                <span>Пн–Пт 8:00–20:00, Сб–Вс 9:00–18:00</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                <Sparkles size={12} className="animate-pulse" />
                <span className="font-bold">Бесплатная доставка от 500 000 сум</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header with Glassmorphism */}
      <div className={`bg-white/80 backdrop-blur-xl border-b border-dark-100/50 transition-all duration-500 ${scrolled ? 'py-2 shadow-lg' : 'py-4'}`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Premium Logo with 3D Effect */}
            <Link to="/" className="flex items-center gap-3 shrink-0 group relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-11 h-11 bg-gradient-to-br from-primary via-primary-600 to-secondary rounded-2xl flex items-center justify-center font-heading text-white text-xl font-bold group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                  СМ
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="font-heading text-dark-900 text-2xl font-bold tracking-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-secondary group-hover:bg-clip-text transition-all duration-300">
                  СтройМаркет
                </span>
                <p className="text-[10px] text-dark-500 font-medium -mt-1">Строительные материалы</p>
              </div>
            </Link>

            {/* Premium Search with Glow Effect */}
            <div className="flex-1 max-w-[600px] hidden md:block">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Найти перфоратор, цемент, краску..."
                  className="relative w-full bg-white/90 backdrop-blur-sm border-2 border-dark-200 rounded-2xl pl-5 pr-24 py-3.5 text-sm text-dark-900 placeholder:text-dark-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <div className="hidden lg:flex items-center gap-1 text-[10px] text-dark-400 bg-dark-100 px-2 py-1 rounded-lg">
                    <span className="font-mono">Ctrl</span>
                    <span>+</span>
                    <span className="font-mono">K</span>
                  </div>
                  <button
                    onClick={handleSearch}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-primary-600 text-white hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    <Search size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Premium Action Icons */}
            <div className="flex items-center gap-2">
              <Link to="/favorites" className="relative w-11 h-11 flex items-center justify-center rounded-2xl text-dark-600 hover:text-primary hover:bg-gradient-to-br hover:from-primary-50 hover:to-secondary-50 transition-all duration-300 hidden sm:flex group">
                <Heart size={21} className="group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">3</span>
              </Link>
              <Link to="/cart" className="relative w-11 h-11 flex items-center justify-center rounded-2xl text-dark-600 hover:text-primary hover:bg-gradient-to-br hover:from-primary-50 hover:to-secondary-50 transition-all duration-300 group">
                <ShoppingCart size={21} className="group-hover:scale-110 transition-transform" />
                <span className={`absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 transition-all duration-300 shadow-lg ${totalItems > 0 ? 'bg-gradient-to-r from-secondary to-secondary-600 text-white scale-100 animate-bounce' : 'bg-dark-200 text-dark-500 scale-90'}`}>
                  {totalItems}
                </span>
              </Link>
              <Link to="/account" className="relative w-11 h-11 flex items-center justify-center rounded-2xl text-dark-600 hover:text-primary hover:bg-gradient-to-br hover:from-primary-50 hover:to-secondary-50 transition-all duration-300 hidden sm:flex group">
                <User size={21} className="group-hover:scale-110 transition-transform" />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-11 h-11 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-secondary-50 text-primary hover:from-primary hover:to-secondary hover:text-white transition-all duration-300"
              >
                {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Navigation Bar */}
      <div className="bg-white/70 backdrop-blur-md border-b border-dark-100/50 transition-all duration-500 overflow-hidden hidden md:block max-h-14 opacity-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 h-14">
            {navLinks.map(({ to, label }) => {
              const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-300 group ${isActive ? 'text-white bg-gradient-to-r from-primary to-primary-600 shadow-lg' : 'text-dark-700 hover:text-primary hover:bg-primary-50'}`}
                >
                  <span className="relative z-10">{label}</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden fixed inset-x-0 bg-white border-b border-dark-100 shadow-soft transition-all duration-300 ${mobileMenuOpen ? 'max-h-[80vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'}`}>
        <div className="px-4 py-4 space-y-3">
          {/* Mobile search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Поиск товаров..."
              className="w-full bg-light-100 border border-dark-200 rounded-xl pl-4 pr-11 py-3 text-sm text-dark-900 placeholder:text-dark-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-primary">
              <Search size={18} />
            </button>
          </div>
          {/* Mobile nav links */}
          <div className="space-y-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`block py-3 px-3 rounded-xl text-sm font-medium transition-all ${location.pathname.startsWith(to) ? 'text-primary bg-primary-50 shadow-sm' : 'text-dark-700 hover:bg-light-100'}`}
              >
                {label}
              </Link>
            ))}
          </div>
          {/* Mobile bottom actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-dark-100">
            <Link to="/favorites" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-light-100 text-dark-700 text-sm hover:text-primary hover:bg-primary-50 transition-all">
              <Heart size={16} /> Избранное
            </Link>
            <Link to="/account" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-light-100 text-dark-700 text-sm hover:text-primary hover:bg-primary-50 transition-all">
              <User size={16} /> Аккаунт
            </Link>
          </div>
          <a href="tel:+998998107090" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-600 text-white text-sm font-medium shadow-soft hover:shadow-hover active:scale-95 transition-all">
            <Phone size={16} /> +998 99 810 70 90
          </a>
        </div>
      </div>
    </header>
  )
}
