# ZENITH-Vocab Deploy Rehberi

## Vercel Deploy

### 1. Ortam Değişkenleri (Vercel Dashboard → Settings → Environment Variables)

Aşağıdaki değişkenleri **Production**, **Preview** ve **Development** için ekleyin:

| Değişken | Açıklama | Örnek |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (cron için) | `eyJ...` |
| `NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API | `AIza...` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini (server) | `AIza...` |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Client-side quiz | `AIza...` |
| `GOOGLE_CLOUD_VISION_API_KEY` | Vision OCR (opsiyonel) | `AIza...` |
| `RESEND_API_KEY` | E-posta (günlük hatırlatma) | `re_...` |
| `RESEND_FROM_EMAIL` | Gönderen e-posta | `noreply@domain.com` |
| `NEXT_PUBLIC_APP_URL` | Production URL | `https://zenith-vocab.vercel.app` |
| `CRON_SECRET` | Cron güvenlik (opsiyonel) | rastgele string |

### 2. Supabase Ayarları

**Authentication → URL Configuration:**
- Site URL: `https://zenith-vocab.vercel.app`
- Redirect URLs: `https://zenith-vocab.vercel.app/auth/callback`

**Authentication → Providers → Google:** Aktif edin ve Google Cloud Console'dan Client ID/Secret ekleyin.

### 3. Deploy

```bash
git push origin main
```

Vercel otomatik deploy eder. İlk deploy sonrası **Redeploy** yapın (env değişkenleri için).
