import { NextRequest, NextResponse } from "next/server";
import { listMerchants, listTransactions } from "../../../../lib/store";

export const dynamic = "force-dynamic";

/** GET /api/receipt/:txnId — find a transaction across all merchants for receipt display. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ txnId: string }> },
) {
  const { txnId } = await params;

  const merchants = await listMerchants();

  for (const m of merchants) {
    const txns = await listTransactions(m.id);
    const txn = txns.find(t => t.id === txnId);
    if (txn) {
      return NextResponse.json({
        txn,
        merchantName: m.businessName,
        merchantId: m.id,
      });
    }
  }

  return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
}
