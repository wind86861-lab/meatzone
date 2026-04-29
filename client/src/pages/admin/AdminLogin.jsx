import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authAPI } from '../../services/api'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
      })

      const { token, ...user } = response.data

      if (user.role !== 'admin') {
        setError('Доступ запрещён. Требуются права администратора.')
        setLoading(false)
        return
      }

      setAuth(user, token)
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.message || 'Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-xl mb-4 shadow-pop">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="font-display text-3xl tracking-wide text-ink">MEATZONE</h1>
          <p className="text-ink-dim text-sm mt-1">Административная панель</p>
        </div>

        <div className="bg-bg-surface rounded-2xl p-6 shadow-card border border-ink-line">
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-ink mb-1.5">Эл. почта</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@meatzone.uz"
                  className="w-full bg-bg-surface2 border border-ink-line text-ink rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-ink-mute"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-ink mb-1.5">Пароль</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                  placeholder="Введите пароль"
                  className="w-full bg-bg-surface2 border border-ink-line text-ink rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-ink-mute"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink tap"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg font-bold hover:bg-primary-600 transition-colors disabled:opacity-50 text-sm mt-2 tap"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Вход...
                </span>
              ) : 'Войти'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-mute mt-6">
          Защищённая зона. Несанкционированный доступ запрещён.
        </p>
      </div>
    </div>
  )
}
