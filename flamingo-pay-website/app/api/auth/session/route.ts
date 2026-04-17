import { NextRequest, NextResponse } from "next/server";
import { getSession, type SessionRole } from "../../../../lib/api-auth";

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role") as SessionRole | null;

  if (!role || !["merchant", "admin", "compliance"].includes(role)) {
    return NextResponse.json({ error: "Missing or invalid role" }, { status: 400 });
  }

  const session = await getSession(role);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    role: session.role,
    id: session.id,
    name: session.name,
    lastActiveAt: session.lastActiveAt,
  });
}
