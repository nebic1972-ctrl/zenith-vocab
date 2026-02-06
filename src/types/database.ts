/**
 * Zenith Vocab - Veritabanı Tip Tanımları
 * Supabase tablolarına karşılık gelen TypeScript interface'leri.
 */

// ---------------------------------------------------------------------------
// vocabulary_collections - Kelime koleksiyonları
// ---------------------------------------------------------------------------
export interface VocabularyCollection {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// collection_words - Koleksiyondaki kelimeler
// ---------------------------------------------------------------------------
export interface CollectionWord {
  id: string
  collection_id: string
  word: string
  definition: string
  translation: string | null
  example_sentence: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// review_sessions - Çalışma seansları
// ---------------------------------------------------------------------------
export interface ReviewSession {
  id: string
  user_id: string
  collection_id: string | null
  started_at: string
  completed_at: string | null
  cards_reviewed: number
  cards_correct: number
}

// ---------------------------------------------------------------------------
// word_contexts - Kelime bağlamları
// ---------------------------------------------------------------------------
export interface WordContext {
  id: string
  user_id: string
  word: string
  context: string
  source: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// sector_glossaries - Sektörel terimler
// ---------------------------------------------------------------------------
export interface SectorGlossary {
  id: string
  user_id: string
  term: string
  definition: string
  sector: string
  created_at: string
}

// ---------------------------------------------------------------------------
// vocabulary - Ana kelime tablosu (mevcut)
// ---------------------------------------------------------------------------
export interface Vocabulary {
  id: string
  user_id: string
  word: string
  definition: string
  example_sentence: string | null
  book_id: string | null
  created_at: string
}
