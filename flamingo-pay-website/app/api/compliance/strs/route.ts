/**
 * GET  /api/compliance/strs — List all STRs with optional filters.
 * POST /api/compliance/strs — Create a manual STR or update an existing one.
 *
 * Query params (GET): merchantId, status, filed
 * POST body (create): { merchantId, merchantName, description, riskLevel }
 * POST body (update): { strId, status, riskLevel, notes, ficReference }
 *
 * Admin-only (owner or manager).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../lib/api-auth";
import {
  listSTRs,
  updateSTR,
  createManualSTR,
  strStats,
} from "../../../../lib/fica";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const merchantId = url.searchParams.get("merchantId") ?? undefined;
  const status = url.searchParams.get("status") as "draft" | "pending_review" | "filed" | "dismissed" | undefined;
  const filedParam = url.searchParams.get("filed");
  const filed = filedParam === "true" ? true : filedParam === "false" ? false : undefined;
  const includeStats = url.searchParams.get("stats") === "true";

  const strs = await listSTRs({ merchantId, status, filed });
  const stats = includeStats ? await strStats() : undefined;

  return NextResponse.json({ strs, stats });
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
    const reviewerName = session.name || session.email || "admin";

    // Update existing STR
    if (body.strId) {
      const updated = await updateSTR(body.strId, {
        status: body.status,
        riskLevel: body.riskLevel,
        reviewedBy: reviewerName,
        notes: body.notes,
        ficReference: body.ficReference,
      });
      if (!updated) {
        return NextResponse.json({ error: "STR not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, str: updated });
    }

    // Create manual STR
    if (body.merchantId && body.description) {
      const str = await createManualSTR(
        body.merchantId,
        body.merchantName ?? "Unknown",
        body.description,
        body.riskLevel ?? "medium",
        reviewerName,
      );
      return NextResponse.json({ ok: true, str });
    }

    return NextResponse.json(
      { error: "Provide strId (to update) or merchantId + description (to create)" },
      { status: 400 },
    );
  } catch (err) {
    console.error("[STR] API error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
