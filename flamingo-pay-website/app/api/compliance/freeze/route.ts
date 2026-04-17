import { NextRequest, NextResponse } from "next/server";
import { freezeMerchant, unfreezeMerchant } from "../../../../lib/store";
import { appendAuditLog } from "../../../../lib/audit";
import { requireSession } from "../../../../lib/api-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Only compliance or admin can freeze/unfreeze
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;
  let body: { merchantId?: string; action?: "freeze" | "unfreeze"; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.merchantId) {
    return NextResponse.json({ error: "merchantId is required" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (body.action === "unfreeze") {
    const m = await unfreezeMerchant(body.merchantId);
    if (!m) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    await appendAuditLog({
      action: "merchant_unfrozen", role: "compliance",
      actorId: "compliance", actorName: "Compliance Officer",
      targetId: body.merchantId, targetType: "merchant",
      detail: `Merchant ${body.merchantId} unfrozen`, ip,
    });
    return NextResponse.json({ merchant: m, action: "unfrozen" });
  }

  const reason = body.reason || "Frozen by compliance officer";
  const m = await freezeMerchant(body.merchantId, reason);
  if (!m) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  await appendAuditLog({
    action: "merchant_frozen", role: "compliance",
    actorId: "compliance", actorName: "Compliance Officer",
    targetId: body.merchantId, targetType: "merchant",
    detail: `Merchant ${body.merchantId} frozen: ${reason}`, ip,
  });
  return NextResponse.json({ merchant: m, action: "frozen" });
}
