import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const authRoutes = ['/login', '/register', '/onboarding']

function isOnboardingCompleted(metadata: Record<string, unknown> | null | undefined): boolean {
  if (!metadata) return false
  return Boolean(metadata.onboarding_completed)
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // API routes - session güncelle, redirect yapma
  if (pathname.startsWith('/api')) {
    return response
  }

  // PWA ve statik dosyalar - auth kontrolü yapma (manifest, icon, sw vb.)
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
  if (staticPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return response
  }
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico|json|js)$/i.test(pathname)) {
    return response
  }

  // Public routes
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

  // Oturum yok + korumalı route → /login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Oturum var
  if (user) {
    // Auth sayfasındayken → onboarding/dashboard'a yönlendir
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

    // Onboarding tamamlanmamış + public olmayan route (onboarding hariç) → /onboarding
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
