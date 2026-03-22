import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Only load English by default for fast initial load
import en from './translations/en.json'

// Lazy load other languages only when needed
const loadLanguage = async (lang: string) => {
  try {
    const translation = await import(`./translations/${lang}.json`)
    return translation.default
  } catch (error) {
    console.error(`Failed to load language: ${lang}`, error)
    return null
  }
}

const resources = {
  en: { translation: en }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false // Disable suspense for faster initial render
    }
  })

// Add lazy loading support for other languages
const supportedLanguages = ['es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko', 'ar', 'hi', 'kn', 'te', 'ta']

i18n.on('languageChanged', async (lng) => {
  if (lng !== 'en' && supportedLanguages.includes(lng) && !i18n.hasResourceBundle(lng, 'translation')) {
    const translation = await loadLanguage(lng)
    if (translation) {
      i18n.addResourceBundle(lng, 'translation', translation)
    }
  }
})

export default i18n
