/**
 * GET /api/compliance/ctrs/[ctrId]/goaml
 *
 * Returns a goAML 4.0-shaped XML draft for the CTR. The compliance officer
 * downloads this, reviews/edits the reporting-person + rentity fields,
 * then uploads it to the FIC goAML portal.
 *
 * Auth: compliance or admin session.
 * Side-effects: appends an audit log entry on every successful download.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "../../../../../../lib/api-auth";
import { getCTR } from "../../../../../../lib/fica";
import { getMerchant, listTransactions, type StoredTxn } from "../../../../../../lib/store";
import { buildGoAmlCtrXml } from "../../../../../../lib/goaml";
import { appendAuditLog } from "../../../../../../lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ctrId: string }> },
) {
  // Accept both compliance and admin sessions.
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const { ctrId } = await params;
  const ctr = await getCTR(ctrId);
  if (!ctr) {
    return NextResponse.json({ error: "CTR not found" }, { status: 404 });
  }

  const merchant = await getMerchant(ctr.merchantId);
  if (!merchant) {
    return NextResponse.json(
      { error: "Merchant referenced by CTR no longer exists" },
      { status: 404 },
    );
  }

  // CTR references a single transaction — hydrate it.
  const allTxns = await listTransactions(ctr.merchantId);
  const txn: StoredTxn | undefined = allTxns.find((t) => t.id === ctr.txnId);
  if (!txn) {
    return NextResponse.json(
      {
        error:
          "The transaction referenced by this CTR is no longer in storage — cannot generate a goAML filing. " +
          "Re-run the compliance rescan or restore the transaction record.",
      },
      { status: 409 },
    );
  }

  const xml = buildGoAmlCtrXml(ctr, merchant, txn);

  await appendAuditLog({
    action: "ctr_goaml_generated",
    role: "compliance",
    actorId: session.id,
    actorName: session.name,
    targetId: ctr.id,
    targetType: "ctr",
    detail: `Generated goAML XML draft for CTR ${ctr.id} (R${txn.amount.toFixed(2)}, ${merchant.businessName})`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  const filename = `goaml_ctr_${ctr.id}.xml`;
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
