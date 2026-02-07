/**
 * Güvenli ortam değişkeni wrapper'ı.
 * Edge/Middleware ortamında hata fırlatmaz - fail-safe.
 */
function getEnv(key: string, _required = false): string {
  try {
    const value = process.env[key]?.trim()
    if (!value || value === 'your_key_here_do_not_share') return ''
    return value
  } catch {
    return ''
  }
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
