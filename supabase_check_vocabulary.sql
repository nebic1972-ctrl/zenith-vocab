-- =============================================================================
-- VOCABULARY TABLOSU KONTROL SORGUSU
-- Supabase Dashboard > SQL Editor'da çalıştırın
-- =============================================================================

-- 1. Toplam kelime sayısı
SELECT COUNT(*) AS total_words FROM public.vocabulary;

-- 2. Son 20 kelime (tüm sütunlar)
SELECT id, user_id, word, definition, example_sentence, status, created_at
FROM public.vocabulary
ORDER BY created_at DESC
LIMIT 20;

-- 3. user_id boş mu kontrol
SELECT COUNT(*) AS null_user_count FROM public.vocabulary WHERE user_id IS NULL;

-- 4. definition boş mu kontrol (NOT NULL olmalı)
SELECT COUNT(*) AS null_definition_count FROM public.vocabulary WHERE definition IS NULL OR definition = '';

-- 5. Null/boş definition'ları düzelt (Supabase SQL Editor'da çalıştırın)
UPDATE public.vocabulary 
SET definition = COALESCE(example_sentence, 'Bağlamdan eklenen kelime')
WHERE definition IS NULL OR TRIM(definition) = '';
