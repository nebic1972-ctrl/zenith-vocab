-- =============================================================================
-- Migration: vocabulary_words - category, level, pronunciation_us, pronunciation_uk
-- =============================================================================
-- Bu migration'ı çalıştırırsanız AddWordModal tam özellikli çalışır.
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- =============================================================================

-- category sütunu (yoksa ekle)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'vocabulary_words' AND column_name = 'category') THEN
    ALTER TABLE public.vocabulary_words ADD COLUMN category text DEFAULT 'daily';
  END IF;
END $$;

-- level sütunu (yoksa ekle)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'vocabulary_words' AND column_name = 'level') THEN
    ALTER TABLE public.vocabulary_words ADD COLUMN level text DEFAULT 'B1';
  END IF;
END $$;

-- pronunciation_us sütunu (yoksa ekle)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'vocabulary_words' AND column_name = 'pronunciation_us') THEN
    ALTER TABLE public.vocabulary_words ADD COLUMN pronunciation_us text;
  END IF;
END $$;

-- pronunciation_uk sütunu (yoksa ekle)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'vocabulary_words' AND column_name = 'pronunciation_uk') THEN
    ALTER TABLE public.vocabulary_words ADD COLUMN pronunciation_uk text;
  END IF;
END $$;
