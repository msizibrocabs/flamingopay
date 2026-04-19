/**
 * GET /api/cron/sanctions-refresh — Daily automated refresh of sanctions & PEP lists.
 *
 * Called by Vercel Cron (vercel.json) every day at 03:00 SAST (01:00 UTC).
 * Secured with CRON_SECRET to prevent unauthorized access.
 *
 * This ensures sanctions and PEP lists are always current without manual intervention.
 */

import { NextRequest, NextResponse } from "next/server";
import { refreshSanctionsList, refreshPepList } from "../../../../lib/sanctions";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Allow up to 120s for fetching both datasets

export async function GET(req: NextRequest) {
  // Verify the request is from Vercel Cron or has the correct secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  console.log(`[cron] Sanctions & PEP refresh started at ${startedAt}`);

  try {
    const [sanctionsMeta, pepMeta] = await Promise.all([
      refreshSanctionsList(),
      refreshPepList(),
    ]);

    const result = {
      ok: true,
      startedAt,
      completedAt: new Date().toISOString(),
      sanctions: {
        totalEntries: sanctionsMeta.totalEntries,
        sources: sanctionsMeta.sources,
        durationMs: sanctionsMeta.refreshDurationMs,
      },
      pep: {
        totalEntries: pepMeta.totalEntries,
        sources: pepMeta.sources,
        durationMs: pepMeta.refreshDurationMs,
      },
    };

    console.log(`[cron] Sanctions refresh complete:`, JSON.stringify(result));
    return NextResponse.json(result);
  } catch (err) {
    console.error("[cron] Sanctions refresh failed:", err);
    return NextResponse.json(
      {
        error: "Refresh failed",
        startedAt,
        failedAt: new Date().toISOString(),
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
