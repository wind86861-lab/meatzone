import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  User, Package, Heart, Settings, LogOut, ChevronRight,
  MapPin, Phone, Mail, Calendar, ShoppingBag, Clock, CheckCircle2,
  Edit2, Camera, Award, TrendingUp
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const orderHistory = [
  {
    id: '#ORD-2024-001',
    date: '15 марта 2024',
    status: 'Доставлен',
    total: 2450000,
    items: 3,
    statusColor: 'text-accent-green bg-accent-green/10'
  },
  {
    id: '#ORD-2024-002',
    date: '10 марта 2024',
    status: 'В пути',
    total: 890000,
    items: 2,
    statusColor: 'text-primary bg-primary/10'
  },
  {
    id: '#ORD-2024-003',
    date: '5 марта 2024',
    status: 'Доставлен',
    total: 1560000,
    items: 5,
    statusColor: 'text-accent-green bg-accent-green/10'
  },
]

const stats = [
  { icon: ShoppingBag, label: 'Всего заказов', value: '12', color: 'from-primary to-primary-600' },
  { icon: Award, label: 'Бонусные баллы', value: '2,450', color: 'from-amber-500 to-amber-600' },
  { icon: Heart, label: 'Избранное', value: '8', color: 'from-secondary-500 to-secondary-600' },
  { icon: TrendingUp, label: 'Экономия', value: '450K', color: 'from-accent-green to-emerald-600' },
]

export default function Account() {
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: 'Алишер Каримов',
    email: 'alisher.karimov@example.com',
    phone: '+998 90 123 45 67',
    address: 'г. Ташкент, ул. Навои, 42',
    birthdate: '15.06.1985'
  })

  const tabs = [
    { id: 'profile', label: 'Профиль', icon: User },
    { id: 'orders', label: 'Заказы', icon: Package },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-light-50">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-dark-900 via-primary-900 to-dark-900 pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-dark-400 mb-8">
            <Link to="/" className="hover:text-white transition-colors">Главная</Link>
            <ChevronRight size={14} />
            <span className="text-white font-medium">Личный кабинет</span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                {profile.name.split(' ').map(n => n[0]).join('')}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <Camera size={16} className="text-primary" />
              </button>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-2">{profile.name}</h1>
              <p className="text-dark-300 mb-4">Клиент с марта 2024</p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <Mail size={16} className="text-white/70" />
                  <span className="text-white text-sm">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <Phone size={16} className="text-white/70" />
                  <span className="text-white text-sm">{profile.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="relative -mt-8 mb-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="group bg-white rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-dark-900 mb-1">{stat.value}</p>
                <p className="text-dark-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-4 shadow-soft sticky top-24">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                          ? 'bg-gradient-to-r from-primary to-primary-600 text-white shadow-lg'
                          : 'text-dark-600 hover:bg-light-100'
                        }`}
                    >
                      <tab.icon size={20} />
                      {tab.label}
                    </button>
                  ))}
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-secondary-600 hover:bg-secondary-50 transition-all">
                    <LogOut size={20} />
                    Выйти
                  </button>
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              {activeTab === 'profile' && (
                <div className="bg-white rounded-2xl p-8 shadow-soft">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-dark-900">Личная информация</h2>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      <Edit2 size={16} />
                      {isEditing ? 'Сохранить' : 'Редактировать'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-dark-600 mb-2">Полное имя</label>
                      <input
                        type="text"
                        value={profile.name}
                        disabled={!isEditing}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full px-4 py-3 bg-light-50 border border-dark-200 rounded-xl focus:outline-none focus:border-primary disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-600 mb-2">Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled={!isEditing}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full px-4 py-3 bg-light-50 border border-dark-200 rounded-xl focus:outline-none focus:border-primary disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-600 mb-2">Телефон</label>
                      <input
                        type="tel"
                        value={profile.phone}
                        disabled={!isEditing}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-light-50 border border-dark-200 rounded-xl focus:outline-none focus:border-primary disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-600 mb-2">Дата рождения</label>
                      <input
                        type="text"
                        value={profile.birthdate}
                        disabled={!isEditing}
                        onChange={(e) => setProfile({ ...profile, birthdate: e.target.value })}
                        className="w-full px-4 py-3 bg-light-50 border border-dark-200 rounded-xl focus:outline-none focus:border-primary disabled:opacity-60"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-dark-600 mb-2">Адрес доставки</label>
                      <input
                        type="text"
                        value={profile.address}
                        disabled={!isEditing}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        className="w-full px-4 py-3 bg-light-50 border border-dark-200 rounded-xl focus:outline-none focus:border-primary disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-6 shadow-soft">
                    <h2 className="text-2xl font-bold text-dark-900 mb-6">История заказов</h2>
                    <div className="space-y-4">
                      {orderHistory.map((order) => (
                        <div key={order.id} className="border border-dark-200 rounded-xl p-6 hover:border-primary hover:shadow-md transition-all">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div>
                              <h3 className="font-bold text-dark-900 text-lg mb-1">{order.id}</h3>
                              <div className="flex items-center gap-4 text-sm text-dark-500">
                                <span className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  {order.date}
                                </span>
                                <span>{order.items} товара</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`px-4 py-2 rounded-full text-sm font-bold ${order.statusColor}`}>
                                {order.status}
                              </span>
                              <span className="text-xl font-bold text-dark-900">{order.total.toLocaleString()} сум</span>
                            </div>
                          </div>
                          <button className="text-primary text-sm font-medium hover:underline">
                            Посмотреть детали →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="bg-white rounded-2xl p-8 shadow-soft">
                  <h2 className="text-2xl font-bold text-dark-900 mb-6">Настройки</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b border-dark-100">
                      <div>
                        <h3 className="font-medium text-dark-900">Email уведомления</h3>
                        <p className="text-sm text-dark-500">Получать уведомления о заказах на email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-dark-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-dark-100">
                      <div>
                        <h3 className="font-medium text-dark-900">SMS уведомления</h3>
                        <p className="text-sm text-dark-500">Получать SMS о статусе доставки</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-dark-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-4">
                      <div>
                        <h3 className="font-medium text-dark-900">Рекламные рассылки</h3>
                        <p className="text-sm text-dark-500">Получать информацию об акциях и скидках</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-dark-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
