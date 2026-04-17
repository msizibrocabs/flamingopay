/**
 * POST /api/webhooks/payshap — PayShap payment notification webhook.
 *
 * PayShap (or the bank partner) sends a POST when a real-time payment completes.
 * We verify the HMAC-SHA256 signature, then create the transaction.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  verifyPayShapSignature,
  type PayShapNotification,
} from "../../../../lib/webhook-verify";
import { createTransaction, getMerchant, refundTransaction } from "../../../../lib/store";
import { appendAuditLog } from "../../../../lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Read raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get("X-PayShap-Signature") ?? "";

  if (!verifyPayShapSignature(rawBody, signature)) {
    await appendAuditLog({
      action: "login_failed",
      role: "system",
      actorId: "payshap-webhook",
      actorName: "PayShap Webhook",
      detail: "Invalid webhook signature",
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: PayShapNotification;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Extract merchant ID from reference (format: FP-{merchantId}-{random})
  const refParts = body.merchantReference.split("-");
  const merchantId = refParts.length >= 2 ? refParts.slice(1, -1).join("-") : "";
  if (!merchantId) {
    return NextResponse.json({ error: "Cannot parse merchant ID from reference" }, { status: 400 });
  }

  const merchant = await getMerchant(merchantId);
  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  switch (body.eventType) {
    case "payment.completed": {
      if (body.amount <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }

      const result = await createTransaction(merchantId, {
        amount: body.amount,
        rail: "payshap",
        buyerBank: body.buyerBank ?? "Unknown",
        idempotencyKey: `payshap:${body.paymentId}`,
      });

      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      await appendAuditLog({
        action: "transaction_created",
        role: "system",
        actorId: "payshap-webhook",
        actorName: "PayShap",
        targetId: merchantId,
        targetType: "transaction",
        detail: `PayShap payment: R${body.amount.toFixed(2)} from ${body.buyerBank ?? "unknown bank"}`,
        metadata: { payshapId: body.paymentId, internalTxnId: result.id },
      });

      return NextResponse.json({ received: true, transactionId: result.id });
    }

    case "payment.refunded": {
      // Find and refund the matching transaction
      const result = await refundTransaction(
        merchantId,
        body.paymentId, // This should map to our internal txn — in practice we'd look up by reference
        body.amount,
        "Refunded via PayShap",
      );

      if ("error" in result) {
        // Log but don't fail — the refund may not match a known transaction
        await appendAuditLog({
          action: "transaction_refunded",
          role: "system",
          actorId: "payshap-webhook",
          actorName: "PayShap",
          targetId: merchantId,
          targetType: "transaction",
          detail: `PayShap refund notification (could not match): ${body.paymentId}`,
        });
        return NextResponse.json({ received: true, matched: false });
      }

      await appendAuditLog({
        action: "transaction_refunded",
        role: "system",
        actorId: "payshap-webhook",
        actorName: "PayShap",
        targetId: merchantId,
        targetType: "transaction",
        detail: `PayShap refund: R${body.amount.toFixed(2)} for ${body.paymentId}`,
      });

      return NextResponse.json({ received: true, refunded: true });
    }

    case "payment.failed": {
      await appendAuditLog({
        action: "transaction_created",
        role: "system",
        actorId: "payshap-webhook",
        actorName: "PayShap",
        targetId: merchantId,
        targetType: "merchant",
        detail: `Payment failed: ${body.paymentId} (R${body.amount})`,
        metadata: { payshapId: body.paymentId, status: body.status },
      });
      return NextResponse.json({ received: true, status: "failed" });
    }

    case "settlement.completed": {
      // Settlement confirmation — log for reconciliation
      await appendAuditLog({
        action: "transaction_created",
        role: "system",
        actorId: "payshap-webhook",
        actorName: "PayShap",
        targetId: merchantId,
        targetType: "merchant",
        detail: `Settlement completed: R${body.amount.toFixed(2)} paid out`,
        metadata: { payshapId: body.paymentId, amount: body.amount },
      });
      return NextResponse.json({ received: true, status: "settlement_logged" });
    }

    default:
      return NextResponse.json({ received: true, status: "unknown_event" });
  }
}
