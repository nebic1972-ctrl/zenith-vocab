/* Migration: Flashcards tablosu
   Idempotent: tekrar çalıştırıldığında hata vermez.
   Supabase SQL Editor'da çalıştırın.
   =============================================================================
   1. Tablo (yoksa oluştur)
   ============================================================================= */

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

COMMENT ON TABLE public.flashcards IS 'Kullanıcı flashcard kartları (kelime + AI üretim).';
COMMENT ON COLUMN public.flashcards.word IS 'Seçilen kelime veya kavram.';
COMMENT ON COLUMN public.flashcards.front IS 'Kart ön yüzü (Türkçe anlam).';
COMMENT ON COLUMN public.flashcards.back IS 'Kart arka yüzü (İngilizce karşılık).';
COMMENT ON COLUMN public.flashcards.example IS 'Örnek cümle.';
COMMENT ON COLUMN public.flashcards.context IS 'Metinden alınan bağlam.';

/* Index'ler */
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_word ON public.flashcards(word);
CREATE INDEX IF NOT EXISTS idx_flashcards_created_at ON public.flashcards(created_at DESC);

/* updated_at trigger */
CREATE OR REPLACE FUNCTION public.update_flashcards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_flashcards_updated_at ON public.flashcards;
CREATE TRIGGER set_flashcards_updated_at
  BEFORE UPDATE ON public.flashcards
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_flashcards_updated_at();

/* 2. RLS (Row Level Security) */
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can insert their own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can update their own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can delete their own flashcards" ON public.flashcards;

CREATE POLICY "Users can view their own flashcards"
  ON public.flashcards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcards"
  ON public.flashcards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards"
  ON public.flashcards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards"
  ON public.flashcards FOR DELETE
  USING (auth.uid() = user_id);
