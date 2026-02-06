-- =============================================================================
-- Migration: Şablon koleksiyonları için RLS politikaları
-- =============================================================================
-- ÖN KOŞUL: supabase_migration_collections.sql çalıştırılmış olmalı
-- ÇALIŞTIRMA SIRASI: 1) collections  2) init_templates  3) template_policies
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Herhangi bir authenticated kullanıcı şablon oluşturabilir (initialization)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow template creation" ON public.collections;
CREATE POLICY "Allow template creation"
  ON public.collections
  FOR INSERT
  TO authenticated
  WITH CHECK (is_template = true);

-- -----------------------------------------------------------------------------
-- 2. Şablonlar herkes tarafından görüntülenebilir
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Templates are viewable by everyone" ON public.collections;
CREATE POLICY "Templates are viewable by everyone"
  ON public.collections
  FOR SELECT
  TO authenticated
  USING (is_template = true);

-- -----------------------------------------------------------------------------
-- 3. Şablonları sadece sahibi güncelleyebilir
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Only system can update templates" ON public.collections;
CREATE POLICY "Only system can update templates"
  ON public.collections
  FOR UPDATE
  TO authenticated
  USING (is_template = true AND user_id = auth.uid())
  WITH CHECK (is_template = true AND user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 4. Şablonları sadece sahibi silebilir
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Only system can delete templates" ON public.collections;
CREATE POLICY "Only system can delete templates"
  ON public.collections
  FOR DELETE
  TO authenticated
  USING (is_template = true AND user_id = auth.uid());
