/**
 * GET /api/compliance/dsar — List all DSARs + stats (compliance only).
 */

import { NextRequest, NextResponse } from "next/server";
import { listDsars, dsarStats, type DsarStatus } from "../../../../lib/dsar";
import { requireSession } from "../../../../lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const status = req.nextUrl.searchParams.get("status") as DsarStatus | null;
  const [dsars, stats] = await Promise.all([
    listDsars({ status: status ?? undefined }),
    dsarStats(),
  ]);

  return NextResponse.json({ dsars, stats });
}
