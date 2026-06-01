import React, { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, ShoppingBag, Package, Settings, BarChart3, LogOut, Truck, Menu, X, ChevronLeft, Users, Image, Banknote } from 'lucide-react'
import AdminDashboard from './admin/AdminDashboard'
import AdminOrders from './admin/AdminOrders'
import AdminOrderDetail from './admin/AdminOrderDetail'
import AdminCheck from './admin/AdminCheck'
import AdminProducts from './admin/AdminProducts'
import AdminCategories from './admin/AdminCategories'
import AdminSettings from './admin/AdminSettings'
import AdminDelivery from './admin/AdminDelivery'
import AdminUsers from './admin/AdminUsers'
import AdminBanners from './admin/AdminBanners'
import AdminCash from './admin/AdminCash'
import AdminCashHandovers from './admin/AdminCashHandovers'
import AdminLogin from './admin/AdminLogin'
import { useAuthStore } from '../store/authStore'
import { ordersAPI } from '../services/api'

const NAV = [
  { path: '', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'orders', label: 'Buyurtmalar', icon: ShoppingBag },
  { path: 'products', label: 'Mahsulotlar', icon: Package },
  { path: 'users', label: 'Foydalanuvchilar', icon: Users },
  { path: 'delivery', label: 'Yetkazib berish', icon: Truck },
  { path: 'cash-handovers', label: 'Pul topshirish', icon: Banknote },
  { path: 'categories', label: 'Kategoriyalar', icon: BarChart3 },
  { path: 'banners', label: 'Bannerlar', icon: Image },
  { path: 'settings', label: 'Sozlamalar', icon: Settings },
]

function useOrderStatsPoll(interval = 30000) {
  const [stats, setStats] = useState({ new: 0, processing: 0, confirmed: 0, completed: 0, cancelled: 0, total: 0 })
  const [prevNew, setPrevNew] = useState(0)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    let mounted = true
    const fetch = async () => {
      try {
        const res = await ordersAPI.getStats()
        const data = res.data
        if (!mounted) return
        setStats(data)
        if (data.new > prevNew && prevNew > 0) {
          const diff = data.new - prevNew
          setToast(`${diff} ta yangi buyurtma!`)
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YQAAAAA=')
            audio.volume = 0.3
            await audio.play()
          } catch { }
          setTimeout(() => setToast(null), 5000)
        }
        setPrevNew(data.new)
      } catch { }
    }
    fetch()
    const id = setInterval(fetch, interval)
    return () => { mounted = false; clearInterval(id) }
  }, [interval, prevNew])

  return { stats, toast, dismissToast: () => setToast(null) }
}

function ProtectedAdmin({ children }) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()
  useEffect(() => { checkAuth() }, [])
  if (isLoading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />
  return children
}

function SidebarContent({ collapsed, currentPath, navigate, handleLogout, onClose, isMobile, stats }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`h-14 border-b border-ink-line flex items-center shrink-0 ${collapsed && !isMobile ? 'justify-center px-2' : 'px-4 justify-between'}`}>
        {(!collapsed || isMobile) && (
          <div>
            <div className="font-display text-base tracking-widest text-primary font-bold leading-tight">MEATZONE</div>
            <div className="text-[10px] text-ink-mute">Admin panel</div>
          </div>
        )}
        {collapsed && !isMobile && (
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">M</div>
        )}
        {isMobile && onClose && (
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-bg-surface2 flex items-center justify-center text-ink-dim">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(n => {
          const Icon = n.icon
          const isActive = currentPath === n.path
          const badge = n.path === 'orders' && stats?.new > 0 ? stats.new : null
          return (
            <button
              key={n.path}
              onClick={() => { navigate(`/admin/${n.path}`); if (onClose) onClose() }}
              title={collapsed && !isMobile ? n.label : ''}
              className={`w-full flex items-center h-10 rounded-xl text-sm font-medium transition-all duration-150
                ${collapsed && !isMobile ? 'justify-center px-0' : 'gap-3 px-3'}
                ${isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-ink-dim hover:bg-bg-surface2 hover:text-ink'
                }`}
            >
              <div className="relative shrink-0">
                <Icon size={18} />
                {badge && collapsed && !isMobile && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              {(!collapsed || isMobile) && (
                <span className="flex-1 flex items-center justify-between">
                  <span className="truncate">{n.label}</span>
                  {badge && (
                    <span className="ml-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className={`p-2 border-t border-ink-line shrink-0 ${collapsed && !isMobile ? 'flex justify-center' : ''}`}>
        <button
          onClick={handleLogout}
          title={collapsed && !isMobile ? 'Chiqish' : ''}
          className={`flex items-center h-10 rounded-xl text-sm font-medium text-ink-dim hover:bg-red-50 hover:text-red-600 transition-colors
            ${collapsed && !isMobile ? 'w-10 justify-center px-0' : 'w-full gap-3 px-3'}`}
        >
          <LogOut size={18} className="shrink-0" />
          {(!collapsed || isMobile) && <span>Chiqish</span>}
        </button>
      </div>
    </div>
  )
}

function Toast({ message, onClose }) {
  if (!message) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: -20, x: '-50%' }}
      className="fixed top-4 left-1/2 z-50 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px]"
    >
      <span className="text-lg">🔔</span>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-auto text-white/80 hover:text-white"><X size={16} /></button>
    </motion.div>
  )
}

function AdminShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore(s => s.logout)
  const [collapsed, setCollapsed] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { stats, toast, dismissToast } = useOrderStatsPoll()

  const handleLogout = () => { logout(); navigate('/admin/login') }
  const currentPath = location.pathname.replace(/^\/admin\/?/, '').split('/')[0] || ''

  return (
    <div className="min-h-screen bg-bg text-ink font-body flex">
      <AnimatePresence>
        <Toast key={toast} message={toast} onClose={dismissToast} />
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col shrink-0 bg-bg-surface border-r border-ink-line transition-all duration-300 ease-in-out ${collapsed ? 'w-[60px]' : 'w-56'}`}>
        <SidebarContent collapsed={collapsed} currentPath={currentPath} navigate={navigate} handleLogout={handleLogout} stats={stats} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-bg-surface border-r border-ink-line flex flex-col md:hidden"
            >
              <SidebarContent collapsed={false} isMobile currentPath={currentPath} navigate={navigate} handleLogout={handleLogout} onClose={() => setMobileOpen(false)} stats={stats} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header */}
        <header className="h-14 bg-bg-surface border-b border-ink-line flex items-center gap-3 px-4 shrink-0">
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(p => !p)}
            className="hidden md:flex w-8 h-8 rounded-lg hover:bg-bg-surface2 items-center justify-center text-ink-dim transition-colors"
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-8 h-8 rounded-lg hover:bg-bg-surface2 flex items-center justify-center text-ink-dim"
          >
            <Menu size={18} />
          </button>

          <span className="text-sm font-semibold text-ink hidden sm:block">Admin</span>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-ink-dim hover:text-ink transition-colors px-2 py-1 rounded-lg hover:bg-bg-surface2"
            >
              Saytga qaytish
            </button>
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 text-xs text-ink-dim hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
            >
              <LogOut size={14} /> Chiqish
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <motion.div
            key={currentPath}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="p-4 md:p-6 w-full"
          >
            <Routes>
              <Route path="" element={<AdminDashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetail />} />
              <Route path="orders/:id/check" element={<AdminCheck />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="delivery" element={<AdminDelivery />} />
              <Route path="cash-handovers" element={<AdminCashHandovers />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default function Admin() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route path="*" element={<ProtectedAdmin><AdminShell /></ProtectedAdmin>} />
    </Routes>
  )
}
