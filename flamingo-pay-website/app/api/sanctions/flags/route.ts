/**
 * GET  /api/sanctions/flags — List all sanctions flags.
 * POST /api/sanctions/flags — Resolve a flag (clear or block).
 *
 * POST body: { merchantId: string, status: "cleared" | "blocked", note?: string }
 * Admin-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../lib/api-auth";
import {
  listSanctionsFlags,
  resolveSanctionsFlag,
  getSanctionsMeta,
} from "../../../../lib/sanctions";
import { updateMerchantStatus } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [flags, meta] = await Promise.all([
    listSanctionsFlags(),
    getSanctionsMeta(),
  ]);

  return NextResponse.json({ flags, meta });
}

export async function POST(req: NextRequest) {
  const session = await getSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.adminRole ?? "staff";
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { merchantId, status, note } = body;

    if (!merchantId || !status || !["cleared", "blocked"].includes(status)) {
      return NextResponse.json(
        { error: "Provide merchantId and status ('cleared' or 'blocked')" },
        { status: 400 },
      );
    }

    const flag = await resolveSanctionsFlag(
      merchantId,
      status,
      session.name || session.email || "admin",
      note,
    );

    if (!flag) {
      return NextResponse.json({ error: "Flag not found" }, { status: 404 });
    }

    // If blocked, also suspend the merchant
    if (status === "blocked") {
      await updateMerchantStatus(merchantId, "rejected", "Sanctions match — blocked by compliance officer");
    }

    return NextResponse.json({ ok: true, flag });
  } catch (err) {
    console.error("[sanctions] Resolve flag error:", err);
    return NextResponse.json(
      { error: "Failed to update flag" },
      { status: 500 },
    );
  }
}
