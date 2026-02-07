# 🛠️ Hata Mesajına Göre Hızlı Reçete

Sistem ayağa kalkmazsa aşağıdaki adımları **hatanıza göre** uygulayın.

---

## 1. `relation "public.profiles" does not exist` veya column hatası

**Çözüm:** Supabase SQL Editor'da migration'ları sırayla çalıştırın:

- `supabase_migration_add_xp_level.sql` → `profiles` tablosuna `xp`, `level` ekler.
- `supabase_migration_add_cover_and_storage.sql` → Kapak ve storage (gerekirse).

Supabase Dashboard → SQL Editor → dosya içeriğini yapıştırıp **Run**.

---

## 2. `NEXT_PUBLIC_SUPABASE_URL is missing`

**Çözüm:** Proje kökünde `.env.local` dosyası olsun ve şunlar tanımlı olsun:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Değişiklikten sonra dev server'ı yeniden başlatın (`npm run dev`).

---

## 3. Beyaz ekran / sayfa yüklenmiyor

**Çözüm:**

1. Tarayıcıda **F12** → Console. "Hydration failed" veya benzeri hata var mı bakın.
2. Varsa **Nükleer temizlik** yapın:
   - Dev server'ı durdurun (Ctrl+C), Cursor/VS Code'u kapatın.
   - Yeni terminal (mümkünse yönetici olarak) açın.
   - Proje klasöründe:
     ```bat
     rmdir /s /q .next
     rmdir /s /q node_modules
     npm install
     npm run dev
     ```
3. Hâlâ beyaz ekran varsa konsoldaki tam hata mesajını not alıp buna göre ilerleyin.

---

## 4. NeuroRead 2.0 – Vision, Gemini, PWA, Kelimelerim

**Gerekli .env.local** (esas alınacak dosya; kodda kullanılan değişken isimleri bu dosyayla aynı olmalı. `.env.example` şablon olarak kullanılabilir):

| Değişken | Açıklama |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL (zorunlu) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (zorunlu) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini AI (kelime kartı, flashcard) – zorunlu |
| `GOOGLE_CLOUD_VISION_API_KEY` | Vision OCR (Belge Tara) – en az biri gerekli |
| `GOOGLE_CLOUD_API_KEY` | Vision OCR fallback – en az biri gerekli |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Client-side quiz (opsiyonel; yoksa simülasyon) |
| `RATE_LIMIT_MAX_REQUESTS` | Opsiyonel (varsayılan: 10) |
| `RATE_LIMIT_WINDOW_MS` | Opsiyonel (varsayılan: 60000) |

**Vercel deploy:** Dashboard → Settings → Environment Variables → yukarıdaki tüm değerleri ekleyin.

**API:** Google model `gemini-2.5-flash`; Vision endpoint `vision.googleapis.com/v1/images:annotate`. Değişken isimleri `.env.local` ile aynı olmalı.

**API key değişikliği sonrası:** `.env.local` güncellediyseniz, Vercel'de de aynı değişkenleri güncelleyin. Settings → Environment Variables → **Save** → **Redeploy**.

**Supabase migration sırası (SQL Editor'da sırayla):**

1. `supabase_migration_add_xp_level.sql` (profiles: xp, level)
2. `supabase_migration_add_cover_and_storage.sql` (gerekirse)
3. `supabase_migration_vocabulary.sql` (Kelimelerim – AI flashcard)
4. `supabase_migration_game_scores.sql` (Neuro Gym skorları)
5. `supabase_migration_reading_progress.sql` (okuma ilerlemesi – kaldığı yerden devam)

**Yapılan fazlar (özet):**

| Faz | İçerik |
|-----|--------|
| 1 | Paketler, .cursorrules, .env.local |
| 2 | Google Vision + Gemini (core/google), middleware rate limit |
| 3 | Capture sayfası, kamera → library, /reader?bookId= |
| 4 | PWA (manifest, next-pwa, PWAInstallPrompt) |
| 5 | createFlashcardFromSelection, vocabulary tablosu |
| 6 | Kelimelerim sayfası (/vocabulary), silme, Sidebar link |
| 7 | Kelimelerim'de "Yeni kart oluştur" (AI form) |
| 8 | SelectionFlashcardButton, /offline sayfası |
| 9 | Reader'da "Kart oluştur" butonu |
| 10 | Dokümantasyon (bu reçete) |
| 11 | /api/health, README NeuroRead 2.0 |
| 12 | .cursorrules durum özeti |
| 13 | Kelimelerim CSV dışa aktarma |
| 14 | 404 sayfasına Dashboard linki, dokümantasyon güncellemesi |
| 15 | Kelimelerim arama (kelime / açıklama filtre) |
| 16 | Reader Space = play/pause, error sayfasına Dashboard linki |
| 17 | Kelimelerim sıralama (En yeni / En eski / Kelime A-Z) |
| 18 | Reader Escape = zen mode toggle |
| 19 | Reader okuma ilerleme göstergesi (X / Y kelime + progress bar) |
| 20 | Okuma ilerlemesi: reading_progress, kaldığı yerden devam, debounced kayıt |
| 21 | Kütüphane: kitap kartında ilerleme çubuğu, "Kaldığı yerden devam" butonu |
| 22 | Reader "Baştan oku" butonu: ilerlemeyi sıfırlayıp veritabanına kaydeder |
| 23 | Dashboard "Kaldığı yerden devam": son okunan kitaba tek tıkla reader linki |
| 24 | Kelimelerim kitaba göre filtre (Tüm kitaplar / Kitapsız / kitap adı) |
| 25 | Kütüphane sıralama: En yeni / En son okunan / İlerleme yüksek |
| 26 | Profile okuma istatistikleri |
| 27 | Dashboard Kelimelerim / Neuro Gym kısayolları |
| 28 | Reader klavye kısayolları yardımı (HelpCircle Popover) |
| 29 | Kelimelerim kart düzenleme (tanım / örnek cümle) |
| 30 | PWA okuma hatırlatması (ReadingReminderCard + ReadingReminderToast) |

**Sonraki aşamalar (öneri):** Liderlik/aktivite gerçek veri vb.

**Önemli route'lar:** `/capture` (Belge Tara), `/vocabulary` (Kelimelerim), `/offline` (PWA çevrimdışı).

---

Hangi hatayı aldığınızı söylerseniz, o adım üzerinden nokta atışı yapabiliriz.
