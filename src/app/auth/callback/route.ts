import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Vercel ortamında güvenilir base URL (x-forwarded-host öncelikli)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
    }
    if (isLocalEnv) {
      return new URL(request.url).origin;
    }
    if (forwardedHost) {
      return `https://${forwardedHost}`;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return new URL(request.url).origin;
  };

  const baseUrl = getBaseUrl();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  // Hata olsa bile siyah ekranda bırakma, login'e hata mesajıyla at
  return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_error`);
}
