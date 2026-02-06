import { createClient } from '@/lib/supabase/client'
import type { Collection, CollectionWithWords, VocabularyWord } from '@/types/collection'

export async function getCollections(userId: string): Promise<Collection[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_words(count)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map(col => ({
    ...col,
    word_count: col.collection_words?.[0]?.count || 0
  }))
}

export async function getTemplateCollections(): Promise<Collection[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('is_template', true)
    .order('name')

  if (error) throw error
  return data || []
}

export async function createCollection(
  userId: string,
  name: string,
  description: string,
  icon: string,
  color: string
): Promise<Collection> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('collections')
    .insert([{
      user_id: userId,
      name,
      description,
      icon,
      color
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCollection(
  collectionId: string,
  updates: Partial<Pick<Collection, 'name' | 'description' | 'icon' | 'color'>>
): Promise<Collection> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('collections')
    .update(updates)
    .eq('id', collectionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCollection(collectionId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)

  if (error) throw error
}

export async function getCollectionWithWords(
  collectionId: string
): Promise<CollectionWithWords> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_words(
        word_id,
        vocabulary_words(
          id,
          word,
          translation,
          level,
          category,
          mastery_level
        )
      )
    `)
    .eq('id', collectionId)
    .single()

  if (error) throw error

  return {
    ...data,
    words: data.collection_words.map((cw: any) => cw.vocabulary_words)
  }
}

export async function getCollectionIdsContainingWord(wordId: string): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('collection_words')
    .select('collection_id')
    .eq('word_id', wordId)

  if (error) return []
  return (data || []).map((r) => r.collection_id)
}

export async function addWordToCollection(
  collectionId: string,
  wordId: string
): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('collection_words')
    .insert([{
      collection_id: collectionId,
      word_id: wordId
    }])

  if (error) {
    if (error.code === '23505') {
      throw new Error('Bu kelime zaten koleksiyonda')
    }
    throw error
  }
}

export async function removeWordFromCollection(
  collectionId: string,
  wordId: string
): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('collection_words')
    .delete()
    .eq('collection_id', collectionId)
    .eq('word_id', wordId)

  if (error) throw error
}

export async function getCollectionStats(collectionId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('get_collection_stats', { collection_uuid: collectionId })

  if (error) throw error
  return data?.[0] || { total_words: 0, learned_words: 0, progress_percentage: 0 }
}

/**
 * Copy a shared collection to user's collections
 */
export async function copyCollectionToUser(
  collectionId: string,
  userId: string
): Promise<string> {
  const supabase = createClient()

  try {
    // 1. Get source collection
    const { data: sourceCollection, error: collectionError } = await supabase
      .from('collections')
      .select('name, description, icon, color')
      .eq('id', collectionId)
      .single()

    if (collectionError) throw collectionError

    // 2. Create new collection for user
    const { data: newCollection, error: createError } = await supabase
      .from('collections')
      .insert({
        user_id: userId,
        name: `${sourceCollection.name} (Kopya)`,
        description: sourceCollection.description,
        icon: sourceCollection.icon,
        color: sourceCollection.color,
        is_public: false,
        share_enabled: false
      })
      .select()
      .single()

    if (createError) throw createError

    // 3. Get words from source collection
    const { data: sourceWords, error: wordsError } = await supabase
      .from('collection_words')
      .select(`
        vocabulary_words (
          word,
          translation,
          definition,
          level,
          category,
          example_sentence,
          pronunciation_us,
          pronunciation_uk
        )
      `)
      .eq('collection_id', collectionId)

    if (wordsError) throw wordsError

    // 4. Add words to user's vocabulary and new collection
    const wordPromises = (sourceWords || []).map(async (item: { vocabulary_words?: unknown }) => {
      const wordData = item.vocabulary_words as Record<string, unknown> | null | undefined
      if (!wordData) return

      // Check if word already exists in user's vocabulary
      const { data: existingWord } = await supabase
        .from('vocabulary_words')
        .select('id')
        .eq('user_id', userId)
        .eq('word', wordData.word)
        .single()

      let wordId: string

      if (existingWord) {
        wordId = existingWord.id
      } else {
        const { data: newWord, error: wordError } = await supabase
          .from('vocabulary_words')
          .insert({
            user_id: userId,
            word: wordData.word,
            translation: wordData.translation ?? null,
            definition: wordData.definition ?? null,
            level: (wordData.level as string) ?? 'B1',
            category: (wordData.category as string) ?? 'daily',
            example_sentence: wordData.example_sentence ?? null,
            pronunciation_us: wordData.pronunciation_us ?? null,
            pronunciation_uk: wordData.pronunciation_uk ?? null
          })
          .select('id')
          .single()

        if (wordError) throw wordError
        wordId = newWord.id
      }

      const { error: linkError } = await supabase
        .from('collection_words')
        .insert({
          collection_id: newCollection.id,
          word_id: wordId
        })

      if (linkError) throw linkError
    })

    await Promise.all(wordPromises)

    return newCollection.id
  } catch (error) {
    console.error('Error copying collection:', error)
    throw error
  }
}

export async function cloneTemplateCollection(
  userId: string,
  templateId: string
): Promise<Collection> {
  const supabase = createClient()
  
  // Get template
  const { data: template, error: templateError } = await supabase
    .from('collections')
    .select('*')
    .eq('id', templateId)
    .single()

  if (templateError) throw templateError

  // Create new collection
  const { data: newCollection, error: createError } = await supabase
    .from('collections')
    .insert([{
      user_id: userId,
      name: template.name,
      description: template.description,
      icon: template.icon,
      color: template.color,
      is_template: false
    }])
    .select()
    .single()

  if (createError) throw createError

  return newCollection
}
/**
 * Get words from a collection for flashcard practice
 */
export async function getCollectionFlashcardWords(
  collectionId: string
): Promise<VocabularyWord[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('collection_words')
    .select(`
      word:vocabulary_words (
        id,
        word,
        translation,
        definition,
        example_sentence,
        category,
        level,
        mastery_level,
        last_reviewed_at,
        next_review_at,
        review_count,
        created_at
      )
    `)
    .eq('collection_id', collectionId)

  if (error) throw error

  // Extract words from nested structure
  const words = data
    .map((item: any) => item.word)
    .filter((word: any) => word !== null)

  return words as VocabularyWord[]
}

/**
 * Update collection progress after flashcard session
 */
export async function updateCollectionProgress(
  collectionId: string
): Promise<void> {
  const supabase = createClient()

  // Get collection stats
  const stats = await getCollectionStats(collectionId)

  // Update collection metadata (if you want to store progress)
  const { error } = await supabase
    .from('collections')
    .update({
      updated_at: new Date().toISOString()
    })
    .eq('id', collectionId)

  if (error) throw error
}

/**
 * Get collection learning statistics
 */
export async function getCollectionLearningStats(collectionId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('collection_words')
    .select(`
      word:vocabulary_words (
        mastery_level,
        review_count,
        last_reviewed_at
      )
    `)
    .eq('collection_id', collectionId)

  if (error) throw error

  const words = data.map((item: any) => item.word).filter((w: any) => w !== null)

  const today = new Date().toDateString()
  const reviewedToday = words.filter(
    (w: any) => w.last_reviewed_at && new Date(w.last_reviewed_at).toDateString() === today
  ).length

  const avgMastery = words.length > 0
    ? words.reduce((sum: number, w: any) => sum + (w.mastery_level || 0), 0) / words.length
    : 0

  const totalReviews = words.reduce((sum: number, w: any) => sum + (w.review_count || 0), 0)

  return {
    total_words: words.length,
    reviewed_today: reviewedToday,
    avg_mastery: Math.round(avgMastery * 10) / 10,
    total_reviews: totalReviews
  }
}
