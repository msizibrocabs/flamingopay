/**
 * POST /api/disputes/search — Find transactions by amount + date.
 * Public endpoint for buyers who lost their reference number.
 */

import { NextRequest, NextResponse } from "next/server";
import { findTransactionsByDetails } from "../../../../lib/disputes";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, dateFrom, dateTo, merchantName } = body as {
      amount?: number;
      dateFrom?: string;
      dateTo?: string;
      merchantName?: string;
    };

    if (!amount && !dateFrom && !merchantName) {
      return NextResponse.json({ error: "Please provide at least an amount or date to search." }, { status: 400 });
    }

    const results = await findTransactionsByDetails({ amount, dateFrom, dateTo, merchantName });

    // Return limited info — no merchant internal IDs exposed to public
    return NextResponse.json({
      transactions: results.map(r => ({
        txnId: r.txn.id,
        txnRef: r.txn.reference,
        amount: r.txn.amount,
        date: r.txn.timestamp,
        merchantId: r.merchantId,
        merchantName: r.merchantName,
        rail: r.txn.rail,
        buyerBank: r.txn.buyerBank,
      })),
    });
  } catch (err) {
    console.error("[disputes/search] Error:", err);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
