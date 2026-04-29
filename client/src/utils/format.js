export const formatPrice = (n) =>
  new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0))

export const formatSum = (n) => `${formatPrice(n)} so'm`

export const cn = (...parts) => parts.filter(Boolean).join(' ')

export const haptic = (style = 'light') => {
  try {
    const tg = window.Telegram?.WebApp?.HapticFeedback
    if (!tg) return
    if (['light', 'medium', 'heavy', 'rigid', 'soft'].includes(style)) tg.impactOccurred(style)
    else if (['error', 'success', 'warning'].includes(style)) tg.notificationOccurred(style)
  } catch { /* noop */ }
}
