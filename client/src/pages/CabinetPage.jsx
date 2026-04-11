import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  User, Package, Heart, MapPin, LogOut, ChevronRight, Edit3, Save, CheckCircle2,
  Phone, Mail, Calendar, Shield
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const sidebarLinks = [
  { id: 'profile', label: 'Профиль', icon: User, badge: null },
  { id: 'orders', label: 'Мои заказы', icon: Package, badge: '3' },
  { id: 'favorites', label: 'Избранное', icon: Heart, badge: null },
  { id: 'addresses', label: 'Адреса', icon: MapPin, badge: null },
]

const recentOrders = [
  { id: '#12345', items: 3, total: 360000, status: 'Доставлен', statusColor: 'bg-green-100 text-green-700' },
  { id: '#12312', items: 1, total: 120000, status: 'В доставке', statusColor: 'bg-amber-100 text-amber-700' },
  { id: '#12290', items: 5, total: 870000, status: 'Обработка', statusColor: 'bg-blue-100 text-blue-700' },
]

const savedAddresses = [
  { id: 1, label: 'Дом', address: 'г. Ташкент, ул. Навои, 42, кв. 15', isDefault: true },
  { id: 2, label: 'Офис', address: 'г. Ташкент, ул. Амира Темура, 108, оф. 305', isDefault: false },
]

const favoriteProducts = [
  { id: 1, name: 'Перфоратор Bosch GBH 2-26', price: 1250000, image: null },
  { id: 2, name: 'Смеситель Grohe Eurosmart', price: 890000, image: null },
  { id: 3, name: 'Набор отвёрток Stanley 20шт', price: 185000, image: null },
]

export default function CabinetPage() {
  const [activeSection, setActiveSection] = useState('profile')
  const [editing, setEditing] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profile, setProfile] = useState({
    firstName: 'Михаил',
    lastName: 'Петров',
    phone: '+998 90 123-45-67',
    email: 'mikhail@mail.uz',
    birthday: '1990-05-15',
  })

  const handleSave = () => {
    setEditing(false)
  }

  return (
    <div className="min-h-screen bg-light-50">
      <Header />

      <div className="pt-36 pb-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-dark-500 mb-6">
            <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
            <ChevronRight size={14} />
            <span className="text-dark-900 font-medium">Личный кабинет</span>
          </div>

          {/* Mobile Section Switcher */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full bg-white border border-dark-200 rounded-xl px-4 py-3 text-sm font-medium text-dark-900 flex items-center justify-between shadow-sm"
            >
              <span className="flex items-center gap-2">
                {(() => { const s = sidebarLinks.find(l => l.id === activeSection); return s ? <><s.icon size={16} /> {s.label}</> : 'Профиль' })()}
              </span>
              <ChevronRight size={16} className={`transition-transform ${mobileMenuOpen ? 'rotate-90' : ''}`} />
            </button>
            {mobileMenuOpen && (
              <div className="mt-2 bg-white border border-dark-200 rounded-xl shadow-card overflow-hidden">
                {sidebarLinks.map(link => (
                  <button
                    key={link.id}
                    onClick={() => { setActiveSection(link.id); setMobileMenuOpen(false) }}
                    className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center justify-between border-b border-dark-100 last:border-0 ${activeSection === link.id ? 'text-primary bg-primary-50' : 'text-dark-700 hover:bg-light-50'}`}
                  >
                    <span className="flex items-center gap-3"><link.icon size={16} /> {link.label}</span>
                    {link.badge && <span className="bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{link.badge}</span>}
                  </button>
                ))}
                <button className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-3">
                  <LogOut size={16} /> Выйти
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-[260px] shrink-0">
              <div className="sticky top-36 bg-white border border-dark-200 rounded-3xl p-6 shadow-card overflow-hidden">
                {/* Decorative header */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-primary to-secondary" />
                {/* User Info */}
                <div className="relative flex flex-col items-center text-center mb-5 pb-5 border-b border-dark-100">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-heading text-2xl font-bold mb-3 shadow-lg border-4 border-white mt-6">
                    МП
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent-green flex items-center justify-center border-2 border-white">
                      <CheckCircle2 size={12} className="text-white" />
                    </div>
                  </div>
                  <p className="text-dark-900 font-bold">Михаил П.</p>
                  <p className="text-dark-500 text-xs mt-0.5">+998 90 123-45-67</p>
                </div>

                {/* Nav */}
                <nav className="space-y-1.5">
                  {sidebarLinks.map(link => (
                    <button
                      key={link.id}
                      onClick={() => setActiveSection(link.id)}
                      className={`group w-full text-left py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-between ${activeSection === link.id
                        ? 'text-primary bg-gradient-to-r from-primary-50 to-transparent border-l-3 border-primary shadow-sm'
                        : 'text-dark-700 hover:text-dark-900 hover:bg-light-50'
                        }`}
                    >
                      <span className="flex items-center gap-3">
                        <link.icon size={18} className={activeSection === link.id ? 'text-primary' : 'group-hover:text-primary transition-colors'} />
                        {link.label}
                      </span>
                      {link.badge && <span className="bg-gradient-to-r from-primary to-primary-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">{link.badge}</span>}
                    </button>
                  ))}
                </nav>

                <div className="mt-5 pt-5 border-t border-dark-100">
                  <button className="w-full text-left py-3 px-4 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all flex items-center gap-3 hover:translate-x-1">
                    <LogOut size={18} /> Выйти
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* PROFILE */}
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  <div className="relative bg-white border border-dark-200 rounded-3xl p-6 md:p-8 shadow-card overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
                    <div className="relative flex items-center justify-between mb-8">
                      <h2 className="font-heading text-2xl text-dark-900 font-bold">Личные данные</h2>
                      {!editing ? (
                        <button onClick={() => setEditing(true)} className="btn-ghost text-sm flex items-center gap-2">
                          <Edit3 size={14} /> Редактировать
                        </button>
                      ) : (
                        <button onClick={handleSave} className="btn-primary text-sm flex items-center gap-2">
                          <Save size={14} /> Сохранить
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-dark-500 text-xs font-medium uppercase tracking-wider mb-2">Имя</label>
                        <input
                          type="text"
                          value={profile.firstName}
                          onChange={(e) => setProfile(p => ({ ...p, firstName: e.target.value }))}
                          disabled={!editing}
                          className={`w-full px-4 py-3 rounded-xl text-dark-900 text-sm border transition-all ${editing ? 'bg-light-50 border-dark-200 focus:border-primary focus:ring-2 focus:ring-primary/20' : 'bg-light-50 border-transparent'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-dark-500 text-xs font-medium uppercase tracking-wider mb-2">Фамилия</label>
                        <input
                          type="text"
                          value={profile.lastName}
                          onChange={(e) => setProfile(p => ({ ...p, lastName: e.target.value }))}
                          disabled={!editing}
                          className={`w-full px-4 py-3 rounded-xl text-dark-900 text-sm border transition-all ${editing ? 'bg-light-50 border-dark-200 focus:border-primary focus:ring-2 focus:ring-primary/20' : 'bg-light-50 border-transparent'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-dark-500 text-xs font-medium uppercase tracking-wider mb-2">Телефон</label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                            disabled={!editing}
                            className={`w-full px-4 py-3 rounded-xl text-dark-900 text-sm border transition-all ${editing ? 'bg-light-50 border-dark-200 focus:border-primary focus:ring-2 focus:ring-primary/20' : 'bg-light-50 border-transparent'}`}
                          />
                          {!editing && (
                            <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-green" />
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-dark-500 text-xs font-medium uppercase tracking-wider mb-2">Email</label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                          disabled={!editing}
                          className={`w-full px-4 py-3 rounded-xl text-dark-900 text-sm border transition-all ${editing ? 'bg-light-50 border-dark-200 focus:border-primary focus:ring-2 focus:ring-primary/20' : 'bg-light-50 border-transparent'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-dark-500 text-xs font-medium uppercase tracking-wider mb-2">Дата рождения</label>
                        <input
                          type="date"
                          value={profile.birthday}
                          onChange={(e) => setProfile(p => ({ ...p, birthday: e.target.value }))}
                          disabled={!editing}
                          className={`w-full px-4 py-3 rounded-xl text-dark-900 text-sm border transition-all ${editing ? 'bg-light-50 border-dark-200 focus:border-primary focus:ring-2 focus:ring-primary/20' : 'bg-light-50 border-transparent'}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders Preview */}
                  <div className="relative bg-white border border-dark-200 rounded-3xl p-6 md:p-8 shadow-card overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-secondary/5 to-transparent rounded-bl-full" />
                    <div className="relative flex items-center justify-between mb-6">
                      <h3 className="font-heading text-xl text-dark-900 font-bold">Последние заказы</h3>
                      <button onClick={() => setActiveSection('orders')} className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                        Все заказы <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {recentOrders.map((order, i) => (
                        <div key={i} className="group flex items-center justify-between p-4 bg-light-50 rounded-2xl border border-dark-100 hover:border-primary/30 hover:shadow-sm hover:-translate-x-1 transition-all duration-300 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Package size={20} className="text-primary" />
                            </div>
                            <div>
                              <p className="text-dark-900 font-bold text-sm">Заказ {order.id}</p>
                              <p className="text-dark-500 text-xs">{order.items} {order.items === 1 ? 'товар' : 'товаров'} · {order.total.toLocaleString()} сум</p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${order.statusColor}`}>
                            {order.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ORDERS */}
              {activeSection === 'orders' && (
                <div className="bg-white border border-dark-200 rounded-2xl p-6 md:p-8 shadow-card">
                  <h2 className="font-heading text-2xl text-dark-900 font-bold mb-6">Мои заказы</h2>
                  <div className="space-y-4">
                    {recentOrders.map((order, i) => (
                      <div key={i} className="p-5 bg-light-50 rounded-xl border border-dark-100 hover:border-primary/30 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-soft">
                              <Package size={22} className="text-white" />
                            </div>
                            <div>
                              <p className="text-dark-900 font-bold">Заказ {order.id}</p>
                              <p className="text-dark-500 text-xs">{order.items} {order.items === 1 ? 'товар' : order.items < 5 ? 'товара' : 'товаров'}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${order.statusColor}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-dark-100">
                          <span className="text-dark-900 font-bold">{order.total.toLocaleString()} сум</span>
                          <button className="text-primary text-sm font-bold hover:underline">Подробнее</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAVORITES */}
              {activeSection === 'favorites' && (
                <div className="bg-white border border-dark-200 rounded-2xl p-6 md:p-8 shadow-card">
                  <h2 className="font-heading text-2xl text-dark-900 font-bold mb-6">Избранное</h2>
                  <div className="space-y-4">
                    {favoriteProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 bg-light-50 rounded-xl border border-dark-100 hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-light-100 to-primary-50 flex items-center justify-center">
                            <Package size={24} className="text-dark-400" />
                          </div>
                          <div>
                            <p className="text-dark-900 font-bold text-sm">{product.name}</p>
                            <p className="text-primary font-bold text-sm mt-1">{product.price.toLocaleString()} сум</p>
                          </div>
                        </div>
                        <button className="text-red-400 hover:text-red-500 transition-colors">
                          <Heart size={20} fill="currentColor" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADDRESSES */}
              {activeSection === 'addresses' && (
                <div className="bg-white border border-dark-200 rounded-2xl p-6 md:p-8 shadow-card">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-heading text-2xl text-dark-900 font-bold">Мои адреса</h2>
                    <button className="btn-primary text-sm flex items-center gap-2">
                      <MapPin size={14} /> Добавить адрес
                    </button>
                  </div>
                  <div className="space-y-4">
                    {savedAddresses.map((addr) => (
                      <div key={addr.id} className="flex items-start justify-between p-5 bg-light-50 rounded-xl border border-dark-100 hover:border-primary/30 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center shrink-0">
                            <MapPin size={20} className="text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-dark-900 font-bold text-sm">{addr.label}</p>
                              {addr.isDefault && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary">По умолчанию</span>
                              )}
                            </div>
                            <p className="text-dark-600 text-sm">{addr.address}</p>
                          </div>
                        </div>
                        <button className="text-dark-400 hover:text-primary transition-colors">
                          <Edit3 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
