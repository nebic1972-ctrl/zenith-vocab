/**
 * Toplu işlem servisi
 * Kelime listesinde toplu silme, güncelleme, koleksiyon işlemleri ve AI çeviri/tanım
 */

import { createClient } from '@/lib/supabase/client'
import { addWordToCollection, removeWordFromCollection } from '@/lib/collectionsService'
import { translateWordsBatch } from '@/lib/geminiTranslationService'
import { analyzeWord } from '@/lib/aiCategorization'
import { isGeminiAvailable } from '@/lib/geminiService'

export interface BulkOperation {
  id: string
  user_id: string
  operation_type: string
  affected_word_ids: string[]
  changes: Record<string, unknown> | null
  status: 'pending' | 'completed' | 'failed'
  error_message: string | null
  created_at: string
  completed_at: string | null
}

async function recordBulkOperation(
  userId: string,
  operationType: string,
  wordIds: string[],
  changes: Record<string, unknown> | null,
  status: 'pending' | 'completed' | 'failed',
  errorMessage?: string
): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bulk_operations')
    .insert({
      user_id: userId,
      operation_type: operationType,
      affected_word_ids: wordIds,
      changes,
      status,
      error_message: errorMessage || null,
      completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

async function completeBulkOperation(operationId: string, status: 'completed' | 'failed', errorMessage?: string): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('bulk_operations')
    .update({
      status,
      error_message: errorMessage || null,
      completed_at: new Date().toISOString()
    })
    .eq('id', operationId)
}

/**
 * Toplu silme
 */
export async function bulkDeleteWords(wordIds: string[], userId: string): Promise<void> {
  if (wordIds.length === 0) return

  const supabase = createClient()

  const { data: words } = await supabase
    .from('vocabulary_words')
    .select('*')
    .in('id', wordIds)
    .eq('user_id', userId)

  const opId = await recordBulkOperation(userId, 'delete', wordIds, { deleted: words || [] }, 'pending')

  try {
    const { error } = await supabase
      .from('vocabulary_words')
      .delete()
      .in('id', wordIds)
      .eq('user_id', userId)

    if (error) throw error
    await completeBulkOperation(opId, 'completed')
  } catch (err) {
    await completeBulkOperation(opId, 'failed', err instanceof Error ? err.message : 'Silme hatası')
    throw err
  }
}

/**
 * Toplu kategori değiştirme
 */
export async function bulkUpdateCategory(wordIds: string[], category: string, userId: string): Promise<void> {
  if (wordIds.length === 0) return

  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('vocabulary_words')
    .select('id, category')
    .in('id', wordIds)
    .eq('user_id', userId)

  const changes = { category, previous: oldData?.map(w => ({ id: w.id, category: w.category })) }
  const opId = await recordBulkOperation(userId, 'update_category', wordIds, changes, 'pending')

  try {
    const { error } = await supabase
      .from('vocabulary_words')
      .update({ category })
      .in('id', wordIds)
      .eq('user_id', userId)

    if (error) throw error
    await completeBulkOperation(opId, 'completed')
  } catch (err) {
    await completeBulkOperation(opId, 'failed', err instanceof Error ? err.message : 'Güncelleme hatası')
    throw err
  }
}

/**
 * Toplu seviye değiştirme
 */
export async function bulkUpdateLevel(wordIds: string[], level: string, userId: string): Promise<void> {
  if (wordIds.length === 0) return

  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('vocabulary_words')
    .select('id, level')
    .in('id', wordIds)
    .eq('user_id', userId)

  const changes = { level, previous: oldData?.map(w => ({ id: w.id, level: w.level })) }
  const opId = await recordBulkOperation(userId, 'update_level', wordIds, changes, 'pending')

  try {
    const { error } = await supabase
      .from('vocabulary_words')
      .update({ level })
      .in('id', wordIds)
      .eq('user_id', userId)

    if (error) throw error
    await completeBulkOperation(opId, 'completed')
  } catch (err) {
    await completeBulkOperation(opId, 'failed', err instanceof Error ? err.message : 'Güncelleme hatası')
    throw err
  }
}

/**
 * Toplu koleksiyona ekleme
 */
export async function bulkAddToCollection(wordIds: string[], collectionId: string, userId: string): Promise<void> {
  if (wordIds.length === 0) return

  const opId = await recordBulkOperation(userId, 'add_to_collection', wordIds, { collection_id: collectionId }, 'pending')

  try {
    let successCount = 0
    for (const wordId of wordIds) {
      try {
        await addWordToCollection(collectionId, wordId)
        successCount++
      } catch {
        // Zaten koleksiyonda olabilir
      }
    }
    await completeBulkOperation(opId, 'completed')
  } catch (err) {
    await completeBulkOperation(opId, 'failed', err instanceof Error ? err.message : 'Ekleme hatası')
    throw err
  }
}

/**
 * Toplu koleksiyondan çıkarma
 */
export async function bulkRemoveFromCollection(wordIds: string[], collectionId: string, userId: string): Promise<void> {
  if (wordIds.length === 0) return

  const opId = await recordBulkOperation(userId, 'remove_from_collection', wordIds, { collection_id: collectionId }, 'pending')

  try {
    for (const wordId of wordIds) {
      await removeWordFromCollection(collectionId, wordId)
    }
    await completeBulkOperation(opId, 'completed')
  } catch (err) {
    await completeBulkOperation(opId, 'failed', err instanceof Error ? err.message : 'Çıkarma hatası')
    throw err
  }
}

/**
 * Toplu çeviri (AI)
 */
export async function bulkTranslateWords(wordIds: string[], userId: string): Promise<void> {
  if (wordIds.length === 0) return
  if (!isGeminiAvailable()) throw new Error('Gemini API anahtarı yapılandırılmamış')

  const supabase = createClient()
  const { data: words, error: fetchError } = await supabase
    .from('vocabulary_words')
    .select('id, word')
    .in('id', wordIds)
    .eq('user_id', userId)

  if (fetchError || !words?.length) throw new Error('Kelimeler bulunamadı')

  const opId = await recordBulkOperation(userId, 'translate', wordIds, null, 'pending')

  try {
    const { translations, failed } = await translateWordsBatch(
      words.map(w => w.word),
      'en',
      'tr'
    )

    for (let i = 0; i < translations.length; i++) {
      const t = translations[i]
      const word = words.find(w => w.word === t.word)
      if (word) {
        await supabase
          .from('vocabulary_words')
          .update({
            translation: t.translation,
            level: t.level,
            definition: t.definition || null,
            example_sentence: t.example_sentence || null
          })
          .eq('id', word.id)
          .eq('user_id', userId)
      }
    }

    await completeBulkOperation(opId, 'completed')
  } catch (err) {
    await completeBulkOperation(opId, 'failed', err instanceof Error ? err.message : 'Çeviri hatası')
    throw err
  }
}

/**
 * Toplu tanım ekleme (AI)
 */
export async function bulkGenerateDefinitions(wordIds: string[], userId: string): Promise<void> {
  if (wordIds.length === 0) return
  if (!isGeminiAvailable()) throw new Error('Gemini API anahtarı yapılandırılmamış')

  const supabase = createClient()
  const { data: words, error: fetchError } = await supabase
    .from('vocabulary_words')
    .select('id, word, translation')
    .in('id', wordIds)
    .eq('user_id', userId)

  if (fetchError || !words?.length) throw new Error('Kelimeler bulunamadı')

  const opId = await recordBulkOperation(userId, 'generate_definitions', wordIds, null, 'pending')

  try {
    const previous: Array<{ id: string; definition?: string | null }> = []
    for (const w of words) {
      const { data } = await supabase
        .from('vocabulary_words')
        .select('definition')
        .eq('id', w.id)
        .single()
      previous.push({ id: w.id, definition: data?.definition })
    }

    for (const w of words) {
      try {
        const analysis = await analyzeWord(w.word, w.translation)
        const def = analysis.contextualUsage?.length
          ? analysis.contextualUsage.join(', ')
          : analysis.exampleSentence
          ? `${analysis.exampleSentence}${analysis.exampleTranslation ? ` (${analysis.exampleTranslation})` : ''}`
          : null
        const cat = analysis.categories?.[0]?.category || 'daily'
        const lvl = analysis.level?.level || 'B1'

        await supabase
          .from('vocabulary_words')
          .update({
            definition: def,
            example_sentence: analysis.exampleSentence || null,
            category: cat,
            level: lvl
          })
          .eq('id', w.id)
          .eq('user_id', userId)
      } catch {
        // Tek kelime hatası tüm işlemi durdurmaz
      }
    }

    await completeBulkOperation(opId, 'completed')
  } catch (err) {
    await completeBulkOperation(opId, 'failed', err instanceof Error ? err.message : 'Tanım hatası')
    throw err
  }
}

/**
 * İşlem geçmişi
 */
export async function getBulkOperationHistory(userId: string, limit = 20): Promise<BulkOperation[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bulk_operations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data || []).map(row => ({
    id: row.id,
    user_id: row.user_id,
    operation_type: row.operation_type,
    affected_word_ids: row.affected_word_ids || [],
    changes: row.changes,
    status: row.status,
    error_message: row.error_message,
    created_at: row.created_at,
    completed_at: row.completed_at
  }))
}

/**
 * Geri alma (undo)
 */
export async function undoBulkOperation(operationId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { data: op, error: fetchError } = await supabase
    .from('bulk_operations')
    .select('*')
    .eq('id', operationId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !op) throw new Error('İşlem bulunamadı')
  if (op.status !== 'completed') throw new Error('Sadece tamamlanmış işlemler geri alınabilir')

  const changes = op.changes as Record<string, unknown> | null
  const wordIds = op.affected_word_ids as string[]

  switch (op.operation_type) {
    case 'delete': {
      const deleted = (changes?.deleted as Array<Record<string, unknown>>) || []
      for (const w of deleted) {
        const { id, user_id, ...rest } = w
        await supabase.from('vocabulary_words').insert({
          ...rest,
          id,
          user_id: userId
        })
      }
      break
    }
    case 'update_category': {
      const previous = (changes?.previous as Array<{ id: string; category: string }>) || []
      for (const p of previous) {
        await supabase
          .from('vocabulary_words')
          .update({ category: p.category })
          .eq('id', p.id)
          .eq('user_id', userId)
      }
      break
    }
    case 'update_level': {
      const previous = (changes?.previous as Array<{ id: string; level: string }>) || []
      for (const p of previous) {
        await supabase
          .from('vocabulary_words')
          .update({ level: p.level })
          .eq('id', p.id)
          .eq('user_id', userId)
      }
      break
    }
    case 'add_to_collection': {
      const collectionId = changes?.collection_id as string
      if (collectionId) {
        for (const wordId of wordIds) {
          await removeWordFromCollection(collectionId, wordId)
        }
      }
      break
    }
    case 'remove_from_collection': {
      const collectionId = changes?.collection_id as string
      if (collectionId) {
        for (const wordId of wordIds) {
          await addWordToCollection(collectionId, wordId)
        }
      }
      break
    }
    default:
      throw new Error('Bu işlem türü geri alınamaz')
  }

  await supabase
    .from('bulk_operations')
    .update({ status: 'failed', error_message: 'Geri alındı (undo)' })
    .eq('id', operationId)
}
