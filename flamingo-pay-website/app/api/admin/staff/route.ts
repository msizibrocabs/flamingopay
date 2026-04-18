/**
 * Staff management API — Owner only.
 *
 * GET  /api/admin/staff         — List all staff members
 * POST /api/admin/staff         — Create a new staff member
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "../../../../lib/api-auth";
import {
  listStaffMembers,
  createStaffMember,
  type AdminRole,
} from "../../../../lib/admin-staff";

const VALID_ROLES: AdminRole[] = ["owner", "manager", "staff"];

export async function GET() {
  const session = await requireAdminRole("owner");
  if (session instanceof Response) return session;

  const members = await listStaffMembers();
  // Strip password hashes from response
  const safe = members.map(m => ({
    id: m.id,
    email: m.email,
    name: m.name,
    role: m.role,
    active: m.active,
    createdAt: m.createdAt,
    createdBy: m.createdBy,
    lastLoginAt: m.lastLoginAt,
    deactivatedAt: m.deactivatedAt,
  }));

  return NextResponse.json({ staff: safe });
}

export async function POST(req: NextRequest) {
  const session = await requireAdminRole("owner");
  if (session instanceof Response) return session;

  try {
    const body = await req.json();
    const { email, name, role, password } = body as {
      email?: string;
      name?: string;
      role?: string;
      password?: string;
    };

    if (!email || !name || !role || !password) {
      return NextResponse.json(
        { error: "email, name, role, and password are all required." },
        { status: 400 },
      );
    }

    if (!VALID_ROLES.includes(role as AdminRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    const result = await createStaffMember({
      email,
      name,
      role: role as AdminRole,
      password,
      createdBy: session.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({
      ok: true,
      staff: {
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role,
        active: result.active,
        createdAt: result.createdAt,
      },
    });
  } catch (err) {
    console.error("[admin/staff] Create error:", err);
    return NextResponse.json({ error: "Failed to create staff member." }, { status: 500 });
  }
}
