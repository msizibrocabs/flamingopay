/**
 * POST /api/sanctions/screen — Screen a name against sanctions + PEP lists.
 * Body: { name: string } or { businessName: string, ownerName: string, merchantId?: string }
 * Admin-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../lib/api-auth";
import { screenName, screenNamePep, screenMerchant } from "../../../../lib/sanctions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // If businessName + ownerName provided, do a full merchant screen (sanctions + PEP)
    if (body.businessName && body.ownerName) {
      const result = await screenMerchant(
        body.merchantId || "manual-check",
        body.businessName,
        body.ownerName,
      );
      return NextResponse.json(result);
    }

    // Single name check — run both sanctions and PEP
    if (body.name) {
      const [sanctionsResult, pepResult] = await Promise.all([
        screenName(body.name),
        screenNamePep(body.name),
      ]);

      // Merge results
      const entries = [...sanctionsResult.entries, ...pepResult.entries]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      const highestScore = Math.max(sanctionsResult.score, pepResult.score);

      return NextResponse.json({
        matched: sanctionsResult.matched || pepResult.matched,
        score: highestScore,
        matchType: highestScore >= 95 ? "exact" : highestScore >= 70 ? "fuzzy" : highestScore >= 50 ? "partial" : "none",
        matchedName: body.name,
        entries,
        sanctionsMatched: sanctionsResult.matched,
        pepMatched: pepResult.matched,
      });
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
