-- Migration: Add xp and level columns to profiles table (gamification)
-- UseNeuroStore reads/writes these; syncProfile on load, addXP on read.
-- Run in Supabase SQL Editor. Idempotent: safe to run multiple times.

DO $$
BEGIN
  -- Add xp column (INTEGER: JS gets number; matches store type)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'xp'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN xp INTEGER NOT NULL DEFAULT 0;
    COMMENT ON COLUMN public.profiles.xp IS 'Experience points; level = floor(xp/1000)+1';
  END IF;

  -- Add level column
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'level'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN level INTEGER NOT NULL DEFAULT 1;
    COMMENT ON COLUMN public.profiles.level IS 'Derived from xp: floor(xp/1000)+1';
  END IF;
END $$;

-- Optional: copy from legacy xp_points if you had that column and xp is still 0
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'xp_points') THEN
        UPDATE public.profiles SET xp = xp_points WHERE xp = 0 AND xp_points > 0;
    END IF;
END $$;
