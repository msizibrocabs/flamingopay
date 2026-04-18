import { NextRequest, NextResponse } from "next/server";
import { getMerchantByPhone } from "../../../../lib/store";

export const dynamic = "force-dynamic";

/** GET /api/merchants/check-phone?phone=+27... — check if phone is already registered. */
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const merchant = await getMerchantByPhone(phone);
  // Only return whether it exists — never expose merchant details
  return NextResponse.json({ exists: !!merchant });
}
