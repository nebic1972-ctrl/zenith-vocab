/**
 * API Route'lar için kimlik doğrulama yardımcıları.
 * Giriş yapmamış kullanıcılar 401 döner.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      )
    }
  }

  return { user, response: null }
}
