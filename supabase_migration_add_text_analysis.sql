-- Migration: Add text complexity analysis columns to library table
-- This adds difficulty_level and estimated_time columns
-- Run this in your Supabase SQL Editor

-- Check if columns exist, if not add them
DO $$ 
BEGIN
  -- Add difficulty_level column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'library' 
    AND column_name = 'difficulty_level'
  ) THEN
    ALTER TABLE public.library 
    ADD COLUMN difficulty_level TEXT;
    
    COMMENT ON COLUMN public.library.difficulty_level IS 'Text complexity level: Çok Kolay, Kolay, Orta, Zor, Akademik';
  END IF;

  -- Add estimated_time column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'library' 
    AND column_name = 'estimated_time'
  ) THEN
    ALTER TABLE public.library 
    ADD COLUMN estimated_time INTEGER;
    
    COMMENT ON COLUMN public.library.estimated_time IS 'Estimated reading time in minutes based on user WPM';
  END IF;
END $$;
