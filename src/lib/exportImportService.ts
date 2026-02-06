/**
 * Export/Import Service
 * Kelime ve koleksiyon verilerini CSV, JSON, TXT formatlarında dışa/içe aktarır.
 */

import { saveAs } from 'file-saver'
import Papa from 'papaparse'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

export interface ExportableWord {
  id?: string
  word: string
  translation: string
  definition?: string | null
  example_sentence?: string | null
  pronunciation_us?: string | null
  pronunciation_uk?: string | null
  category?: string | null
  level?: string | null
  mastery_level?: number
  created_at?: string
}

export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
  words: ImportableWord[]
}

export interface ImportableWord {
  word: string
  translation: string
  definition?: string | null
  example_sentence?: string | null
  category?: string
  level?: string
}

// ---------------------------------------------------------------------------
// Zod şemaları (validasyon)
// ---------------------------------------------------------------------------

const importWordSchema = z.object({
  word: z.string().min(1, 'Kelime boş olamaz').max(200),
  translation: z.string().min(1, 'Çeviri boş olamaz').max(500),
  definition: z.string().max(2000).optional().nullable(),
  example_sentence: z.string().max(1000).optional().nullable(),
  category: z.string().max(50).optional(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional()
})

// ---------------------------------------------------------------------------
// EXPORT
// ---------------------------------------------------------------------------

const EXPORT_COLUMNS = [
  'word',
  'translation',
  'definition',
  'example_sentence',
  'pronunciation_us',
  'pronunciation_uk',
  'category',
  'level',
  'mastery_level',
  'created_at'
] as const

/**
 * Kelimeleri CSV olarak dışa aktarır
 */
export function exportToCSV(words: ExportableWord[]): void {
  const csv = Papa.unparse(words, {
    columns: [...EXPORT_COLUMNS],
    header: true
  })
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const timestamp = new Date().toISOString().split('T')[0]
  saveAs(blob, `zenith-vocab-${timestamp}.csv`)
}

/**
 * Kelimeleri JSON olarak dışa aktarır (tam veri)
 */
export function exportToJSON(words: ExportableWord[]): void {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    source: 'zenith-vocab',
    words
  }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const timestamp = new Date().toISOString().split('T')[0]
  saveAs(blob, `zenith-vocab-${timestamp}.json`)
}

/**
 * Kelimeleri TXT olarak dışa aktarır (basit liste)
 */
export function exportToTXT(words: ExportableWord[]): void {
  const text = words.map((w) => `${w.word} - ${w.translation}`).join('\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' })
  const timestamp = new Date().toISOString().split('T')[0]
  saveAs(blob, `zenith-vocab-${timestamp}.txt`)
}

// ---------------------------------------------------------------------------
// IMPORT
// ---------------------------------------------------------------------------

/**
 * CSV dosyasından kelime listesi okur
 */
export async function importFromCSV(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'utf-8',
      complete: (results) => {
        resolve(parseAndValidateRows(results.data as Record<string, unknown>[]))
      },
      error: (error) => {
        resolve({
          success: false,
          imported: 0,
          skipped: 0,
          errors: [error.message ?? 'CSV okunamadı'],
          words: []
        })
      }
    })
  })
}

/**
 * JSON dosyasından kelime listesi okur
 * Hem ham array hem de { words: [...] } formatını destekler
 */
export async function importFromJSON(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const raw = JSON.parse((e.target?.result as string) ?? '{}')
        const rows = Array.isArray(raw) ? raw : raw.words ?? raw.data ?? []
        resolve(parseAndValidateRows(rows as Record<string, unknown>[]))
      } catch (err) {
        resolve({
          success: false,
          imported: 0,
          skipped: 0,
          errors: [err instanceof Error ? err.message : 'JSON okunamadı'],
          words: []
        })
      }
    }
    reader.onerror = () =>
      resolve({
        success: false,
        imported: 0,
        skipped: 0,
        errors: ['Dosya okunamadı'],
        words: []
      })
    reader.readAsText(file)
  })
}

/**
 * Ham satırları doğrular ve ImportableWord[] döner
 */
function parseAndValidateRows(rows: Record<string, unknown>[]): ImportResult {
  const errors: string[] = []
  const words: ImportableWord[] = []
  let skipped = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const word = String(row.word ?? row.kelime ?? '').trim()
    const translation = String(row.translation ?? row.ceviri ?? row.definition ?? '').trim()

    if (!word || !translation) {
      skipped++
      continue
    }

    const parsed = importWordSchema.safeParse({
      word,
      translation,
      definition: row.definition ?? null,
      example_sentence: row.example_sentence ?? row.example ?? null,
      category: row.category ?? row.kategori ?? 'daily',
      level: row.level ?? row.seviye ?? 'B1'
    })

    if (parsed.success) {
      words.push(parsed.data)
    } else {
      skipped++
      const msg = parsed.error.errors.map((e) => e.message).join('; ')
      errors.push(`Satır ${i + 1}: ${msg}`)
    }
  }

  return {
    success: words.length > 0,
    imported: words.length,
    skipped,
    errors,
    words
  }
}

/**
 * Import edilen kelimeleri Supabase insert formatına çevirir
 */
export function toSupabaseInsertFormat(
  words: ImportableWord[],
  userId: string
): Array<Record<string, unknown>> {
  return words.map((w) => ({
    user_id: userId,
    word: w.word,
    translation: w.translation,
    definition: w.definition ?? null,
    example_sentence: w.example_sentence ?? null,
    category: w.category ?? 'daily',
    level: w.level ?? 'B1',
    mastery_level: 0
  }))
}

// ---------------------------------------------------------------------------
// KOLEKSİYON EXPORT/IMPORT
// ---------------------------------------------------------------------------

export interface ExportedCollection {
  version: string
  exported_at: string
  collection: {
    name: string
    description: string | null
    icon: string
    color: string
    is_public: boolean
  }
  words: Array<{
    word: string
    translation: string
    definition: string | null
    example_sentence: string | null
    category: string
    level: string
    mastery_level: number
  }>
  metadata: {
    word_count: number
    export_source: string
  }
}

/**
 * Koleksiyonu JSON olarak dışa aktarır
 */
export async function exportCollection(collectionId: string): Promise<ExportedCollection> {
  const supabase = createClient()

  const { data: collection, error } = await supabase
    .from('collections')
    .select(`
      name,
      description,
      icon,
      color,
      is_public,
      collection_words (
        word:vocabulary_words (
          word,
          translation,
          definition,
          example_sentence,
          category,
          level,
          mastery_level
        )
      )
    `)
    .eq('id', collectionId)
    .single()

  if (error) throw error

  type CollectionWordItem = { word?: { word: string; translation: string; definition?: string | null; example_sentence?: string | null; category?: string; level?: string; mastery_level?: number } | null }
  const words = ((collection.collection_words ?? []) as CollectionWordItem[])
    .map((cw) => cw.word)
    .filter((w): w is NonNullable<typeof w> => w !== null)

  return {
    version: '1.0',
    exported_at: new Date().toISOString(),
    collection: {
      name: collection.name,
      description: collection.description,
      icon: collection.icon,
      color: collection.color,
      is_public: collection.is_public ?? false
    },
    words: words.map((w) => ({
      word: w.word,
      translation: w.translation,
      definition: w.definition ?? null,
      example_sentence: w.example_sentence ?? null,
      category: w.category ?? 'daily',
      level: w.level ?? 'B1',
      mastery_level: w.mastery_level ?? 0
    })),
    metadata: {
      word_count: words.length,
      export_source: 'Zenith Vocabulary'
    }
  }
}

/**
 * Koleksiyonu JSON dosyası olarak indirir
 */
export function downloadCollectionJSON(exported: ExportedCollection, filename?: string): void {
  const json = JSON.stringify(exported, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const name = filename ?? `${exported.collection.name.replace(/\s+/g, '_')}_${Date.now()}.json`
  saveAs(blob, name)
}

/**
 * Import edilen koleksiyon JSON'unu doğrular
 */
export function validateImportedCollection(data: unknown): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const d = data as Record<string, unknown>

  if (!d?.version) errors.push('version alanı eksik')
  if (!d?.collection) errors.push('collection alanı eksik')
  else {
    const c = d.collection as Record<string, unknown>
    if (!c?.name) errors.push('Koleksiyon adı eksik')
    if (!c?.icon) errors.push('Koleksiyon ikonu eksik')
    if (!c?.color) errors.push('Koleksiyon rengi eksik')
  }

  if (!Array.isArray(d?.words)) {
    errors.push('words bir dizi olmalı')
  } else if (d.words.length === 0) {
    errors.push('Koleksiyonda en az bir kelime olmalı')
  } else {
    ;(d.words as Array<Record<string, unknown>>).forEach((word, index) => {
      if (!word?.word) errors.push(`Kelime ${index + 1}: word alanı eksik`)
      if (!word?.translation) errors.push(`Kelime ${index + 1}: translation alanı eksik`)
    })
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Koleksiyonu JSON'dan içe aktarır
 */
export async function importCollection(
  data: ExportedCollection,
  userId: string,
  options?: { mergeExisting?: boolean; overwriteName?: string }
): Promise<{ collectionId: string; wordsAdded: number; wordsSkipped: number }> {
  const supabase = createClient()

  const validation = validateImportedCollection(data)
  if (!validation.valid) {
    throw new Error(`Geçersiz import verisi: ${validation.errors.join(', ')}`)
  }

  const collectionName = options?.overwriteName ?? data.collection.name

  const { data: newCollection, error: collectionError } = await supabase
    .from('collections')
    .insert({
      user_id: userId,
      name: collectionName,
      description: data.collection.description,
      icon: data.collection.icon,
      color: data.collection.color,
      is_public: data.collection.is_public,
      is_template: false
    })
    .select()
    .single()

  if (collectionError) throw collectionError

  let wordsAdded = 0
  let wordsSkipped = 0

  for (const wordData of data.words) {
    try {
      const { data: existingWord } = await supabase
        .from('vocabulary_words')
        .select('id')
        .eq('user_id', userId)
        .eq('word', wordData.word)
        .single()

      let wordId: string

      if (existingWord) {
        if (options?.mergeExisting) {
          wordId = existingWord.id
        } else {
          wordsSkipped++
          continue
        }
      } else {
        const { data: newWord, error: wordError } = await supabase
          .from('vocabulary_words')
          .insert({
            user_id: userId,
            word: wordData.word,
            translation: wordData.translation,
            definition: wordData.definition ?? null,
            example_sentence: wordData.example_sentence ?? null,
            category: wordData.category ?? 'daily',
            level: wordData.level ?? 'B1',
            mastery_level: 0
          })
          .select()
          .single()

        if (wordError) {
          wordsSkipped++
          continue
        }
        wordId = newWord.id
      }

      await supabase.from('collection_words').insert({
        collection_id: newCollection.id,
        word_id: wordId
      })

      wordsAdded++
    } catch {
      wordsSkipped++
    }
  }

  return {
    collectionId: newCollection.id,
    wordsAdded,
    wordsSkipped
  }
}

/**
 * JSON dosyasını okur ve ExportedCollection döner
 */
export async function parseCollectionJSONFile(file: File): Promise<ExportedCollection> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse((e.target?.result as string) ?? '{}')
        resolve(json as ExportedCollection)
      } catch {
        reject(new Error('Geçersiz JSON dosyası'))
      }
    }
    reader.onerror = () => reject(new Error('Dosya okunamadı'))
    reader.readAsText(file)
  })
}
