/**
 * Merchant Risk Scoring Engine
 *
 * Calculates a 0-100 risk score per merchant based on:
 *  - Transaction velocity patterns
 *  - Sanctions/PEP flag history
 *  - Refund rate
 *  - Complaint count
 *  - KYC tier vs actual volume
 *  - STR history
 *
 * Score bands:
 *   0-25   → Low risk (green)
 *   26-50  → Medium risk (yellow)
 *   51-75  → High risk (orange)
 *   76-100 → Critical risk (red)
 */

import "server-only";
import { Redis } from "@upstash/redis";
import type { MerchantApplication, StoredTxn } from "./store";
import { KYC_THRESHOLDS } from "./store";
import { listSTRs } from "./fica";
import { MS_PER_DAY } from "./time";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RiskFactor = {
  name: string;
  score: number;      // contribution to the total (0-25 each)
  detail: string;
};

export type MerchantRiskScore = {
  merchantId: string;
  merchantName: string;
  totalScore: number;  // 0-100
  level: RiskLevel;
  factors: RiskFactor[];
  calculatedAt: string;
};

function riskLevel(score: number): RiskLevel {
  if (score <= 25) return "low";
  if (score <= 50) return "medium";
  if (score <= 75) return "high";
  return "critical";
}

/**
 * Calculate a risk score for a single merchant.
 */
export async function calculateMerchantRisk(
  merchant: MerchantApplication,
  txns: StoredTxn[],
): Promise<MerchantRiskScore> {
  const factors: RiskFactor[] = [];
  const now = Date.now();
  const day = MS_PER_DAY;

  // ─── Factor 1: Transaction velocity (0-25) ───
  {
    const last7d = txns.filter(
      t => t.status === "completed" && new Date(t.timestamp).getTime() > now - 7 * day,
    );
    const last30d = txns.filter(
      t => t.status === "completed" && new Date(t.timestamp).getTime() > now - 30 * day,
    );

    const dailyAvg7d = last7d.length / 7;
    const dailyAvg30d = last30d.length / 30;

    let velocityScore = 0;
    // Spike detection: 7-day avg significantly higher than 30-day avg
    if (dailyAvg30d > 0 && dailyAvg7d > dailyAvg30d * 2) {
      velocityScore += 10;
    }
    // High absolute frequency
    if (dailyAvg7d > 20) velocityScore += 8;
    else if (dailyAvg7d > 10) velocityScore += 4;

    // Volume concentration — is >80% of volume in one day?
    if (last7d.length > 5) {
      const dayBuckets: Record<string, number> = {};
      for (const t of last7d) {
        const d = t.timestamp.slice(0, 10);
        dayBuckets[d] = (dayBuckets[d] ?? 0) + t.amount;
      }
      const totalVol = Object.values(dayBuckets).reduce((s, v) => s + v, 0);
      const maxDayVol = Math.max(...Object.values(dayBuckets));
      if (totalVol > 0 && maxDayVol / totalVol > 0.8) velocityScore += 7;
    }

    factors.push({
      name: "Transaction velocity",
      score: Math.min(25, velocityScore),
      detail: `${dailyAvg7d.toFixed(1)} txns/day (7d), ${dailyAvg30d.toFixed(1)} txns/day (30d)`,
    });
  }

  // ─── Factor 2: Sanctions & PEP flags (0-25) ───
  {
    const flagsRaw = await redis.get("sanctions_flags");
    const allFlags = flagsRaw
      ? typeof flagsRaw === "string" ? JSON.parse(flagsRaw) : flagsRaw as { merchantId: string; status: string; flagType?: string }[]
      : [];
    const merchantFlags = allFlags.filter((f: { merchantId: string }) => f.merchantId === merchant.id);
    const pendingFlags = merchantFlags.filter((f: { status: string }) => f.status === "pending");
    const blockedFlags = merchantFlags.filter((f: { status: string }) => f.status === "blocked");
    const pepFlags = merchantFlags.filter((f: { flagType?: string }) => f.flagType === "pep" || f.flagType === "both");

    let flagScore = 0;
    if (blockedFlags.length > 0) flagScore += 25; // instant critical
    else {
      flagScore += pendingFlags.length * 8;
      flagScore += pepFlags.length * 5;
    }

    factors.push({
      name: "Sanctions & PEP",
      score: Math.min(25, flagScore),
      detail: `${merchantFlags.length} total flags (${pendingFlags.length} pending, ${pepFlags.length} PEP)`,
    });
  }

  // ─── Factor 3: Refund rate & complaints (0-25) ───
  {
    const last30d = txns.filter(
      t => new Date(t.timestamp).getTime() > now - 30 * day,
    );
    const completed = last30d.filter(t => t.status === "completed").length;
    const refunded = last30d.filter(
      t => t.status === "refunded" || t.status === "partial_refund",
    ).length;
    const refundRate = completed > 0 ? refunded / completed : 0;

    // Check complaints
    const complaintsRaw = await redis.get("complaint_ids");
    const complaintIds: string[] = complaintsRaw
      ? typeof complaintsRaw === "string" ? JSON.parse(complaintsRaw) : complaintsRaw as string[]
      : [];

    let merchantComplaints = 0;
    for (const cid of complaintIds.slice(0, 100)) {
      const c = await redis.get(`complaint:${cid}`);
      if (c) {
        const complaint = typeof c === "string" ? JSON.parse(c) : c;
        if (complaint.merchantId === merchant.id) merchantComplaints++;
      }
    }

    let refundScore = 0;
    if (refundRate > 0.3) refundScore += 15;
    else if (refundRate > 0.15) refundScore += 8;
    else if (refundRate > 0.05) refundScore += 3;

    refundScore += Math.min(10, merchantComplaints * 3);

    factors.push({
      name: "Refunds & complaints",
      score: Math.min(25, refundScore),
      detail: `${(refundRate * 100).toFixed(0)}% refund rate, ${merchantComplaints} complaints`,
    });
  }

  // ─── Factor 4: STR history & KYC (0-25) ───
  {
    const strs = await listSTRs({ merchantId: merchant.id });
    const pendingSTRs = strs.filter(s => s.status === "pending_review").length;
    const filedSTRs = strs.filter(s => s.status === "filed").length;

    let strScore = 0;
    strScore += filedSTRs * 10;
    strScore += pendingSTRs * 5;

    // KYC tier check — is their actual volume near their tier limit?
    const thirtyDaysAgo = new Date(now - 30 * day).toISOString();
    const monthVol = txns
      .filter(t => t.timestamp >= thirtyDaysAgo && t.status === "completed")
      .reduce((s, t) => s + t.amount, 0);

    // Enhanced tier is uncapped by design — skip the utilisation penalty for
    // those merchants. For simplified + standard, use the single source of
    // truth in lib/store.ts so risk and limit enforcement never drift.
    let utilisation = 0;
    if (merchant.kycTier !== "enhanced") {
      const limit =
        merchant.kycTier === "simplified"
          ? KYC_THRESHOLDS.simplified
          : KYC_THRESHOLDS.standard;
      utilisation = monthVol / limit;
      if (utilisation > 0.9) strScore += 5;
      if (utilisation > 1.0) strScore += 5;
    }

    const utilisationText =
      merchant.kycTier === "enhanced"
        ? "enhanced tier — uncapped"
        : `${(utilisation * 100).toFixed(0)}% tier utilisation`;
    factors.push({
      name: "STR history & KYC",
      score: Math.min(25, strScore),
      detail: `${strs.length} STRs (${pendingSTRs} pending, ${filedSTRs} filed), ${utilisationText}`,
    });
  }

  const totalScore = Math.min(100, factors.reduce((s, f) => s + f.score, 0));

  return {
    merchantId: merchant.id,
    merchantName: merchant.businessName,
    totalScore,
    level: riskLevel(totalScore),
    factors,
    calculatedAt: new Date().toISOString(),
  };
}
