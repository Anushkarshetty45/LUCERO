// Utility to translate user-generated content using Gemini API (via backend proxy)
import { callGemini } from '../services/gemini'

const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'pt': 'Portuguese',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'kn': 'Kannada',
  'te': 'Telugu',
  'ta': 'Tamil',
  'ru': 'Russian',
  'it': 'Italian',
  'nl': 'Dutch',
  'pl': 'Polish',
  'tr': 'Turkish',
  'vi': 'Vietnamese',
  'th': 'Thai',
  'id': 'Indonesian',
  'ms': 'Malay',
  'sv': 'Swedish',
  'no': 'Norwegian',
  'da': 'Danish',
  'fi': 'Finnish',
  'cs': 'Czech',
  'el': 'Greek',
  'he': 'Hebrew',
  'uk': 'Ukrainian',
  'ro': 'Romanian',
  'hu': 'Hungarian',
  'bg': 'Bulgarian'
}

// Cache for translations to avoid repeated API calls
const translationCache: Record<string, string> = {}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  // Don't translate if target is English or if text is empty
  if (targetLanguage === 'en' || !text || text.trim().length === 0) {
    return text
  }

  // Check cache first
  const cacheKey = `${text}_${targetLanguage}`
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey]
  }

  try {
    const targetLanguageName = LANGUAGE_NAMES[targetLanguage] || targetLanguage
    const prompt = `Translate the following text to ${targetLanguageName}. Only provide the translation, nothing else:\n\n${text}`

    const translatedText = await callGemini(prompt, {
      model: 'gemini-2.0-flash-exp',
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
    })

    const result = translatedText.trim() || text
    translationCache[cacheKey] = result
    return result
  } catch (error) {
    return text
  }
}

export function clearTranslationCache() {
  Object.keys(translationCache).forEach(key => delete translationCache[key])
}
