-- Sadece full_name sütununu ekle (mevcut profiles tablosu için)
-- Bu dosyayı ÖNCE çalıştırın, sonra supabase_migration_profiles.sql

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name text;

COMMENT ON COLUMN public.profiles.full_name IS 'Ad Soyad (auth signUp metadata)';
