/**
 * GET  /api/compliance/ctrs — List all CTRs with optional filters.
 * POST /api/compliance/ctrs — Mark a CTR as filed with the FIC.
 *
 * Query params (GET): merchantId, filed (true/false)
 * POST body: { ctrId }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "../../../../lib/api-auth";
import { listCTRs, markCTRFiled } from "../../../../lib/fica";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const sp = req.nextUrl.searchParams;
  const merchantId = sp.get("merchantId") ?? undefined;
  const filedParam = sp.get("filed");
  const filed = filedParam === "true" ? true : filedParam === "false" ? false : undefined;

  const ctrs = await listCTRs({ merchantId, filed });

  const pendingCount = ctrs.filter(c => !c.filedWithFIC).length;
  const filedCount = ctrs.filter(c => c.filedWithFIC).length;

  return NextResponse.json({
    ctrs,
    stats: { total: ctrs.length, pending: pendingCount, filed: filedCount },
  });
}

export async function POST(req: NextRequest) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  let body: { ctrId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.ctrId) {
    return NextResponse.json({ error: "ctrId is required" }, { status: 400 });
  }

  const ok = await markCTRFiled(body.ctrId);
  if (!ok) {
    return NextResponse.json({ error: "CTR not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
