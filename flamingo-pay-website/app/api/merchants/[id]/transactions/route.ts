import { NextRequest, NextResponse } from "next/server";
import { getMerchant, listTransactions, transactionStats } from "../../../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const merchant = getMerchant(id);
  if (!merchant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const transactions = listTransactions(id);
  const stats = transactionStats(id);
  return NextResponse.json({ transactions, stats });
}
