'use client'

/**
 * Metin çıkarma modülü
 * PDF, TXT, MD, EPUB, DOCX ve yapıştırılmış metin için tek bir API sağlar.
 * PDF işleme (pdfjs-dist) sadece gerektiğinde dinamik yüklenir - canvas hatasını önler.
 */

export type ExtractResult = {
  text: string
  wordCount: number
  source: 'pdf' | 'txt' | 'md' | 'epub' | 'docx' | 'paste'
  metadata?: {
    title?: string
    author?: string
    subject?: string
    pageCount?: number
  }
}

export interface ExtractedWord {
  word: string
  translation?: string
  context?: string
}

/**
 * Metni normalize eder: fazla boşlukları temizler, satır sonlarını düzenler.
 */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Metni kelimelere böler (RSVP vb. için).
 */
export function textToWords(text: string): string[] {
  return normalizeText(text)
    .split(/\s+/)
    .filter(Boolean)
}

/**
 * Dosyadan metin çıkarır.
 * Desteklenen: PDF, TXT, MD, EPUB
 */
export async function extractTextFromFile(file: File): Promise<ExtractResult> {
  const name = file.name.toLowerCase()
  const type = file.type

  // PDF - dinamik import (pdfjs-dist canvas gerektirir, sadece PDF seçildiğinde yükle)
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    const { extractTextFromPDF } = await import('@/lib/pdfProcessor')
    const result = await extractTextFromPDF(file)
    const text = result.text
    return {
      text: normalizeText(text),
      wordCount: textToWords(text).length,
      source: 'pdf',
      metadata: {
        ...result.metadata,
        pageCount: result.pageCount
      }
    }
  }

  // EPUB
  if (type === 'application/epub+zip' || name.endsWith('.epub')) {
    return extractTextFromEpubFile(file)
  }

  // DOCX
  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx') ||
    name.endsWith('.doc')
  ) {
    return extractTextFromDocxFile(file)
  }

  // TXT veya MD
  if (
    type === 'text/plain' ||
    type.startsWith('text/') ||
    name.endsWith('.txt') ||
    name.endsWith('.md')
  ) {
    const text = await file.text()
    return {
      text: normalizeText(text),
      wordCount: textToWords(text).length,
      source: name.endsWith('.md') ? 'md' : 'txt'
    }
  }

  throw new Error(
    `Desteklenmeyen dosya türü: ${file.name}. Lütfen .pdf, .txt, .md, .epub veya .docx dosyası yükleyin.`
  )
}

/**
 * Yapıştırılmış metinden çıkarım (zaten metin).
 */
export function extractTextFromPaste(rawText: string): ExtractResult {
  const text = normalizeText(rawText)
  return {
    text,
    wordCount: textToWords(text).length,
    source: 'paste'
  }
}

/**
 * EPUB dosyasından metin çıkarır (epubUtils kullanır).
 */
export async function extractTextFromEpubFile(
  file: File
): Promise<ExtractResult> {
  const { extractTextFromEPUB } = await import('./epubUtils')
  const words = await extractTextFromEPUB(file)
  const text = words.join(' ')
  return {
    text: normalizeText(text),
    wordCount: words.length,
    source: 'epub'
  }
}

/**
 * DOCX dosyasından metin çıkarır (mammoth kullanır).
 */
async function extractTextFromDocxFile(file: File): Promise<ExtractResult> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  const text = normalizeText(result.value)
  return {
    text,
    wordCount: textToWords(text).length,
    source: 'docx'
  }
}

/**
 * Dosya veya yapıştırılmış metinden otomatik çıkarım.
 * File ise extractTextFromFile, string ise extractTextFromPaste kullanır.
 */
export async function extractText(input: File | string): Promise<ExtractResult> {
  if (typeof input === 'string') {
    return extractTextFromPaste(input)
  }
  return extractTextFromFile(input)
}

/**
 * Metinden benzersiz kelimeleri çıkarır.
 * Türkçe karakterler (ğüşıöç) desteklenir, 2 karakterden kısa kelimeler elenir.
 */
export function extractWordsFromText(text: string): string[] {
  const cleanText = text
    .toLowerCase()
    .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, ' ')
  const words = cleanText.split(/\s+/).filter((word) => word.length > 2)
  return Array.from(new Set(words)).sort()
}

/**
 * Kelimenin geçtiği cümleleri bulur (bağlam için).
 */
export function findWordContext(text: string, word: string): string[] {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  return sentences
    .filter((sentence) =>
      sentence.toLowerCase().includes(word.toLowerCase())
    )
    .map((s) => s.trim())
    .slice(0, 3)
}

/**
 * Metni analiz eder: kelime frekansı, sıralama, en sık kullanılanlar.
 */
export function analyzeText(text: string): {
  totalWords: number
  uniqueWords: number
  words: string[]
  frequency: Record<string, number>
  topWords: string[]
} {
  const words = extractWordsFromText(text)
  const frequency: Record<string, number> = {}
  const lowerText = text.toLowerCase()

  words.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    const matches = lowerText.match(regex)
    frequency[word] = matches ? matches.length : 0
  })

  const sortedWords = [...words].sort((a, b) => frequency[b] - frequency[a])

  return {
    totalWords: textToWords(text).length,
    uniqueWords: words.length,
    words: sortedWords,
    frequency,
    topWords: sortedWords.slice(0, 100)
  }
}

/**
 * Metinden kelimeleri çıkar ve temizle (gelişmiş seçeneklerle)
 */
export function extractWords(
  text: string,
  options: {
    minLength?: number
    maxLength?: number
    removeCommon?: boolean
    caseSensitive?: boolean
  } = {}
): string[] {
  const {
    minLength = 3,
    maxLength = 20,
    removeCommon = true,
    caseSensitive = false
  } = options

  let words = text
    .split(/\s+/)
    .map(word => {
      const cleaned = word.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ'-]/g, '')
      return caseSensitive ? cleaned : cleaned.toLowerCase()
    })
    .filter(word => word.length >= minLength && word.length <= maxLength)

  if (removeCommon) {
    const commonWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
      'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
      'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
      'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
      'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
      'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
      'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
      'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had',
      'were', 'said', 'did', 'having', 'may', 'should', 'am'
    ])
    words = words.filter(word => !commonWords.has(word.toLowerCase()))
  }

  return Array.from(new Set(words)).sort()
}

/**
 * Dosya tipinin desteklenip desteklenmediğini kontrol et
 */
export function isSupportedFileType(file: File): boolean {
  const supportedTypes = [
    'text/plain',
    'application/pdf',
    'application/epub+zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  const supportedExtensions = ['.txt', '.md', '.pdf', '.epub', '.docx', '.doc']
  return (
    supportedTypes.some(t => file.type.toLowerCase().includes(t)) ||
    supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  )
}

/**
 * Dosya boyutunu formatla
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
