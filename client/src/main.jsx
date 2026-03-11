import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { LanguageProvider } from './context/LanguageContext'
import { CartProvider } from './context/CartContext'
import AOS from 'aos'
import 'aos/dist/aos.css'

function Root() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      offset: 120,
      easing: 'ease-out-cubic',
      delay: 50,
      anchorPlacement: 'top-bottom',
    })

    // Refresh AOS on route changes
    const handleRouteChange = () => {
      setTimeout(() => AOS.refresh(), 100)
    }
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <CartProvider>
        <Root />
      </CartProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
