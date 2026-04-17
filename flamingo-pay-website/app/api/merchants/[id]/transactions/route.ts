import { NextRequest, NextResponse } from "next/server";
import { createTransaction, getMerchant, listTransactions, transactionStats } from "../../../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const merchant = await getMerchant(id);
  if (!merchant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const transactions = await listTransactions(id);
  const stats = await transactionStats(id);
  return NextResponse.json({ transactions, stats });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const merchant = await getMerchant(id);
  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }
  if (merchant.status !== "approved") {
    return NextResponse.json({ error: "Merchant not approved" }, { status: 403 });
  }

  let body: { amount?: number; rail?: string; buyerBank?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.amount !== "number" || body.amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const rail = body.rail === "eft" ? "eft" as const : "payshap" as const;
  const banks = ["Capitec", "FNB", "Standard Bank", "Nedbank", "ABSA", "TymeBank", "Discovery Bank"];
  const buyerBank = typeof body.buyerBank === "string" && body.buyerBank.trim()
    ? body.buyerBank.trim()
    : banks[Math.floor(Math.random() * banks.length)];

  const result = await createTransaction(id, { amount: body.amount, rail, buyerBank });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  return NextResponse.json({ transaction: result }, { status: 201 });
}
