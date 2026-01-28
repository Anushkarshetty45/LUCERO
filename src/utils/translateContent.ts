// Utility to translate user-generated content using Gemini API

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
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY
    if (!apiKey) {
      console.warn('Translation API key not found, returning original text')
      return text
    }

    const targetLanguageName = LANGUAGE_NAMES[targetLanguage] || targetLanguage

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{
              text: `Translate the following text to ${targetLanguageName}. Only provide the translation, nothing else:\n\n${text}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024
          }
        })
      }
    )

    if (!response.ok) {
      console.error('Translation API error:', response.status)
      return text
    }

    const data = await response.json()
    const translatedText = data.candidates[0]?.content?.parts[0]?.text?.trim() || text

    // Cache the translation
    translationCache[cacheKey] = translatedText

    return translatedText
  } catch (error) {
    console.error('Error translating text:', error)
    return text
  }
}

export function clearTranslationCache() {
  Object.keys(translationCache).forEach(key => delete translationCache[key])
}
