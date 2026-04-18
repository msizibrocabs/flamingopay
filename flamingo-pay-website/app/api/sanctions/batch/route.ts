/**
 * POST /api/sanctions/batch — Batch re-screen all merchants.
 * Admin-only (owner or manager).
 */

import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/api-auth";
import { batchScreenMerchants } from "../../../../lib/sanctions";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Batch screening can take a while

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
    const result = await batchScreenMerchants();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[sanctions] Batch screen error:", err);
    return NextResponse.json(
      { error: "Batch screening failed" },
      { status: 500 },
    );
  }
}
