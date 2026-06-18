export const formatPrice = (n) =>
  new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0))

export const formatSum = (n) => `${formatPrice(n)} so'm`

// Cart helpers — kg items store qty in grams; pcs items store a count.
export const lineTotal = (item) =>
  item.unit === 'kg' ? Math.round((item.price * item.qty) / 1000) : item.price * item.qty

export const qtyLabel = (unit, qty) => {
  if (unit !== 'kg') return String(qty)
  if (qty >= 1000) {
    const kg = qty / 1000
    return `${Number.isInteger(kg) ? kg : kg.toFixed(1)} kg`
  }
  return `${qty} g`
}

export const cn = (...parts) => parts.filter(Boolean).join(' ')

export const haptic = (style = 'light') => {
  try {
    const tg = window.Telegram?.WebApp?.HapticFeedback
    if (!tg) return
    if (['light', 'medium', 'heavy', 'rigid', 'soft'].includes(style)) tg.impactOccurred(style)
    else if (['error', 'success', 'warning'].includes(style)) tg.notificationOccurred(style)
  } catch { /* noop */ }
}
