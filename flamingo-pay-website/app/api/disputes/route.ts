/**
 * POST /api/disputes — File a new dispute (public, no auth required).
 * GET  /api/disputes — List all disputes (compliance/admin only).
 */

import { NextRequest, NextResponse } from "next/server";
import { createDispute, listDisputes, type DisputeStatus } from "../../../lib/disputes";
import { requireSession } from "../../../lib/api-auth";

export const dynamic = "force-dynamic";

/** File a new dispute — public endpoint (buyer-facing). */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txnId, txnRef, merchantId, merchantName, amount, txnDate, buyerPhone, buyerEmail, reason, description, evidenceUrl } = body;

    if (!txnId || !merchantId || !reason || !description) {
      return NextResponse.json({ error: "Missing required fields: txnId, merchantId, reason, description." }, { status: 400 });
    }

    const result = await createDispute({
      txnId,
      txnRef: txnRef ?? "",
      merchantId,
      merchantName: merchantName ?? "",
      amount: Number(amount) || 0,
      txnDate: txnDate ?? new Date().toISOString(),
      buyerPhone,
      buyerEmail,
      reason,
      description,
      evidenceUrl,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ dispute: result }, { status: 201 });
  } catch (err) {
    console.error("[disputes] Create error:", err);
    return NextResponse.json({ error: "Failed to create dispute." }, { status: 500 });
  }
}

/** List all disputes — compliance/admin only. */
export async function GET(req: NextRequest) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const status = req.nextUrl.searchParams.get("status") as DisputeStatus | null;
  const merchantId = req.nextUrl.searchParams.get("merchantId") ?? undefined;

  const disputes = await listDisputes({
    status: status ?? undefined,
    merchantId,
  });

  return NextResponse.json({ disputes });
}
