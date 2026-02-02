-- Migration: Kelime / flashcard tablosu (vocabulary)
-- Idempotent: tekrar çalıştırıldığında hata vermez.
-- Supabase SQL Editor'da çalıştırın.

-- =============================================================================
-- 1. Tablo (yoksa oluştur)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.vocabulary (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word text NOT NULL,
  definition text NOT NULL,
  example_sentence text,
  book_id uuid REFERENCES public.library(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.vocabulary IS 'Kullanıcı kelime kartları (AI flashcard). Reader seçiminden veya metinden üretilir.';
COMMENT ON COLUMN public.vocabulary.word IS 'Kelime veya kavram (kart ön yüzü).';
COMMENT ON COLUMN public.vocabulary.definition IS 'Türkçe açıklama (kart arka yüzü).';
COMMENT ON COLUMN public.vocabulary.example_sentence IS 'Örnek cümle.';
COMMENT ON COLUMN public.vocabulary.book_id IS 'İlişkili kitap (library.id); null olabilir.';

CREATE INDEX IF NOT EXISTS vocabulary_user_id_idx ON public.vocabulary(user_id);
CREATE INDEX IF NOT EXISTS vocabulary_book_id_idx ON public.vocabulary(book_id);

-- =============================================================================
-- 2. RLS (Row Level Security)
-- =============================================================================
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kullanıcılar kendi kelimelerini görür" ON public.vocabulary;
DROP POLICY IF EXISTS "Kullanıcılar kelime ekleyebilir" ON public.vocabulary;
DROP POLICY IF EXISTS "Kullanıcılar kendi kelimelerini silebilir" ON public.vocabulary;

CREATE POLICY "Kullanıcılar kendi kelimelerini görür"
  ON public.vocabulary
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kelime ekleyebilir"
  ON public.vocabulary
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi kelimelerini silebilir"
  ON public.vocabulary
  FOR DELETE
  USING (auth.uid() = user_id);
