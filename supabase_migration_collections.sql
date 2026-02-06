-- =============================================================================
-- Migration: collections & collection_words
-- =============================================================================
-- ÖN KOŞUL: vocabulary_words tablosu mevcut olmalı (id, mastery_level sütunları)
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- Kelime koleksiyonları ve kelime-koleksiyon ilişkisi.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. collections tablosu
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT '📚',
  color VARCHAR(20) DEFAULT 'blue',
  is_public BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. collection_words (koleksiyon-kelime ilişki tablosu)
-- vocabulary_words tablosu ve id sütunu gerekli!
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.collection_words CASCADE;

CREATE TABLE public.collection_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES public.vocabulary_words(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, word_id)
);

-- -----------------------------------------------------------------------------
-- 3. İndeksler
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_words_collection_id ON public.collection_words(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_words_word_id ON public.collection_words(word_id);

-- -----------------------------------------------------------------------------
-- 4. RLS - collections
-- -----------------------------------------------------------------------------
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can view public collections" ON public.collections;
DROP POLICY IF EXISTS "Users can insert their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can update their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can delete their own collections" ON public.collections;

CREATE POLICY "Users can view their own collections"
  ON public.collections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections"
  ON public.collections FOR SELECT
  TO authenticated
  USING (is_public = true OR is_template = true);

CREATE POLICY "Users can insert their own collections"
  ON public.collections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON public.collections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON public.collections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 5. RLS - collection_words
-- -----------------------------------------------------------------------------
ALTER TABLE public.collection_words ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view collection words" ON public.collection_words;
DROP POLICY IF EXISTS "Users can insert collection words" ON public.collection_words;
DROP POLICY IF EXISTS "Users can delete collection words" ON public.collection_words;

CREATE POLICY "Users can view collection words"
  ON public.collection_words FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_words.collection_id
      AND (c.user_id = auth.uid() OR c.is_public = true OR c.is_template = true)
    )
  );

CREATE POLICY "Users can insert collection words"
  ON public.collection_words FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_words.collection_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete collection words"
  ON public.collection_words FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_words.collection_id
      AND c.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 6. Şablon koleksiyonlar (ilk kullanıcıya - sadece hiç şablon yoksa)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.collections WHERE is_template = true LIMIT 1) THEN
    SELECT id INTO first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    IF first_user_id IS NOT NULL THEN
      INSERT INTO public.collections (user_id, name, description, icon, color, is_template)
      VALUES
        (first_user_id, 'Business English', 'Professional workplace vocabulary', '💼', 'blue', true),
        (first_user_id, 'Travel & Tourism', 'Essential travel phrases and vocabulary', '✈️', 'green', true),
        (first_user_id, 'IELTS Preparation', 'Common words for IELTS exam', '📝', 'purple', true),
        (first_user_id, 'Academic Writing', 'Formal academic vocabulary', '🎓', 'indigo', true),
        (first_user_id, 'Daily Conversation', 'Everyday spoken English', '💬', 'orange', true),
        (first_user_id, 'Technology & IT', 'Tech industry terminology', '💻', 'cyan', true),
        (first_user_id, 'Medical Terms', 'Healthcare and medical vocabulary', '⚕️', 'red', true),
        (first_user_id, 'Food & Cooking', 'Culinary vocabulary', '🍳', 'yellow', true);
    END IF;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 7. Koleksiyon istatistik fonksiyonu
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_collection_stats(collection_uuid UUID)
RETURNS TABLE (
  total_words BIGINT,
  learned_words BIGINT,
  progress_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_words,
    COUNT(CASE WHEN vw.mastery_level >= 3 THEN 1 END)::BIGINT as learned_words,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(CASE WHEN vw.mastery_level >= 3 THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
      ELSE 0
    END as progress_percentage
  FROM public.collection_words cw
  LEFT JOIN public.vocabulary_words vw ON vw.id = cw.word_id
  WHERE cw.collection_id = collection_uuid;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Kontrol
-- =============================================================================
-- SELECT 'Collections created successfully!' as message;
-- SELECT COUNT(*) as template_count FROM public.collections WHERE is_template = true;
