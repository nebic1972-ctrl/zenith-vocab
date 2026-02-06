-- =============================================================================
-- Migration: vocabulary_words - set_id opsiyonel (nullable)
-- =============================================================================
-- vocabulary_sets kullanmayan projeler için. set_id NULL kabul edilir.
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- =============================================================================

-- set_id sütunu varsa ve NOT NULL ise nullable yap
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'vocabulary_words' AND column_name = 'set_id'
  ) THEN
    ALTER TABLE public.vocabulary_words ALTER COLUMN set_id DROP NOT NULL;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'set_id zaten nullable veya sütun yok: %', SQLERRM;
END $$;
