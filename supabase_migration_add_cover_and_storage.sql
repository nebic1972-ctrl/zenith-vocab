-- Migration: Add cover_url to library + Storage policies for book-covers bucket
-- Idempotent: tekrar çalıştırıldığında hata vermez.
-- Supabase SQL Editor'da çalıştırın.
-- Ön koşul: Storage'da "book-covers" bucket'ı oluşturulmuş olmalı (Dashboard > Storage > New bucket).

-- =============================================================================
-- 1. library tablosuna cover_url sütunu (yoksa ekle)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'library'
      AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE public.library
    ADD COLUMN cover_url text;

    COMMENT ON COLUMN public.library.cover_url IS 'Kitap kapağı görseli URL (Storage veya harici). Gelişime açık: CDN/placeholder eklenebilir.';
  END IF;
END $$;

-- =============================================================================
-- 2. Storage: book-covers bucket için politikalar (idempotent)
-- Önce varsa kaldır, sonra oluştur. Böylece script tekrar çalıştırılabilir.
-- =============================================================================

-- 2a. Resim yükleme: Giriş yapmış herkes book-covers'a INSERT yapabilir
DROP POLICY IF EXISTS "Resim Yükleme İzni" ON storage.objects;
CREATE POLICY "Resim Yükleme İzni"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'book-covers' );

-- 2b. Resim silme: Giriş yapmış herkes silebilir (ileride admin-only yapılabilir)
DROP POLICY IF EXISTS "Resim Silme İzni" ON storage.objects;
CREATE POLICY "Resim Silme İzni"
ON storage.objects
FOR DELETE
TO authenticated
USING ( bucket_id = 'book-covers' );

-- 2c. Resim okuma: Herkes (anon dahil) kapak görsellerini okuyabilsin (kütüphane listesi için)
DROP POLICY IF EXISTS "Resim Okuma İzni" ON storage.objects;
CREATE POLICY "Resim Okuma İzni"
ON storage.objects
FOR SELECT
TO public
USING ( bucket_id = 'book-covers' );

-- Gelişime açık notlar:
-- - Sadece admin silsin istersen: USING içinde (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' gibi bir kontrol eklenebilir (security definer fonksiyon gerekebilir).
-- - Bucket oluşturmak SQL ile yapılmıyor; Supabase Dashboard > Storage > New bucket > "book-covers" adıyla oluşturun.
