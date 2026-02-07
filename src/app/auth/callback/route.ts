import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isOnboardingCompleted } from '@/lib/auth/auth-utils'

function getRedirectBase(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const url = new URL(request.url)

  if (isLocalEnv) {
    return url.origin
  }
  if (forwardedHost) {
    return `https://${forwardedHost}`
  }
  return url.origin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const base = getRedirectBase(request)

  if (!code) {
    return NextResponse.redirect(`${base}/login?error=auth_failed`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] Session exchange error:', error.message)
    return NextResponse.redirect(`${base}/login?error=auth_failed`)
  }

  const user = data.user
  if (!user) {
    return NextResponse.redirect(`${base}/login?error=auth_failed`)
  }

  // Yeni kullanıcı: first_login_at yoksa ekle
  const metadata = user.user_metadata ?? {}
  if (!metadata.first_login_at) {
    await supabase.auth.updateUser({
      data: {
        ...metadata,
        first_login_at: new Date().toISOString(),
      },
    })
  }

  // Onboarding kontrolü - ana sayfa "/" (dashboard)
  const onboardingDone = isOnboardingCompleted(user.user_metadata)
  const redirectTo = onboardingDone ? '/' : '/onboarding'

  return NextResponse.redirect(`${base}${redirectTo}`)
}
