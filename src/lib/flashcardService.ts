import { createClient } from '@/lib/supabase/client'

export interface FlashcardSession {
  id: string
  userId: string
  collectionId: string | null
  startedAt: string
  endedAt: string | null
  totalCards: number
  correctAnswers: number
  wrongAnswers: number
  skippedCards: number
  durationSeconds: number | null
}

export interface WordReview {
  id: string
  userId: string
  wordId: string
  sessionId: string | null
  result: 'correct' | 'wrong' | 'skipped'
  previousMastery: number
  newMastery: number
  responseTimeMs: number | null
  reviewedAt: string
}

/**
 * Start a new flashcard session
 */
export async function startFlashcardSession(
  userId: string,
  collectionId: string | null
): Promise<string> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('flashcard_sessions')
    .insert({
      user_id: userId,
      collection_id: collectionId,
      started_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (error) throw error

  return data.id
}

/**
 * End a flashcard session
 */
export async function endFlashcardSession(
  sessionId: string,
  stats: {
    totalCards: number
    correctAnswers: number
    wrongAnswers: number
    skippedCards: number
    durationSeconds: number
  }
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('flashcard_sessions')
    .update({
      ended_at: new Date().toISOString(),
      total_cards: stats.totalCards,
      correct_answers: stats.correctAnswers,
      wrong_answers: stats.wrongAnswers,
      skipped_cards: stats.skippedCards,
      duration_seconds: stats.durationSeconds
    })
    .eq('id', sessionId)

  if (error) throw error
}

/**
 * Record a word review
 */
export async function recordWordReview(
  userId: string,
  wordId: string,
  sessionId: string | null,
  result: 'correct' | 'wrong' | 'skipped',
  previousMastery: number,
  newMastery: number,
  responseTimeMs: number | null = null
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('word_reviews')
    .insert({
      user_id: userId,
      word_id: wordId,
      session_id: sessionId,
      result,
      previous_mastery: previousMastery,
      new_mastery: newMastery,
      response_time_ms: responseTimeMs,
      reviewed_at: new Date().toISOString()
    })

  if (error) throw error
}

/**
 * Update word mastery after review
 */
export async function updateWordMastery(
  wordId: string,
  result: 'correct' | 'wrong' | 'skipped',
  currentMastery: number,
  currentReviewCount: number = 0
): Promise<number> {
  const supabase = createClient()

  let newMastery = currentMastery
  if (result === 'correct') {
    newMastery = Math.min(5, currentMastery + 1)
  } else if (result === 'wrong') {
    newMastery = Math.max(0, currentMastery - 1)
  }

  const updates: Record<string, unknown> = {
    mastery_level: newMastery,
    last_reviewed_at: new Date().toISOString()
  }
  if (result !== 'skipped') {
    updates.review_count = currentReviewCount + 1
  }

  const { error } = await supabase
    .from('vocabulary_words')
    .update(updates)
    .eq('id', wordId)

  if (error) throw error

  return newMastery
}

/**
 * Get recent sessions
 */
export async function getRecentSessions(
  userId: string,
  limit: number = 10
): Promise<FlashcardSession[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('flashcard_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map((session) => ({
    id: session.id,
    userId: session.user_id,
    collectionId: session.collection_id ?? null,
    startedAt: session.started_at,
    endedAt: session.ended_at ?? null,
    totalCards: session.total_cards ?? 0,
    correctAnswers: session.correct_answers ?? 0,
    wrongAnswers: session.wrong_answers ?? 0,
    skippedCards: session.skipped_cards ?? 0,
    durationSeconds: session.duration_seconds ?? null
  }))
}

/**
 * Get word review history
 */
export async function getWordReviewHistory(
  wordId: string,
  userId: string
): Promise<WordReview[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('word_reviews')
    .select('*')
    .eq('word_id', wordId)
    .eq('user_id', userId)
    .order('reviewed_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((review) => ({
    id: review.id,
    userId: review.user_id,
    wordId: review.word_id,
    sessionId: review.session_id ?? null,
    result: review.result,
    previousMastery: review.previous_mastery,
    newMastery: review.new_mastery,
    responseTimeMs: review.response_time_ms ?? null,
    reviewedAt: review.reviewed_at
  }))
}
