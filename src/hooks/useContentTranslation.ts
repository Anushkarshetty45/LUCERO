import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { translateText } from '../utils/translateContent'

export function useContentTranslation(text: string): string {
  const { i18n } = useTranslation()
  const [translatedText, setTranslatedText] = useState(text)
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    const currentLanguage = i18n.language

    // If English or no text, return original
    if (currentLanguage === 'en' || !text) {
      setTranslatedText(text)
      return
    }

    // Translate the text
    const translate = async () => {
      setIsTranslating(true)
      try {
        const result = await translateText(text, currentLanguage)
        setTranslatedText(result)
      } catch (error) {
        console.error('Translation error:', error)
        setTranslatedText(text) // Fallback to original
      } finally {
        setIsTranslating(false)
      }
    }

    translate()
  }, [text, i18n.language])

  return isTranslating ? text : translatedText
}
