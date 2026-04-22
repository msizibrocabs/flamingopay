/**
 * GET /api/merchants/[id]/limits/usage
 *
 * Returns the merchant's KYC-tier + velocity caps alongside current
 * usage (rolling 30-day volume, today volume, txns in the last hour).
 *
 * Used by:
 *   - the merchant dashboard widget ("Rx used of Ry — Rz remaining")
 *   - the admin merchant detail tier bar
 *
 * Not sensitive beyond the merchant ID that's already in the URL, so
 * there's no hard auth gate — the /pay flow is also public by design.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getMerchant,
  listTransactions,
  KYC_THRESHOLDS,
  DEFAULT_VELOCITY,
  type KycTier,
} from "../../../../../../lib/store";
import { MS_PER_DAY } from "../../../../../../lib/time";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const merchant = await getMerchant(id);
  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  const tier: KycTier = merchant.kycTier ?? "simplified";
  const tierCap =
    tier === "simplified" ? KYC_THRESHOLDS.simplified
      : tier === "standard" ? KYC_THRESHOLDS.standard
      : null; // enhanced has no fixed cap

  const velocity = { ...DEFAULT_VELOCITY[tier], ...(merchant.velocityLimits ?? {}) };

  const allTxns = await listTransactions(id);
  const now = new Date();

  // 30-day rolling volume — what the tier cap is measured against.
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_PER_DAY).toISOString();
  const monthVolume = allTxns
    .filter(t => t.timestamp >= thirtyDaysAgo && (t.status === "completed" || t.status === "partial_refund"))
    .reduce((s, t) => s + t.amount, 0);

  // Today (for daily velocity cap).
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayVolume = allTxns
    .filter(t => t.timestamp >= todayStart.toISOString() && t.status === "completed")
    .reduce((s, t) => s + t.amount, 0);

  // Last hour (for hourly txn-count cap).
  const hourAgo = new Date(now.getTime() - 3_600_000).toISOString();
  const txnsLastHour = allTxns.filter(t => t.timestamp >= hourAgo && t.status === "completed").length;

  const monthRemaining = tierCap === null ? null : Math.max(0, tierCap - monthVolume);
  const monthPct = tierCap === null ? 0 : Math.min(100, Math.round((monthVolume / tierCap) * 100));

  return NextResponse.json({
    tier,
    month: {
      cap: tierCap,      // null for enhanced tier
      used: monthVolume,
      remaining: monthRemaining,
      pct: monthPct,
    },
    day: {
      cap: velocity.maxDailyVolume,
      used: todayVolume,
      remaining: Math.max(0, velocity.maxDailyVolume - todayVolume),
      pct: Math.min(100, Math.round((todayVolume / velocity.maxDailyVolume) * 100)),
    },
    hour: {
      cap: velocity.maxTxnPerHour,
      used: txnsLastHour,
      remaining: Math.max(0, velocity.maxTxnPerHour - txnsLastHour),
    },
    singleTxnCap: velocity.maxSingleTxn,
  });
}
