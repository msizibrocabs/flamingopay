/**
 * GET /api/complaints/stats — Complaint statistics (admin only)
 */

import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/api-auth";
import { complaintStats } from "../../../../lib/complaints";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await complaintStats();
  return NextResponse.json(stats);
}
