-- Migration: SECURITY DEFINER fonksiyonlarda search_path sabitleme
-- Hata: function_search_path_mutable (yetki yükseltme riski)
-- Supabase SQL Editor'da çalıştırın. Idempotent: tekrar çalıştırılabilir.
-- Not: Fonksiyon yoksa ilgili satır sessizce atlanır.

DO $$
BEGIN
  ALTER FUNCTION public.handle_new_user() SET search_path = public;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'handle_new_user() bulunamadı, atlanıyor.';
END $$;

DO $$
BEGIN
  ALTER FUNCTION public.readings_audit_trigger() SET search_path = public;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'readings_audit_trigger() bulunamadı, atlanıyor.';
END $$;

DO $$
BEGIN
  ALTER FUNCTION public.compute_quiz_score(uuid) SET search_path = public;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'compute_quiz_score(uuid) bulunamadı, parametre tipini kontrol edin.';
END $$;
