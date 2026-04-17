import { NextRequest, NextResponse } from "next/server";
import {
  listFlags,
  createManualFlag,
  type FlagStatus,
} from "../../../../lib/store";
import { requireSession } from "../../../../lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Accept either admin or compliance session
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;
  const status = req.nextUrl.searchParams.get("status") as FlagStatus | null;
  const merchantId = req.nextUrl.searchParams.get("merchantId") ?? undefined;
  const flags = await listFlags({
    status: status ?? undefined,
    merchantId,
  });
  return NextResponse.json({ flags });
}

export async function POST(req: NextRequest) {
  let postSession = await requireSession("compliance");
  if (postSession instanceof Response) postSession = await requireSession("admin");
  if (postSession instanceof Response) return postSession;
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
