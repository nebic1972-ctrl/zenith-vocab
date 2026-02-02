-- Migration: Tüm public tablolarda RLS aktif et
-- Idempotent: Sadece mevcut tablolar üzerinde çalışır, yoksa atlar.
-- Supabase SQL Editor'da çalıştırın.
-- Sıra: Diğer migration'lar (library, profiles, vocabulary, reading_progress, game_scores vb.) sonrası.

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'library', 'profiles', 'vocabulary', 'reading_progress', 'game_scores',
    'books', 'vocab_words', 'readings_audit', 'user_library', 'exercise_logs',
    'schulte_sessions', 'reading_sessions', 'readings', 'user_settings',
    'user_books', 'stroop_sessions', 'user_profiles'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      RAISE NOTICE 'RLS enabled: %', tbl;
    END IF;
  END LOOP;
END $$;
