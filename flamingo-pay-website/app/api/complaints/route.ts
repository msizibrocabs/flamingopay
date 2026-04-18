/**
 * GET  /api/complaints?merchantId=...&status=...&category=...  — List complaints
 * POST /api/complaints  — Create a new complaint
 *
 * Accepts either admin session auth OR merchantId param (matching existing merchant API pattern).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../lib/api-auth";
import { getMerchant } from "../../../lib/store";
import {
  createComplaint,
  listComplaints,
  type ComplaintCategory,
  type ComplaintStatus,
  CATEGORY_LABELS,
} from "../../../lib/complaints";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const merchantId = url.searchParams.get("merchantId") || undefined;
  const status = url.searchParams.get("status") as ComplaintStatus | undefined;
  const category = url.searchParams.get("category") as ComplaintCategory | undefined;

  // Admin can list all; merchant-scoped requests must provide merchantId
  const adminSession = await getSession("admin");
  const effectiveMerchantId = adminSession ? merchantId : merchantId;

  // If no admin session and no merchantId, reject
  if (!adminSession && !merchantId) {
    return NextResponse.json({ error: "Provide merchantId" }, { status: 400 });
  }

  const complaints = await listComplaints({
    merchantId: effectiveMerchantId,
    status: status || undefined,
    category: category || undefined,
  });

  return NextResponse.json({ complaints });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { merchantId, complainantName, complainantEmail, complainantPhone, category, subject, description, relatedTxnId } = body;

    if (!subject || !description || !category) {
      return NextResponse.json(
        { error: "Subject, description, and category are required" },
        { status: 400 },
      );
    }

    if (!CATEGORY_LABELS[category as ComplaintCategory]) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    if (!merchantId) {
      return NextResponse.json({ error: "merchantId is required" }, { status: 400 });
    }

    // Look up merchant to get the business name
    const merchant = await getMerchant(merchantId);
    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const complaint = await createComplaint({
      merchantId,
      merchantName: merchant.businessName,
      complainantName: complainantName || merchant.ownerName,
      complainantEmail: complainantEmail || undefined,
      complainantPhone: complainantPhone || merchant.phone,
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
