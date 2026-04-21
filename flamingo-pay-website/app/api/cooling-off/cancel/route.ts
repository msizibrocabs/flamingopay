/**
 * POST /api/cooling-off/cancel
 *
 * Public endpoint — buyer requests cancellation of a transaction
 * within the 7-day ECT Act s44 cooling-off period.
 *
 * Body: { reference: string, email?: string, phone?: string }
 *
 * Validates the transaction is within the cooling-off window,
 * creates a cancellation request, and flags it for compliance review.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listMerchants,
  listTransactions,
  type StoredTxn,
} from "../../../../lib/store";
import {
  isWithinCoolingOff,
  createCoolingOffRequest,
  getCoolingOffRequestByTxn,
} from "../../../../lib/cooling-off";
import { appendAuditLog } from "../../../../lib/audit";

export const dynamic = "force-dynamic";

async function findTransaction(
  reference: string,
): Promise<{ txn: StoredTxn; merchantId: string; merchantName: string } | null> {
  const merchants = await listMerchants();
  for (const m of merchants) {
    const txns = await listTransactions(m.id);
    const txn = txns.find(t => t.reference.toLowerCase() === reference.toLowerCase());
    if (txn) {
      return { txn, merchantId: m.id, merchantName: m.businessName };
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: { reference?: string; email?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { reference, email, phone } = body;
  if (!reference) {
    return NextResponse.json(
      { error: "Transaction reference is required" },
      { status: 400 },
    );
  }

  // Find the transaction
  const result = await findTransaction(reference);
  if (!result) {
    return NextResponse.json(
      { error: "Transaction not found. Please check your reference number." },
      { status: 404 },
    );
  }

  const { txn, merchantId, merchantName } = result;

  // Validate status — can only cancel completed transactions
  if (txn.status !== "completed") {
    return NextResponse.json(
      { error: `This transaction has already been ${txn.status}. Cooling-off cancellation is not available.` },
      { status: 400 },
    );
  }

  // Validate cooling-off window
  if (!isWithinCoolingOff(txn)) {
    return NextResponse.json(
      { error: "The 7-day cooling-off period has expired for this transaction. You may still contact the merchant directly for a refund." },
      { status: 400 },
    );
  }

  // Check for duplicate request
  const existing = await getCoolingOffRequestByTxn(txn.id);
  if (existing) {
    return NextResponse.json(
      {
        error: "A cancellation request already exists for this transaction.",
        requestId: existing.id,
        status: existing.status,
      },
      { status: 409 },
    );
  }

  // Create the cancellation request
  const coolingOffReq = await createCoolingOffRequest(
    txn,
    merchantId,
    merchantName,
    email,
    phone,
  );

  // Update the transaction's cooling-off status
  const txns = await listTransactions(merchantId);
  const txnIdx = txns.findIndex(t => t.id === txn.id);
  if (txnIdx !== -1) {
    txns[txnIdx] = {
      ...txns[txnIdx],
      coolingOffStatus: "requested",
      coolingOffRequestedAt: new Date().toISOString(),
      coolingOffBuyerEmail: email,
      coolingOffBuyerPhone: phone,
    };
    // Save updated transactions via Redis directly
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
      token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
    });
    await redis.set(`txns:${merchantId}`, JSON.stringify(txns));
  }

  // Audit log
  await appendAuditLog({
    action: "transaction_refunded",
    role: "system",
    actorId: "buyer",
    actorName: email ?? phone ?? "Anonymous Buyer",
    targetId: txn.id,
    targetType: "transaction",
    detail: `Cooling-off cancellation requested for ${txn.reference} (R${txn.amount.toFixed(2)}) — ECT Act s44`,
    metadata: {
      coolingOffRequestId: coolingOffReq.id,
      merchantId,
      buyerEmail: email,
    },
  });

  return NextResponse.json({
    ok: true,
    requestId: coolingOffReq.id,
    message: "Your cancellation request has been submitted. The merchant will be notified and you will receive a full refund within 7 business days.",
  });
}
