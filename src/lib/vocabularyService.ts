import { createClient } from '@/lib/supabase/client'
import type { VocabularyWord } from '@/types/collection'

export interface GetVocabularyWordsOptions {
  level?: string
  category?: string
}

/**
 * Kullanıcının kelimelerini getirir (vocabulary_words tablosu)
 */
export async function getVocabularyWords(
  userId: string,
  options?: GetVocabularyWordsOptions
): Promise<VocabularyWord[]> {
  const supabase = createClient()

  let query = supabase
    .from('vocabulary_words')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (options?.level) {
    query = query.eq('level', options.level)
  }
  if (options?.category) {
    query = query.eq('category', options.category)
  }

  const { data, error } = await query

  if (error) throw error

  return (data || []).map((row) => ({
    id: row.id,
    word: row.word,
    translation: row.translation ?? '',
    definition: row.definition ?? null,
    example_sentence: row.example_sentence ?? null,
    pronunciation_us: row.pronunciation_us ?? null,
    pronunciation_uk: row.pronunciation_uk ?? null,
    category: row.category ?? undefined,
    level: row.level ?? undefined,
    mastery_level: row.mastery_level ?? 0,
    last_reviewed_at: row.last_reviewed_at ?? null,
    next_review_at: row.next_review_at ?? null,
    review_count: row.review_count ?? 0,
    created_at: row.created_at ?? ''
  }))
}

/**
 * Kelime siler (kullanıcıya ait olmalı)
 */
export async function deleteWord(wordId: string, userId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('vocabulary_words')
    .delete()
    .eq('id', wordId)
    .eq('user_id', userId)

  if (error) throw error
}
