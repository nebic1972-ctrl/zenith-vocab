-- =============================================================================
-- Migration: get_users_for_daily_reminder - full_name ekle
-- =============================================================================
-- auth.admin kullanmadan full_name'i RPC'den döndürmek için
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_users_for_daily_reminder();

CREATE OR REPLACE FUNCTION public.get_users_for_daily_reminder()
RETURNS TABLE(
  user_id uuid,
  email varchar,
  full_name text,
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
      COUNT(*) as due_count
    FROM public.vocabulary_words vw
    WHERE vw.next_review_date IS NULL 
      OR vw.next_review_date <= now()
    GROUP BY vw.user_id
    HAVING COUNT(*) > 0
  )
  SELECT 
    up.user_id,
    au.email::varchar,
    (au.raw_user_meta_data->>'full_name')::text as full_name,
    up.reminder_time,
    udc.due_count
  FROM public.user_preferences up
  INNER JOIN auth.users au ON au.id = up.user_id
  INNER JOIN user_due_counts udc ON udc.user_id = up.user_id
  WHERE up.email_notifications_enabled = true
    AND up.daily_reminder_enabled = true
    AND EXTRACT(HOUR FROM (now() AT TIME ZONE up.reminder_timezone)) = EXTRACT(HOUR FROM up.reminder_time)
    AND au.email IS NOT NULL;
END;
$func$;
