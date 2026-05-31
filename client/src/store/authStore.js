import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const safeStorage = {
  getItem: (key) => { try { return localStorage.getItem(key) } catch { return null } },
  setItem: (key, val) => { try { localStorage.setItem(key, val) } catch { } },
  removeItem: (key) => { try { localStorage.removeItem(key) } catch { } },
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true, isLoading: false }),

      logout: () => set({ user: null, token: null, isAuthenticated: false, isLoading: false }),

      checkAuth: async () => {
        const { token } = get()
        if (!token) {
          set({ isAuthenticated: false, isLoading: false })
          return
        }
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const user = await res.json()
            if (user.role === 'admin' || user.role === 'driver' || user.role === 'operator') {
              set({ user, isAuthenticated: true, isLoading: false })
            } else {
              set({ user: null, token: null, isAuthenticated: false, isLoading: false })
            }
          } else {
            set({ user: null, token: null, isAuthenticated: false, isLoading: false })
          }
        } catch {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false })
        }
      },

      telegramUser: null, // Telegram user data from WebApp
      isTelegram: false,

      telegramAutoLogin: async () => {
        // Only run inside Telegram Mini App
        const tg = window.Telegram?.WebApp
        if (!tg || !tg.initData) return false

        // Extract all available Telegram user data from initDataUnsafe
        const tgUser = tg.initDataUnsafe?.user || {}
        const tgData = {
          telegramId: String(tgUser.id || ''),
          firstName: tgUser.first_name || '',
          lastName: tgUser.last_name || '',
          username: tgUser.username || '',
          languageCode: tgUser.language_code || 'uz',
          isPremium: tgUser.is_premium || false,
          photoUrl: tgUser.photo_url || '',
        }

        set({ isTelegram: true, telegramUser: tgData })

        // Skip if already authenticated
        const { token } = get()
        if (token) return true

        try {
          const res = await fetch('/api/auth/telegram/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg.initData, tgData }),
          })
          if (res.ok) {
            const data = await res.json()
            set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false })
            return true
          }
        } catch (err) {
          console.error('Telegram auto-login failed:', err)
        }
        return false
      },

      syncTelegramProfile: async (data) => {
        const tg = window.Telegram?.WebApp
        if (!tg || !tg.initData) return false

        try {
          await fetch('/api/auth/telegram/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg.initData, ...data }),
          })
          return true
        } catch (err) {
          console.error('Profile sync failed:', err)
          return false
        }
      },

      requestTelegramPhone: async () => {
        const tg = window.Telegram?.WebApp
        if (!tg || !tg.requestContact) return { success: false, message: 'Not in Telegram' }

        return new Promise((resolve) => {
          tg.requestContact(async (sent, event) => {
            if (sent && event?.responseUnsafe?.contact?.phone_number) {
              const phone = event.responseUnsafe.contact.phone_number
              // Sync to server
              await get().syncTelegramProfile({ phone })
              resolve({ success: true, phone })
            } else {
              resolve({ success: false, message: 'User declined' })
            }
          })
        })
      },

      requestTelegramLocation: async () => {
        const tg = window.Telegram?.WebApp
        if (!tg) return { success: false, message: 'Not in Telegram' }

        return new Promise((resolve) => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                resolve({
                  success: true,
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                })
              },
              (err) => resolve({ success: false, message: err.message }),
              { enableHighAccuracy: true, timeout: 10000 }
            )
          } else {
            resolve({ success: false, message: 'Geolocation not supported' })
          }
        })
      },
    }),
    {
      name: 'meatzone-admin-auth',
      storage: createJSONStorage(() => safeStorage),
    }
  )
)
