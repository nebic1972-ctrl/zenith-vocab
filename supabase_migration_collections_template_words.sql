-- =============================================================================
-- Migration: Şablon koleksiyonlarına örnek kelimeler ekle
-- =============================================================================
-- KULLANIM: Tüm SQL'i kopyalayıp Supabase Dashboard > SQL Editor'a yapıştırın.
-- ÖN KOŞUL: collections, init_templates, template_policies çalıştırılmış olmalı
--
-- ÇALIŞTIRMA SIRASI:
--   1. supabase_migration_collections.sql
--   2. supabase_migration_collections_init_templates.sql
--   3. supabase_migration_collections_template_policies.sql
--   4. supabase_migration_collections_template_words.sql  (bu dosya)
--   5. supabase_migration_word_reviews.sql
--   6. supabase_migration_flashcard_sessions_extended.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION public.initialize_template_words()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $func$
DECLARE
  system_user_id uuid;
  coll_rec RECORD;
  word_id uuid;
  word_data RECORD;
  template_words JSONB;
BEGIN
  -- Şablon koleksiyon yoksa çık
  IF NOT EXISTS (SELECT 1 FROM public.collections WHERE is_template = true) THEN
    RETURN;
  END IF;

  SELECT id INTO system_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF system_user_id IS NULL THEN RETURN; END IF;

  -- Her şablon koleksiyon için kelimeler (name -> kelime listesi)
  FOR coll_rec IN SELECT id, name FROM public.collections WHERE is_template = true
  LOOP
    -- Koleksiyonda zaten kelime varsa atla
    IF EXISTS (SELECT 1 FROM public.collection_words WHERE collection_id = coll_rec.id) THEN
      CONTINUE;
    END IF;

    -- Kategoriye göre örnek kelimeler
    template_words := CASE coll_rec.name
      WHEN 'Günlük İngilizce' THEN '[
        {"word":"hello","translation":"merhaba","definition":"Selamlama"},
        {"word":"thank you","translation":"teşekkür ederim","definition":"Minnet ifadesi"},
        {"word":"please","translation":"lütfen","definition":"Rica ifadesi"},
        {"word":"goodbye","translation":"hoşça kal","definition":"Veda"},
        {"word":"sorry","translation":"özür dilerim","definition":"Özür"},
        {"word":"yes","translation":"evet","definition":"Onay"},
        {"word":"no","translation":"hayır","definition":"Red"},
        {"word":"water","translation":"su","definition":"İçecek"},
        {"word":"food","translation":"yiyecek","definition":"Besin"},
        {"word":"time","translation":"zaman","definition":"Süre"}
      ]'::jsonb
      WHEN 'İş İngilizcesi' THEN '[
        {"word":"meeting","translation":"toplantı","definition":"İş toplantısı"},
        {"word":"deadline","translation":"son teslim tarihi","definition":"Bitiş tarihi"},
        {"word":"budget","translation":"bütçe","definition":"Mali plan"},
        {"word":"report","translation":"rapor","definition":"Yazılı özet"},
        {"word":"agenda","translation":"gündem","definition":"Toplantı konuları"},
        {"word":"negotiate","translation":"müzakere etmek","definition":"Anlaşma aramak"},
        {"word":"contract","translation":"sözleşme","definition":"Yasal anlaşma"},
        {"word":"invoice","translation":"fatura","definition":"Ödeme belgesi"},
        {"word":"colleague","translation":"iş arkadaşı","definition":"Birlikte çalışan"},
        {"word":"promotion","translation":"terfi","definition":"Yükselme"}
      ]'::jsonb
      WHEN 'Seyahat' THEN '[
        {"word":"airport","translation":"havalimanı","definition":"Uçuş terminali"},
        {"word":"passport","translation":"pasaport","definition":"Kimlik belgesi"},
        {"word":"luggage","translation":"bagaj","definition":"Valiz"},
        {"word":"reservation","translation":"rezervasyon","definition":"Önceden ayırtma"},
        {"word":"check-in","translation":"giriş yapmak","definition":"Kayıt olmak"},
        {"word":"boarding","translation":"uçağa binme","definition":"Biniş"},
        {"word":"destination","translation":"varış noktası","definition":"Gidilecek yer"},
        {"word":"hotel","translation":"otel","definition":"Konaklama"},
        {"word":"ticket","translation":"bilet","definition":"Giriş/ulaşım belgesi"},
        {"word":"currency","translation":"para birimi","definition":"Döviz"}
      ]'::jsonb
      WHEN 'Yemek & Mutfak' THEN '[
        {"word":"recipe","translation":"tarif","definition":"Yemek tarifi"},
        {"word":"ingredient","translation":"malzeme","definition":"Tarif öğesi"},
        {"word":"delicious","translation":"lezzetli","definition":"Tatlı"},
        {"word":"breakfast","translation":"kahvaltı","definition":"Sabah yemeği"},
        {"word":"lunch","translation":"öğle yemeği","definition":"Öğlen yemeği"},
        {"word":"dinner","translation":"akşam yemeği","definition":"Akşam yemeği"},
        {"word":"appetizer","translation":"başlangıç","definition":"Ön yemek"},
        {"word":"dessert","translation":"tatlı","definition":"Son yemek"},
        {"word":"beverage","translation":"içecek","definition":"Sıvı tüketim"},
        {"word":"spicy","translation":"acı/baharatlı","definition":"Keskin tat"}
      ]'::jsonb
      WHEN 'Teknoloji' THEN '[
        {"word":"software","translation":"yazılım","definition":"Program"},
        {"word":"hardware","translation":"donanım","definition":"Fiziksel bileşen"},
        {"word":"database","translation":"veritabanı","definition":"Veri deposu"},
        {"word":"password","translation":"şifre","definition":"Gizli anahtar"},
        {"word":"download","translation":"indirmek","definition":"Dosya almak"},
        {"word":"upload","translation":"yüklemek","definition":"Dosya göndermek"},
        {"word":"browser","translation":"tarayıcı","definition":"Web aracı"},
        {"word":"algorithm","translation":"algoritma","definition":"Adım adım çözüm"},
        {"word":"network","translation":"ağ","definition":"Bağlantı sistemi"},
        {"word":"backup","translation":"yedek","definition":"Kopya"}
      ]'::jsonb
      WHEN 'Sağlık' THEN '[
        {"word":"symptom","translation":"belirti","definition":"Hastalık işareti"},
        {"word":"prescription","translation":"reçete","definition":"İlaç yazısı"},
        {"word":"appointment","translation":"randevu","definition":"Görüşme zamanı"},
        {"word":"vaccine","translation":"aşı","definition":"Bağışıklık"},
        {"word":"recovery","translation":"iyileşme","definition":"Sağlığa kavuşma"},
        {"word":"emergency","translation":"acil","definition":"Acil durum"},
        {"word":"medicine","translation":"ilaç","definition":"Tedavi maddesi"},
        {"word":"patient","translation":"hasta","definition":"Tedavi edilen"},
        {"word":"diagnosis","translation":"teşhis","definition":"Hastalık tespiti"},
        {"word":"treatment","translation":"tedavi","definition":"İyileştirme"}
      ]'::jsonb
      WHEN 'Eğitim' THEN '[
        {"word":"assignment","translation":"ödev","definition":"Verilen görev"},
        {"word":"graduation","translation":"mezuniyet","definition":"Bitirme"},
        {"word":"scholarship","translation":"burs","definition":"Mali destek"},
        {"word":"semester","translation":"dönem","definition":"Öğretim periyodu"},
        {"word":"lecture","translation":"ders","definition":"Anlatım"},
        {"word":"research","translation":"araştırma","definition":"İnceleme"},
        {"word":"thesis","translation":"tez","definition":"Bitirme çalışması"},
        {"word":"curriculum","translation":"müfredat","definition":"Ders programı"},
        {"word":"enrollment","translation":"kayıt","definition":"Kayıt olma"},
        {"word":"academic","translation":"akademik","definition":"Eğitimle ilgili"}
      ]'::jsonb
      WHEN 'Spor' THEN '[
        {"word":"championship","translation":"şampiyona","definition":"Yarışma"},
        {"word":"training","translation":"antrenman","definition":"Çalışma"},
        {"word":"score","translation":"skor","definition":"Puan"},
        {"word":"referee","translation":"hakem","definition":"Oyun yöneticisi"},
        {"word":"stadium","translation":"stadyum","definition":"Oyun alanı"},
        {"word":"tournament","translation":"turnuva","definition":"Yarışma"},
        {"word":"fitness","translation":"fitness","definition":"Formda olma"},
        {"word":"workout","translation":"idman","definition":"Egzersiz"},
        {"word":"medal","translation":"madalya","definition":"Ödül"},
        {"word":"record","translation":"rekor","definition":"En iyi sonuç"}
      ]'::jsonb
      ELSE '[]'::jsonb
    END;

    -- Her kelimeyi ekle
    FOR word_data IN SELECT * FROM jsonb_to_recordset(template_words) AS x(word text, translation text, definition text)
    LOOP
      INSERT INTO public.vocabulary_words (user_id, word, translation, definition, level, category, mastery_level)
      VALUES (system_user_id, word_data.word, word_data.translation, word_data.definition, 'B1', 'daily', 0)
      RETURNING id INTO word_id;

      INSERT INTO public.collection_words (collection_id, word_id)
      VALUES (coll_rec.id, word_id)
      ON CONFLICT (collection_id, word_id) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$func$;

-- Çalıştır
SELECT public.initialize_template_words();
