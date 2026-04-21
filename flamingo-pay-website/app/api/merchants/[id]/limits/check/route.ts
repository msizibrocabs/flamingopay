/**
 * GET /api/merchants/[id]/limits/check?amount=NNN
 *
 * Pre-flight limit check for the buyer-facing /pay flow.
 *
 * Returns 200 with { ok: true, remaining } when the amount would clear all
 * KYC-tier + velocity caps, or 200 with { ok: false, reason, message, ... }
 * when it would be blocked. We intentionally return 200 in both cases so the
 * caller can render a friendly UI message without having to distinguish
 * 4xx "blocked" from 4xx "network error".
 *
 * This endpoint is public (same shape as the existing POST transactions
 * endpoint on /pay) — the merchant ID comes from the QR code and no
 * sensitive data is returned.
 */

import { NextRequest, NextResponse } from "next/server";
import { evaluateTransactionLimits, getMerchant, listTransactions } from "../../../../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const amountStr = req.nextUrl.searchParams.get("amount");
  const amount = amountStr ? Number(amountStr) : NaN;
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const merchant = await getMerchant(id);
  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }
  if (merchant.status !== "approved") {
    return NextResponse.json(
      { ok: false, reason: "merchant_not_approved", message: "This merchant is not accepting payments yet." },
      { status: 200 },
    );
  }

  const allTxns = await listTransactions(id);
  const result = evaluateTransactionLimits(merchant, amount, allTxns);

  return NextResponse.json(result, { status: 200 });
}
