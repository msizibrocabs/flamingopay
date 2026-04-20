import { NextRequest, NextResponse } from "next/server";
import {
  listMerchants,
  listTransactions,
  evaluateRules,
  listFlags,
} from "../../../../../lib/store";
import { requireSession } from "../../../../../lib/api-auth";
import { appendAuditLog } from "../../../../../lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/compliance/flags/rescan
 *
 * Re-evaluates ALL existing transactions across ALL merchants against the
 * current flagging rules.  Used to regenerate flags after data loss (e.g.
 * Redis key eviction).
 *
 * Skips transactions that already have a flag to avoid duplicates.
 */
export async function POST(req: NextRequest) {
  // Only compliance or admin users can trigger a rescan
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  try {
    const merchants = await listMerchants();

    // Get all existing flags so we can skip already-flagged transactions
    const existingFlags = await listFlags();
    const flaggedTxnIds = new Set(existingFlags.map((f) => f.txnId));

    let totalScanned = 0;
    let totalFlagged = 0;
    const flagsByMerchant: Record<string, number> = {};

    for (const merchant of merchants) {
      if (merchant.status !== "approved") continue;

      const txns = await listTransactions(merchant.id);
      let merchantFlagCount = 0;

      for (const txn of txns) {
        // Skip transactions that already have flags
        if (flaggedTxnIds.has(txn.id)) continue;

        totalScanned++;
        const newFlags = await evaluateRules(merchant.id, txn);

        if (newFlags.length > 0) {
          merchantFlagCount += newFlags.length;
          totalFlagged += newFlags.length;
          // Track newly flagged IDs to avoid duplicates within this run
          for (const f of newFlags) {
            flaggedTxnIds.add(f.txnId);
          }
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
      detail: `Bulk rescan completed: ${totalScanned} transactions scanned, ${totalFlagged} new flags generated across ${Object.keys(flagsByMerchant).length} merchants`,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return NextResponse.json({
      success: true,
      scanned: totalScanned,
      flagsCreated: totalFlagged,
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
