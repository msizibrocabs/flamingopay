import { NextRequest, NextResponse } from "next/server";
import { destroySession, getSession, type SessionRole } from "../../../../lib/api-auth";
import { appendAuditLog } from "../../../../lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role } = body as { role?: SessionRole };

    if (!role) {
      return NextResponse.json({ error: "Missing role" }, { status: 400 });
    }

    const session = await getSession(role);
    if (session) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      await appendAuditLog({
        action: "logout",
        role,
        actorId: session.id,
        actorName: session.name,
        detail: `${role} logout`,
        ip,
      });
    }

    await destroySession(role);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
