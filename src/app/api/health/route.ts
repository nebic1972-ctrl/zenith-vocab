import { NextResponse } from "next/server";

/**
 * Sağlık kontrolü – deployment / monitoring için.
 * GET /api/health → { ok: true, timestamp }
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    version: "2.0",
  });
}
