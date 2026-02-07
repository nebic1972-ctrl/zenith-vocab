-- =============================================================================
-- ZENITH VOCAB - OPTİMAL GÜVENLİK HARDENİNG
-- =============================================================================
-- Bu migration en iyi güvenlik uygulamalarını uygular.
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- Idempotent: Tekrar çalıştırıldığında hata vermez.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. get_user_preferences: Sadece kendi tercihlerini okuyabilsin
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_preferences(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  email_notifications_enabled boolean,
  daily_reminder_enabled boolean,
  reminder_time time,
  reminder_timezone varchar,
  push_notifications_enabled boolean,
  weekly_report_enabled boolean,
  achievement_notifications boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $func$
BEGIN
  -- Sadece kendi tercihlerini okuyabilir (veya service_role)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Oturum açmanız gerekiyor';
  END IF;
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Yetkisiz erişim';
  END IF;

  INSERT INTO public.user_preferences (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN QUERY
  SELECT
    up.id,
    up.user_id,
    up.email_notifications_enabled,
    up.daily_reminder_enabled,
    up.reminder_time,
    up.reminder_timezone,
    up.push_notifications_enabled,
    up.weekly_report_enabled,
    up.achievement_notifications
  FROM public.user_preferences up
  WHERE up.user_id = p_user_id;
END;
$func$;

-- -----------------------------------------------------------------------------
-- 2. bulk_operations: Açıkça TO authenticated
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own bulk operations" ON public.bulk_operations;
CREATE POLICY "Users can view own bulk operations"
ON public.bulk_operations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bulk operations" ON public.bulk_operations;
CREATE POLICY "Users can insert own bulk operations"
ON public.bulk_operations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bulk operations" ON public.bulk_operations;
CREATE POLICY "Users can update own bulk operations"
ON public.bulk_operations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. vocabulary_sets: TO authenticated
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own sets" ON public.vocabulary_sets;
CREATE POLICY "Users can view own sets"
  ON public.vocabulary_sets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own sets" ON public.vocabulary_sets;
CREATE POLICY "Users can create own sets"
  ON public.vocabulary_sets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sets" ON public.vocabulary_sets;
CREATE POLICY "Users can update own sets"
  ON public.vocabulary_sets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sets" ON public.vocabulary_sets;
CREATE POLICY "Users can delete own sets"
  ON public.vocabulary_sets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. word_reviews: Kelime kullanıcıya ait olmalı (INSERT)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.word_reviews;
CREATE POLICY "Users can insert own reviews"
ON public.word_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.vocabulary_words vw
    WHERE vw.id = word_id AND vw.user_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- 5. profiles: Sadece kendi profili görülebilir (gizlilik)
-- -----------------------------------------------------------------------------
-- Çakışan policy'leri kaldır
DROP POLICY IF EXISTS "Profiller herkese açık okunabilir" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Kullanıcı kendi profilini güncelleyebilir" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin: role sütunu ve get_user_role() (library yönetimi için)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
    COMMENT ON COLUMN public.profiles.role IS 'user | admin - Kütüphane yönetimi için';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
  RETURN COALESCE(v_role, 'user');
END;
$$;

DROP POLICY IF EXISTS "Admins can view profiles for management" ON public.profiles;
CREATE POLICY "Admins can view profiles for management"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- -----------------------------------------------------------------------------
-- 6. Storage: Sadece kendi yüklediği dosyayı silebilsin
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Resim Silme İzni" ON storage.objects;
CREATE POLICY "Resim Silme İzni"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'book-covers'
  AND owner_id = auth.uid()::text
);

-- -----------------------------------------------------------------------------
-- 7. SECURITY DEFINER fonksiyonları: search_path sabitle
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  funcs text[] := ARRAY[
    'get_user_preferences(uuid)',
    'get_user_role(uuid)',
    'get_users_for_daily_reminder()',
    'enable_collection_sharing(uuid,uuid)',
    'disable_collection_sharing(uuid,uuid)',
    'increment_collection_view(varchar)',
    'increment_collection_clone(varchar)',
    'generate_share_token()',
    'handle_new_user()'
  ];
  f text;
BEGIN
  FOREACH f IN ARRAY funcs
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%s SET search_path = public', f);
      RAISE NOTICE 'search_path set: %', f;
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'Fonksiyon bulunamadı: %', f;
    END;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 8. Anon erişim: Sadece paylaşılan koleksiyonlar için
-- -----------------------------------------------------------------------------
-- collections_sharing zaten anon için share_enabled=true ile SELECT izni veriyor.
-- Başka hiçbir tabloda anon yazma olmamalı.
-- Mevcut policy'ler kontrol edildi - OK.

-- =============================================================================
-- TAMAMLANDI
-- =============================================================================
-- Özet:
-- - get_user_preferences: auth.uid() doğrulaması
-- - bulk_operations, vocabulary_sets: TO authenticated
-- - word_reviews: word_id user'a ait olmalı
-- - profiles: sadece kendi profil, admin istisnası
-- - storage: sadece kendi dosyayı sil
-- - SECURITY DEFINER: search_path sabitlendi
-- =============================================================================
