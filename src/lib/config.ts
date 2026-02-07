/**
 * Güvenli ortam değişkeni wrapper'ı.
 * API anahtarlarını tek noktadan yönetir, eksikse net hata verir.
 */

function getEnv(key: string, required = true): string {
  const value = process.env[key]?.trim()
  if (required && (!value || value === 'your_key_here_do_not_share')) {
    throw new Error(
      `[CONFIG] ${key} tanımlı değil! .env.local dosyasına ekleyin.`
    )
  }
  return value || ''
}

/**
 * Google/Gemini API anahtarı (server tarafı).
 * Öncelik: GOOGLE_API_KEY > GOOGLE_GENERATIVE_AI_API_KEY
 */
export function getGoogleApiKey(): string {
  const key =
    getEnv('GOOGLE_API_KEY', false) ||
    getEnv('GOOGLE_GENERATIVE_AI_API_KEY', false)
  if (!key || key === 'your_key_here_do_not_share') {
    console.error(
      '[CONFIG] GOOGLE_API_KEY veya GOOGLE_GENERATIVE_AI_API_KEY tanımlı değil! .env.local dosyasını kontrol edin.'
    )
    return ''
  }
  return key
}

/**
 * Google/Gemini API anahtarı (client tarafı - NEXT_PUBLIC_).
 */
export function getPublicGoogleApiKey(): string {
  const key =
    getEnv('NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY', false) ||
    getEnv('NEXT_PUBLIC_GEMINI_API_KEY', false)
  return key
}

/**
 * Google Cloud Vision API anahtarı.
 */
export function getGoogleVisionApiKey(): string {
  const key =
    getEnv('GOOGLE_CLOUD_VISION_API_KEY', false) ||
    getEnv('GOOGLE_CLOUD_API_KEY', false)
  if (!key || key === 'your_key_here_do_not_share') {
    console.error(
      '[CONFIG] GOOGLE_CLOUD_VISION_API_KEY tanımlı değil! .env.local dosyasını kontrol edin.'
    )
    return ''
  }
  return key
}
