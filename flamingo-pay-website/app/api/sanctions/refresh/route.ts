/**
 * POST /api/sanctions/refresh — Refresh sanctions + PEP lists from OpenSanctions.
 * Admin-only (owner or manager).
 */

import { NextResponse } from "next/server";
import { getSession, requireSession } from "../../../../lib/api-auth";
import { refreshSanctionsList, refreshPepList } from "../../../../lib/sanctions";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Allow up to 120s for fetching both datasets

export async function POST() {
  const complianceSession = await getSession("compliance");
  const adminSession = await getSession("admin");
  if (!complianceSession && !adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!complianceSession) {
    const role = adminSession!.adminRole ?? "staff";
    if (role !== "owner" && role !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
  }

  try {
    // Refresh both sanctions and PEP lists in parallel
    const [sanctionsMeta, pepMeta] = await Promise.all([
      refreshSanctionsList(),
      refreshPepList(),
    ]);

    return NextResponse.json({
      ok: true,
      meta: sanctionsMeta,
      pepMeta,
    });
  } catch (err) {
    console.error("[sanctions] Refresh error:", err);
    return NextResponse.json(
      { error: "Failed to refresh lists" },
      { status: 500 },
    );
  }
}
