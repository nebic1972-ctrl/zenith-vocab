import { NextResponse } from "next/server";

/**
 * Sağlık kontrolü – deployment / monitoring için.
 * GET /api/health → { status, timestamp, version, environment }
 */
export const runtime = "edge";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV,
  });
}
