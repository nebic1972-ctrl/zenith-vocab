import { GoogleGenerativeAI } from '@google/generative-ai'
import { getPublicGoogleApiKey } from '@/lib/config'

const GEMINI_API_KEY = getPublicGoogleApiKey()

export interface WordAnalysis {
  categories: Array<{
    category: string
    confidence: number
    reasoning: string
  }>
  level: {
    level: string
    reasoning: string
  }
  contextualUsage: string[]
  exampleSentence?: string
  exampleTranslation?: string
}

function safeParseJson(text: string): WordAnalysis {
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)
    const categories = (parsed.categories || []).map((c: { category?: string; confidence?: number; reasoning?: string }) => ({
      category: c.category || 'daily',
      confidence: typeof c.confidence === 'number' ? c.confidence : 0.5,
      reasoning: c.reasoning || 'parsed'
    }))
    return {
      categories: categories.length ? categories : [{ category: 'daily', confidence: 0.5, reasoning: 'fallback' }],
      level: parsed.level?.level ? { level: parsed.level.level, reasoning: parsed.level.reasoning || 'parsed' } : { level: 'B1', reasoning: 'fallback' },
      contextualUsage: Array.isArray(parsed.contextualUsage) ? parsed.contextualUsage : [],
      exampleSentence: parsed.exampleSentence,
      exampleTranslation: parsed.exampleTranslation
    }
  } catch {
    return {
      categories: [{ category: 'daily', confidence: 0.5, reasoning: 'parse error' }],
      level: { level: 'B1', reasoning: 'parse error' },
      contextualUsage: [],
      exampleSentence: undefined,
      exampleTranslation: undefined
    }
  }
}

export async function analyzeWord(
  word: string,
  translation: string,
  definition?: string,
  exampleSentence?: string
): Promise<WordAnalysis> {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1536,
      }
    })

    const prompt = `Sen bir İngilizce-Türkçe öğretim uzmanısın.

İngilizce kelime: "${word}"

SADECE bu JSON formatında cevap ver:

{
  "categories": [{"category": "daily", "confidence": 0.9, "reasoning": "common word"}],
  "level": {"level": "B1", "reasoning": "intermediate"},
  "contextualUsage": ["türkçe anlam 1", "türkçe anlam 2"],
  "exampleSentence": "Example sentence using ${word}.",
  "exampleTranslation": "Örnek cümlenin Türkçe çevirisi."
}

KURALLAR:
1. contextualUsage: SADECE TÜRKÇE anlamlar (2-4 kelime, virgülle ayrılmış)
2. exampleSentence: İngilizce örnek cümle (kelimenin kullanımını göster)
3. exampleTranslation: Örnek cümlenin TÜRKÇE çevirisi
4. Kategori: daily, business, academic, technical, travel, food, medical, legal, sports, entertainment, science, art, politics, finance, education, technology
5. Seviye: A1, A2, B1, B2, C1, C2

ÖRNEKLER:

"hello" için:
{
  "categories": [{"category": "daily", "confidence": 0.95, "reasoning": "basic greeting"}],
  "level": {"level": "A1", "reasoning": "beginner word"},
  "contextualUsage": ["merhaba", "selam"],
  "exampleSentence": "Hello, how are you today?",
  "exampleTranslation": "Merhaba, bugün nasılsın?"
}

"ubiquitous" için:
{
  "categories": [{"category": "academic", "confidence": 0.90, "reasoning": "formal term"}],
  "level": {"level": "C1", "reasoning": "advanced vocabulary"},
  "contextualUsage": ["her yerde bulunan", "yaygın"],
  "exampleSentence": "Smartphones have become ubiquitous in modern society.",
  "exampleTranslation": "Akıllı telefonlar modern toplumda her yerde bulunur hale geldi."
}

"however" için:
{
  "categories": [{"category": "daily", "confidence": 0.85, "reasoning": "common conjunction"}],
  "level": {"level": "B1", "reasoning": "intermediate connector"},
  "contextualUsage": ["ancak", "fakat", "bununla birlikte"],
  "exampleSentence": "I wanted to go; however, I was too tired.",
  "exampleTranslation": "Gitmek istedim; ancak çok yorgundum."
}

Şimdi "${word}" kelimesi için analiz yap. SADECE JSON döndür, başka hiçbir şey yazma.`

    console.log('🤖 Sending to Gemini...')
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log('📥 Gemini response:', text.slice(0, 500))

    const analysis = safeParseJson(text)

    // Validate Turkish in contextualUsage
    const contextualUsage = analysis.contextualUsage || []
    const hasTurkish = contextualUsage.some((usage: string) => 
      /[çğıöşüÇĞİÖŞÜ]/.test(usage)
    )

    if (!hasTurkish && contextualUsage.length > 0) {
      console.warn('⚠️ AI returned English, using fallback')
      if (translation && translation !== 'unknown') {
        analysis.contextualUsage = [translation]
      }
    }

    // Validate example sentences exist
    if (!analysis.exampleSentence) {
      console.warn('⚠️ No example sentence, creating one')
      analysis.exampleSentence = `This is an example with ${word}.`
    }

    if (!analysis.exampleTranslation) {
      console.warn('⚠️ No example translation')
      analysis.exampleTranslation = 'Örnek cümle çevirisi bulunamadı.'
    }

    // Validate structure
    if (!analysis.categories || !Array.isArray(analysis.categories)) {
      analysis.categories = [{ category: 'daily', confidence: 0.5, reasoning: 'fallback' }]
    }
    
    if (!analysis.level || !analysis.level.level) {
      analysis.level = { level: determineLevelByLength(word), reasoning: 'fallback' }
    }

    console.log('✅ Final analysis:', {
      categories: analysis.categories,
      level: analysis.level,
      contextualUsage: analysis.contextualUsage,
      hasExample: !!analysis.exampleSentence
    })

    return analysis

  } catch (error) {
    console.error('❌ AI Analysis error:', error)
    
    return {
      categories: [{ category: 'daily', confidence: 0.5, reasoning: 'Fallback' }],
      level: { level: determineLevelByLength(word), reasoning: 'Fallback' },
      contextualUsage: translation !== 'unknown' ? [translation] : ['Çeviri bulunamadı'],
      exampleSentence: `Example with ${word}.`,
      exampleTranslation: 'Örnek cümle bulunamadı.'
    }
  }
}

function determineLevelByLength(word: string): string {
  const length = word.length
  if (length <= 3) return 'A1'
  if (length <= 5) return 'A2'
  if (length <= 7) return 'B1'
  if (length <= 9) return 'B2'
  if (length <= 11) return 'C1'
  return 'C2'
}

export async function bulkCategorize(
  words: Array<{ word: string; translation: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<Array<{ word: string; category: string; level: string }>> {
  const results: Array<{ word: string; category: string; level: string }> = []
  const total = words.length

  for (let i = 0; i < words.length; i++) {
    const { word, translation } = words[i]
    onProgress?.(i + 1, total)
    const analysis = await analyzeWord(word, translation)
    results.push({
      word,
      category: analysis.categories?.[0]?.category || 'daily',
      level: analysis.level?.level || 'B1'
    })
  }

  return results
}
