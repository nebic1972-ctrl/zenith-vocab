/**
 * Collection Sharing Service
 * Handle collection sharing, public links, and social sharing
 */

import { createClient } from '@/lib/supabase/client'

export interface SharedCollection {
  id: string
  name: string
  description: string
  icon: string
  color: string
  wordCount: number
  viewCount: number
  cloneCount: number
  createdAt: string
  shareToken: string
  ownerName?: string
}

/**
 * Enable sharing for a collection
 */
export async function enableCollectionSharing(
  collectionId: string,
  userId: string
): Promise<string> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('enable_collection_sharing', {
    p_collection_id: collectionId,
    p_user_id: userId
  })

  if (error) throw error

  return data as string
}

/**
 * Disable sharing for a collection
 */
export async function disableCollectionSharing(
  collectionId: string,
  userId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.rpc('disable_collection_sharing', {
    p_collection_id: collectionId,
    p_user_id: userId
  })

  if (error) throw error
}

/**
 * Get collection by share token
 * @param shareToken - Paylaşım token'ı
 * @param incrementView - Görüntülenme sayacını artır (varsayılan: true)
 */
export async function getSharedCollection(
  shareToken: string,
  incrementView: boolean = true
): Promise<SharedCollection | null> {
  const supabase = createClient()

  const { data: collection, error } = await supabase
    .from('collections')
    .select('*')
    .eq('share_token', shareToken)
    .eq('share_enabled', true)
    .eq('is_public', true)
    .single()

  if (error || !collection) return null

  const { count: wordCount } = await supabase
    .from('collection_words')
    .select('*', { count: 'exact', head: true })
    .eq('collection_id', collection.id)

  if (incrementView) {
    await supabase.rpc('increment_collection_view', {
      p_share_token: shareToken
    })
  }

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description || '',
    icon: collection.icon || '📚',
    color: collection.color || 'blue',
    wordCount: wordCount || 0,
    viewCount: collection.view_count || 0,
    cloneCount: collection.clone_count || 0,
    createdAt: collection.created_at,
    shareToken: collection.share_token
  }
}

/**
 * Get collection words by share token
 */
export async function getSharedCollectionWords(shareToken: string) {
  const supabase = createClient()

  const { data: collection } = await supabase
    .from('collections')
    .select('id')
    .eq('share_token', shareToken)
    .eq('share_enabled', true)
    .eq('is_public', true)
    .single()

  if (!collection) return []

  const { data: collectionWords } = await supabase
    .from('collection_words')
    .select(`
      word:vocabulary_words (
        id,
        word,
        translation,
        definition,
        example_sentence,
        level,
        category,
        pronunciation_us,
        pronunciation_uk
      )
    `)
    .eq('collection_id', collection.id)

  return collectionWords?.map((cw: { word?: Record<string, unknown> | null }) => cw.word).filter((w): w is Record<string, unknown> => w != null) || []
}

/**
 * Clone a shared collection
 */
export async function cloneSharedCollection(
  shareToken: string,
  userId: string,
  customName?: string
): Promise<string> {
  const supabase = createClient()

  const sharedCollection = await getSharedCollection(shareToken, false)
  if (!sharedCollection) throw new Error('Koleksiyon bulunamadı')

  const words = await getSharedCollectionWords(shareToken)

  const { data: newCollection, error: collectionError } = await supabase
    .from('collections')
    .insert({
      user_id: userId,
      name: customName || `${sharedCollection.name} (Kopya)`,
      description: sharedCollection.description,
      icon: sharedCollection.icon,
      color: sharedCollection.color,
      is_template: false
    })
    .select()
    .single()

  if (collectionError) throw collectionError

  for (const word of words) {
    try {
      const { data: existing } = await supabase
        .from('vocabulary_words')
        .select('id')
        .eq('user_id', userId)
        .eq('word', word.word)
        .single()

      let wordId: string

      if (existing) {
        wordId = existing.id
      } else {
        const { data: newWord, error: wordError } = await supabase
          .from('vocabulary_words')
          .insert({
            user_id: userId,
            word: word.word,
            translation: word.translation,
            definition: word.definition ?? null,
            example_sentence: word.example_sentence ?? null,
            level: word.level ?? 'B1',
            category: word.category ?? 'daily',
            mastery_level: 0
          })
          .select('id')
          .single()

        if (wordError) continue
        wordId = newWord.id
      }

      await supabase.from('collection_words').insert({
        collection_id: newCollection.id,
        word_id: wordId
      })
    } catch {
      // Kelime eklenemezse devam et
    }
  }

  await supabase.rpc('increment_collection_clone', {
    p_share_token: shareToken
  })

  return newCollection.id
}

/**
 * Get public collections (trending/popular)
 */
export async function getPublicCollections(
  limit: number = 20,
  sortBy: 'recent' | 'popular' | 'most_cloned' = 'popular'
): Promise<SharedCollection[]> {
  const supabase = createClient()

  let query = supabase
    .from('collections')
    .select('*')
    .eq('is_public', true)
    .eq('share_enabled', true)
    .limit(limit)

  if (sortBy === 'recent') {
    query = query.order('created_at', { ascending: false })
  } else if (sortBy === 'popular') {
    query = query.order('view_count', { ascending: false })
  } else if (sortBy === 'most_cloned') {
    query = query.order('clone_count', { ascending: false })
  }

  const { data: collections, error } = await query

  if (error) throw error
  if (!collections?.length) return []

  const collectionsWithCounts = await Promise.all(
    collections.map(async (collection) => {
      const { count: wordCount } = await supabase
        .from('collection_words')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', collection.id)

      return {
        id: collection.id,
        name: collection.name,
        description: collection.description || '',
        icon: collection.icon || '📚',
        color: collection.color || 'blue',
        wordCount: wordCount || 0,
        viewCount: collection.view_count || 0,
        cloneCount: collection.clone_count || 0,
        createdAt: collection.created_at,
        shareToken: collection.share_token
      }
    })
  )

  return collectionsWithCounts
}

/**
 * Search public collections with filters
 */
export async function searchPublicCollections(
  query: string | null = null,
  category: string | null = null,
  sortBy: 'popular' | 'recent' | 'most_cloned' = 'popular',
  limit: number = 20,
  offset: number = 0
): Promise<SharedCollection[]> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('search_public_collections', {
    p_query: query,
    p_category: category,
    p_sort_by: sortBy,
    p_limit: limit,
    p_offset: offset
  })

  if (error) throw error

  return (data || []).map((collection: Record<string, unknown>) => ({
    id: collection.id,
    name: collection.name,
    description: collection.description || '',
    icon: collection.icon || '📚',
    color: collection.color || 'blue',
    wordCount: Number(collection.word_count) || 0,
    viewCount: collection.view_count || 0,
    cloneCount: collection.clone_count || 0,
    createdAt: collection.created_at,
    shareToken: collection.share_token || ''
  }))
}

/**
 * Get collection categories for filtering
 * RPC get_collection_categories gerekli - supabase_migration_explore_collections.sql
 * Hata durumunda boş dizi döner (kategoriler opsiyonel)
 */
export async function getCollectionCategories(): Promise<{ category: string; count: number }[]> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_collection_categories')

  if (error) {
    console.warn('get_collection_categories RPC failed (migration may not be run):', error.message)
    return []
  }

  return (data || []).map((cat: Record<string, unknown>) => ({
    category: String(cat.category || ''),
    count: Number(cat.collection_count) || 0
  }))
}

/**
 * Get sharing stats for collection owner
 */
export async function getSharingStats(
  userId: string,
  collectionId: string
): Promise<{
  shareEnabled: boolean
  shareToken: string | null
  viewCount: number
  cloneCount: number
  lastViewedAt: string | null
} | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('collections')
    .select('share_enabled, share_token, view_count, clone_count, last_viewed_at')
    .eq('id', collectionId)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null

  return {
    shareEnabled: data.share_enabled ?? false,
    shareToken: data.share_token ?? null,
    viewCount: data.view_count ?? 0,
    cloneCount: data.clone_count ?? 0,
    lastViewedAt: data.last_viewed_at ?? null
  }
}

/**
 * Generate share URL
 */
export function generateShareUrl(shareToken: string): string {
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return `${baseUrl}/shared/${shareToken}`
}

/** @deprecated Use generateShareUrl */
export function getShareUrl(shareToken: string, baseUrl?: string): string {
  return generateShareUrl(shareToken)
}

/**
 * Generate social share URLs
 */
export function generateSocialShareUrls(shareToken: string, collectionName: string) {
  const shareUrl = generateShareUrl(shareToken)
  const text = `${collectionName} koleksiyonunu keşfedin!`

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  }
}
