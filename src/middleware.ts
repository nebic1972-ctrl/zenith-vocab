import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting için basit in-memory store
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static dosyaları ve Next.js internal route'ları atla
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/api/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Sadece API route'ları için rate limiting
  if (pathname.startsWith("/api/")) {
    const ip =
      request.ip ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "anonymous";
    const now = Date.now();
    const windowMs = 60000;
    const maxRequests = 10;

    const userLimit = rateLimitMap.get(ip);

    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= maxRequests) {
          return NextResponse.json(
            { error: "Çok fazla istek. Lütfen 1 dakika bekleyin." },
            { status: 429 }
          );
        }
        userLimit.count++;
      } else {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
