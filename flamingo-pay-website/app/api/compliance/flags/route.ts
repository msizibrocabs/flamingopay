import { NextRequest, NextResponse } from "next/server";
import {
  listFlags,
  createManualFlag,
  type FlagStatus,
} from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") as FlagStatus | null;
  const merchantId = req.nextUrl.searchParams.get("merchantId") ?? undefined;
  const flags = await listFlags({
    status: status ?? undefined,
    merchantId,
  });
  return NextResponse.json({ flags });
}

export async function POST(req: NextRequest) {
  let body: { merchantId?: string; txnId?: string; note?: string; officerName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.merchantId || !body.txnId) {
    return NextResponse.json({ error: "merchantId and txnId are required" }, { status: 400 });
  }

  const result = await createManualFlag(
    body.merchantId,
    body.txnId,
    body.note ?? "Flagged for review",
    body.officerName ?? "Compliance Officer",
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ flag: result }, { status: 201 });
}
