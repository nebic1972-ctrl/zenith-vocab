-- =============================================================================
-- Migration: Toplu işlem kayıt tablosu (bulk_operations)
-- =============================================================================
-- Kelime listesinde yapılan toplu işlemleri (silme, kategori güncelleme,
-- koleksiyona ekleme vb.) takip etmek için kullanılır.
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. bulk_operations tablosu
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bulk_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type varchar(50) NOT NULL,
  affected_word_ids uuid[] NOT NULL,
  changes jsonb,
  status varchar(20) NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- operation_type örnekleri: 'delete', 'update_category', 'add_to_collection', vb.
-- status: 'pending', 'completed', 'failed'

-- -----------------------------------------------------------------------------
-- 2. İndeksler
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bulk_operations_user_id
ON public.bulk_operations(user_id);

CREATE INDEX IF NOT EXISTS idx_bulk_operations_status
ON public.bulk_operations(status);

CREATE INDEX IF NOT EXISTS idx_bulk_operations_created_at
ON public.bulk_operations(created_at DESC);

-- -----------------------------------------------------------------------------
-- 3. RLS (Row Level Security)
-- -----------------------------------------------------------------------------
ALTER TABLE public.bulk_operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bulk operations" ON public.bulk_operations;
CREATE POLICY "Users can view own bulk operations"
ON public.bulk_operations FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bulk operations" ON public.bulk_operations;
CREATE POLICY "Users can insert own bulk operations"
ON public.bulk_operations FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bulk operations" ON public.bulk_operations;
CREATE POLICY "Users can update own bulk operations"
ON public.bulk_operations FOR UPDATE
USING (auth.uid() = user_id);
