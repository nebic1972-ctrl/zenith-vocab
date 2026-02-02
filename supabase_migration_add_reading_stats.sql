-- Migration: Add reading stats columns to profiles table
-- This adds total_words_read, daily_words, and highest_speed columns
-- Run this in your Supabase SQL Editor

-- Check if columns exist, if not add them
DO $$ 
BEGIN
  -- Add total_words_read column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'total_words_read'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN total_words_read INTEGER DEFAULT 0 NOT NULL;
    
    COMMENT ON COLUMN public.profiles.total_words_read IS 'Total words read across all sessions';
  END IF;

  -- Add daily_words column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'daily_words'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN daily_words INTEGER DEFAULT 0 NOT NULL;
    
    COMMENT ON COLUMN public.profiles.daily_words IS 'Words read today (resets daily via cron or app logic)';
  END IF;

  -- Add highest_speed column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'highest_speed'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN highest_speed INTEGER DEFAULT 0 NOT NULL;
    
    COMMENT ON COLUMN public.profiles.highest_speed IS 'Highest WPM speed achieved in any reading session';
  END IF;

  -- Add streak column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'streak'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN streak INTEGER DEFAULT 0 NOT NULL;
    
    COMMENT ON COLUMN public.profiles.streak IS 'Consecutive days of reading activity';
  END IF;

  -- Add last_active_date column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'last_active_date'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN last_active_date DATE;
    
    COMMENT ON COLUMN public.profiles.last_active_date IS 'Last date user was active (YYYY-MM-DD format)';
  END IF;
END $$;
