-- =============================================================================
-- Migration: User Profiles Tablosu
-- =============================================================================
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- Idempotent: Tekrar çalıştırıldığında hata vermez.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tablo (yoksa oluştur)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- full_name sütunu yoksa ekle (mevcut tabloda username vb. varsa uyumluluk için)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

COMMENT ON TABLE public.profiles IS 'Kullanıcı profilleri (Ad, avatar vb.)';

-- -----------------------------------------------------------------------------
-- 2. RLS (Row Level Security)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Eski policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiller herkese açık okunabilir" ON public.profiles;
DROP POLICY IF EXISTS "Kullanıcı kendi profilini güncelleyebilir" ON public.profiles;

-- Yeni policy'ler
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 3. Trigger: Yeni user oluşunca otomatik profile oluştur
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger'ı oluştur (önce varsa sil)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
