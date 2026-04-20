import { NextRequest, NextResponse } from "next/server";
import {
  listEDDCases,
  openEDDCase,
  getEDDStats,
  type EDDTrigger,
  type EDDStatus,
} from "../../../../lib/edd";
import { requireSession } from "../../../../lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/compliance/edd
 * List EDD cases. Optional filters: ?status=opened&trigger=pep_identified
 * Add ?stats=true to get dashboard statistics.
 */
export async function GET(req: NextRequest) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const wantStats = req.nextUrl.searchParams.get("stats") === "true";

  if (wantStats) {
    const stats = await getEDDStats();
    return NextResponse.json({ stats });
  }

  const status = req.nextUrl.searchParams.get("status") as EDDStatus | null;
  const trigger = req.nextUrl.searchParams.get("trigger") as EDDTrigger | null;

  const cases = await listEDDCases({
    status: status ?? undefined,
    trigger: trigger ?? undefined,
  });

  return NextResponse.json({ cases, count: cases.length });
}

/**
 * POST /api/compliance/edd
 * Open a new EDD case (manual referral or system trigger).
 */
export async function POST(req: NextRequest) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  let body: {
    merchantId?: string;
    merchantName?: string;
    ownerName?: string;
    trigger?: EDDTrigger;
    triggerDetail?: string;
    riskLevel?: "high" | "critical";
    openedBy?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.merchantId || !body.merchantName || !body.ownerName || !body.trigger || !body.triggerDetail) {
    return NextResponse.json(
      { error: "merchantId, merchantName, ownerName, trigger, and triggerDetail are required" },
      { status: 400 },
    );
  }

  const eddCase = await openEDDCase({
    merchantId: body.merchantId,
    merchantName: body.merchantName,
    ownerName: body.ownerName,
    trigger: body.trigger,
    triggerDetail: body.triggerDetail,
    riskLevel: body.riskLevel,
    openedBy: body.openedBy ?? "Compliance Officer",
  });

  return NextResponse.json({ case: eddCase }, { status: 201 });
}
