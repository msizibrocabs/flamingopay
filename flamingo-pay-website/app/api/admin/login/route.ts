/**
 * POST /api/admin/login — Authenticate admin staff with email + password.
 * Creates a server-side session cookie on success.
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateStaff } from "../../../../lib/admin-staff";
import { createSession } from "../../../../lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const result = await authenticateStaff(email, password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const { member } = result;

    // Create server-side session with role info
    await createSession("admin", member.id, member.name, {
      adminRole: member.role,
      email: member.email,
    });

    return NextResponse.json({
      ok: true,
      staff: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
      },
    });
  } catch (err) {
    console.error("[admin/login] Error:", err);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
