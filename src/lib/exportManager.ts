import { saveAs } from 'file-saver'
import Papa from 'papaparse'

export interface VocabularyWord {
  id: string
  word: string
  translation: string
  definition?: string
  example_sentence?: string
  pronunciation_us?: string
  pronunciation_uk?: string
  category?: string
  level?: string
  created_at: string
}

/**
 * Export vocabulary to CSV
 */
export function exportVocabularyCSV(words: VocabularyWord[]) {
  const csv = Papa.unparse(words, {
    columns: [
      'word',
      'translation',
      'definition',
      'example_sentence',
      'pronunciation_us',
      'pronunciation_uk',
      'category',
      'level',
      'created_at'
    ],
    header: true
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const timestamp = new Date().toISOString().split('T')[0]
  saveAs(blob, `zenith-vocab-${timestamp}.csv`)
}

/**
 * Export to JSON
 */
export function exportToJSON(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const timestamp = new Date().toISOString().split('T')[0]
  saveAs(blob, `${filename}-${timestamp}.json`)
}

/**
 * Export to TXT (simple list)
 */
export function exportToTXT(words: VocabularyWord[]) {
  const text = words
    .map(w => `${w.word} - ${w.translation}`)
    .join('\n')
  
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' })
  const timestamp = new Date().toISOString().split('T')[0]
  saveAs(blob, `zenith-vocab-${timestamp}.txt`)
}

/**
 * Import from CSV
 */
export async function importFromCSV(file: File): Promise<VocabularyWord[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        resolve(results.data as VocabularyWord[])
      },
      error: (error) => {
        reject(error)
      }
    })
  })
}

/**
 * Import from JSON
 */
export async function importFromJSON(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)
        resolve(json)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
