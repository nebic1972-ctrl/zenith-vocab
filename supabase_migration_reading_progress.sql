-- =============================================================================
-- MIGRATION: reading_progress tablosu
-- =============================================================================
-- Supabase Dashboard > SQL Editor'da bu dosyanın içeriğini yapıştırıp çalıştırın.
--
-- ÖN KOŞUL: public.library tablosu mevcut olmalı.
-- Kodun gönderdiği alanlar: user_id, book_id, current_position, last_read_at, updated_at
-- Upsert conflict: (user_id, book_id)
-- =============================================================================

-- 1. Eski tabloyu kaldır (varsa)
DROP TABLE IF EXISTS public.reading_progress CASCADE;

-- 2. Tablo oluştur
CREATE TABLE public.reading_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.library(id) ON DELETE CASCADE,
  current_position integer NOT NULL DEFAULT 0 CHECK (current_position >= 0),
  progress_percentage numeric(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  wpm integer DEFAULT 200,
  last_read_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT reading_progress_pkey PRIMARY KEY (id),
  CONSTRAINT reading_progress_user_book_unique UNIQUE (user_id, book_id)
);

COMMENT ON TABLE public.reading_progress IS 'Kullanıcı başına kitap okuma ilerlemesi. Reader kaldığı yerden devam eder.';
COMMENT ON COLUMN public.reading_progress.current_position IS 'Son okunan kelime indeksi (0 tabanlı). Kod: saveReadingProgress(bookId, position)';

-- 3. İndeksler
CREATE INDEX reading_progress_user_id_idx ON public.reading_progress(user_id);
CREATE INDEX reading_progress_book_id_idx ON public.reading_progress(book_id);
CREATE INDEX reading_progress_user_book_idx ON public.reading_progress(user_id, book_id);

-- 4. RLS
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own reading progress" ON public.reading_progress;
DROP POLICY IF EXISTS "Users can insert their own reading progress" ON public.reading_progress;
DROP POLICY IF EXISTS "Users can update their own reading progress" ON public.reading_progress;
DROP POLICY IF EXISTS "Kullanıcılar kendi ilerlemesini görür" ON public.reading_progress;
DROP POLICY IF EXISTS "Kullanıcılar kendi ilerlemesini ekler/günceller" ON public.reading_progress;

CREATE POLICY "Users can view their own reading progress"
  ON public.reading_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading progress"
  ON public.reading_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading progress"
  ON public.reading_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
