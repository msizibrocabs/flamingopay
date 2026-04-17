import { NextRequest, NextResponse } from "next/server";
import { getAuditLog, type AuditAction } from "../../../../lib/audit";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const action = sp.get("action") as AuditAction | null;
  const role = sp.get("role") ?? undefined;
  const actorId = sp.get("actorId") ?? undefined;
  const targetId = sp.get("targetId") ?? undefined;
  const limit = parseInt(sp.get("limit") ?? "200", 10);

  const entries = await getAuditLog({
    action: action ?? undefined,
    role,
    actorId,
    targetId,
    limit,
  });

  return NextResponse.json({ entries, total: entries.length });
}
