/**
 * GET /api/admin/env-check — Temporary endpoint to check if env vars are set.
 * Remove after debugging.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ENCRYPTION_KEY_set: !!process.env.ENCRYPTION_KEY,
    ENCRYPTION_KEY_length: process.env.ENCRYPTION_KEY?.length ?? 0,
    SMS_SA_CLIENT_ID_set: !!process.env.SMS_SA_CLIENT_ID,
    SMS_SA_SECRET_set: !!process.env.SMS_SA_SECRET,
    KV_REST_API_URL_set: !!process.env.KV_REST_API_URL,
    UPSTASH_REDIS_REST_URL_set: !!process.env.UPSTASH_REDIS_REST_URL,
    NODE_ENV: process.env.NODE_ENV,
  });
}
