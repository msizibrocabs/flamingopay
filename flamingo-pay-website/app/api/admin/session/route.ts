/**
 * GET  /api/admin/session — Check current admin session (returns staff info + role).
 * POST /api/admin/session — Alias for login (redirects to /api/admin/login).
 * DELETE /api/admin/session — Sign out (destroy session).
 */

import { NextResponse } from "next/server";
import { getSession, destroySession } from "../../../../lib/api-auth";

export async function GET() {
  const session = await getSession("admin");
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    staff: {
      id: session.id,
      name: session.name,
      email: session.email,
      role: session.adminRole ?? "staff",
    },
  });
}

export async function DELETE() {
  await destroySession("admin");
  return NextResponse.json({ ok: true });
}
