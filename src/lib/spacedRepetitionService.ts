/**
 * Spaced Repetition Service
 * SM-2 Algorithm implementation for optimal learning
 */

import { createClient } from '@/lib/supabase/client'

export interface DueWord {
  id: string
  word: string
  translation: string
  definition: string | null
  example_sentence: string | null
  level: string
  category: string
  next_review_date: string | null
  easiness_factor: number
  repetitions: number
  review_interval: number
}

export interface ReviewResult {
  next_review_date: string
  review_interval: number
  easiness_factor: number
  repetitions: number
}

export interface DailyReviewStats {
  date: string
  total_reviews: number
  correct_reviews: number
  accuracy: number
}

/**
 * Get words due for review
 */
export async function getDueWords(
  userId: string,
  collectionId: string | null = null,
  limit: number = 20
): Promise<DueWord[]> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_due_words', {
    p_user_id: userId,
    p_collection_id: collectionId,
    p_limit: limit
  })

  if (error) throw error

  return data.map((word: any) => ({
    id: word.id,
    word: word.word,
    translation: word.translation,
    definition: word.definition,
    example_sentence: word.example_sentence,
    level: word.level,
    category: word.category,
    next_review_date: word.next_review_date,
    easiness_factor: word.easiness_factor || 2.5,
    repetitions: word.repetitions || 0,
    review_interval: word.review_interval || 0
  }))
}

/**
 * Get count of words due for review
 */
export async function getDueWordsCount(
  userId: string,
  collectionId: string | null = null
): Promise<number> {
  const supabase = createClient()

  let query = supabase
    .from('vocabulary_words')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .or('next_review_date.is.null,next_review_date.lte.' + new Date().toISOString())

  if (collectionId) {
    // Get words in collection
    const { data: collectionWords } = await supabase
      .from('collection_words')
      .select('word_id')
      .eq('collection_id', collectionId)

    if (collectionWords && collectionWords.length > 0) {
      const wordIds = collectionWords.map(cw => cw.word_id)
      query = query.in('id', wordIds)
    } else {
      return 0
    }
  }

  const { count, error } = await query

  if (error) throw error

  return count || 0
}

/**
 * Review a word and calculate next review using SM-2 algorithm
 * 
 * @param wordId - Word ID
 * @param quality - Quality rating (0-5)
 *   0: Complete blackout
 *   1: Incorrect response, but correct one remembered
 *   2: Incorrect response, correct one seemed easy to recall
 *   3: Correct response, but required significant difficulty
 *   4: Correct response, after some hesitation
 *   5: Perfect response
 * @param userId - User ID
 */
export async function reviewWord(
  wordId: string,
  quality: number,
  userId: string
): Promise<ReviewResult> {
  const supabase = createClient()

  // Validate quality
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5')
  }

  // Calculate next review using SM-2
  const { data, error } = await supabase.rpc('calculate_next_review', {
    p_word_id: wordId,
    p_quality: quality,
    p_user_id: userId
  })

  if (error) throw error

  const result = data[0]

  // Also record in word_reviews table
  await supabase.from('word_reviews').insert({
    user_id: userId,
    word_id: wordId,
    result: quality >= 3 ? 'correct' : 'wrong',
    previous_mastery: 0, // Will be updated by trigger if needed
    new_mastery: 0,
    reviewed_at: new Date().toISOString()
  })

  return {
    next_review_date: result.next_review_date,
    review_interval: result.review_interval,
    easiness_factor: result.easiness_factor,
    repetitions: result.repetitions
  }
}

/**
 * Get daily review statistics
 */
export async function getDailyReviewStats(
  userId: string,
  days: number = 30
): Promise<DailyReviewStats[]> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_daily_review_stats', {
    p_user_id: userId,
    p_days: days
  })

  if (error) throw error

  return data.map((stat: any) => ({
    date: stat.date,
    total_reviews: stat.total_reviews,
    correct_reviews: stat.correct_reviews,
    accuracy: stat.accuracy || 0
  }))
}

/**
 * Get review statistics summary
 */
export async function getReviewStatsSummary(userId: string): Promise<{
  totalReviews: number
  correctReviews: number
  accuracy: number
  dueToday: number
  streak: number
  averageEasiness: number
}> {
  const supabase = createClient()

  // Get total reviews
  const { data: words } = await supabase
    .from('vocabulary_words')
    .select('total_reviews, correct_reviews, easiness_factor')
    .eq('user_id', userId)

  const totalReviews = words?.reduce((sum, w) => sum + (w.total_reviews || 0), 0) || 0
  const correctReviews = words?.reduce((sum, w) => sum + (w.correct_reviews || 0), 0) || 0
  const accuracy = totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0
  const averageEasiness = words && words.length > 0
    ? words.reduce((sum, w) => sum + (w.easiness_factor || 2.5), 0) / words.length
    : 2.5

  // Get due today count
  const dueToday = await getDueWordsCount(userId)

  // Calculate streak (days with reviews)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: reviews } = await supabase
    .from('word_reviews')
    .select('reviewed_at')
    .eq('user_id', userId)
    .gte('reviewed_at', thirtyDaysAgo.toISOString())
    .order('reviewed_at', { ascending: false })

  // Calculate streak
  let streak = 0
  if (reviews && reviews.length > 0) {
    const reviewDates = new Set(
      reviews.map(r => new Date(r.reviewed_at).toISOString().split('T')[0])
    )
    
    const today = new Date().toISOString().split('T')[0]
    let currentDate = new Date()
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0]
      if (reviewDates.has(dateStr)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (dateStr === today) {
        // Today not yet reviewed, continue
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
  }

  return {
    totalReviews,
    correctReviews,
    accuracy,
    dueToday,
    streak,
    averageEasiness
  }
}

/**
 * Get upcoming reviews (next 7 days)
 */
export async function getUpcomingReviews(
  userId: string,
  days: number = 7
): Promise<{ date: string; count: number }[]> {
  const supabase = createClient()

  const endDate = new Date()
  endDate.setDate(endDate.getDate() + days)

  const { data: words } = await supabase
    .from('vocabulary_words')
    .select('next_review_date')
    .eq('user_id', userId)
    .not('next_review_date', 'is', null)
    .lte('next_review_date', endDate.toISOString())

  // Group by date
  const reviewsByDate: Record<string, number> = {}
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    reviewsByDate[dateStr] = 0
  }

  words?.forEach(word => {
    if (word.next_review_date) {
      const dateStr = new Date(word.next_review_date).toISOString().split('T')[0]
      if (reviewsByDate[dateStr] !== undefined) {
        reviewsByDate[dateStr]++
      }
    }
  })

  return Object.entries(reviewsByDate).map(([date, count]) => ({
    date,
    count
  }))
}

/**
 * Reset word progress (for testing or user request)
 */
export async function resetWordProgress(
  wordId: string,
  userId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('vocabulary_words')
    .update({
      easiness_factor: 2.5,
      next_review_date: null,
      review_interval: 0,
      repetitions: 0,
      last_review_quality: null,
      total_reviews: 0,
      correct_reviews: 0
    })
    .eq('id', wordId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Initialize spaced repetition for existing words
 * (Run once to set initial review dates for old words)
 */
export async function initializeSpacedRepetition(userId: string): Promise<number> {
  const supabase = createClient()

  // Get words without next_review_date
  const { data: words } = await supabase
    .from('vocabulary_words')
    .select('id')
    .eq('user_id', userId)
    .is('next_review_date', null)

  if (!words || words.length === 0) {
    return 0
  }

  // Set initial review date to now (so they appear in due list)
  const { error } = await supabase
    .from('vocabulary_words')
    .update({
      next_review_date: new Date().toISOString(),
      easiness_factor: 2.5,
      review_interval: 0,
      repetitions: 0
    })
    .eq('user_id', userId)
    .is('next_review_date', null)

  if (error) throw error

  return words.length
}
