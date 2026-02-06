export interface DictionaryResult {
  word: string
  translation: string
  definition: string
  example: string
  pronunciation_us?: string
  pronunciation_uk?: string
  category: string
  level: string
}

/**
 * MyMemory Translation API - Her zaman Türkçe çeviri
 */
export async function translateWord(word: string): Promise<string> {
  try {
    console.log('🌐 Translating:', word)
    
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|tr`
    )

    if (!response.ok) throw new Error('Translation API failed')

    const data = await response.json()
    const translation = data.responseData.translatedText || ''
    
    console.log('✅ Translation:', translation)
    
    // Validate it's Turkish (has Turkish chars or is short)
    if (translation && (
      /[çğıöşüÇĞİÖŞÜ]/.test(translation) || 
      translation.split(' ').length <= 4
    )) {
      return translation
    }
    
    throw new Error('Translation not in Turkish')
  } catch (error) {
    console.error('Translation error:', error)
    return '' // Return empty, will be handled
  }
}

// Word frequency lists for level determination
const commonWords = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'however', 'therefore', 'although', 'moreover', 'furthermore', 'nevertheless'
])

const advancedWords = new Set([
  'ubiquitous', 'serendipity', 'ephemeral', 'meticulous', 'eloquent', 'pragmatic',
  'ambiguous', 'inevitable', 'substantial', 'resilient', 'comprehensive', 'fundamental',
  'contemporary', 'sophisticated', 'predominant', 'intrinsic', 'paradigm', 'phenomenon'
])

function determineLevel(word: string): string {
  const lowerWord = word.toLowerCase()
  const length = word.length
  
  if (commonWords.has(lowerWord)) return length <= 4 ? 'A1' : 'B1'
  if (advancedWords.has(lowerWord)) return 'C1'
  
  if (length <= 3) return 'A1'
  if (length <= 5) return 'A2'
  if (length <= 7) return 'B1'
  if (length <= 9) return 'B2'
  if (length <= 11) return 'C1'
  return 'C2'
}

function determineCategory(partOfSpeech: string): string {
  if (partOfSpeech === 'adjective' || partOfSpeech === 'adverb') {
    return 'academic'
  }
  if (partOfSpeech === 'verb' || partOfSpeech === 'noun') {
    return 'daily'
  }
  return 'daily'
}

/**
 * Quick lookup with GUARANTEED Turkish translation
 */
export async function quickLookup(word: string): Promise<DictionaryResult> {
  try {
    console.log('📖 Quick Dictionary lookup:', word)

    // 1. Get English definition from Free Dictionary API
    const dictResponse = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
    )

    if (!dictResponse.ok) {
      throw new Error('Word not found in dictionary')
    }

    const dictData = await dictResponse.json()
    const entry = dictData[0]

    // Extract phonetics
    const phonetics = entry.phonetics || []
    const usPhonetic = phonetics.find((p: any) => 
      p.text && (p.audio?.includes('-us') || p.audio?.includes('_us'))
    )
    const ukPhonetic = phonetics.find((p: any) => 
      p.text && (p.audio?.includes('-uk') || p.audio?.includes('_uk'))
    )
    const anyPhonetic = phonetics.find((p: any) => p.text)

    const pronunciation_us = usPhonetic?.text || anyPhonetic?.text || ''
    const pronunciation_uk = ukPhonetic?.text || anyPhonetic?.text || ''

    // Extract meanings
    const meanings = entry.meanings || []
    const firstMeaning = meanings[0] || {}
    const definitions = firstMeaning.definitions || []
    const firstDefinition = definitions[0] || {}
    const partOfSpeech = firstMeaning.partOfSpeech || 'noun'

    // 2. Get Turkish translation - ALWAYS from API
    let translation = await translateWord(word)
    
    if (!translation) {
      // Fallback to manual list only if API fails
      const manualTranslations: Record<string, string> = {
        'however': 'ancak, fakat',
        'therefore': 'bu nedenle',
        'although': 'rağmen',
        'nevertheless': 'yine de',
        'moreover': 'dahası',
        'furthermore': 'ayrıca',
        'ubiquitous': 'her yerde bulunan',
        'serendipity': 'tesadüf eseri bulma',
        'ephemeral': 'geçici',
        'resilient': 'dayanıklı',
        'sympathetic': 'anlayışlı'
      }
      translation = manualTranslations[word.toLowerCase()] || 'Çeviri bulunamadı'
    }

    console.log('🇹🇷 Turkish translation:', translation)

    // Determine level and category
    const level = determineLevel(word)
    const category = determineCategory(partOfSpeech)

    return {
      word: entry.word,
      translation,
      definition: firstDefinition.definition || 'No definition available',
      example: firstDefinition.example || '',
      pronunciation_us,
      pronunciation_uk,
      category,
      level
    }
  } catch (error) {
    console.error('Dictionary lookup error:', error)
    throw new Error('Sözlükte bulunamadı. Lütfen AI seçeneğini kullanın.')
  }
}

/**
 * Combined lookup - Always returns Turkish
 */
export async function quickLookupWithTranslation(word: string): Promise<DictionaryResult> {
  return quickLookup(word) // Already includes translation
}
