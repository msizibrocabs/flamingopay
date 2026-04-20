/**
 * POST /api/compliance/login — Authenticate compliance staff with email + password.
 * Creates a server-side session cookie on success.
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateComplianceStaff } from "../../../../lib/compliance-staff";
import { createSession } from "../../../../lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const result = await authenticateComplianceStaff(email, password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const { member } = result;

    // Create server-side compliance session
    await createSession("compliance", member.id, member.name);

    return NextResponse.json({
      ok: true,
      officer: {
        id: member.id,
        name: member.name,
        email: member.email,
      },
    });
  } catch (err) {
    console.error("[compliance/login] Error:", err);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
