/**
 * GET /api/compliance/strs/[strId]
 *
 * Returns the STR plus the hydrated list of related transactions
 * (reference, amount, timestamp, rail, counterparty bank, status)
 * — the exact per-txn detail needed to file with the FIC goAML portal.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "../../../../../lib/api-auth";
import { getSTR } from "../../../../../lib/fica";
import { getMerchant, listTransactions, type StoredTxn } from "../../../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ strId: string }> },
) {
  // Accept both compliance and admin sessions
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const { strId } = await params;
  const str = await getSTR(strId);
  if (!str) return NextResponse.json({ error: "STR not found" }, { status: 404 });

  // Hydrate related transactions with full detail for goAML filing.
  const merchant = await getMerchant(str.merchantId);
  const allTxns = await listTransactions(str.merchantId);
  const related: StoredTxn[] = str.relatedTxnIds
    .map(id => allTxns.find(t => t.id === id))
    .filter((t): t is StoredTxn => Boolean(t));

  // Sort chronologically (earliest first) — FIC expects time-ordered reporting.
  related.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return NextResponse.json({
    str,
    transactions: related,
    merchant: merchant
      ? {
          id: merchant.id,
          businessName: merchant.businessName,
          businessType: merchant.businessType,
          ownerName: merchant.ownerName,
          phone: merchant.phone,
          bank: merchant.bank,
          accountLast4: merchant.accountLast4,
          address: merchant.address,
          status: merchant.status,
        }
      : null,
    /** txns that the STR points to but were not found in the merchant's current txn list. */
    missingTxnIds: str.relatedTxnIds.filter(id => !allTxns.some(t => t.id === id)),
  });
}
