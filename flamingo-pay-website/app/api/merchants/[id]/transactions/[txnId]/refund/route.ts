import { NextRequest, NextResponse } from "next/server";
import { refundTransaction } from "../../../../../../../lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; txnId: string }> },
) {
  const { id, txnId } = await params;
  const result = refundTransaction(id, txnId);
  if ("error" in result) {
    const code = result.error === "Merchant not found" || result.error === "Transaction not found" ? 404 : 409;
    return NextResponse.json({ error: result.error }, { status: code });
  }
  return NextResponse.json(result);
}
