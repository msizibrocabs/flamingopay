/**
 * GET /api/disputes/lookup?ref=DSP-XXXX — Public lookup by dispute reference.
 * Buyer uses this to check dispute status without auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDisputeByRef } from "../../../../lib/disputes";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "Missing ref parameter." }, { status: 400 });
  }

  const dispute = await getDisputeByRef(ref);
  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found. Check your reference number." }, { status: 404 });
  }

  // Return limited info for public access (no internal IDs or compliance details)
  return NextResponse.json({
    dispute: {
      ref: dispute.ref,
      status: dispute.status,
      reason: dispute.reason,
      amount: dispute.amount,
      merchantName: dispute.merchantName,
      txnDate: dispute.txnDate,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
      refundAmount: dispute.refundAmount,
      merchantResponse: dispute.merchantResponse ? {
        action: dispute.merchantResponse.action,
        respondedAt: dispute.merchantResponse.respondedAt,
      } : undefined,
      resolution: dispute.resolution ? {
        decision: dispute.resolution.decision,
        resolvedAt: dispute.resolution.resolvedAt,
      } : undefined,
    },
  });
}
