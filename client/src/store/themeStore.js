import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const safeStorage = {
  getItem: (key) => { try { return localStorage.getItem(key) } catch { return null } },
  setItem: (key, val) => { try { localStorage.setItem(key, val) } catch { } },
  removeItem: (key) => { try { localStorage.removeItem(key) } catch { } },
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
      toggle: () => {
        const next = get().theme === 'light' ? 'dark' : 'light'
        set({ theme: next })
        applyTheme(next)
      },
      init: () => {
        applyTheme(get().theme)
      },
    }),
    {
      name: 'meatzone-theme',
      storage: createJSONStorage(() => safeStorage),
    }
  )
)

function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }
}
