/**
 * POST /api/sanctions/refresh — Refresh the sanctions list from OpenSanctions.
 * Admin-only (owner or manager).
 */

import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/api-auth";
import { refreshSanctionsList } from "../../../../lib/sanctions";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for fetching external data

export async function POST() {
  const session = await getSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = session.adminRole ?? "staff";
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const meta = await refreshSanctionsList();
    return NextResponse.json({ ok: true, meta });
  } catch (err) {
    console.error("[sanctions] Refresh error:", err);
    return NextResponse.json(
      { error: "Failed to refresh sanctions list" },
      { status: 500 },
    );
  }
}
