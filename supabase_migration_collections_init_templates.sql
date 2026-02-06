-- =============================================================================
-- Migration: Şablon koleksiyonları için DB fonksiyonu
-- =============================================================================
-- UYARI: "#" ile başlayan satırlar PostgreSQL'de GEÇERSİZDİR. Sadece "--" kullanın.
-- Eğer bir araç "# Dosya: ..." ekliyorsa, o satırı silin veya "-- Dosya: ..." yapın.
-- =============================================================================
-- ÖN KOŞUL: supabase_migration_collections.sql çalıştırılmış olmalı
-- ÇALIŞTIRMA SIRASI: 1) collections  2) init_templates  3) template_policies
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- SECURITY DEFINER ile RLS bypass - sadece şablon yoksa çalışır.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. initialize_template_collections fonksiyonu
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.initialize_template_collections()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $func$
DECLARE
  system_user_id uuid;
BEGIN
  -- Şablon zaten varsa çık
  IF EXISTS (SELECT 1 FROM public.collections WHERE is_template = true) THEN
    RETURN;
  END IF;

  -- İlk kullanıcıyı al (auth.users - Supabase SQL Editor postgres rolü ile erişilebilir)
  SELECT id INTO system_user_id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;

  -- Hiç kullanıcı yoksa çık (FK constraint nedeniyle insert yapılamaz)
  IF system_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Şablonları ekle
  INSERT INTO public.collections (name, description, icon, color, is_template, is_public, user_id)
  VALUES
    ('Günlük İngilizce', 'Günlük hayatta sık kullanılan temel kelimeler', '🌟', 'blue', true, true, system_user_id),
    ('İş İngilizcesi', 'İş hayatında kullanılan profesyonel kelimeler', '💼', 'indigo', true, true, system_user_id),
    ('Seyahat', 'Seyahat ederken işinize yarayacak kelimeler', '✈️', 'cyan', true, true, system_user_id),
    ('Yemek & Mutfak', 'Yemek ve mutfakla ilgili kelimeler', '🍕', 'orange', true, true, system_user_id),
    ('Teknoloji', 'Teknoloji ve bilgisayar terimleri', '💻', 'purple', true, true, system_user_id),
    ('Sağlık', 'Sağlık ve tıbbi terimler', '🏥', 'red', true, true, system_user_id),
    ('Eğitim', 'Eğitim ve akademik kelimeler', '📚', 'green', true, true, system_user_id),
    ('Spor', 'Spor ve fitness kelimeleri', '⚽', 'yellow', true, true, system_user_id);
END;
$func$;

-- -----------------------------------------------------------------------------
-- 2. İlk çalıştırma (şablon yoksa oluşturur)
-- -----------------------------------------------------------------------------
SELECT public.initialize_template_collections();

-- -----------------------------------------------------------------------------
-- 3. RPC olarak çağrılabilir (isteğe bağlı - client'tan invoke edilebilir)
-- -----------------------------------------------------------------------------
-- GRANT EXECUTE ON FUNCTION public.initialize_template_collections() TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.initialize_template_collections() TO anon;

-- -----------------------------------------------------------------------------
-- 4. İlk kullanıcı kaydında otomatik çalıştırma (isteğe bağlı)
-- -----------------------------------------------------------------------------
-- NOT: Supabase auth.users üzerinde trigger oluşturmak özel izin gerektirebilir.
-- Alternatif: Client tarafında Server Action (initializeTemplateCollections) kullanın.
--
-- CREATE OR REPLACE FUNCTION public.on_first_user_created()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- BEGIN
--   PERFORM public.initialize_template_collections();
--   RETURN NEW;
-- END;
-- $$;
--
-- CREATE TRIGGER first_user_trigger
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.on_first_user_created();
