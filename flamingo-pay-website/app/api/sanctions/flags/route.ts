/**
 * GET  /api/sanctions/flags — List all sanctions flags.
 * POST /api/sanctions/flags — Resolve a flag (clear or block).
 *
 * POST body: { merchantId: string, status: "cleared" | "blocked", note?: string }
 * Admin-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession, requireSession } from "../../../../lib/api-auth";
import {
  listSanctionsFlags,
  resolveSanctionsFlag,
  getSanctionsMeta,
  getPepMeta,
  getPepProviderName,
} from "../../../../lib/sanctions";
import { updateMerchantStatus } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const [flags, meta, pepMeta] = await Promise.all([
    listSanctionsFlags(),
    getSanctionsMeta(),
    getPepMeta(),
  ]);

  return NextResponse.json({
    flags,
    meta,
    pepMeta,
    pepProvider: getPepProviderName(),
  });
}

export async function POST(req: NextRequest) {
  // Compliance officers or admin managers/owners can resolve flags
  const complianceSession = await getSession("compliance");
  const adminSession = await getSession("admin");
  if (!complianceSession && !adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin staff (non-manager) can't resolve — only compliance, admin owners, or admin managers
  if (!complianceSession) {
    const role = adminSession!.adminRole ?? "staff";
    if (role !== "owner" && role !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
  }

  const activeSession = complianceSession ?? adminSession!;

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
      activeSession.name || activeSession.email || "officer",
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
