/**
 * POST /api/webhooks/ozow — Ozow payment notification webhook.
 *
 * Ozow sends a POST when a payment status changes.
 * We verify the hash, then create/update the transaction in our system.
 *
 * This endpoint is NOT rate-limited by our middleware (webhooks need to
 * always succeed) but IS protected by signature verification.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  verifyOzowSignature,
  ozowStatusToInternal,
  type OzowNotification,
} from "../../../../lib/webhook-verify";
import { createTransaction, getMerchant } from "../../../../lib/store";
import { appendAuditLog } from "../../../../lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: OzowNotification;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Verify Ozow signature
  if (!verifyOzowSignature(body)) {
    await appendAuditLog({
      action: "login_failed",
      role: "system",
      actorId: "ozow-webhook",
      actorName: "Ozow Webhook",
      detail: `Invalid webhook signature for transaction ${body.TransactionReference}`,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse merchant ID from TransactionReference (format: FP-{merchantId}-{random})
  // Or from Optional1 field where we store the merchantId
  const merchantId = body.Optional1 ?? "";
  if (!merchantId) {
    return NextResponse.json({ error: "Missing merchant ID in Optional1" }, { status: 400 });
  }

  const merchant = await getMerchant(merchantId);
  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // Map Ozow status to internal status
  const internalStatus = ozowStatusToInternal(body.Status);
  if (!internalStatus) {
    // Payment failed/cancelled — log but don't create transaction
    await appendAuditLog({
      action: "transaction_created",
      role: "system",
      actorId: "ozow-webhook",
      actorName: "Ozow",
      targetId: merchantId,
      targetType: "merchant",
      detail: `Payment ${body.Status}: ${body.TransactionReference} (R${body.Amount})`,
      metadata: { ozowTxnId: body.TransactionId, status: body.Status },
    });
    return NextResponse.json({ received: true, status: body.Status });
  }

  // Create the transaction with idempotency (Ozow TransactionId prevents duplicates)
  const amount = parseFloat(body.Amount);
  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const result = await createTransaction(merchantId, {
    amount,
    rail: "eft",
    buyerBank: "Ozow",
    idempotencyKey: `ozow:${body.TransactionId}`,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await appendAuditLog({
    action: "transaction_created",
    role: "system",
    actorId: "ozow-webhook",
    actorName: "Ozow",
    targetId: merchantId,
    targetType: "transaction",
    detail: `Payment confirmed: R${amount.toFixed(2)} via Ozow (${body.TransactionReference})`,
    metadata: {
      ozowTxnId: body.TransactionId,
      internalTxnId: result.id,
      reference: body.TransactionReference,
    },
  });

  return NextResponse.json({ received: true, transactionId: result.id });
}
