/**
 * ZENITH-Vocab API Konfigürasyonu
 * Tüm API tanımları ve devreye alma kontrolü
 */

export const API_ENDPOINTS = {
  health: '/api/health',
  analyzeWord: '/api/ai/analyze-word',
  flashcardHint: '/api/ai/flashcard-hint',
  flashcards: '/api/flashcards',
  quiz: '/api/quiz',
  cronDailyReminder: '/api/cron/daily-reminder',
} as const

/** API bağımlılıkları - hangi env var hangi API için gerekli */
export const API_ENV_MAP = {
  supabase: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  supabaseService: ['SUPABASE_SERVICE_ROLE_KEY'],
  googleGemini: ['GOOGLE_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY', 'NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY', 'NEXT_PUBLIC_GEMINI_API_KEY'],
  googleVision: ['GOOGLE_CLOUD_VISION_API_KEY', 'GOOGLE_CLOUD_API_KEY'],
  resend: ['RESEND_API_KEY'],
  app: ['NEXT_PUBLIC_APP_URL'],
} as const

/** Ortam değişkeninden değer al (hassas bilgi döndürme) */
function getEnvValue(key: string): string | undefined {
  return process.env[key]?.trim() || undefined
}

/** API seti devreye alınmış mı kontrol et */
export function isApiEnabled(api: keyof typeof API_ENV_MAP): boolean {
  const keys = API_ENV_MAP[api]
  if (!keys) return false

  switch (api) {
    case 'supabase':
      return !!(getEnvValue('NEXT_PUBLIC_SUPABASE_URL') && getEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY'))
    case 'supabaseService':
      return !!getEnvValue('SUPABASE_SERVICE_ROLE_KEY')
    case 'googleGemini': {
      const key =
        getEnvValue('GOOGLE_API_KEY') ||
        getEnvValue('GOOGLE_GENERATIVE_AI_API_KEY') ||
        getEnvValue('NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY') ||
        getEnvValue('NEXT_PUBLIC_GEMINI_API_KEY')
      return !!(key && key !== 'your_key_here_do_not_share')
    }
    case 'googleVision': {
      const key = getEnvValue('GOOGLE_CLOUD_VISION_API_KEY') || getEnvValue('GOOGLE_CLOUD_API_KEY')
      return !!(key && key !== 'your_key_here_do_not_share')
    }
    case 'resend': {
      const key = getEnvValue('RESEND_API_KEY')
      return !!(key && !key.startsWith('re_xxxxxxxx'))
    }
    case 'app':
      return !!getEnvValue('NEXT_PUBLIC_APP_URL')
    default:
      return false
  }
}

/** Tüm API durumlarını döndür (health check için) */
export function getApiStatus(): Record<string, boolean> {
  return {
    supabase: isApiEnabled('supabase'),
    supabaseService: isApiEnabled('supabaseService'),
    googleGemini: isApiEnabled('googleGemini'),
    googleVision: isApiEnabled('googleVision'),
    resend: isApiEnabled('resend'),
    app: isApiEnabled('app'),
  }
}
