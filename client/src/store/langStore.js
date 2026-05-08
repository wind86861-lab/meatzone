import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const safeStorage = {
  getItem: (key) => { try { return localStorage.getItem(key) } catch { return null } },
  setItem: (key, val) => { try { localStorage.setItem(key, val) } catch { } },
  removeItem: (key) => { try { localStorage.removeItem(key) } catch { } },
}

const LANGS = ['uz', 'ru', 'en']

export const useLangStore = create(
  persist(
    (set, get) => ({
      lang: 'uz',
      setLang: (lang) => set({ lang }),
      toggle: () => {
        const idx = LANGS.indexOf(get().lang)
        set({ lang: LANGS[(idx + 1) % LANGS.length] })
      },
    }),
    {
      name: 'meatzone-lang',
      storage: createJSONStorage(() => safeStorage),
    }
  )
)
