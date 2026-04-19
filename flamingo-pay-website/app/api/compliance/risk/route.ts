/**
 * GET /api/compliance/risk — Portfolio risk dashboard.
 * Returns risk scores for all merchants (or a single one via ?merchantId=).
 * Admin-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../lib/api-auth";
import { listMerchants, listTransactions } from "../../../../lib/store";
import { calculateMerchantRisk } from "../../../../lib/risk";
import type { MerchantRiskScore, RiskLevel } from "../../../../lib/risk";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const session = await getSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const singleId = url.searchParams.get("merchantId");

  const merchants = await listMerchants();
  const targets = singleId
    ? merchants.filter(m => m.id === singleId)
    : merchants.filter(m => m.status === "approved" || m.status === "suspended");

  const scores: MerchantRiskScore[] = [];

  for (const m of targets) {
    const txns = await listTransactions(m.id);
    const score = await calculateMerchantRisk(m, txns);
    scores.push(score);
  }

  // Sort by risk score descending (highest risk first)
  scores.sort((a, b) => b.totalScore - a.totalScore);

  // Portfolio summary
  const byLevel: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const s of scores) byLevel[s.level]++;

  const avgScore = scores.length > 0
    ? scores.reduce((s, r) => s + r.totalScore, 0) / scores.length
    : 0;

  return NextResponse.json({
    scores,
    summary: {
      totalMerchants: scores.length,
      averageScore: Math.round(avgScore),
      byLevel,
    },
  });
}
