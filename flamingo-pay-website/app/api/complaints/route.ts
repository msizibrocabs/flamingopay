/**
 * GET  /api/complaints?merchantId=...&status=...&category=...  — List complaints
 * POST /api/complaints  — Create a new complaint (merchant-facing)
 *
 * Both merchant auth and admin auth are accepted for GET.
 * POST requires merchant auth OR admin auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../lib/api-auth";
import {
  createComplaint,
  listComplaints,
  type ComplaintCategory,
  type ComplaintStatus,
  CATEGORY_LABELS,
} from "../../../lib/complaints";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Accept either admin or merchant session
  const adminSession = await getSession("admin");
  const merchantSession = await getSession("merchant");

  if (!adminSession && !merchantSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const merchantId = url.searchParams.get("merchantId") || undefined;
  const status = url.searchParams.get("status") as ComplaintStatus | undefined;
  const category = url.searchParams.get("category") as ComplaintCategory | undefined;

  // Merchants can only see their own complaints
  const effectiveMerchantId = merchantSession && !adminSession
    ? merchantSession.id
    : merchantId;

  const complaints = await listComplaints({
    merchantId: effectiveMerchantId,
    status: status || undefined,
    category: category || undefined,
  });

  return NextResponse.json({ complaints });
}

export async function POST(req: NextRequest) {
  const adminSession = await getSession("admin");
  const merchantSession = await getSession("merchant");

  if (!adminSession && !merchantSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { merchantId, merchantName, complainantName, complainantEmail, complainantPhone, category, subject, description, relatedTxnId } = body;

    if (!subject || !description || !category) {
      return NextResponse.json(
        { error: "Subject, description, and category are required" },
        { status: 400 },
      );
    }

    if (!CATEGORY_LABELS[category as ComplaintCategory]) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // If merchant session, use their info
    const effectiveMerchantId = merchantSession ? merchantSession.id : merchantId;
    const effectiveMerchantName = merchantSession ? (merchantSession.name || merchantId) : merchantName;

    if (!effectiveMerchantId) {
      return NextResponse.json({ error: "merchantId is required" }, { status: 400 });
    }

    const complaint = await createComplaint({
      merchantId: effectiveMerchantId,
      merchantName: effectiveMerchantName || effectiveMerchantId,
      complainantName: complainantName || merchantSession?.name || "Merchant",
      complainantEmail,
      complainantPhone,
      category,
      subject,
      description,
      relatedTxnId,
    });

    return NextResponse.json({ ok: true, complaint }, { status: 201 });
  } catch (err) {
    console.error("[complaints] Create error:", err);
    return NextResponse.json({ error: "Failed to create complaint" }, { status: 500 });
  }
}
