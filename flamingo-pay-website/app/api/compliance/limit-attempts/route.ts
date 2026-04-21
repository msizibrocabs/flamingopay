/**
 * GET /api/compliance/limit-attempts?hours=24
 *
 * Surfaces recent `limit_exceeded_attempt` audit entries for the
 * compliance dashboard.
 *
 * A repeated pattern of same-merchant rejections (especially at the
 * hourly velocity cap or single-txn cap) can itself be a structuring
 * signal — this endpoint gives the compliance team a rolling window
 * they can scan at a glance and a top-offenders list for triage.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuditLog } from "../../../../lib/audit";
import { requireSession } from "../../../../lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const hours = Math.max(1, Math.min(168, parseInt(req.nextUrl.searchParams.get("hours") ?? "24", 10) || 24));
  const cutoff = new Date(Date.now() - hours * 3_600_000).toISOString();

  // Pull a reasonably-large window from the hot log then filter by cutoff +
  // action client-side. The audit log stores the last 10k entries hot; for a
  // 24h window that's more than enough headroom.
  const entries = (await getAuditLog({ action: "limit_exceeded_attempt", limit: 2000 }))
    .filter(e => e.timestamp >= cutoff);

  // Breakdown by reason.
  const byReason: Record<string, number> = {};
  for (const e of entries) {
    const reason = (e.metadata?.reason as string) ?? "unknown";
    byReason[reason] = (byReason[reason] ?? 0) + 1;
  }

  // Top offenders — merchant ID with the most rejections in the window.
  const byMerchant: Record<string, { merchantId: string; merchantName: string; count: number; lastAt: string; tier?: string }> = {};
  for (const e of entries) {
    const mid = e.targetId ?? e.actorId;
    if (!mid) continue;
    const tier = e.metadata?.tier as string | undefined;
    if (!byMerchant[mid]) {
      byMerchant[mid] = { merchantId: mid, merchantName: e.actorName, count: 0, lastAt: e.timestamp, tier };
    }
    byMerchant[mid].count += 1;
    if (e.timestamp > byMerchant[mid].lastAt) byMerchant[mid].lastAt = e.timestamp;
  }
  const topOffenders = Object.values(byMerchant)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return NextResponse.json({
    hours,
    total: entries.length,
    byReason,
    topOffenders,
    recent: entries.slice(0, 20), // most-recent 20 for an inline feed
  });
}
