-- =============================================================================
-- Migration: vocabulary_words - Spaced repetition alanları (SM-2)
-- =============================================================================
-- ÖN KOŞUL: vocabulary_words tablosu mevcut olmalı
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Spaced repetition sütunları
-- -----------------------------------------------------------------------------
ALTER TABLE public.vocabulary_words
ADD COLUMN IF NOT EXISTS easiness_factor real NOT NULL DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS next_review_date timestamptz,
ADD COLUMN IF NOT EXISTS review_interval integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS repetitions integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_review_quality integer,
ADD COLUMN IF NOT EXISTS total_reviews integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS correct_reviews integer NOT NULL DEFAULT 0;

-- -----------------------------------------------------------------------------
-- 2. İndeks (vadesi gelen tekrarlar için)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_vocabulary_words_next_review
ON public.vocabulary_words(user_id, next_review_date)
WHERE next_review_date IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. Sütun açıklamaları
-- -----------------------------------------------------------------------------
COMMENT ON COLUMN public.vocabulary_words.easiness_factor IS 'SM-2 easiness factor (1.3-2.5)';
COMMENT ON COLUMN public.vocabulary_words.next_review_date IS 'Next scheduled review date';
COMMENT ON COLUMN public.vocabulary_words.review_interval IS 'Current review interval in days';
COMMENT ON COLUMN public.vocabulary_words.repetitions IS 'Number of consecutive correct reviews';
COMMENT ON COLUMN public.vocabulary_words.last_review_quality IS 'Last review quality (0-5)';

-- -----------------------------------------------------------------------------
-- 4. SM-2 algoritması fonksiyonu
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_next_review(
  p_word_id uuid,
  p_quality integer,
  p_user_id uuid
)
RETURNS TABLE(
  next_review_date timestamptz,
  review_interval integer,
  easiness_factor real,
  repetitions integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $func$
DECLARE
  v_current_ef real;
  v_current_interval integer;
  v_current_reps integer;
  v_new_ef real;
  v_new_interval integer;
  v_new_reps integer;
  v_new_review_date timestamptz;
BEGIN
  SELECT
    w.easiness_factor,
    w.review_interval,
    w.repetitions
  INTO v_current_ef, v_current_interval, v_current_reps
  FROM public.vocabulary_words w
  WHERE w.id = p_word_id AND w.user_id = p_user_id;

  v_new_ef := v_current_ef + (0.1 - (5 - p_quality) * (0.08 + (5 - p_quality) * 0.02));

  IF v_new_ef < 1.3 THEN
    v_new_ef := 1.3;
  END IF;

  IF p_quality < 3 THEN
    v_new_reps := 0;
    v_new_interval := 1;
  ELSE
    v_new_reps := v_current_reps + 1;

    IF v_new_reps = 1 THEN
      v_new_interval := 1;
    ELSIF v_new_reps = 2 THEN
      v_new_interval := 6;
    ELSE
      v_new_interval := ROUND(v_current_interval * v_new_ef)::integer;
    END IF;
  END IF;

  v_new_review_date := now() + (v_new_interval || ' days')::interval;

  UPDATE public.vocabulary_words
  SET
    easiness_factor = v_new_ef,
    review_interval = v_new_interval,
    repetitions = v_new_reps,
    next_review_date = v_new_review_date,
    last_review_quality = p_quality,
    total_reviews = total_reviews + 1,
    correct_reviews = correct_reviews + CASE WHEN p_quality >= 3 THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE id = p_word_id AND user_id = p_user_id;

  RETURN QUERY SELECT v_new_review_date, v_new_interval, v_new_ef, v_new_reps;
END;
$func$;

-- -----------------------------------------------------------------------------
-- 5. Vadesi gelen kelimeleri getir
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_due_words(
  p_user_id uuid,
  p_collection_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  word varchar,
  translation text,
  definition text,
  example_sentence text,
  level varchar,
  category varchar,
  next_review_date timestamptz,
  easiness_factor real,
  repetitions integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $func$
BEGIN
  IF p_collection_id IS NULL THEN
    RETURN QUERY
    SELECT
      w.id,
      w.word,
      w.translation,
      w.definition,
      w.example_sentence,
      w.level,
      w.category,
      w.next_review_date,
      w.easiness_factor,
      w.repetitions
    FROM public.vocabulary_words w
    WHERE w.user_id = p_user_id
      AND (w.next_review_date IS NULL OR w.next_review_date <= now())
    ORDER BY
      w.next_review_date NULLS FIRST,
      w.easiness_factor ASC,
      w.created_at ASC
    LIMIT p_limit;
  ELSE
    RETURN QUERY
    SELECT
      w.id,
      w.word,
      w.translation,
      w.definition,
      w.example_sentence,
      w.level,
      w.category,
      w.next_review_date,
      w.easiness_factor,
      w.repetitions
    FROM public.vocabulary_words w
    INNER JOIN public.collection_words cw ON cw.word_id = w.id
    WHERE w.user_id = p_user_id
      AND cw.collection_id = p_collection_id
      AND (w.next_review_date IS NULL OR w.next_review_date <= now())
    ORDER BY
      w.next_review_date NULLS FIRST,
      w.easiness_factor ASC,
      w.created_at ASC
    LIMIT p_limit;
  END IF;
END;
$func$;

-- -----------------------------------------------------------------------------
-- 6. Günlük tekrar istatistikleri
-- -----------------------------------------------------------------------------
-- ÖN KOŞUL: word_reviews tablosu mevcut olmalı
CREATE OR REPLACE FUNCTION public.get_daily_review_stats(
  p_user_id uuid,
  p_days integer DEFAULT 30
)
RETURNS TABLE(
  date date,
  total_reviews integer,
  correct_reviews integer,
  accuracy real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $func$
BEGIN
  RETURN QUERY
  SELECT
    wr.reviewed_at::date as date,
    COUNT(*)::integer as total_reviews,
    COUNT(*) FILTER (WHERE wr.result = 'correct')::integer as correct_reviews,
    (COUNT(*) FILTER (WHERE wr.result = 'correct')::real / NULLIF(COUNT(*)::real, 0) * 100) as accuracy
  FROM public.word_reviews wr
  WHERE wr.user_id = p_user_id
    AND wr.reviewed_at >= now() - (p_days || ' days')::interval
  GROUP BY wr.reviewed_at::date
  ORDER BY date DESC;
END;
$func$;
