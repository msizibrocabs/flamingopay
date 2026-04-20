/**
 * GET /api/dsar/lookup?ref=DSAR-XXXXXX — Public lookup by reference.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDsarByRef, markDsarDownloaded } from "../../../../lib/dsar";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "Missing ref parameter." }, { status: 400 });
  }

  const dsar = await getDsarByRef(ref);
  if (!dsar) {
    return NextResponse.json({ error: "Request not found. Check your reference number." }, { status: 404 });
  }

  // Public response — limited info
  const response: Record<string, unknown> = {
    ref: dsar.ref,
    requestType: dsar.requestType ?? "access",
    status: dsar.status,
    requesterType: dsar.requesterType,
    fullName: dsar.fullName,
    createdAt: dsar.createdAt,
    deadline: dsar.deadline,
    updatedAt: dsar.updatedAt,
  };

  // If data export is ready (access request), include for download
  if (dsar.status === "ready" && dsar.dataExport) {
    response.dataExport = dsar.dataExport;
  }

  // If deletion is complete, include the report
  if (dsar.status === "ready" && dsar.deletionReport) {
    response.deletionReport = dsar.deletionReport;
  }

  return NextResponse.json({ dsar: response });
}

/** POST to mark as downloaded. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ref } = body;
    if (!ref) return NextResponse.json({ error: "Missing ref." }, { status: 400 });

    const dsar = await getDsarByRef(ref);
    if (!dsar) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const updated = await markDsarDownloaded(dsar.id);
    if (!updated) return NextResponse.json({ error: "Cannot mark as downloaded." }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
