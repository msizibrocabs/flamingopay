import { NextRequest, NextResponse } from "next/server";
import { getMerchant, listTransactions } from "../../../../../lib/store";

export const dynamic = "force-dynamic";

/** GET /api/merchants/:id/export — returns transaction CSV download. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const merchant = await getMerchant(id);
  if (!merchant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const txns = await listTransactions(id);

  // Build CSV
  const header = "Date,Reference,Amount (ZAR),Rail,Buyer Bank,Status\n";
  const rows = txns.map(t =>
    [
      new Date(t.timestamp).toLocaleString("en-ZA"),
      t.reference,
      t.amount.toFixed(2),
      t.rail.toUpperCase(),
      t.buyerBank,
      t.status,
    ].join(",")
  ).join("\n");

  const csv = header + rows;
  const filename = `flamingo-${id}-transactions-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
