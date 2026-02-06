-- =============================================================================
-- Migration: Explore sayfası - Arama ve filtreleme
-- =============================================================================
-- ÖN KOŞUL: collections, collection_words, vocabulary_words tabloları mevcut olmalı
-- collections_sharing migration çalıştırılmış olmalı (share_enabled, share_token)
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Public koleksiyonlarda arama ve filtreleme
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_public_collections(
  p_query text DEFAULT NULL,
  p_category varchar DEFAULT NULL,
  p_sort_by varchar DEFAULT 'popular',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  name varchar,
  description text,
  icon varchar,
  color varchar,
  word_count bigint,
  view_count integer,
  clone_count integer,
  created_at timestamptz,
  share_token varchar
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $func$
BEGIN
  RETURN QUERY
  WITH collection_word_counts AS (
    SELECT
      cw.collection_id,
      COUNT(*) as word_count
    FROM public.collection_words cw
    GROUP BY cw.collection_id
  ),
  collection_categories AS (
    SELECT DISTINCT
      cw.collection_id,
      vw.category
    FROM public.collection_words cw
    INNER JOIN public.vocabulary_words vw ON vw.id = cw.word_id
  )
  SELECT
    c.id,
    c.name,
    c.description,
    c.icon,
    c.color,
    COALESCE(cwc.word_count, 0)::bigint as word_count,
    c.view_count,
    c.clone_count,
    c.created_at,
    c.share_token
  FROM public.collections c
  LEFT JOIN collection_word_counts cwc ON cwc.collection_id = c.id
  LEFT JOIN collection_categories cc ON cc.collection_id = c.id
  WHERE c.is_public = true
    AND c.share_enabled = true
    AND (p_query IS NULL OR c.name ILIKE '%' || p_query || '%' OR c.description ILIKE '%' || p_query || '%')
    AND (p_category IS NULL OR cc.category = p_category)
  ORDER BY
    CASE
      WHEN p_sort_by = 'popular' THEN c.view_count
      WHEN p_sort_by = 'most_cloned' THEN c.clone_count
      ELSE 0
    END DESC,
    CASE
      WHEN p_sort_by = 'recent' THEN c.created_at
      ELSE NULL
    END DESC NULLS LAST,
    c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$func$;

-- -----------------------------------------------------------------------------
-- 2. Kategori listesi (filtre için)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_collection_categories()
RETURNS TABLE(
  category varchar,
  collection_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $func$
BEGIN
  RETURN QUERY
  SELECT
    vw.category,
    COUNT(DISTINCT cw.collection_id)::bigint as collection_count
  FROM public.vocabulary_words vw
  INNER JOIN public.collection_words cw ON cw.word_id = vw.id
  INNER JOIN public.collections c ON c.id = cw.collection_id
  WHERE c.is_public = true
    AND c.share_enabled = true
  GROUP BY vw.category
  ORDER BY collection_count DESC;
END;
$func$;

-- -----------------------------------------------------------------------------
-- 3. Açıklamalar
-- -----------------------------------------------------------------------------
COMMENT ON FUNCTION public.search_public_collections IS 'Search and filter public collections with sorting';
COMMENT ON FUNCTION public.get_collection_categories IS 'Get categories with collection counts for filtering';
