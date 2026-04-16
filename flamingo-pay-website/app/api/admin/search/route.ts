import { NextRequest, NextResponse } from "next/server";
import { searchAll } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const limitRaw = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitRaw ?? "20", 10) || 20, 1), 50);
  const hits = await searchAll(q, limit);
  return NextResponse.json({ q, hits });
}
