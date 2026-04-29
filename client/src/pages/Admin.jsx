import React, { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, LayoutDashboard, ShoppingBag, Package, Settings, BarChart3, LogOut } from 'lucide-react'
import AdminDashboard from './admin/AdminDashboard'
import AdminOrders from './admin/AdminOrders'
import AdminProducts from './admin/AdminProducts'
import AdminCategories from './admin/AdminCategories'
import AdminSettings from './admin/AdminSettings'
import AdminLogin from './admin/AdminLogin'
import { useAuthStore } from '../store/authStore'

const NAV = [
  { path: '', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'orders', label: 'Buyurtmalar', icon: ShoppingBag },
  { path: 'products', label: 'Mahsulotlar', icon: Package },
  { path: 'categories', label: 'Kategoriyalar', icon: BarChart3 },
  { path: 'settings', label: 'Sozlamalar', icon: Settings },
]

function ProtectedAdmin({ children }) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()
  useEffect(() => { checkAuth() }, [])
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />
  return children
}

function AdminShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore(s => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const currentPath = location.pathname.replace(/^\/admin\/?/, '').split('/')[0] || ''

  return (
    <div className="min-h-screen bg-bg text-ink font-body flex">
      {/* Sidebar */}
      <aside className="w-56 bg-bg-surface border-r border-ink-line hidden md:flex flex-col">
        <div className="p-4 border-b border-ink-line">
          <div className="font-display text-xl tracking-wider text-primary">MEATZONE</div>
          <div className="text-[11px] text-ink-dim">Admin panel</div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.map(n => {
            const isActive = currentPath === n.path
            return (
              <button
                key={n.path}
                onClick={() => navigate(`/admin/${n.path}`)}
                className={`w-full flex items-center gap-2.5 px-3 h-10 rounded-lg text-sm font-medium transition-colors tap ${isActive ? 'bg-primary text-white' : 'text-ink-dim hover:bg-bg-surface2 hover:text-ink'
                  }`}
              >
                <n.icon size={16} /> {n.label}
              </button>
            )
          })}
        </nav>
        <div className="p-2 border-t border-ink-line">
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 h-10 rounded-lg text-sm font-medium text-ink-dim hover:bg-bg-surface2 hover:text-ink transition-colors tap">
            <LogOut size={16} /> Chiqish
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen overflow-auto">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-bg-surface border-b border-ink-line">
          <button onClick={() => navigate('/')} className="w-8 h-8 rounded-md bg-bg-surface2 border border-ink-line flex items-center justify-center text-ink-dim tap">
            <ArrowLeft size={16} />
          </button>
          <div className="font-display text-lg tracking-wider text-primary">MEATZONE</div>
          <button onClick={handleLogout} className="ml-auto text-sm text-ink-dim flex items-center gap-1 tap">
            <LogOut size={14} /> Chiqish
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="p-4 md:p-6 max-w-6xl"
        >
          <Routes>
            <Route path="" element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </motion.div>
      </main>
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
