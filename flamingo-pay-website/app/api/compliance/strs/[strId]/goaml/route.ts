/**
 * GET /api/compliance/strs/[strId]/goaml
 *
 * Returns a goAML 4.0-shaped XML draft for the STR. The compliance officer
 * downloads this, reviews/edits the reporting-person + rentity fields,
 * then uploads it to the FIC goAML portal in place of keying transactions
 * in manually.
 *
 * Auth: compliance or admin session.
 * Side-effects: writes an audit log entry on every successful download so
 * there's a permanent record of who generated a filing draft and when.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "../../../../../../lib/api-auth";
import { getSTR } from "../../../../../../lib/fica";
import { getMerchant, listTransactions, type StoredTxn } from "../../../../../../lib/store";
import { buildGoAmlStrXml } from "../../../../../../lib/goaml";
import { appendAuditLog } from "../../../../../../lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ strId: string }> },
) {
  // Accept both compliance and admin sessions.
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const { strId } = await params;
  const str = await getSTR(strId);
  if (!str) {
    return NextResponse.json({ error: "STR not found" }, { status: 404 });
  }

  const merchant = await getMerchant(str.merchantId);
  if (!merchant) {
    return NextResponse.json(
      { error: "Merchant referenced by STR no longer exists" },
      { status: 404 },
    );
  }

  // Hydrate + chronologically sort the related transactions.
  const allTxns = await listTransactions(str.merchantId);
  const related: StoredTxn[] = str.relatedTxnIds
    .map((id) => allTxns.find((t) => t.id === id))
    .filter((t): t is StoredTxn => Boolean(t));
  related.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  if (related.length === 0) {
    return NextResponse.json(
      {
        error:
          "No hydrated transactions found for this STR — cannot generate a goAML filing. " +
          "The referenced transactions may have been evicted from storage.",
      },
      { status: 409 },
    );
  }

  const xml = buildGoAmlStrXml(str, merchant, related);

  await appendAuditLog({
    action: "str_goaml_generated",
    role: "compliance",
    actorId: session.id,
    actorName: session.name,
    targetId: str.id,
    targetType: "str",
    detail: `Generated goAML XML draft for STR ${str.id} (${related.length} txns, ${merchant.businessName})`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  const filename = `goaml_str_${str.id}.xml`;
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
