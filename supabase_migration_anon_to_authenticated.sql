-- Migration: anon/public rollerini authenticated ile değiştir
-- Misafir özelliği yoksa giriş yapmamış kullanıcıların erişimini kaldırır.
-- Supabase SQL Editor'da çalıştırın. Idempotent: tekrar çalıştırılabilir.
-- Ön koşul: RLS ilgili tablolarda açık olmalı.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I TO authenticated',
        r.policyname,
        r.schemaname,
        r.tablename
      );
      RAISE NOTICE 'Güncellendi: public.%.% → TO authenticated', r.tablename, r.policyname;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Atlandı public.%.%: %', r.tablename, r.policyname, SQLERRM;
    END;
  END LOOP;
END $$;
