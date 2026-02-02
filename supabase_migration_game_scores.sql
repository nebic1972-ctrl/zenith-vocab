-- Migration: Oyun skorları tablosu (game_scores)
-- Idempotent: tekrar çalıştırıldığında hata vermez.
-- Supabase SQL Editor'da çalıştırın.

-- =============================================================================
-- 1. Tablo (yoksa oluştur)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.game_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id text NOT NULL,
  difficulty_level int NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  score float NOT NULL,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.game_scores IS 'Neuro Gym oyun skorları: schulte (süre sn), saccade (tamamlanma), memory (doğru sayısı).';
COMMENT ON COLUMN public.game_scores.game_id IS 'Oyun türü: schulte, saccade, memory.';
COMMENT ON COLUMN public.game_scores.difficulty_level IS 'Zorluk seviyesi 1-5.';
COMMENT ON COLUMN public.game_scores.score IS 'Süre (saniye) veya puan (örn. doğru sayısı).';

-- =============================================================================
-- 2. RLS (Row Level Security)
-- =============================================================================
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları kaldır (idempotent)
DROP POLICY IF EXISTS "Kullanıcılar kendi skorlarını görür" ON public.game_scores;
DROP POLICY IF EXISTS "Kullanıcılar skor ekleyebilir" ON public.game_scores;

-- Herkes kendi skorunu görebilir
CREATE POLICY "Kullanıcılar kendi skorlarını görür"
  ON public.game_scores
  FOR SELECT
  USING (auth.uid() = user_id);

-- Herkes kendi skorunu ekleyebilir
CREATE POLICY "Kullanıcılar skor ekleyebilir"
  ON public.game_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- İsteğe bağlı: İleride güncelleme/silme politikaları eklenebilir.
