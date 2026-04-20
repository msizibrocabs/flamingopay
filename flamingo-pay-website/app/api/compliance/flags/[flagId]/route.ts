import { NextRequest, NextResponse } from "next/server";
import { getFlag, updateFlag, type FlagStatus } from "../../../../../lib/store";
import { requireSession } from "../../../../../lib/api-auth";
import { appendAuditLog } from "../../../../../lib/audit";

export const dynamic = "force-dynamic";

const VALID_STATUSES: FlagStatus[] = ["open", "investigating", "cleared", "confirmed"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ flagId: string }> },
) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const { flagId } = await params;
  const flag = await getFlag(flagId);
  if (!flag) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ flag });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ flagId: string }> },
) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const { flagId } = await params;
  let body: { status?: FlagStatus; officerNote?: string; resolvedBy?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const flag = await updateFlag(flagId, body);
  if (!flag) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const actionMap: Record<string, string> = { cleared: "flag_cleared", confirmed: "flag_confirmed" };
  await appendAuditLog({
    action: (actionMap[body.status ?? ""] ?? "flag_updated") as import("../../../../../lib/audit").AuditAction,
    role: "compliance",
    actorId: body.resolvedBy ?? "officer",
    actorName: body.resolvedBy ?? "Compliance Officer",
    targetId: flagId,
    targetType: "flag",
    detail: `Flag ${flagId} → ${body.status ?? "updated"}${body.officerNote ? `: ${body.officerNote}` : ""}`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return NextResponse.json({ flag });
}
