import { createContext, useContext, useState, useEffect } from 'react'
import { uz } from '../locales/uz'
import { ru } from '../locales/ru'
import { en } from '../locales/en'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('pneumax-language')
    return saved && ['uz', 'ru', 'en'].includes(saved) ? saved : 'uz'
  })

  const setLanguage = (lang) => {
    if (['uz', 'ru', 'en'].includes(lang)) {
      localStorage.setItem('pneumax-language', lang)
      setLanguageState(lang)
    }
  }

  const translations = {
    uz,
    ru,
    en
  }

  const t = translations[language] || uz

  const toggleLanguage = () => {
    const next = language === 'uz' ? 'ru' : language === 'ru' ? 'en' : 'uz'
    setLanguage(next)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}
