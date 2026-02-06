-- =============================================================================
-- Migration: Şablon koleksiyonlarını tekil yap (duplicate temizleme + unique)
-- =============================================================================
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- 1. Duplicate şablonları siler (en eskisini tutar)
-- 2. Şablon isimleri için partial unique index ekler
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Duplicate şablonları sil (en eskisini tut)
-- -----------------------------------------------------------------------------
DELETE FROM public.collections
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) AS rn
    FROM public.collections
    WHERE is_template = true
  ) t
  WHERE t.rn > 1
);

-- -----------------------------------------------------------------------------
-- 2. Şablon isimleri için partial unique index
-- (PostgreSQL'de ADD CONSTRAINT UNIQUE WHERE desteklenmez, CREATE UNIQUE INDEX kullanılır)
-- -----------------------------------------------------------------------------
DROP INDEX IF EXISTS public.unique_template_name;

CREATE UNIQUE INDEX unique_template_name
  ON public.collections (name)
  WHERE is_template = true;

-- -----------------------------------------------------------------------------
-- 3. Doğrulama (isteğe bağlı - çalıştırıp kontrol edebilirsiniz)
-- -----------------------------------------------------------------------------
-- SELECT name, COUNT(*) AS count
-- FROM public.collections
-- WHERE is_template = true
-- GROUP BY name
-- ORDER BY name;
