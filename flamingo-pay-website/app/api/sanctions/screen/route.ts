/**
 * POST /api/sanctions/screen — Screen a name against the sanctions list.
 * Body: { name: string } or { businessName: string, ownerName: string, merchantId?: string }
 * Admin-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../lib/api-auth";
import { screenName, screenMerchant } from "../../../../lib/sanctions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // If businessName + ownerName provided, do a full merchant screen
    if (body.businessName && body.ownerName) {
      const result = await screenMerchant(
        body.merchantId || "manual-check",
        body.businessName,
        body.ownerName,
      );
      return NextResponse.json(result);
    }

    // Single name check
    if (body.name) {
      const result = await screenName(body.name);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Provide 'name' or 'businessName' + 'ownerName'" },
      { status: 400 },
    );
  } catch (err) {
    console.error("[sanctions] Screen error:", err);
    return NextResponse.json(
      { error: "Screening failed" },
      { status: 500 },
    );
  }
}
