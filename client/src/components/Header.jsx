import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Phone, Search, Facebook, Instagram, Youtube, Globe, Menu, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import logo from '../image/logo.jpg'
import { settingsAPI } from '../services/api'

export default function Header() {
  const { toggleLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [settings, setSettings] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    settingsAPI.getAll().then(res => setSettings(res.data || {})).catch(() => { })
  }, [])

  return (
    <header className="bg-white shadow-sm">
      <div className="bg-[#fafafa] border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 md:gap-3">
              <img src={settings.logoImage || logo} alt="PneuMax Logo" className="h-[50px] sm:h-[60px] md:h-[70px] lg:h-[80px] w-auto" />
              <span className="text-[#1e3d69] font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl">{settings.logoText || 'PNEUMAX'}</span>
            </Link>

            <div className="hidden lg:flex items-center gap-3 w-[280px]">
              <Search className="text-[#1e3d69]" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`)
                    setSearchQuery('')
                  }
                }}
                placeholder={t.header.search}
                className="flex-1 bg-transparent border-b border-gray-300 pb-1 text-[#1e3d69] placeholder:text-[#6b7280] focus:outline-none text-sm"
              />
            </div>

            <div className="hidden md:flex items-center gap-3 lg:gap-6">
              <div className="hidden lg:flex items-center gap-4">
                <a href="#" className="text-[#1e3d69] hover:text-[#3563e9] transition-colors">
                  <Facebook size={20} />
                </a>
                <a href="#" className="text-[#1e3d69] hover:text-[#3563e9] transition-colors">
                  <Instagram size={20} />
                </a>
                <a href="#" className="text-[#1e3d69] hover:text-[#3563e9] transition-colors">
                  <Youtube size={20} />
                </a>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Phone size={18} className="text-[#1e3d69]" />
                <span className="text-[#1e3d69] font-medium text-xs lg:text-sm">{settings.phone1 || t.header.phone}</span>
              </div>
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 md:gap-2 bg-white px-2 md:px-3 py-1 md:py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Globe size={14} className="text-[#1e3d69] md:w-4 md:h-4" />
                <span className="text-[#1e3d69] font-medium text-xs md:text-sm">{t.header.language}</span>
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-[#1e3d69] p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <nav className="bg-[#1e3d69]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-20">
          <ul className="hidden md:flex items-center gap-3 lg:gap-8 text-white overflow-x-auto">
            <li>
              <Link to="/" className="block py-3 md:py-4 hover:text-[#42ade2] transition-colors font-medium text-base lg:text-lg whitespace-nowrap">{t.nav.home}</Link>
            </li>
            <li>
              <Link to="/catalog" className="block py-3 md:py-4 hover:text-[#42ade2] transition-colors font-medium text-base lg:text-lg whitespace-nowrap">{t.nav.catalog}</Link>
            </li>
            <li>
              <Link to="/calculator" className="block py-3 md:py-4 hover:text-[#42ade2] transition-colors font-medium text-base lg:text-lg whitespace-nowrap">{t.nav.calculator}</Link>
            </li>
            <li>
              <Link to="/custom-order" className="block py-3 md:py-4 hover:text-[#42ade2] transition-colors font-medium text-base lg:text-lg whitespace-nowrap">{t.nav.customOrder}</Link>
            </li>
            <li>
              <Link to="/branches" className="block py-3 md:py-4 hover:text-[#42ade2] transition-colors font-medium text-base lg:text-lg whitespace-nowrap">{t.nav.branches}</Link>
            </li>
            <li>
              <Link to="/blog" className="block py-3 md:py-4 hover:text-[#42ade2] transition-colors font-medium text-base lg:text-lg whitespace-nowrap">{t.nav.blog}</Link>
            </li>
            <li>
              <Link to="/about" className="block py-3 md:py-4 hover:text-[#42ade2] transition-colors font-medium text-base lg:text-lg whitespace-nowrap">{t.nav.about}</Link>
            </li>
          </ul>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1e3d69] border-t border-white/10">
          <div className="px-4 py-2">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-white hover:text-[#42ade2] transition-colors font-medium border-b border-white/10">{t.nav.home}</Link>
            <Link to="/catalog" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-white hover:text-[#42ade2] transition-colors font-medium border-b border-white/10">{t.nav.catalog}</Link>
            <Link to="/calculator" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-white hover:text-[#42ade2] transition-colors font-medium border-b border-white/10">{t.nav.calculator}</Link>
            <Link to="/custom-order" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-white hover:text-[#42ade2] transition-colors font-medium border-b border-white/10">{t.nav.customOrder}</Link>
            <Link to="/branches" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-white hover:text-[#42ade2] transition-colors font-medium border-b border-white/10">{t.nav.branches}</Link>
            <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-white hover:text-[#42ade2] transition-colors font-medium border-b border-white/10">{t.nav.blog}</Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-white hover:text-[#42ade2] transition-colors font-medium border-b border-white/10">{t.nav.about}</Link>
            <button
              onClick={toggleLanguage}
              className="w-full flex items-center gap-2 py-3 text-white hover:text-[#42ade2] transition-colors font-medium"
            >
              <Globe size={18} />
              <span>{t.header.language}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
