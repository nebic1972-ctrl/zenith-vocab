import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 🛡️ GÜVENLİ MOD: Build sırasında anahtarlar yoksa bile patlama.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Build sırasında Supabase anahtarları görünmüyor. Placeholder kullanılıyor.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
