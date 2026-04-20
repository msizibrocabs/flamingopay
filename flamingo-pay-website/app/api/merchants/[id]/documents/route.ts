import { NextRequest, NextResponse } from "next/server";
import {
  getMerchant,
  updateMerchantDocument,
  type DocumentKind,
  type DocumentStatus,
} from "../../../../../lib/store";
import { requireSession } from "../../../../../lib/api-auth";
import { appendAuditLog } from "../../../../../lib/audit";

export const dynamic = "force-dynamic";

const KINDS: DocumentKind[] = ["id", "selfie", "affidavit", "company_reg", "proof_of_address", "bank_letter", "source_of_funds"];
const STATUSES: DocumentStatus[] = ["required", "submitted", "verified", "rejected"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const merchant = await getMerchant(id);
  if (!merchant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ documents: merchant.documents });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Document status changes require compliance or admin session
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const { id } = await params;
  let body: {
    kind?: DocumentKind;
    status?: DocumentStatus;
    note?: string;
    fileName?: string;
    reviewedBy?: string;
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

  // Require a note when rejecting
  if (body.status === "rejected" && !body.note?.trim()) {
    return NextResponse.json({ error: "A rejection reason is required" }, { status: 400 });
  }

  const m = await updateMerchantDocument(id, body.kind, {
    status: body.status,
    note: body.note,
    fileName: body.fileName,
  });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Audit trail
  const actionMap: Record<string, string> = {
    verified: "document_verified",
    rejected: "document_rejected",
    required: "document_reset",
  };
  if (body.status && actionMap[body.status]) {
    await appendAuditLog({
      action: actionMap[body.status] as import("../../../../../lib/audit").AuditAction,
      role: "compliance",
      actorId: body.reviewedBy ?? "officer",
      actorName: body.reviewedBy ?? "Compliance Officer",
      targetId: id,
      targetType: "merchant",
      detail: `Document "${body.kind}" → ${body.status}${body.note ? `: ${body.note}` : ""}`,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
  }

  return NextResponse.json({ merchant: m });
}
