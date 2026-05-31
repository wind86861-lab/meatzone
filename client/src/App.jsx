import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import DriverDashboard from './pages/driver/DriverDashboard'
import OperatorDashboard from './pages/operator/OperatorDashboard'
import AfterSales from './pages/AfterSales'
import { ToastContainer } from './components/ui'
import { useThemeStore } from './store/themeStore'

function ScrollToTop() {
  const { pathname } = useLocation()
  React.useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function ThemeInit() {
  const init = useThemeStore(s => s.init)
  useEffect(() => { init() }, [init])
  return null
}

function App() {
  return (
    <Router>
      <ThemeInit />
      <ScrollToTop />
      <Routes>
        {/* Full-width dashboard routes — no app-shell phone-frame */}
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/driver/*" element={<DriverDashboard />} />
        <Route path="/operator/*" element={<OperatorDashboard />} />
        {/* Public after-sales page — full width, no phone-frame */}
        <Route path="/service/:token" element={<AfterSales />} />

        {/* Store routes — phone-frame (max-width: 480px) */}
        <Route path="*" element={
          <div className="app-shell">
            <ToastContainer />
            <AnimatePresence mode="wait">
              <Routes>
                <Route index element={<Home />} />
                <Route path="catalog" element={<Catalog />} />
                <Route path="catalog/:id" element={<ProductDetail />} />
                <Route path="product/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route path="orders" element={<Orders />} />
                <Route path="profile" element={<Profile />} />
              </Routes>
            </AnimatePresence>
          </div>
        } />
      </Routes>
    </Router>
  )
}

export default App
