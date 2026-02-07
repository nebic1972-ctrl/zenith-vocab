import { NextResponse, type NextRequest } from 'next/server'

/**
 * Edge Runtime - minimal passthrough.
 * Auth layout seviyesinde (DashboardLayoutClient).
 */
export async function middleware(request: NextRequest) {
  try {
    return NextResponse.next()
  } catch {
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.json|manifest\\.webmanifest|sw\\.js|offline\\.html|icons/|icon-|\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
