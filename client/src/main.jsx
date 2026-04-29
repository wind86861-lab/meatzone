import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(error, info) { console.error('App crash:', error, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg text-ink font-body">
          <div className="text-5xl mb-3">⚠️</div>
          <h2 className="font-display text-2xl text-primary mb-2 tracking-wide">XATOLIK YUZ BERDI</h2>
          <p className="text-ink-dim text-sm mb-6 text-center">Iltimos, sahifani yangilang</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary-600 text-white font-bold rounded-md px-6 py-3 text-sm tap"
          >
            Yangilash
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function Root() {
  React.useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
      if (tg.setHeaderColor) tg.setHeaderColor('#1C1512')
      if (tg.setBackgroundColor) tg.setBackgroundColor('#F5F0EC')
    }
  }, [])
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Root />
  </ErrorBoundary>,
)
