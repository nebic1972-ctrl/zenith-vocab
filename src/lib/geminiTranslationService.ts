/**
 * Gemini AI Translation Service
 * Gemini 2.5 Flash ile çeviri ve seviye tespiti
 */

import { generateText, generateJson, isGeminiAvailable } from './geminiService'

export interface TranslationResult {
  word: string
  translation: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  definition?: string
  example_sentence?: string
}

export interface BatchTranslationResult {
  translations: TranslationResult[]
  failed: string[]
}

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

function parseLevel(level: string): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' {
  const upper = (level || 'B1').toUpperCase()
  return CEFR_LEVELS.includes(upper as typeof CEFR_LEVELS[number])
    ? (upper as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2')
    : 'B1'
}

/**
 * Tek kelimeyi Gemini 2.5 Flash ile çevirir
 */
export async function translateWord(
  word: string,
  sourceLanguage: string = 'en',
  targetLanguage: string = 'tr'
): Promise<TranslationResult> {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini API anahtarı yapılandırılmamış')
  }

  const prompt = `Sen bir dil öğrenme asistanısın. Aşağıdaki kelimeyi çevir ve ek bilgi ver.

Kelime: "${word}"
Kaynak Dil: ${sourceLanguage}
Hedef Dil: ${targetLanguage}

SADECE şu JSON formatında yanıt ver (başka metin ekleme):
{
  "word": "${word}",
  "translation": "Türkçe çeviri",
  "level": "CEFR seviyesi (A1, A2, B1, B2, C1 veya C2)",
  "definition": "Kısa tanım Türkçe (opsiyonel, max 100 karakter)",
  "example_sentence": "Örnek cümle ${sourceLanguage} dilinde (opsiyonel)"
}

Kurallar:
- Doğru çeviri ver
- CEFR seviyesini kelime sıklığı ve karmaşıklığa göre belirle
- Tanımı kısa tut
- Örnek cümle basit ve doğal olsun
- SADECE geçerli JSON döndür, markdown veya ek metin yok`

  try {
    const result = await generateJson<{
      word?: string
      translation?: string
      level?: string
      definition?: string
      example_sentence?: string
    }>(prompt)

    return {
      word: result.word || word,
      translation: result.translation || '',
      level: parseLevel(result.level || 'B1'),
      definition: result.definition || undefined,
      example_sentence: result.example_sentence || undefined,
    }
  } catch (error) {
    console.error('Çeviri hatası:', error)
    throw error
  }
}

/**
 * Birden fazla kelimeyi toplu çevirir (daha verimli)
 */
export async function translateWordsBatch(
  words: string[],
  sourceLanguage: string = 'en',
  targetLanguage: string = 'tr',
  onProgress?: (completed: number, total: number) => void
): Promise<BatchTranslationResult> {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini API anahtarı yapılandırılmamış')
  }

  const translations: TranslationResult[] = []
  const failed: string[] = []

  // Rate limit için 10'ar kelimelik gruplar
  const chunkSize = 10
  const chunks: string[][] = []

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize))
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]

    const prompt = `Sen bir dil öğrenme asistanısın. Aşağıdaki kelimeleri çevir ve her biri için ek bilgi ver.

Kelimeler: ${chunk.map((w) => `"${w}"`).join(', ')}
Kaynak Dil: ${sourceLanguage}
Hedef Dil: ${targetLanguage}

SADECE şu JSON array formatında yanıt ver (başka metin ekleme):
[
  {
    "word": "orijinal kelime",
    "translation": "Türkçe çeviri",
    "level": "CEFR seviyesi (A1, A2, B1, B2, C1 veya C2)",
    "definition": "Kısa tanım Türkçe (opsiyonel)",
    "example_sentence": "Örnek cümle (opsiyonel)"
  }
]

Kurallar:
- Doğru çeviriler ver
- CEFR seviyesini kelime sıklığına göre belirle
- Tanımları kısa tut (max 100 karakter)
- Örnek cümleler basit ve doğal olsun
- SADECE geçerli JSON array döndür, markdown veya ek metin yok`

    try {
      const text = await generateText(prompt)
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.error(`Grup ${i + 1} geçersiz JSON`)
        failed.push(...chunk)
        continue
      }

      const results = JSON.parse(jsonMatch[0]) as Array<{
        word?: string
        translation?: string
        level?: string
        definition?: string
        example_sentence?: string
      }>

      results.forEach((result, idx) => {
        const originalWord = chunk[idx] || result.word || ''
        translations.push({
          word: result.word || originalWord,
          translation: result.translation || '',
          level: parseLevel(result.level || 'B1'),
          definition: result.definition || undefined,
          example_sentence: result.example_sentence || undefined,
        })
      })

      if (onProgress) {
        onProgress(Math.min((i + 1) * chunkSize, words.length), words.length)
      }

      // Rate limiting: gruplar arası 1 saniye bekle
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error(`Grup ${i + 1} hatası:`, error)
      failed.push(...chunk)
    }
  }

  return {
    translations,
    failed,
  }
}

/**
 * Kelime için CEFR seviyesi tespit eder
 */
export async function detectWordLevel(
  word: string
): Promise<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'> {
  if (!isGeminiAvailable()) {
    return 'B1'
  }

  const prompt = `İngilizce kelime için CEFR seviyesini belirle: "${word}"

Dikkate al:
- Günlük dilde kelime sıklığı
- Karmaşıklık ve soyutluk
- Tipik öğrenme aşaması

SADECE seviye kodu döndür (A1, A2, B1, B2, C1 veya C2), başka metin yok.`

  try {
    const text = await generateText(prompt)
    const level = text.trim().toUpperCase()
    return CEFR_LEVELS.includes(level as typeof CEFR_LEVELS[number])
      ? (level as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2')
      : 'B1'
  } catch (error) {
    console.error('Seviye tespit hatası:', error)
    return 'B1'
  }
}

/**
 * Kelime için örnek cümle üretir
 */
export async function generateExampleSentence(word: string): Promise<string> {
  if (!isGeminiAvailable()) {
    return `Example sentence with "${word}".`
  }

  const prompt = `İngilizce kelimeyi kullanan basit, doğal bir örnek cümle üret: "${word}"

Gereksinimler:
- Kısa olsun (max 15 kelime)
- Günlük dil kullan
- Net ve bağlamsal olsun
- SADECE cümleyi döndür, başka metin yok`

  try {
    const text = await generateText(prompt)
    return text.trim() || `Example sentence with "${word}".`
  } catch (error) {
    console.error('Örnek cümle hatası:', error)
    return `Example sentence with "${word}".`
  }
}
