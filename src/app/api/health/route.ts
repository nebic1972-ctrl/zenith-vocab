import { NextResponse } from "next/server";
import { getApiStatus } from "@/lib/api-config";

/**
 * Sağlık kontrolü – deployment / monitoring için.
 * GET /api/health → { status, timestamp, version, environment, apis }
 */
export const runtime = "edge";

export async function GET() {
  const apis = getApiStatus();
  const allCritical =
    apis.supabase && apis.app;

  return NextResponse.json({
    status: allCritical ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    apis: {
      supabase: apis.supabase,
      supabaseService: apis.supabaseService,
      googleGemini: apis.googleGemini,
      googleVision: apis.googleVision,
      resend: apis.resend,
      app: apis.app,
    },
  });
}
