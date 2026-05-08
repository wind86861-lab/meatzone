import { create } from 'zustand'

export const useToastStore = create((set) => ({
  toasts: [],
  show: (message, emoji = '🥩') => {
    const id = Date.now() + Math.random()
    set(s => ({ toasts: [...s.toasts, { id, message, emoji }] }))
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
    }, 2500)
  },
}))
