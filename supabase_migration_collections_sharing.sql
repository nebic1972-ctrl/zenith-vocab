-- =============================================================================
-- Migration: Koleksiyon paylaşım sistemi
-- =============================================================================
-- ÖN KOŞUL: supabase_migration_collections.sql çalıştırılmış olmalı
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Paylaşım sütunları (is_public zaten mevcut)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'share_token') THEN
    ALTER TABLE public.collections ADD COLUMN share_token varchar(32) UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'share_enabled') THEN
    ALTER TABLE public.collections ADD COLUMN share_enabled boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'view_count') THEN
    ALTER TABLE public.collections ADD COLUMN view_count integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'clone_count') THEN
    ALTER TABLE public.collections ADD COLUMN clone_count integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'last_viewed_at') THEN
    ALTER TABLE public.collections ADD COLUMN last_viewed_at timestamptz;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. İndeksler
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_collections_share_token 
ON public.collections(share_token) 
WHERE share_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_collections_public 
ON public.collections(is_public, created_at DESC) 
WHERE is_public = true;

-- -----------------------------------------------------------------------------
-- 3. Benzersiz paylaşım token'ı üret
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS varchar(32)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $func$
DECLARE
  token varchar(32);
  token_exists boolean;
BEGIN
  LOOP
    token := encode(gen_random_bytes(24), 'base64');
    token := replace(token, '/', '_');
    token := replace(token, '+', '-');
    token := substring(token, 1, 32);
    
    SELECT EXISTS(
      SELECT 1 FROM public.collections WHERE share_token = token
    ) INTO token_exists;
    
    EXIT WHEN NOT token_exists;
  END LOOP;
  
  RETURN token;
END;
$func$;

-- -----------------------------------------------------------------------------
-- 4. Paylaşımı etkinleştir
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enable_collection_sharing(
  p_collection_id uuid,
  p_user_id uuid
)
RETURNS varchar(32)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $func$
DECLARE
  v_token varchar(32);
  v_owner_id uuid;
BEGIN
  SELECT user_id INTO v_owner_id
  FROM public.collections
  WHERE id = p_collection_id;
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Collection not found';
  END IF;
  
  IF v_owner_id != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  SELECT share_token INTO v_token
  FROM public.collections
  WHERE id = p_collection_id;
  
  IF v_token IS NULL THEN
    v_token := public.generate_share_token();
  END IF;
  
  UPDATE public.collections
  SET 
    share_enabled = true,
    share_token = v_token,
    is_public = true
  WHERE id = p_collection_id;
  
  RETURN v_token;
END;
$func$;

-- -----------------------------------------------------------------------------
-- 5. Paylaşımı kapat
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.disable_collection_sharing(
  p_collection_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $func$
DECLARE
  v_owner_id uuid;
BEGIN
  SELECT user_id INTO v_owner_id
  FROM public.collections
  WHERE id = p_collection_id;
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Collection not found';
  END IF;
  
  IF v_owner_id != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  UPDATE public.collections
  SET 
    share_enabled = false,
    is_public = false
  WHERE id = p_collection_id;
END;
$func$;

-- -----------------------------------------------------------------------------
-- 6. Görüntülenme sayacı
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_collection_view(
  p_share_token varchar(32)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $func$
BEGIN
  UPDATE public.collections
  SET 
    view_count = view_count + 1,
    last_viewed_at = now()
  WHERE share_token = p_share_token
    AND share_enabled = true;
END;
$func$;

-- -----------------------------------------------------------------------------
-- 7. Kopyalama sayacı
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_collection_clone(
  p_share_token varchar(32)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $func$
BEGIN
  UPDATE public.collections
  SET clone_count = clone_count + 1
  WHERE share_token = p_share_token
    AND share_enabled = true;
END;
$func$;

-- -----------------------------------------------------------------------------
-- 8. RLS: Paylaşılan koleksiyonlar herkes tarafından görülebilir (anon dahil)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view shared collections" ON public.collections;
CREATE POLICY "Anyone can view shared collections"
ON public.collections
FOR SELECT
TO authenticated, anon
USING (
  is_public = true 
  AND share_enabled = true
);

-- -----------------------------------------------------------------------------
-- 9. RLS: Paylaşılan koleksiyon kelimeleri herkes tarafından görülebilir
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view words in shared collections" ON public.collection_words;
CREATE POLICY "Anyone can view words in shared collections"
ON public.collection_words
FOR SELECT
TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = collection_words.collection_id
      AND c.is_public = true
      AND c.share_enabled = true
  )
);

-- -----------------------------------------------------------------------------
-- 10. Açıklamalar
-- -----------------------------------------------------------------------------
COMMENT ON COLUMN public.collections.share_token IS 'Benzersiz paylaşım token''ı';
COMMENT ON COLUMN public.collections.share_enabled IS 'Paylaşım şu an etkin mi';
COMMENT ON COLUMN public.collections.view_count IS 'Paylaşım linki ile görüntülenme sayısı';
COMMENT ON COLUMN public.collections.clone_count IS 'Kopyalanma sayısı';
COMMENT ON COLUMN public.collections.last_viewed_at IS 'Son paylaşım linki görüntülenme zamanı';

COMMENT ON FUNCTION public.generate_share_token IS 'Benzersiz 32 karakterlik paylaşım token''ı üretir';
COMMENT ON FUNCTION public.enable_collection_sharing IS 'Koleksiyon paylaşımını etkinleştirir, token döner';
COMMENT ON FUNCTION public.disable_collection_sharing IS 'Koleksiyon paylaşımını kapatır';
COMMENT ON FUNCTION public.increment_collection_view IS 'Paylaşılan koleksiyon görüntülenme sayacını artırır';
COMMENT ON FUNCTION public.increment_collection_clone IS 'Paylaşılan koleksiyon kopyalama sayacını artırır';
