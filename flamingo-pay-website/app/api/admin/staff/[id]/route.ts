/**
 * Staff member management — Owner only.
 *
 * PATCH  /api/admin/staff/:id — Update staff (name, role, password, active)
 * DELETE /api/admin/staff/:id — Remove staff member
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "../../../../../lib/api-auth";
import {
  getStaffMember,
  updateStaffMember,
  deleteStaffMember,
  type AdminRole,
} from "../../../../../lib/admin-staff";

const VALID_ROLES: AdminRole[] = ["owner", "manager", "staff"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminRole("owner");
  if (session instanceof Response) return session;

  const { id } = await params;

  // Prevent self-demotion/deactivation
  if (id === session.id) {
    const body = await req.json();
    if (body.active === false) {
      return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 });
    }
    if (body.role && body.role !== session.adminRole) {
      return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
    }
    // Allow name/password change for self
    const updated = await updateStaffMember(id, {
      ...(body.name ? { name: body.name } : {}),
      ...(body.password ? { password: body.password } : {}),
    });
    if (!updated) return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
    return NextResponse.json({ ok: true, staff: { id: updated.id, name: updated.name, role: updated.role, active: updated.active } });
  }

  try {
    const body = await req.json();
    const patch: { name?: string; role?: AdminRole; password?: string; active?: boolean } = {};

    if (body.name) patch.name = body.name;
    if (body.role) {
      if (!VALID_ROLES.includes(body.role)) {
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });
      }
      patch.role = body.role;
    }
    if (body.password) {
      if (body.password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
      }
      patch.password = body.password;
    }
    if (body.active !== undefined) patch.active = body.active;

    const updated = await updateStaffMember(id, patch);
    if (!updated) {
      return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      staff: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        active: updated.active,
      },
    });
  } catch (err) {
    console.error("[admin/staff] Update error:", err);
    return NextResponse.json({ error: "Failed to update staff member." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminRole("owner");
  if (session instanceof Response) return session;

  const { id } = await params;

  // Can't delete yourself
  if (id === session.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  const member = await getStaffMember(id);
  if (!member) {
    return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
  }

  await deleteStaffMember(id);
  return NextResponse.json({ ok: true, deleted: id });
}
