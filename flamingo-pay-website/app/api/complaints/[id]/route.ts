/**
 * GET   /api/complaints/:id  — Get complaint detail
 * PATCH /api/complaints/:id  — Update complaint (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../lib/api-auth";
import { getComplaint, updateComplaint } from "../../../../lib/complaints";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminSession = await getSession("admin");
  const merchantSession = await getSession("merchant");
  if (!adminSession && !merchantSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const complaint = await getComplaint(id);
  if (!complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  // Merchants can only view their own
  if (merchantSession && !adminSession && complaint.merchantId !== merchantSession.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({ complaint });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const complaint = await updateComplaint(id, {
    status: body.status,
    handler: body.handler,
    outcome: body.outcome,
    outcomeNote: body.outcomeNote,
    level: body.level,
    note: body.note,
    actor: session.name || session.email || "admin",
  });

  if (!complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, complaint });
}
