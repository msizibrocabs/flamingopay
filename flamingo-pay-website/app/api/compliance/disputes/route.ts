/**
 * GET /api/compliance/disputes — List disputes + stats for compliance dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { listDisputes, disputeStats } from "../../../../lib/disputes";
import { requireSession } from "../../../../lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const merchantId = req.nextUrl.searchParams.get("merchantId") ?? undefined;

  const [disputes, stats] = await Promise.all([
    listDisputes({ status: status as any, merchantId }),
    disputeStats(),
  ]);

  return NextResponse.json({ disputes, stats });
}
