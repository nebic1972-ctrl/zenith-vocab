-- Migration: Anonim yazma erişimini kısıtla, sadece authenticated kullanıcılara izin ver
-- Hata: Public/anon kullanıcıların INSERT/UPDATE yapması güvenlik riski
-- Supabase SQL Editor'da çalıştırın. Idempotent: tekrar çalıştırılabilir.
-- Not: Tablo veya politika yoksa ilgili satır atlanır (DO blokları ile).

-- =============================================================================
-- 1. readings: "Herkes yazar" → sadece üyeler yazabilsin
-- =============================================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Herkes yazar" ON public.readings;
  BEGIN
    CREATE POLICY "Sadece üyeler okuma ekleyebilir"
      ON public.readings FOR INSERT TO authenticated WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'readings INSERT policy zaten mevcut.';
  END;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'readings tablosu bulunamadı, atlanıyor.';
END $$;

-- =============================================================================
-- 2. library: Anon INSERT/UPDATE kısıtla (SELECT herkese açık kalabilir)
-- =============================================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Enable insert for anon users" ON public.library;
  DROP POLICY IF EXISTS "Enable insert for public" ON public.library;
  DROP POLICY IF EXISTS "Herkes yazar" ON public.library;
  DROP POLICY IF EXISTS "Public insert" ON public.library;
  -- Sadece giriş yapmış kullanıcılar library'ye kitap ekleyebilir
  BEGIN
    CREATE POLICY "Sadece üyeler kitap ekleyebilir"
      ON public.library FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id::uuid);
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'library INSERT policy zaten mevcut.';
  END;
  BEGIN
    CREATE POLICY "Sadece üyeler kitap güncelleyebilir"
      ON public.library FOR UPDATE TO authenticated
      USING (auth.uid() = user_id::uuid) WITH CHECK (auth.uid() = user_id::uuid);
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'library UPDATE policy zaten mevcut.';
  END;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'library tablosu bulunamadı, atlanıyor.';
END $$;

-- =============================================================================
-- 3. user_settings: Anon INSERT/UPDATE kısıtla
-- =============================================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Enable insert for anon users" ON public.user_settings;
  DROP POLICY IF EXISTS "Enable insert for public" ON public.user_settings;
  DROP POLICY IF EXISTS "Herkes yazar" ON public.user_settings;
  DROP POLICY IF EXISTS "Public insert" ON public.user_settings;
  BEGIN
    CREATE POLICY "Sadece üyeler ayar ekleyebilir"
      ON public.user_settings FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id::uuid);
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'user_settings INSERT policy zaten mevcut.';
  END;
  BEGIN
    CREATE POLICY "Sadece üyeler ayar güncelleyebilir"
      ON public.user_settings FOR UPDATE TO authenticated
      USING (auth.uid() = user_id::uuid) WITH CHECK (auth.uid() = user_id::uuid);
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'user_settings UPDATE policy zaten mevcut.';
  END;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'user_settings tablosu bulunamadı, atlanıyor.';
END $$;
