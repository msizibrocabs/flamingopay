import { NextRequest, NextResponse } from "next/server";
import { refundTransaction } from "../../../../../../../lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; txnId: string }> },
) {
  const { id, txnId } = await params;

  // Body is optional for backwards compat — omitting it does a full refund.
  let refundAmount: number | undefined;
  let refundReason: string | undefined;
  try {
    const body = await req.json();
    if (typeof body.amount === "number" && body.amount > 0) refundAmount = body.amount;
    if (typeof body.reason === "string" && body.reason.trim()) refundReason = body.reason.trim();
  } catch {
    // No body or invalid JSON → full refund, no reason. That's fine.
  }

  const result = refundTransaction(id, txnId, refundAmount, refundReason);
  if ("error" in result) {
    const code = result.error === "Merchant not found" || result.error === "Transaction not found" ? 404 : 409;
    return NextResponse.json({ error: result.error }, { status: code });
  }
  return NextResponse.json(result);
}
