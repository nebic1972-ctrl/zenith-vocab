import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 🛡️ GÜVENLİ MOD: Hata fırlatmak yok!
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Build uyarısı: (supabaseClient.ts) Anahtarlar eksik, placeholder kullanılıyor.')
}

// En basit, standart istemci.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
  auth: {
    persistSession: true, // Oturumu LocalStorage'da tut
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}
)
