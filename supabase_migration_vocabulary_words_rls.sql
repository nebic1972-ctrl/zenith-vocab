-- =============================================================================
-- Migration: vocabulary_words - RLS (Row Level Security) Policies
-- =============================================================================
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- Idempotent: Tekrar çalıştırıldığında hata vermez.
-- =============================================================================

-- 1. RLS etkinleştir
ALTER TABLE public.vocabulary_words ENABLE ROW LEVEL SECURITY;

-- 2. Mevcut policy'leri kaldır (varsa)
DROP POLICY IF EXISTS "Users can insert their own words" ON public.vocabulary_words;
DROP POLICY IF EXISTS "Users can view their own words" ON public.vocabulary_words;
DROP POLICY IF EXISTS "Users can update their own words" ON public.vocabulary_words;
DROP POLICY IF EXISTS "Users can delete their own words" ON public.vocabulary_words;

-- Eski isimli policy'ler (farklı migration'lardan)
DROP POLICY IF EXISTS "Users can view own words" ON public.vocabulary_words;
DROP POLICY IF EXISTS "Users can create own words" ON public.vocabulary_words;
DROP POLICY IF EXISTS "Users can update own words" ON public.vocabulary_words;
DROP POLICY IF EXISTS "Users can delete own words" ON public.vocabulary_words;

-- 3. Yeni policy'leri oluştur
CREATE POLICY "Users can insert their own words"
  ON public.vocabulary_words
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own words"
  ON public.vocabulary_words
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own words"
  ON public.vocabulary_words
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own words"
  ON public.vocabulary_words
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================================================
-- Kontrol sorguları (isteğe bağlı - çalıştırdıktan sonra kontrol için)
-- =============================================================================
-- RLS durumu:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'vocabulary_words';

-- Policy listesi:
-- SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'vocabulary_words';
