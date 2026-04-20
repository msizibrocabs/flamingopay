import { NextRequest, NextResponse } from "next/server";
import {
  listMerchants,
  listTransactions,
  evaluateRules,
  listFlags,
} from "../../../../../lib/store";
import { requireSession } from "../../../../../lib/api-auth";
import { appendAuditLog } from "../../../../../lib/audit";
import { checkSTR, checkCTR, listSTRs, listCTRs } from "../../../../../lib/fica";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/compliance/flags/rescan
 *
 * Re-evaluates ALL existing transactions across ALL merchants against the
 * current flagging rules, STR detection patterns, and CTR thresholds.
 * Used to regenerate compliance data after Redis key eviction.
 *
 * Skips transactions that already have a flag/STR/CTR to avoid duplicates.
 */
export async function POST(req: NextRequest) {
  // Only compliance or admin users can trigger a rescan
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  try {
    const merchants = await listMerchants();

    // Get all existing data so we can skip duplicates
    const existingFlags = await listFlags();
    const flaggedTxnIds = new Set(existingFlags.map((f) => f.txnId));

    const existingSTRs = await listSTRs();
    const strMerchantReasons = new Set(
      existingSTRs.map((s) => `${s.merchantId}:${s.reason}`),
    );

    const existingCTRs = await listCTRs();
    const ctrTxnIds = new Set(existingCTRs.map((c) => c.txnId));

    let totalScanned = 0;
    let totalFlagged = 0;
    let totalSTRs = 0;
    let totalCTRs = 0;
    const flagsByMerchant: Record<string, number> = {};

    for (const merchant of merchants) {
      if (merchant.status !== "approved") continue;

      const txns = await listTransactions(merchant.id);
      let merchantFlagCount = 0;

      for (const txn of txns) {
        totalScanned++;

        // ── Flags ──
        if (!flaggedTxnIds.has(txn.id)) {
          const newFlags = await evaluateRules(merchant.id, txn);
          if (newFlags.length > 0) {
            merchantFlagCount += newFlags.length;
            totalFlagged += newFlags.length;
            for (const f of newFlags) {
              flaggedTxnIds.add(f.txnId);
            }
          }
        }

        // ── CTRs (R25,000+ threshold) ──
        if (!ctrTxnIds.has(txn.id) && txn.amount >= 25000) {
          const recent24hAmounts = txns
            .filter((t) => t.id !== txn.id && Math.abs(new Date(t.timestamp).getTime() - new Date(txn.timestamp).getTime()) < 86400000)
            .map((t) => t.amount);
          const ctr = await checkCTR(
            merchant.id, merchant.businessName, txn.id, txn.amount,
            txn.buyerBank, txn.rail, txn.timestamp, recent24hAmounts,
          );
          if (ctr) {
            totalCTRs++;
            ctrTxnIds.add(txn.id);
          }
        }
      }

      // ── STRs (suspicious pattern detection across all txns) ──
      // Run STR check for the most recent transaction to detect patterns
      if (txns.length > 0) {
        const latestTxn = txns[0]; // txns are sorted newest first
        const recentTxns = txns.slice(0, 50).map((t) => ({
          id: t.id,
          amount: t.amount,
          timestamp: t.timestamp,
          status: t.status,
        }));

        const str = await checkSTR(
          merchant.id,
          merchant.businessName,
          latestTxn.id,
          latestTxn.amount,
          latestTxn.timestamp,
          recentTxns,
        );
        if (str) {
          totalSTRs++;
        }
      }

      if (merchantFlagCount > 0) {
        flagsByMerchant[merchant.id] = merchantFlagCount;
      }
    }

    await appendAuditLog({
      action: "flag_updated" as import("../../../../../lib/audit").AuditAction,
      role: "compliance",
      actorId: "rescan",
      actorName: "Compliance Rescan",
      targetId: "all",
      targetType: "flag",
      detail: `Bulk rescan completed: ${totalScanned} txns scanned, ${totalFlagged} flags, ${totalSTRs} STRs, ${totalCTRs} CTRs generated across ${Object.keys(flagsByMerchant).length} merchants`,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return NextResponse.json({
      success: true,
      scanned: totalScanned,
      flagsCreated: totalFlagged,
      strsCreated: totalSTRs,
      ctrsCreated: totalCTRs,
      merchantsAffected: Object.keys(flagsByMerchant).length,
      flagsByMerchant,
    });
  } catch (err) {
    console.error("[rescan] Error:", err);
    return NextResponse.json(
      { error: `Rescan failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
