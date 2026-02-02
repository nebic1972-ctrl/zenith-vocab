# PROJE TEKNİK RAPORU: NeuroRead V1.0 (Master Template)

## 1. MİSYON VE VİZYON
NeuroRead, hızlı okuma tekniklerini modern web teknolojileriyle birleştiren, SaaS ölçeklenebilirliğine sahip bir "Master Template" projesidir. Amacı, türev projeler (NeuroMath, NeuroCode) için modüler bir fabrika altyapısı sunmaktır.

## 2. TEKNOLOJİ STACK (GÜNCEL)
- **Framework:** Next.js 15.5.9 (App Router)
- **State Management:** Zustand (Global State) + React Context (Auth).
- **Database:** Supabase (PostgreSQL).
- **UI:** Tailwind CSS + Shadcn/ui + Sonner (Toast bildirimleri).

## 3. KRİTİK ALTYAPI VE BEST PRACTICES (ÖNEMLİ)
- **Auth İstemcisi:**
  - Login/Register sayfalarında (Client Component) mutlaka `@/lib/supabase/client` (Browser Client) kullanılmalıdır; oturum cookie'ye yazılır.
  - Giriş veya kayıt başarılı olduktan sonra sunucunun cookie'yi görmesi için `router.refresh()` çağrılmalıdır.
  - Admin/Server sayfalarında ve Server Action'larda `@/lib/supabase/server` (Server Client - Cookies) kullanılmalıdır.
- **Hydration Yönetimi (Defansif Kodlama):**
  - Tarayıcı eklentilerinin (LastPass, Translate vb.) HTML'i değiştirmesi sonucu oluşan "Hydration Mismatch" hatalarını önlemek için; `Input`, `Button`, `Textarea` gibi interaktif form elemanlarına **`suppressHydrationWarning`** prop'u eklenmelidir.
- **Role Based Access (RBAC):**
  - Admin paneli erişimi için `profiles` tablosundaki `role` sütunu kontrol edilir.

## 4. KRİTİK DOSYA YAPISI
- `src/app/admin/page.tsx`: **KAPTAN KÖŞKÜ (Client).** PDF + kapak formu, kütüphane listesi. `createClient()` from `@/lib/supabase/client` ile liste/silme; Server Action ile kitap yükleme.
- `src/app/admin/dashboard/page.tsx`: **ADMİN RBAC (Server).** Auth + `profiles.role === "admin"` kontrolü, native form + `uploadBook` action. `@/lib/supabase/server` kullanır.
- `src/app/login/page.tsx`: **GİRİŞ KAPISI.** Cookie tabanlı client, `router.refresh()` sonrası yönlendirme, Hydration korumalı (suppressHydrationWarning).
- `src/app/register/page.tsx`: **KAYIT (Ana).** `createClient()` from `@/lib/supabase/client`; kayıt sonrası `router.refresh()`. Form alanlarında suppressHydrationWarning.
- `src/app/auth/login/page.tsx`: **AUTH GİRİŞ.** Cookie client, giriş sonrası `router.refresh()`.
- `src/app/auth/register/page.tsx`: **AUTH KAYIT.** Cookie client, kayıt sonrası `router.refresh()`.
- `src/app/auth/callback/page.tsx`: **OAUTH CALLBACK.** `createClient()` from `@/lib/supabase/client` ile `exchangeCodeForSession`; oturum cookie'ye yazılır, `router.refresh()` ile sunucu güncellenir.
- `src/store/useNeuroStore.ts`: **BEYİN.** Uygulama durumunu yönetir; XP/level için cookie client ile sync.
- `src/lib/supabase/server.ts`: **MOTOR.** Next.js 15 `await cookies()` standardına uyumlu sunucu istemcisi.

## 5. VERİTABANI ŞEMASI
- **library:** Kitapların tutulduğu ana tablo (title, author, content_text, difficulty_level, user_id).
- **profiles:** Kullanıcı rolleri ve seviyeleri.

## 6. GÜNCEL DURUM (Rapor Uyum Özeti)

| Konu | Durum |
|------|--------|
| **Auth istemcisi** | Tüm giriş/kayıt sayfaları (`/login`, `/register`, `/auth/login`, `/auth/register`) `createClient()` from `@/lib/supabase/client` kullanıyor; oturum cookie'ye yazılıyor. |
| **OAuth callback** | `auth/callback` cookie client ile `exchangeCodeForSession`; `router.refresh()` ile sunucu cookie'yi görüyor. |
| **Giriş/kayıt sonrası** | `router.refresh()` çağrılıyor; sunucu (admin, dashboard) aynı oturumu cookie'den okuyabiliyor. |
| **Hydration** | Login/Register formlarında ilgili Input, Button, Textarea ve select'lere `suppressHydrationWarning` eklendi (eklenti kaynaklı fdprocessedid uyarıları önlenir). |
| **Admin** | `/admin` client component (liste + PDF form); `/admin/dashboard` server component (RBAC + native form). Server action `uploadBook` `@/lib/supabase/server` kullanır. |
| **Linter** | Hata yok. |

- Admin paneli aktif; PDF + kapak ile kitap yükleme ve kütüphane listesi çalışıyor.
- Login/Register akışları cookie tabanlı; sunucu tarafı aynı oturumu tanıyor.
