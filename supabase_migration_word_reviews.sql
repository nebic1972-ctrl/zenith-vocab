-- =============================================================================
-- Migration: word_reviews - Kelime tekrar geçmişi tablosu
-- =============================================================================
-- KULLANIM: Aşağıdaki TÜM SQL'i kopyalayıp Supabase Dashboard > SQL Editor'a yapıştırın.
-- "npm run..." gibi terminal komutlarını SQL Editor'a YAPIŞTIRMAYIN.
-- ÖN KOŞUL: vocabulary_words tablosu mevcut olmalı
-- =============================================================================

-- flashcard_sessions (word_reviews için gerekli - yoksa oluştur)
CREATE TABLE IF NOT EXISTS public.flashcard_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_flashcard_sessions_user_id ON public.flashcard_sessions(user_id);
ALTER TABLE public.flashcard_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON public.flashcard_sessions;
CREATE POLICY "Users can view own sessions" ON public.flashcard_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.flashcard_sessions;
CREATE POLICY "Users can insert own sessions" ON public.flashcard_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own sessions" ON public.flashcard_sessions;
CREATE POLICY "Users can update own sessions" ON public.flashcard_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Word review history table
CREATE TABLE IF NOT EXISTS public.word_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id uuid NOT NULL REFERENCES public.vocabulary_words(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.flashcard_sessions(id) ON DELETE CASCADE,
  result varchar(20) NOT NULL CHECK (result IN ('correct', 'wrong', 'skipped')),
  previous_mastery integer NOT NULL,
  new_mastery integer NOT NULL,
  response_time_ms integer,
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_word_reviews_user_id ON public.word_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_word_reviews_word_id ON public.word_reviews(word_id);
CREATE INDEX IF NOT EXISTS idx_word_reviews_session_id ON public.word_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_word_reviews_reviewed_at ON public.word_reviews(reviewed_at);

-- RLS Policies
ALTER TABLE public.word_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reviews" ON public.word_reviews;
CREATE POLICY "Users can view own reviews"
ON public.word_reviews
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reviews" ON public.word_reviews;
CREATE POLICY "Users can insert own reviews"
ON public.word_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.word_reviews IS 'Individual word review history for spaced repetition';
