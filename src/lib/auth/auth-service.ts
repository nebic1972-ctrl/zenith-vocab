/**
 * ZENITH-Vocab Auth Service
 * Google OAuth ve oturum yönetimi
 */

'use client'

import { createClient } from '@/lib/supabase/client'

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'AuthServiceError'
  }
}

/**
 * Google ile OAuth girişi başlatır.
 * Supabase callback'e yönlendirir, oradan /auth/callback işler.
 */
export async function signInWithGoogle(): Promise<void> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw new AuthServiceError(error.message, error.code)
  }

  if (data?.url) {
    window.location.href = data.url
  } else {
    throw new AuthServiceError('OAuth URL alınamadı')
  }
}

export { isOnboardingCompleted } from './auth-utils'
