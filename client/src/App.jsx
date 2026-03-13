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

function ScrollToTop() {
  const location = useLocation()

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

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
        <Route path="/about" element={<About />} />
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </Router>
  )
}

export default App
