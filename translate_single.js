const fs = require('fs');
const path = require('path');

// Gemini API key from environment
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ REACT_APP_GEMINI_API_KEY not found in environment');
  process.exit(1);
}

// Get target language from command line argument
const targetLang = process.argv[2];

const LANGUAGES = {
  'ru': 'Russian',
  'it': 'Italian',
  'nl': 'Dutch',
  'pl': 'Polish',
  'cs': 'Czech',
  'uk': 'Ukrainian',
  'bg': 'Bulgarian',
  'ro': 'Romanian',
  'sv': 'Swedish',
  'no': 'Norwegian',
  'da': 'Danish',
  'fi': 'Finnish',
  'tr': 'Turkish',
  'el': 'Greek',
  'hu': 'Hungarian',
  'vi': 'Vietnamese',
  'th': 'Thai',
  'id': 'Indonesian',
  'ms': 'Malay',
  'he': 'Hebrew'
};

if (!targetLang || !LANGUAGES[targetLang]) {
  console.error('❌ Please specify a valid language code as argument');
  console.log('\nAvailable languages:');
  for (const [code, name] of Object.entries(LANGUAGES)) {
    console.log(`  ${code} - ${name}`);
  }
  process.exit(1);
}

async function translateToLanguage(englishJson, targetLanguage, languageName) {
  console.log(`\n🔄 Translating to ${languageName}...`);

  const prompt = `You are a professional translator. Translate the following JSON file from English to ${languageName}.

CRITICAL REQUIREMENTS:
1. Translate ALL text values to ${languageName}
2. Use native script (Cyrillic for Russian/Bulgarian/Ukrainian, Greek alphabet for Greek, Hebrew for Hebrew, Thai script for Thai, etc.)
3. Keep ALL JSON keys in English (do not translate keys)
4. Preserve interpolation variables exactly as-is: {{variable}}
5. Preserve HTML tags exactly as-is: <strong>, </strong>
6. Keep emojis unchanged: 🎨, 📝, etc.
7. Use natural, professional language appropriate for educational software
8. Maintain exact JSON structure
9. Return ONLY valid JSON, no explanation

Here is the English JSON:

${JSON.stringify(englishJson, null, 2)}

Return the complete translated JSON for ${languageName}:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    let translatedText = data.candidates[0]?.content?.parts[0]?.text?.trim() || '';

    // Remove markdown code blocks if present
    translatedText = translatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const translatedJson = JSON.parse(translatedText);
    console.log(`✅ ${languageName} translated successfully`);
    return translatedJson;
  } catch (error) {
    console.error(`❌ Error translating ${languageName}:`, error.message);
    return null;
  }
}

async function main() {
  const languageName = LANGUAGES[targetLang];
  console.log(`🌍 Starting translation to ${languageName}...\n`);

  // Read English base file
  const enPath = path.join(__dirname, 'src', 'i18n', 'translations', 'en.json');
  const englishJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  console.log(`📖 Loaded English base file with ${Object.keys(englishJson).length} top-level keys`);

  const translated = await translateToLanguage(englishJson, targetLang, languageName);

  if (translated) {
    const outputPath = path.join(__dirname, 'src', 'i18n', 'translations', `${targetLang}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(translated, null, 2) + '\n', 'utf8');
    console.log(`💾 Saved ${targetLang}.json`);
    console.log(`\n✨ Translation complete!`);
    console.log(`✅ ${languageName} translation saved successfully`);
  } else {
    console.error(`\n⚠️  Failed to translate ${languageName}`);
    console.log('\n💡 The API might be rate-limited. Try again in a few minutes.');
    process.exit(1);
  }
}

main().catch(console.error);
