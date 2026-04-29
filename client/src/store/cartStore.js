import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCart = create(
  persist(
    (set, get) => ({
      items: [], // [{ id, name, emoji, price, qty }]

      add: (product, qty = 1) => set((s) => {
        const existing = s.items.find((i) => i.id === product.id)
        if (existing) {
          return { items: s.items.map((i) => i.id === product.id ? { ...i, qty: i.qty + qty } : i) }
        }
        return { items: [...s.items, { id: product.id, name: product.name, emoji: product.emoji, price: product.price, meta: product.meta, qty }] }
      }),

      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      setQty: (id, qty) => set((s) => ({
        items: qty <= 0
          ? s.items.filter((i) => i.id !== id)
          : s.items.map((i) => i.id === id ? { ...i, qty } : i),
      })),

      clear: () => set({ items: [] }),

      // selectors
      count:  () => get().items.reduce((a, i) => a + i.qty, 0),
      total:  () => get().items.reduce((a, i) => a + i.qty * i.price, 0),
    }),
    { name: 'mz-cart' }
  )
)
