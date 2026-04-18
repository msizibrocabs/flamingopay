/**
 * Admin (Flamingo staff) client-side session helpers.
 *
 * Session state is managed server-side via httpOnly cookies.
 * This module provides client-side wrappers that call the session API.
 */

import type { AdminRole } from "./admin-staff";

const ADMIN_KEY = "flamingo_admin_session";

export type AdminSession = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  signedInAt: string;
};

/** Store session info client-side (for UI display — auth is via httpOnly cookie). */
export function adminSignIn(staff: { id: string; name: string; email: string; role: AdminRole }) {
  if (typeof window === "undefined") return;
  const session: AdminSession = {
    ...staff,
    signedInAt: new Date().toISOString(),
  };
  window.localStorage.setItem(ADMIN_KEY, JSON.stringify(session));
}

export function adminSignOut() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_KEY);
  // Also destroy server session
  fetch("/api/admin/session", { method: "DELETE" }).catch(() => {});
}

export function currentAdmin(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

/** Check if current admin has a specific permission. */
export function adminCan(permission: string): boolean {
  const admin = currentAdmin();
  if (!admin) return false;
  const perms: Record<AdminRole, string[]> = {
    owner: [
      "view_dashboard", "view_merchants", "approve_merchants",
      "view_transactions", "view_compliance", "handle_compliance", "manage_staff",
    ],
    manager: [
      "view_dashboard", "view_merchants", "approve_merchants",
      "view_transactions", "view_compliance", "handle_compliance",
    ],
    staff: [
      "view_dashboard", "view_merchants", "view_transactions", "view_compliance",
    ],
  };
  return perms[admin.role]?.includes(permission) ?? false;
}

/** Check if current admin's role is at least the given minimum. */
export function adminRoleAtLeast(minRole: AdminRole): boolean {
  const admin = currentAdmin();
  if (!admin) return false;
  const hierarchy: AdminRole[] = ["owner", "manager", "staff"];
  return hierarchy.indexOf(admin.role) <= hierarchy.indexOf(minRole);
}
