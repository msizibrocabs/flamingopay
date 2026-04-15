import { NextRequest, NextResponse } from "next/server";
import {
  getMerchant,
  updateMerchantDocument,
  type DocumentKind,
  type DocumentStatus,
} from "../../../../../lib/store";

export const dynamic = "force-dynamic";

const KINDS: DocumentKind[] = ["id", "selfie", "affidavit", "company_reg", "proof_of_address", "bank_letter"];
const STATUSES: DocumentStatus[] = ["required", "submitted", "verified", "rejected"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const merchant = getMerchant(id);
  if (!merchant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ documents: merchant.documents });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: {
    kind?: DocumentKind;
    status?: DocumentStatus;
    note?: string;
    fileName?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.kind || !KINDS.includes(body.kind)) {
    return NextResponse.json({ error: `kind must be one of: ${KINDS.join(", ")}` }, { status: 400 });
  }
  if (body.status && !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: `status must be one of: ${STATUSES.join(", ")}` }, { status: 400 });
  }
  const m = updateMerchantDocument(id, body.kind, {
    status: body.status,
    note: body.note,
    fileName: body.fileName,
  });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ merchant: m });
}
