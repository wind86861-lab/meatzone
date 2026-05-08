import { me } from '../locales/me'

export function t(lang, key) {
  const keys = key.split('.')
  let val = me[lang] || me.uz
  for (const k of keys) {
    val = val?.[k]
    if (val === undefined) break
  }
  return val ?? key
}
