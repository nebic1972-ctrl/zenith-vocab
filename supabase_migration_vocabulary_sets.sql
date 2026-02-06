-- =============================================================================
-- Migration: Vocabulary Sets, Words, Study Sessions
-- =============================================================================
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- Idempotent: Tekrar çalıştırıldığında hata vermez.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. vocabulary_sets
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vocabulary_sets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  language text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.vocabulary_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sets" ON public.vocabulary_sets;
DROP POLICY IF EXISTS "Users can create own sets" ON public.vocabulary_sets;
DROP POLICY IF EXISTS "Users can update own sets" ON public.vocabulary_sets;
DROP POLICY IF EXISTS "Users can delete own sets" ON public.vocabulary_sets;

CREATE POLICY "Users can view own sets"
  ON public.vocabulary_sets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sets"
  ON public.vocabulary_sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sets"
  ON public.vocabulary_sets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sets"
  ON public.vocabulary_sets FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 2. vocabulary_words
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vocabulary_words (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id uuid REFERENCES public.vocabulary_sets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word text NOT NULL,
  translation text NOT NULL,
  definition text,
  example_sentence text,
  pronunciation text,
  difficulty integer DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  mastery_level integer DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 100),
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  review_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.vocabulary_words ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own words" ON public.vocabulary_words;
DROP POLICY IF EXISTS "Users can create own words" ON public.vocabulary_words;
DROP POLICY IF EXISTS "Users can update own words" ON public.vocabulary_words;
DROP POLICY IF EXISTS "Users can delete own words" ON public.vocabulary_words;

CREATE POLICY "Users can view own words"
  ON public.vocabulary_words FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own words"
  ON public.vocabulary_words FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own words"
  ON public.vocabulary_words FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own words"
  ON public.vocabulary_words FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. study_sessions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  set_id uuid REFERENCES public.vocabulary_sets(id) ON DELETE CASCADE,
  duration_seconds integer DEFAULT 0,
  words_studied integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  wrong_answers integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.study_sessions;

CREATE POLICY "Users can view own sessions"
  ON public.study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
