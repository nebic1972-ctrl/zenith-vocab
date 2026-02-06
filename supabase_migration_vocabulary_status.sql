-- Migration: vocabulary tablosuna status (seviye) sütunu ekle
-- Yeni, Öğreniliyor, Öğrenildi filtrelemesi için.
-- Supabase SQL Editor'da çalıştırın.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.vocabulary ADD COLUMN status text DEFAULT 'yeni';
    COMMENT ON COLUMN public.vocabulary.status IS 'Kelime seviyesi: yeni, ogreniliyor, ogrenildi';
  END IF;
END $$;
