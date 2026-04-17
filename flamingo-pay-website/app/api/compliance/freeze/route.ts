import { NextRequest, NextResponse } from "next/server";
import { freezeMerchant, unfreezeMerchant } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { merchantId?: string; action?: "freeze" | "unfreeze"; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.merchantId) {
    return NextResponse.json({ error: "merchantId is required" }, { status: 400 });
  }

  if (body.action === "unfreeze") {
    const m = await unfreezeMerchant(body.merchantId);
    if (!m) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    return NextResponse.json({ merchant: m, action: "unfrozen" });
  }

  const reason = body.reason || "Frozen by compliance officer";
  const m = await freezeMerchant(body.merchantId, reason);
  if (!m) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  return NextResponse.json({ merchant: m, action: "frozen" });
}
