import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Calculator from './pages/Calculator'
import CustomOrder from './pages/CustomOrder'
import Branches from './pages/Branches'
import Blog from './pages/Blog'
import BlogDetail from './pages/BlogDetail'
import About from './pages/About'
import Admin from './pages/Admin'
import DeliveryPage from './pages/DeliveryPage'
import GuaranteePage from './pages/GuaranteePage'
import ContactsPage from './pages/ContactsPage'
import AboutPage from './pages/AboutPage'
import CabinetPage from './pages/CabinetPage'
import Account from './pages/Account'
import Favorites from './pages/Favorites'

function ScrollToTop() {
  const { pathname, search } = useLocation()

  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname, search])

  return null
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/catalog/:id" element={<ProductDetail />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/custom-order" element={<CustomOrder />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/delivery" element={<DeliveryPage />} />
        <Route path="/guarantee" element={<GuaranteePage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/cabinet" element={<CabinetPage />} />
        <Route path="/account" element={<Account />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </Router>
  )
}

export default App
