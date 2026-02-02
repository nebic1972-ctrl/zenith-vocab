-- Migration: Add last_position column to library table
-- This column tracks reading progress (word index) for each book
-- Run this in your Supabase SQL Editor

-- Check if column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'library' 
    AND column_name = 'last_position'
  ) THEN
    ALTER TABLE public.library 
    ADD COLUMN last_position INTEGER DEFAULT 0 NOT NULL;
    
    -- Add comment for documentation
    COMMENT ON COLUMN public.library.last_position IS 'Tracks the last word index (position) where the user left off reading';
  END IF;
END $$;
