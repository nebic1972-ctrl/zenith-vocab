-- =============================================================================
-- Migration: flashcard_sessions - collection_id ve istatistik sütunları
-- =============================================================================
-- ÖN KOŞUL: flashcard_sessions tablosu mevcut olmalı (word_reviews migration)
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- =============================================================================

-- collection_id (koleksiyon modunda hangi koleksiyon)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'flashcard_sessions' AND column_name = 'collection_id') THEN
    ALTER TABLE public.flashcard_sessions 
    ADD COLUMN collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL;
  END IF;
END $$;

-- total_cards, correct_answers, wrong_answers, skipped_cards, duration_seconds
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'flashcard_sessions' AND column_name = 'total_cards') THEN
    ALTER TABLE public.flashcard_sessions ADD COLUMN total_cards integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'flashcard_sessions' AND column_name = 'correct_answers') THEN
    ALTER TABLE public.flashcard_sessions ADD COLUMN correct_answers integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'flashcard_sessions' AND column_name = 'wrong_answers') THEN
    ALTER TABLE public.flashcard_sessions ADD COLUMN wrong_answers integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'flashcard_sessions' AND column_name = 'skipped_cards') THEN
    ALTER TABLE public.flashcard_sessions ADD COLUMN skipped_cards integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'flashcard_sessions' AND column_name = 'duration_seconds') THEN
    ALTER TABLE public.flashcard_sessions ADD COLUMN duration_seconds integer;
  END IF;
END $$;
