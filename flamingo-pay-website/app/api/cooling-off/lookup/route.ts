/**
 * GET /api/cooling-off/lookup?ref=FP-XXXXXX
 *
 * Public endpoint — buyer enters their transaction reference to check
 * if it's within the 7-day ECT Act cooling-off window.
 *
 * Returns: transaction summary, cooling-off status, remaining time.
 * Does NOT require authentication (buyer portal is public).
 */

import { NextRequest, NextResponse } from "next/server";
import { listMerchants, listTransactions } from "../../../../lib/store";
import {
  isWithinCoolingOff,
  formatCoolingOffRemaining,
  getCoolingOffRequestByTxn,
} from "../../../../lib/cooling-off";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref")?.trim();
  if (!ref) {
    return NextResponse.json(
      { error: "Provide a transaction reference via ?ref=FP-XXXXXX" },
      { status: 400 },
    );
  }

  // Search across all merchants for the transaction
  const merchants = await listMerchants();
  for (const merchant of merchants) {
    const mid = merchant.id;
    const txns = await listTransactions(mid);
    const txn = txns.find(t => t.reference.toLowerCase() === ref.toLowerCase());
    if (!txn) continue;

    // Don't expose sensitive merchant data — just the business name
    const withinWindow = isWithinCoolingOff(txn);
    const existingRequest = await getCoolingOffRequestByTxn(txn.id);

    return NextResponse.json({
      found: true,
      transaction: {
        reference: txn.reference,
        amount: txn.amount,
        date: txn.timestamp,
        status: txn.status,
        rail: txn.rail,
        buyerBank: txn.buyerBank,
        merchantName: merchant?.businessName ?? "Unknown Merchant",
      },
      coolingOff: {
        eligible: withinWindow && txn.status === "completed" && !existingRequest,
        withinWindow,
        remaining: withinWindow ? formatCoolingOffRemaining(txn) : "Expired",
        expiresAt: txn.coolingOffExpiresAt ??
          new Date(new Date(txn.timestamp).getTime() + 7 * 24 * 3600 * 1000).toISOString(),
        alreadyRequested: !!existingRequest,
        requestStatus: existingRequest?.status ?? null,
      },
    });
  }

  return NextResponse.json({ found: false, error: "Transaction not found" }, { status: 404 });
}
