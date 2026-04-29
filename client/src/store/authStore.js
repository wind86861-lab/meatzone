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
            if (user.role === 'admin') {
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
    }),
    {
      name: 'meatzone-admin-auth',
      storage: createJSONStorage(() => safeStorage),
    }
  )
)
