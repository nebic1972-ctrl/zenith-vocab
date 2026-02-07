import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const authRoutes = ['/login', '/register', '/onboarding']

function isOnboardingCompleted(
  metadata: Record<string, unknown> | null | undefined
): boolean {
  if (!metadata) return false
  return Boolean(metadata.onboarding_completed)
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  let user: { user_metadata?: Record<string, unknown> } | null = null

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options })
            response = NextResponse.next({
              request: { headers: request.headers },
            })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options })
            response = NextResponse.next({
              request: { headers: request.headers },
            })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    return response
  }

  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/api')) return response

  const staticPaths = [
    '/manifest.json',
    '/manifest.webmanifest',
    '/sw.js',
    '/offline.html',
    '/icon-192.png',
    '/icon-512.png',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/icon.svg',
    '/icons',
  ]
  if (staticPaths.some((p) => pathname === p || pathname.startsWith(p + '/')))
    return response
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico|json|js)$/i.test(pathname))
    return response

  const publicRoutes = [
    '/login',
    '/register',
    '/onboarding',
    '/verify-email',
    '/auth/login',
    '/auth/register',
    '/auth/callback',
    '/shared',
    '/share',
    '/offline',
  ]
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const isAuthRoute = authRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + '/')
    )
    if (isAuthRoute && pathname !== '/onboarding') {
      const url = request.nextUrl.clone()
      url.pathname = isOnboardingCompleted(user.user_metadata)
        ? '/'
        : '/onboarding'
      return NextResponse.redirect(url)
    }
    if (
      !isOnboardingCompleted(user.user_metadata) &&
      pathname !== '/onboarding' &&
      !isPublicRoute
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.json|manifest\\.webmanifest|sw\\.js|offline\\.html|icons/|icon-|\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
