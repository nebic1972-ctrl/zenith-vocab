-- =============================================================================
-- LIBRARY TABLOSU (Metinler için)
-- =============================================================================
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- Tablo yoksa oluşturur. Var olan tabloyu değiştirmez.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  content_text TEXT,
  file_type VARCHAR(20) DEFAULT 'txt',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own library" ON public.library;
DROP POLICY IF EXISTS "Kullanıcılar kendi metinlerini görür" ON public.library;
CREATE POLICY "Users can view own library"
  ON public.library FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own library" ON public.library;
DROP POLICY IF EXISTS "Kullanıcılar metin ekleyebilir" ON public.library;
CREATE POLICY "Users can insert own library"
  ON public.library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own library" ON public.library;
DROP POLICY IF EXISTS "Kullanıcılar kendi metinlerini güncelleyebilir" ON public.library;
CREATE POLICY "Users can update own library"
  ON public.library FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own library" ON public.library;
DROP POLICY IF EXISTS "Kullanıcılar kendi metinlerini silebilir" ON public.library;
CREATE POLICY "Users can delete own library"
  ON public.library FOR DELETE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_library_user_id ON public.library(user_id);
