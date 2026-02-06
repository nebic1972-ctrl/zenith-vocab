-- Migration: vocabulary tablosuna Spaced Repetition (SM-2) sütunları ekle
-- ease_factor, interval_days, review_count, next_review_date
-- Supabase SQL Editor'da çalıştırın.

-- Yeni sütunlar
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'ease_factor') THEN
    ALTER TABLE public.vocabulary ADD COLUMN ease_factor numeric DEFAULT 2.5;
    COMMENT ON COLUMN public.vocabulary.ease_factor IS 'SM-2 Ease Factor (1.3 - 2.5)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'interval_days') THEN
    ALTER TABLE public.vocabulary ADD COLUMN interval_days integer DEFAULT 0;
    COMMENT ON COLUMN public.vocabulary.interval_days IS 'Sonraki tekrar aralığı (gün)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'review_count') THEN
    ALTER TABLE public.vocabulary ADD COLUMN review_count integer DEFAULT 0;
    COMMENT ON COLUMN public.vocabulary.review_count IS 'Toplam tekrar sayısı';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'next_review_date') THEN
    ALTER TABLE public.vocabulary ADD COLUMN next_review_date date;
    COMMENT ON COLUMN public.vocabulary.next_review_date IS 'Sonraki tekrar tarihi';
  END IF;
END $$;

-- UPDATE policy (kullanıcılar kendi kartlarını güncelleyebilsin)
DROP POLICY IF EXISTS "Kullanıcılar kendi kelimelerini güncelleyebilir" ON public.vocabulary;
CREATE POLICY "Kullanıcılar kendi kelimelerini güncelleyebilir"
  ON public.vocabulary
  FOR UPDATE
  USING (auth.uid() = user_id);
