/**
 * GET    /api/compliance/dsar/:id — Get full DSAR details.
 * PATCH  /api/compliance/dsar/:id — Update DSAR (verify, process, reject, add note, close).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getDsar,
  verifyDsar,
  rejectDsar,
  addDsarNote,
  completeDsarExport,
  collectPersonalData,
  completeDeletion,
  closeDsar,
} from "../../../../../lib/dsar";
import { requireSession } from "../../../../../lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ dsarId: string }> },
) {
  const { dsarId } = await params;
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const dsar = await getDsar(dsarId);
  if (!dsar) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ dsar });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ dsarId: string }> },
) {
  const { dsarId } = await params;
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  let body: {
    action?: string;
    officer?: string;
    reason?: string;
    noteText?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const officer = body.officer ?? "Compliance Officer";

  // Verify identity
  if (body.action === "verify") {
    const dsar = await verifyDsar(dsarId, officer);
    if (!dsar) return NextResponse.json({ error: "Cannot verify — not in 'new' status." }, { status: 400 });
    return NextResponse.json({ dsar });
  }

  // Process — collect data and generate export (access) or execute deletion (deletion)
  if (body.action === "process") {
    const dsar = await getDsar(dsarId);
    if (!dsar) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!["verified", "new"].includes(dsar.status)) {
      return NextResponse.json({ error: "Request must be verified before processing." }, { status: 400 });
    }

    if ((dsar.requestType ?? "access") === "deletion") {
      // Execute deletion with FICA retention
      const updated = await completeDeletion(dsarId, officer);
      if (!updated) return NextResponse.json({ error: "Failed to process deletion." }, { status: 500 });
      return NextResponse.json({ dsar: updated });
    } else {
      // Collect all personal data for access request
      const dataExport = await collectPersonalData(dsar);
      const updated = await completeDsarExport(dsarId, officer, dataExport);
      if (!updated) return NextResponse.json({ error: "Failed to generate export." }, { status: 500 });
      return NextResponse.json({ dsar: updated });
    }
  }

  // Reject
  if (body.action === "reject") {
    const reason = body.reason ?? "Request rejected.";
    const dsar = await rejectDsar(dsarId, officer, reason);
    if (!dsar) return NextResponse.json({ error: "Cannot reject." }, { status: 400 });
    return NextResponse.json({ dsar });
  }

  // Add note
  if (body.action === "note" && body.noteText) {
    const dsar = await addDsarNote(dsarId, officer, body.noteText);
    if (!dsar) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ dsar });
  }

  // Close
  if (body.action === "close") {
    const dsar = await closeDsar(dsarId);
    if (!dsar) return NextResponse.json({ error: "Cannot close." }, { status: 400 });
    return NextResponse.json({ dsar });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
