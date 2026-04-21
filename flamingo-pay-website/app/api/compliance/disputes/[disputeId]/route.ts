/**
 * GET  /api/compliance/disputes/[disputeId] — Get a single dispute.
 * PATCH /api/compliance/disputes/[disputeId] — Resolve or mark refund done.
 *
 * PATCH body for resolution:
 *   { decision: "refund_full"|"refund_partial"|"reject", note: string, resolvedBy: string, refundAmount?: number }
 *
 * PATCH body for marking refund complete:
 *   { markRefundDone: true }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "../../../../../lib/api-auth";
import {
  getDispute,
  resolveDispute,
  markRefundCompleted,
} from "../../../../../lib/disputes";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> },
) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const { disputeId } = await params;
  const dispute = await getDispute(disputeId);
  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }
  return NextResponse.json({ dispute });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> },
) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const { disputeId } = await params;

  let body: {
    decision?: "refund_full" | "refund_partial" | "reject";
    note?: string;
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
    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }
    return NextResponse.json({ dispute });
  }

  // Resolve dispute
  if (!body.decision || !["refund_full", "refund_partial", "reject"].includes(body.decision)) {
    return NextResponse.json(
      { error: "decision must be one of: refund_full, refund_partial, reject" },
      { status: 400 },
    );
  }

  const dispute = await resolveDispute(disputeId, {
    decision: body.decision,
    note: body.note ?? "",
    resolvedBy: body.resolvedBy ?? "Compliance Officer",
    refundAmount: body.refundAmount,
  });

  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  return NextResponse.json({ dispute });
}
