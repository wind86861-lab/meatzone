import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCart = create(
  persist(
    (set, get) => ({
      items: [], // [{ id, name, emoji, price, unit, qty }] — kg: qty in grams, pcs: count

      add: (product, qty) => set((s) => {
        const unit = product.unit || 'pcs'
        const step = unit === 'kg' ? 1000 : 1          // kg default = 1000g (1 kg)
        const addQty = qty ?? step
        const existing = s.items.find((i) => i.id === product.id)
        if (existing) {
          return { items: s.items.map((i) => i.id === product.id ? { ...i, qty: i.qty + addQty } : i) }
        }
        return { items: [...s.items, { id: product.id, name: product.name, emoji: product.emoji, price: product.price, unit, meta: product.meta, qty: addQty }] }
      }),

      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      setQty: (id, qty) => set((s) => ({
        items: qty <= 0
          ? s.items.filter((i) => i.id !== id)
          : s.items.map((i) => i.id === id ? { ...i, qty } : i),
      })),

      clear: () => set({ items: [] }),

      // selectors — kg items contribute price*grams/1000 and count as one line
      count:  () => get().items.reduce((a, i) => a + (i.unit === 'kg' ? 1 : i.qty), 0),
      total:  () => get().items.reduce((a, i) => a + (i.unit === 'kg' ? Math.round(i.price * i.qty / 1000) : i.price * i.qty), 0),
    }),
    { name: 'mz-cart' }
  )
)
