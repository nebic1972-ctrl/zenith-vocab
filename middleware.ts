import { NextResponse, type NextRequest } from 'next/server'

/**
 * Supabase @supabase/ssr Edge Runtime ile uyumsuz olduğu için
 * auth kontrolü layout seviyesinde yapılıyor (DashboardLayoutClient).
 * Middleware sadece isteği geçiriyor.
 */
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.json|manifest\\.webmanifest|sw\\.js|offline\\.html|icons/|icon-|\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
