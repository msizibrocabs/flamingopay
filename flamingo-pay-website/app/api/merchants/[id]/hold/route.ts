/**
 * POST /api/merchants/[id]/hold — Place or lift a transaction hold on a merchant.
 * Body: { action: "hold" | "release", reason?: string }
 *
 * PUT /api/merchants/[id]/hold — Update velocity limits.
 * Body: { maxTxnPerHour?, maxDailyVolume?, maxSingleTxn? }
 *
 * GET /api/merchants/[id]/hold — Get current hold status and velocity limits.
 *
 * Admin-only (owner or manager).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../../lib/api-auth";
import { getMerchant, updateMerchantFields, DEFAULT_VELOCITY } from "../../../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const m = await getMerchant(id);
  if (!m) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });

  const defaults = DEFAULT_VELOCITY[m.kycTier ?? "simplified"];
  const active = { ...defaults, ...(m.velocityLimits ?? {}) };

  return NextResponse.json({
    transactionHold: m.transactionHold ?? false,
    holdReason: m.holdReason,
    holdSetBy: m.holdSetBy,
    holdSetAt: m.holdSetAt,
    velocityLimits: active,
    velocityDefaults: defaults,
    velocityOverrides: m.velocityLimits ?? null,
    kycTier: m.kycTier,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.adminRole ?? "staff";
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, reason } = body;

  if (action === "hold") {
    await updateMerchantFields(id, {
      transactionHold: true,
      holdReason: reason ?? "Compliance review",
      holdSetBy: session.name || session.email || "admin",
      holdSetAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, action: "hold" });
  }

  if (action === "release") {
    await updateMerchantFields(id, {
      transactionHold: false,
      holdReason: undefined,
      holdSetBy: undefined,
      holdSetAt: undefined,
    });
    return NextResponse.json({ ok: true, action: "release" });
  }

  return NextResponse.json({ error: "action must be 'hold' or 'release'" }, { status: 400 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.adminRole ?? "staff";
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const limits: Record<string, number | undefined> = {};

  if (typeof body.maxTxnPerHour === "number") limits.maxTxnPerHour = body.maxTxnPerHour;
  if (typeof body.maxDailyVolume === "number") limits.maxDailyVolume = body.maxDailyVolume;
  if (typeof body.maxSingleTxn === "number") limits.maxSingleTxn = body.maxSingleTxn;

  if (Object.keys(limits).length === 0) {
    return NextResponse.json({ error: "Provide at least one limit" }, { status: 400 });
  }

  const m = await getMerchant(id);
  if (!m) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });

  const merged = { ...(m.velocityLimits ?? {}), ...limits };
  await updateMerchantFields(id, { velocityLimits: merged });

  return NextResponse.json({ ok: true, velocityLimits: merged });
}
