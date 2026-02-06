/**
 * İstatistik Servisi
 * Kelime, tekrar ve koleksiyon istatistiklerini toplar.
 */

import { createClient } from '@/lib/supabase/client'

export interface VocabularyStats {
  totalWords: number
  learnedWords: number
  learningWords: number
  newWords: number
  byLevel: Record<string, number>
  byCategory: Record<string, number>
  masteryDistribution: { level: number; count: number }[]
}

export interface ReviewStats {
  reviewedToday: number
  reviewedThisWeek: number
  totalReviews: number
  retentionRate: number
  weeklyData: { date: string; count: number }[]
}

export interface CollectionStatsSummary {
  totalCollections: number
  totalWordsInCollections: number
  avgProgress: number
}

const MASTERY_LEARNED = 3
const MASTERY_LEARNING = 1

/**
 * Kullanıcının kelime istatistiklerini getirir
 */
export async function getVocabularyStats(userId: string): Promise<VocabularyStats> {
  const supabase = createClient()

  const { data: words, error } = await supabase
    .from('vocabulary_words')
    .select('mastery_level, level, category')
    .eq('user_id', userId)

  if (error) throw error

  const list = words ?? []
  const byLevel: Record<string, number> = {}
  const byCategory: Record<string, number> = {}
  const masteryDistribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  let learnedWords = 0
  let learningWords = 0
  let newWords = 0

  for (const w of list) {
    const mastery = w.mastery_level ?? 0
    const level = w.level ?? 'B1'
    const category = w.category ?? 'daily'

    if (mastery >= MASTERY_LEARNED) learnedWords++
    else if (mastery >= MASTERY_LEARNING) learningWords++
    else newWords++

    byLevel[level] = (byLevel[level] ?? 0) + 1
    byCategory[category] = (byCategory[category] ?? 0) + 1
    const bucket = Math.min(5, Math.max(0, Math.floor(mastery)))
    masteryDistribution[bucket] = (masteryDistribution[bucket] ?? 0) + 1
  }

  return {
    totalWords: list.length,
    learnedWords,
    learningWords,
    newWords,
    byLevel,
    byCategory,
    masteryDistribution: [0, 1, 2, 3, 4, 5].map((level) => ({
      level,
      count: masteryDistribution[level] ?? 0
    }))
  }
}

/**
 * Tekrar istatistiklerini getirir
 */
export async function getReviewStats(userId: string): Promise<ReviewStats> {
  const supabase = createClient()

  const { data: words, error } = await supabase
    .from('vocabulary_words')
    .select('last_reviewed_at, review_count, mastery_level')
    .eq('user_id', userId)

  if (error) throw error

  const list = words ?? []
  const today = new Date().toDateString()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  let reviewedToday = 0
  let reviewedThisWeek = 0
  let totalReviews = 0

  const weekDays: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    weekDays[d.toDateString()] = 0
  }

  for (const w of list) {
    totalReviews += w.review_count ?? 0

    const lastReviewed = w.last_reviewed_at
    if (lastReviewed) {
      const date = new Date(lastReviewed)
      if (date.toDateString() === today) reviewedToday++
      if (date >= weekAgo) {
        reviewedThisWeek++
        const key = date.toDateString()
        if (key in weekDays) weekDays[key]++
      }
    }
  }

  const weeklyData = Object.entries(weekDays)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('tr-TR', { weekday: 'short' }),
      count
    }))

  const learnedCount = list.filter((w) => (w.mastery_level ?? 0) >= MASTERY_LEARNED).length
  const retentionRate =
    list.length > 0 ? Math.round((learnedCount / list.length) * 1000) / 10 : 0

  return {
    reviewedToday,
    reviewedThisWeek,
    totalReviews,
    retentionRate: Math.round(retentionRate * 10) / 10,
    weeklyData
  }
}

/**
 * Koleksiyon özet istatistiklerini getirir
 */
export async function getCollectionStatsSummary(
  userId: string
): Promise<CollectionStatsSummary> {
  const supabase = createClient()

  const { data: collections, error } = await supabase
    .from('collections')
    .select(`
      id,
      collection_words(
        word_id,
        vocabulary_words(mastery_level)
      )
    `)
    .eq('user_id', userId)
    .eq('is_template', false)

  if (error) throw error

  let totalWordsInCollections = 0
  let totalMastery = 0
  let wordsWithMastery = 0

  type CwItem = { vocabulary_words?: { mastery_level?: number } | null }
  for (const col of collections ?? []) {
    const cw = (col.collection_words ?? []) as CwItem[]
    for (const item of cw) {
      const vw = item.vocabulary_words
      if (vw) {
        totalWordsInCollections++
        const ml = vw.mastery_level ?? 0
        totalMastery += ml
        wordsWithMastery++
      }
    }
  }

  const avgProgress =
    wordsWithMastery > 0 ? Math.round((totalMastery / wordsWithMastery) * 100) / 100 : 0

  return {
    totalCollections: collections?.length ?? 0,
    totalWordsInCollections,
    avgProgress
  }
}

/**
 * Tüm istatistikleri tek seferde getirir
 */
export async function getAllStats(userId: string) {
  const [vocabularyStats, reviewStats, collectionStats] = await Promise.all([
    getVocabularyStats(userId),
    getReviewStats(userId),
    getCollectionStatsSummary(userId)
  ])

  return {
    vocabulary: vocabularyStats,
    review: reviewStats,
    collections: collectionStats
  }
}

// ---------------------------------------------------------------------------
// Genişletilmiş istatistikler (VocabularyStatistics, CollectionStats)
// ---------------------------------------------------------------------------

export interface VocabularyStatistics {
  totalWords: number
  totalCollections: number
  wordsByLevel: Record<string, number>
  wordsByCategory: Record<string, number>
  wordsByMastery: Record<number, number>
  averageMastery: number
  recentActivity: {
    date: string
    wordsAdded: number
    flashcardsStudied: number
  }[]
  streak: number
  longestStreak: number
}

export interface CollectionStats {
  collectionId: string
  collectionName: string
  wordCount: number
  averageMastery: number
  levelDistribution: Record<string, number>
  categoryDistribution: Record<string, number>
  lastStudied: string | null
  studyCount: number
  completionRate: number
}

/**
 * Genişletilmiş kelime istatistikleri (streak, recentActivity dahil)
 */
export async function getVocabularyStatistics(
  userId: string
): Promise<VocabularyStatistics> {
  const supabase = createClient()

  const { count: totalWords } = await supabase
    .from('vocabulary_words')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { count: totalCollections } = await supabase
    .from('collections')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_template', false)

  const { data: words } = await supabase
    .from('vocabulary_words')
    .select('level, category, mastery_level, created_at')
    .eq('user_id', userId)

  const wordsByLevel: Record<string, number> = {}
  const wordsByCategory: Record<string, number> = {}
  const wordsByMastery: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let totalMastery = 0

  words?.forEach((w) => {
    const level = w.level ?? 'B1'
    const category = w.category ?? 'daily'
    const mastery = w.mastery_level ?? 0

    wordsByLevel[level] = (wordsByLevel[level] ?? 0) + 1
    wordsByCategory[category] = (wordsByCategory[category] ?? 0) + 1
    const bucket = Math.min(5, Math.max(0, Math.floor(mastery)))
    wordsByMastery[bucket] = (wordsByMastery[bucket] ?? 0) + 1
    totalMastery += mastery
  })

  const averageMastery =
    words && words.length > 0 ? Math.round((totalMastery / words.length) * 100) / 100 : 0

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: recentWords } = await supabase
    .from('vocabulary_words')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  const { data: sessions } = await supabase
    .from('flashcard_sessions')
    .select('started_at, total_cards')
    .eq('user_id', userId)
    .gte('started_at', thirtyDaysAgo.toISOString())
    .order('started_at', { ascending: true })

  const activityByDate: Record<string, { wordsAdded: number; flashcardsStudied: number }> = {}

  recentWords?.forEach((w) => {
    const date = new Date(w.created_at).toISOString().split('T')[0]
    if (!activityByDate[date]) {
      activityByDate[date] = { wordsAdded: 0, flashcardsStudied: 0 }
    }
    activityByDate[date].wordsAdded++
  })

  sessions?.forEach((session) => {
    const date = new Date(session.started_at).toISOString().split('T')[0]
    if (!activityByDate[date]) {
      activityByDate[date] = { wordsAdded: 0, flashcardsStudied: 0 }
    }
    activityByDate[date].flashcardsStudied += session.total_cards ?? 0
  })

  const recentActivity = Object.entries(activityByDate)
    .map(([date, data]) => ({
      date,
      wordsAdded: data.wordsAdded,
      flashcardsStudied: data.flashcardsStudied
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const allActivityDates = Object.keys(activityByDate)
  const { streak, longestStreak } = calculateStreak(
    allActivityDates.map((d) => `${d}T00:00:00Z`)
  )

  return {
    totalWords: totalWords ?? 0,
    totalCollections: totalCollections ?? 0,
    wordsByLevel,
    wordsByCategory,
    wordsByMastery,
    averageMastery,
    recentActivity,
    streak,
    longestStreak
  }
}

/**
 * Tek koleksiyon istatistikleri
 */
export async function getCollectionStatistics(
  collectionId: string,
  _userId: string
): Promise<CollectionStats | null> {
  const supabase = createClient()

  const { data: collection } = await supabase
    .from('collections')
    .select('name')
    .eq('id', collectionId)
    .single()

  if (!collection) return null

  const { data: collectionWords } = await supabase
    .from('collection_words')
    .select(`
      word:vocabulary_words (
        level,
        category,
        mastery_level
      )
    `)
    .eq('collection_id', collectionId)

  type CwItem = { word?: { level?: string; category?: string; mastery_level?: number } | null }
  const words = (collectionWords ?? [])
    .map((cw: CwItem) => cw.word)
    .filter((w): w is NonNullable<typeof w> => w != null)

  const levelDistribution: Record<string, number> = {}
  const categoryDistribution: Record<string, number> = {}
  let totalMastery = 0
  let masteredWords = 0

  words.forEach((word) => {
    const level = word.level ?? 'B1'
    const category = word.category ?? 'daily'
    const mastery = word.mastery_level ?? 0

    levelDistribution[level] = (levelDistribution[level] ?? 0) + 1
    categoryDistribution[category] = (categoryDistribution[category] ?? 0) + 1
    totalMastery += mastery
    if (mastery >= 4) masteredWords++
  })

  const averageMastery =
    words.length > 0 ? Math.round((totalMastery / words.length) * 100) / 100 : 0
  const completionRate =
    words.length > 0 ? Math.round((masteredWords / words.length) * 1000) / 10 : 0

  return {
    collectionId,
    collectionName: collection.name,
    wordCount: words.length,
    averageMastery,
    levelDistribution,
    categoryDistribution,
    lastStudied: null,
    studyCount: 0,
    completionRate
  }
}

/**
 * Tüm koleksiyonların istatistikleri
 */
export async function getAllCollectionsStatistics(
  userId: string
): Promise<CollectionStats[]> {
  const supabase = createClient()

  const { data: collections } = await supabase
    .from('collections')
    .select('id')
    .eq('user_id', userId)
    .eq('is_template', false)

  if (!collections?.length) return []

  const stats = await Promise.all(
    collections.map((c) => getCollectionStatistics(c.id, userId))
  )

  return stats.filter((s): s is CollectionStats => s !== null)
}

/**
 * Çalışma serisi hesapla (created_at veya last_reviewed_at bazlı)
 */
function calculateStreak(
  dates: string[]
): { streak: number; longestStreak: number } {
  if (dates.length === 0) return { streak: 0, longestStreak: 0 }

  const uniqueDates = Array.from(
    new Set(dates.map((d) => new Date(d).toISOString().split('T')[0]))
  ).sort()

  let currentStreak = 0
  let longestStreak = 1
  let tempStreak = 1

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const lastDate = uniqueDates[uniqueDates.length - 1]

  if (lastDate === today || lastDate === yesterday) {
    currentStreak = 1
    for (let i = uniqueDates.length - 2; i >= 0; i--) {
      const current = new Date(uniqueDates[i]).getTime()
      const next = new Date(uniqueDates[i + 1]).getTime()
      const diffDays = Math.floor((next - current) / 86400000)
      if (diffDays === 1) {
        currentStreak++
      } else {
        break
      }
    }
  }

  for (let i = 1; i < uniqueDates.length; i++) {
    const current = new Date(uniqueDates[i]).getTime()
    const prev = new Date(uniqueDates[i - 1]).getTime()
    const diffDays = Math.floor((current - prev) / 86400000)
    if (diffDays === 1) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 1
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak)

  return { streak: currentStreak, longestStreak }
}

/**
 * Seviye rengi (grafikler için)
 */
export function getLevelColor(level: string): string {
  const colors: Record<string, string> = {
    A1: '#10b981',
    A2: '#3b82f6',
    B1: '#f59e0b',
    B2: '#f97316',
    C1: '#ef4444',
    C2: '#8b5cf6'
  }
  return colors[level] ?? '#6b7280'
}

/**
 * Mastery rengi (grafikler için)
 */
export function getMasteryColor(mastery: number): string {
  const colors = [
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#eab308',
    '#84cc16',
    '#10b981'
  ]
  return colors[Math.min(5, Math.max(0, Math.floor(mastery)))] ?? '#6b7280'
}

/**
 * Bugünkü tekrar istatistikleri (word_reviews tablosundan)
 */
export async function getTodayReviewStats(userId: string): Promise<{
  totalReviews: number
  correctReviews: number
  accuracy: number
}> {
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]

  const { data: reviews } = await supabase
    .from('word_reviews')
    .select('result')
    .eq('user_id', userId)
    .gte('reviewed_at', `${today}T00:00:00Z`)
    .lte('reviewed_at', `${today}T23:59:59.999Z`)

  const totalReviews = reviews?.length ?? 0
  const correctReviews = reviews?.filter((r) => r.result === 'correct').length ?? 0
  const accuracy = totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0

  return { totalReviews, correctReviews, accuracy }
}
