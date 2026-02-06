/**
 * Kelime (vocabulary) API fonksiyonları
 * Supabase vocabulary tablosu üzerinde CRUD işlemleri.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { Vocabulary } from '@/types/database'

// ---------------------------------------------------------------------------
// getVocabulary - Kullanıcının tüm kelimelerini getir
// ---------------------------------------------------------------------------
export async function getVocabulary(userId?: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const targetUserId = userId || user?.id
    if (!targetUserId) {
      console.warn('[getVocabulary] Kullanıcı giriş yapmamış.')
      return { data: [] as Vocabulary[], error: 'Lütfen giriş yapın.' }
    }

    const { data, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getVocabulary] Hata:', error)
      return { data: [] as Vocabulary[], error: error.message }
    }

    console.log('[getVocabulary] Başarılı, kelime sayısı:', data?.length ?? 0)
    return { data: (data ?? []) as Vocabulary[], error: null }
  } catch (err) {
    console.error('[getVocabulary] Beklenmeyen hata:', err)
    return { data: [] as Vocabulary[], error: 'Beklenmeyen bir hata oluştu.' }
  }
}

// ---------------------------------------------------------------------------
// addVocabulary - Yeni kelime ekle
// ---------------------------------------------------------------------------
export async function addVocabulary(
  word: string,
  definition: string,
  context?: string,
  bookId?: string
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.warn('[addVocabulary] Kullanıcı giriş yapmamış.')
      return { success: false, error: 'Lütfen giriş yapın.' }
    }

    if (!word?.trim() || !definition?.trim()) {
      return { success: false, error: 'Kelime ve tanım gerekli.' }
    }

    const { data, error } = await supabase
      .from('vocabulary')
      .insert({
        user_id: user.id,
        word: word.trim(),
        definition: definition.trim(),
        example_sentence: context?.trim() || null,
        book_id: bookId || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[addVocabulary] Hata:', error)
      return { success: false, error: error.message }
    }

    console.log('[addVocabulary] Kelime eklendi, id:', data?.id)
    return { success: true, id: data?.id, error: null }
  } catch (err) {
    console.error('[addVocabulary] Beklenmeyen hata:', err)
    return { success: false, error: 'Beklenmeyen bir hata oluştu.' }
  }
}

// ---------------------------------------------------------------------------
// deleteVocabulary - Kelime sil
// ---------------------------------------------------------------------------
export async function deleteVocabulary(wordId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.warn('[deleteVocabulary] Kullanıcı giriş yapmamış.')
      return { success: false, error: 'Lütfen giriş yapın.' }
    }

    if (!wordId) {
      return { success: false, error: 'Kelime ID gerekli.' }
    }

    const { error } = await supabase
      .from('vocabulary')
      .delete()
      .eq('id', wordId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[deleteVocabulary] Hata:', error)
      return { success: false, error: error.message }
    }

    console.log('[deleteVocabulary] Kelime silindi, id:', wordId)
    return { success: true, error: null }
  } catch (err) {
    console.error('[deleteVocabulary] Beklenmeyen hata:', err)
    return { success: false, error: 'Beklenmeyen bir hata oluştu.' }
  }
}

// ---------------------------------------------------------------------------
// updateVocabulary - Kelime güncelle
// ---------------------------------------------------------------------------
export async function updateVocabulary(
  wordId: string,
  data: { word?: string; definition?: string; example_sentence?: string }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.warn('[updateVocabulary] Kullanıcı giriş yapmamış.')
      return { success: false, error: 'Lütfen giriş yapın.' }
    }

    if (!wordId) {
      return { success: false, error: 'Kelime ID gerekli.' }
    }

    const updatePayload: Record<string, unknown> = {}
    if (data.word?.trim()) updatePayload.word = data.word.trim()
    if (data.definition?.trim()) updatePayload.definition = data.definition.trim()
    if (data.example_sentence !== undefined)
      updatePayload.example_sentence = data.example_sentence?.trim() || null

    if (Object.keys(updatePayload).length === 0) {
      return { success: false, error: 'Güncellenecek alan yok.' }
    }

    const { error } = await supabase
      .from('vocabulary')
      .update(updatePayload)
      .eq('id', wordId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[updateVocabulary] Hata:', error)
      return { success: false, error: error.message }
    }

    console.log('[updateVocabulary] Kelime güncellendi, id:', wordId)
    return { success: true, error: null }
  } catch (err) {
    console.error('[updateVocabulary] Beklenmeyen hata:', err)
    return { success: false, error: 'Beklenmeyen bir hata oluştu.' }
  }
}
