/**
 * GET    /api/disputes/:id — Get dispute details (compliance/admin).
 * PATCH  /api/disputes/:id — Update dispute (merchant respond, compliance resolve).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getDispute,
  merchantRespondToDispute,
  resolveDispute,
  markRefundCompleted,
} from "../../../../lib/disputes";
import { requireSession } from "../../../../lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> },
) {
  const { disputeId } = await params;
  // Allow both compliance and admin
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const dispute = await getDispute(disputeId);
  if (!dispute) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ dispute });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> },
) {
  const { disputeId } = await params;

  let body: {
    action?: string;
    note?: string;
    partialAmount?: number;
    decision?: string;
    resolvedBy?: string;
    refundAmount?: number;
    markRefundDone?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Mark refund as completed
  if (body.markRefundDone) {
    const dispute = await markRefundCompleted(disputeId);
    if (!dispute) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ dispute });
  }

  // Merchant response (accept / reject / partial)
  if (body.action && ["accept", "reject", "partial"].includes(body.action)) {
    const dispute = await merchantRespondToDispute(disputeId, {
      action: body.action as "accept" | "reject" | "partial",
      note: body.note ?? "",
      partialAmount: body.partialAmount,
    });
    if (!dispute) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ dispute });
  }

  // Compliance resolution
  if (body.decision && ["refund_full", "refund_partial", "reject"].includes(body.decision)) {
    let session = await requireSession("compliance");
    if (session instanceof Response) session = await requireSession("admin");
    if (session instanceof Response) return session;

    const dispute = await resolveDispute(disputeId, {
      decision: body.decision as "refund_full" | "refund_partial" | "reject",
      note: body.note ?? "",
      resolvedBy: body.resolvedBy ?? "Compliance Officer",
      refundAmount: body.refundAmount,
    });
    if (!dispute) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ dispute });
  }

  return NextResponse.json({ error: "Invalid action or decision." }, { status: 400 });
}
