/**
 * Gemini API Service
 * Merkezi yapılandırma ve ortak fonksiyonlar.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { getGoogleApiKey, getPublicGoogleApiKey } from '@/lib/config'

const GEMINI_MODEL = 'gemini-2.5-flash'

const apiKey = getPublicGoogleApiKey() || getGoogleApiKey()

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

/**
 * API anahtarının mevcut olup olmadığını kontrol eder.
 */
export function isGeminiAvailable(): boolean {
  return !!apiKey?.trim()
}

/**
 * Gemini model instance döndürür.
 * Anahtar yoksa null döner.
 */
export function getGeminiModel(): GenerativeModel | null {
  if (!genAI) return null
  return genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  })
}

/**
 * Metin üretir.
 * @returns Üretilen metin veya hata mesajı
 */
export async function generateText(prompt: string): Promise<string> {
  const model = getGeminiModel()
  if (!model) {
    console.warn('Gemini API anahtarı eksik')
    return ''
  }

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    return response.text().trim()
  } catch (error) {
    console.error('Gemini generateText hatası:', error)
    throw error
  }
}

/**
 * JSON formatında yanıt üretir.
 * Yanıttan JSON objesini çıkarır (```json blokları dahil).
 */
export async function generateJson<T = Record<string, unknown>>(
  prompt: string
): Promise<T> {
  const text = await generateText(prompt)
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```javascript\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Gemini yanıtında JSON bulunamadı')
  }
  return JSON.parse(jsonMatch[0]) as T
}

/**
 * Kelime analizi sonucu (API /analyze-word ile uyumlu)
 */
export interface GeminiAnalysis {
  translation: string
  contextAnalysis: string
  difficulty: string
  exampleSentences?: string[]
  tips?: string
}
