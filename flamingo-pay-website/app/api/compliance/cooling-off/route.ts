/**
 * GET  /api/compliance/cooling-off — List cooling-off cancellation requests + stats.
 * POST /api/compliance/cooling-off — Resolve a request (approve/reject).
 *
 * POST body: { requestId: string, decision: "approved"|"rejected", note?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "../../../../lib/api-auth";
import {
  listCoolingOffRequests,
  coolingOffStats,
  resolveCoolingOffRequest,
  getCoolingOffRequest,
} from "../../../../lib/cooling-off";
import { listTransactions, refundTransaction } from "../../../../lib/store";
import { appendAuditLog } from "../../../../lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const status = req.nextUrl.searchParams.get("status") as "pending" | "approved" | "rejected" | null;

  const [requests, stats] = await Promise.all([
    listCoolingOffRequests({ status: status ?? undefined }),
    coolingOffStats(),
  ]);

  return NextResponse.json({ requests, stats });
}

export async function POST(req: NextRequest) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  let body: { requestId?: string; decision?: "approved" | "rejected"; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { requestId, decision, note } = body;
  if (!requestId || !decision || !["approved", "rejected"].includes(decision)) {
    return NextResponse.json(
      { error: "Provide requestId and decision ('approved' or 'rejected')" },
      { status: 400 },
    );
  }

  const existing = await getCoolingOffRequest(requestId);
  if (!existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (existing.status !== "pending") {
    return NextResponse.json(
      { error: `Request already ${existing.status}` },
      { status: 400 },
    );
  }

  const resolverName = (session as any).name ?? (session as any).email ?? "Compliance Officer";

  const resolved = await resolveCoolingOffRequest(requestId, decision, resolverName, note);

  // If approved, process the refund
  if (decision === "approved" && resolved) {
    try {
      await refundTransaction(
        resolved.merchantId,
        resolved.transactionId,
        resolved.amount,
        `ECT Act s44 cooling-off cancellation (${resolved.id})`,
      );
    } catch (err) {
      console.error("[cooling-off] Refund processing error:", err);
    }
  }

  // Audit
  await appendAuditLog({
    action: "transaction_refunded",
    role: "compliance",
    actorId: resolverName,
    actorName: resolverName,
    targetId: existing.transactionId,
    targetType: "transaction",
    detail: `Cooling-off request ${requestId} ${decision}: ${existing.transactionRef} R${existing.amount.toFixed(2)}${note ? ` — ${note}` : ""}`,
    metadata: { coolingOffRequestId: requestId, decision, merchantId: existing.merchantId },
  });

  return NextResponse.json({ ok: true, request: resolved });
}
