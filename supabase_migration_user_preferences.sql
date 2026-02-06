-- =============================================================================
-- Migration: Kullanıcı bildirim tercihleri (user_preferences)
-- =============================================================================
-- ÖN KOŞUL: auth.users tablosu mevcut olmalı
-- vocabulary_words tablosu (next_review_date) - spaced repetition migration
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Generic updated_at trigger fonksiyonu (yoksa oluştur)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. user_preferences tablosu
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  email_notifications_enabled boolean DEFAULT true,
  daily_reminder_enabled boolean DEFAULT true,
  reminder_time time DEFAULT '09:00:00',
  reminder_timezone varchar(50) DEFAULT 'Europe/Istanbul',

  push_notifications_enabled boolean DEFAULT false,
  push_subscription jsonb,

  weekly_report_enabled boolean DEFAULT true,
  achievement_notifications boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(user_id)
);

-- -----------------------------------------------------------------------------
-- 3. RLS Policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. updated_at trigger
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 5. get_user_preferences fonksiyonu
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
-- 6. get_users_for_daily_reminder fonksiyonu
-- -----------------------------------------------------------------------------
-- ÖN KOŞUL: vocabulary_words.next_review_date sütunu (spaced repetition migration)
-- Kullanıcının saat diliminde şu anki saat = reminder_time saati ise döner.
-- Cron her saat başı çalışmalı (örn. :00'da).
CREATE OR REPLACE FUNCTION public.get_users_for_daily_reminder()
RETURNS TABLE(
  user_id uuid,
  email varchar,
  reminder_time time,
  due_words_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $func$
BEGIN
  RETURN QUERY
  WITH user_due_counts AS (
    SELECT
      vw.user_id,
      COUNT(*)::bigint as due_count
    FROM public.vocabulary_words vw
    WHERE (vw.next_review_date IS NULL OR vw.next_review_date <= now())
    GROUP BY vw.user_id
    HAVING COUNT(*) > 0
  )
  SELECT
    up.user_id,
    au.email::varchar,
    up.reminder_time,
    udc.due_count
  FROM public.user_preferences up
  INNER JOIN auth.users au ON au.id = up.user_id
  INNER JOIN user_due_counts udc ON udc.user_id = up.user_id
  WHERE up.email_notifications_enabled = true
    AND up.daily_reminder_enabled = true
    AND au.email IS NOT NULL
    AND EXTRACT(HOUR FROM (now() AT TIME ZONE COALESCE(up.reminder_timezone, 'UTC'))) = EXTRACT(HOUR FROM up.reminder_time);
END;
$func$;

-- -----------------------------------------------------------------------------
-- 7. ON CONFLICT için unique constraint
-- -----------------------------------------------------------------------------
-- user_id zaten UNIQUE, ON CONFLICT (user_id) için gerekli

-- -----------------------------------------------------------------------------
-- 8. Açıklamalar
-- -----------------------------------------------------------------------------
COMMENT ON TABLE public.user_preferences IS 'User notification and preference settings';
COMMENT ON FUNCTION public.get_user_preferences IS 'Get or create user preferences';
COMMENT ON FUNCTION public.get_users_for_daily_reminder IS 'Get users who need daily reminder at specific hour';
