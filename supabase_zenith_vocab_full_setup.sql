-- =============================================================================
-- ZENITH VOCAB - TAM SUPABASE KURULUM
-- =============================================================================
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştırın.
-- Idempotent: Tekrar çalıştırıldığında hata vermez.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. LIBRARY (Metinlerim - kullanıcı metinleri)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.library (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content_text text,
  file_type text DEFAULT 'txt',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.library IS 'Kullanıcı metinleri (Metinlerim sayfası).';

CREATE INDEX IF NOT EXISTS idx_library_user_id ON public.library(user_id);
CREATE INDEX IF NOT EXISTS idx_library_created_at ON public.library(created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_library_updated_at ON public.library;
CREATE TRIGGER set_library_updated_at
  BEFORE UPDATE ON public.library
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_library_updated_at();

ALTER TABLE public.library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kullanıcılar kendi metinlerini görür" ON public.library;
DROP POLICY IF EXISTS "Kullanıcılar metin ekleyebilir" ON public.library;
DROP POLICY IF EXISTS "Kullanıcılar kendi metinlerini güncelleyebilir" ON public.library;
DROP POLICY IF EXISTS "Kullanıcılar kendi metinlerini silebilir" ON public.library;

CREATE POLICY "Kullanıcılar kendi metinlerini görür"
  ON public.library FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar metin ekleyebilir"
  ON public.library FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi metinlerini güncelleyebilir"
  ON public.library FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi metinlerini silebilir"
  ON public.library FOR DELETE USING (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 2. VOCABULARY (Sözlüğüm - kelime kartları + Spaced Repetition)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vocabulary (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word text NOT NULL,
  definition text NOT NULL,
  example_sentence text,
  book_id uuid REFERENCES public.library(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  -- Spaced Repetition (SM-2)
  ease_factor numeric DEFAULT 2.5,
  interval_days integer DEFAULT 0,
  review_count integer DEFAULT 0,
  next_review_date date,
  -- Seviye filtrelemesi
  status text DEFAULT 'yeni'
);

COMMENT ON TABLE public.vocabulary IS 'Kullanıcı kelime kartları (Sözlüğüm + Flashcards).';
COMMENT ON COLUMN public.vocabulary.status IS 'yeni | ogreniliyor | ogrenildi';
COMMENT ON COLUMN public.vocabulary.ease_factor IS 'SM-2 Ease Factor';
COMMENT ON COLUMN public.vocabulary.next_review_date IS 'Sonraki tekrar tarihi';

CREATE INDEX IF NOT EXISTS idx_vocabulary_user_id ON public.vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_book_id ON public.vocabulary(book_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_next_review ON public.vocabulary(next_review_date) WHERE next_review_date IS NOT NULL;

-- Mevcut vocabulary varsa eksik sütunları ekle
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'ease_factor') THEN
    ALTER TABLE public.vocabulary ADD COLUMN ease_factor numeric DEFAULT 2.5;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'interval_days') THEN
    ALTER TABLE public.vocabulary ADD COLUMN interval_days integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'review_count') THEN
    ALTER TABLE public.vocabulary ADD COLUMN review_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'next_review_date') THEN
    ALTER TABLE public.vocabulary ADD COLUMN next_review_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'status') THEN
    ALTER TABLE public.vocabulary ADD COLUMN status text DEFAULT 'yeni';
  END IF;
END $$;

ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kullanıcılar kendi kelimelerini görür" ON public.vocabulary;
DROP POLICY IF EXISTS "Kullanıcılar kelime ekleyebilir" ON public.vocabulary;
DROP POLICY IF EXISTS "Kullanıcılar kendi kelimelerini güncelleyebilir" ON public.vocabulary;
DROP POLICY IF EXISTS "Kullanıcılar kendi kelimelerini silebilir" ON public.vocabulary;

CREATE POLICY "Kullanıcılar kendi kelimelerini görür"
  ON public.vocabulary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kelime ekleyebilir"
  ON public.vocabulary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi kelimelerini güncelleyebilir"
  ON public.vocabulary FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi kelimelerini silebilir"
  ON public.vocabulary FOR DELETE USING (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 3. FLASHCARDS (Opsiyonel - Ana sayfa sayacı için; vocabulary kullanılıyor)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word text NOT NULL,
  front text NOT NULL,
  back text NOT NULL,
  example text,
  context text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can insert their own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can delete their own flashcards" ON public.flashcards;

CREATE POLICY "Users can view their own flashcards"
  ON public.flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own flashcards"
  ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own flashcards"
  ON public.flashcards FOR DELETE USING (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 4. PROFILES (Kullanıcı profili - xp, level)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- xp ve level sütunları
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'xp') THEN
    ALTER TABLE public.profiles ADD COLUMN xp integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'level') THEN
    ALTER TABLE public.profiles ADD COLUMN level integer NOT NULL DEFAULT 1;
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiller herkese açık okunabilir" ON public.profiles;
DROP POLICY IF EXISTS "Kullanıcı kendi profilini güncelleyebilir" ON public.profiles;

CREATE POLICY "Profiller herkese açık okunabilir"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Kullanıcı kendi profilini güncelleyebilir"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Yeni kullanıcı kaydında profil oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();


-- -----------------------------------------------------------------------------
-- 5. VOCABULARY_COLLECTIONS (Koleksiyonlar - gelecek için)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vocabulary_collections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_collections_user_id ON public.vocabulary_collections(user_id);

ALTER TABLE public.vocabulary_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kullanıcılar kendi koleksiyonlarını yönetir" ON public.vocabulary_collections;

CREATE POLICY "Kullanıcılar kendi koleksiyonlarını yönetir"
  ON public.vocabulary_collections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- TAMAMLANDI
-- -----------------------------------------------------------------------------
-- Tablolar: library, vocabulary, flashcards, profiles, vocabulary_collections
-- RLS tüm tablolarda aktif.
-- =============================================================================
