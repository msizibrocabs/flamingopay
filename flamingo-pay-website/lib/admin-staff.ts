/**
 * Admin staff management — Redis-backed accounts with role-based access.
 *
 * Roles (hierarchical):
 *   owner    — Full access. Can manage all staff accounts.
 *   manager  — Can approve merchants, handle compliance. Cannot manage staff.
 *   staff    — View-only. Dashboard, transactions, merchants (read-only).
 *
 * Redis keys:
 *   admin_staff:{id}    → JSON AdminStaffMember
 *   admin_staff_ids     → JSON string[] (list of all staff IDs)
 *   admin_email:{email} → staff ID (lookup index)
 */

import "server-only";
import { Redis } from "@upstash/redis";
import { hashSync, compareSync } from "bcryptjs";
import crypto from "crypto";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

// ─── Types ───

export type AdminRole = "owner" | "manager" | "staff";

export type AdminStaffMember = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  passwordHash: string;
  active: boolean;
  createdAt: string;
  createdBy: string;       // ID of admin who created this account
  lastLoginAt?: string;
  deactivatedAt?: string;
};

/** What each role can do. */
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  owner: [
    "view_dashboard",
    "view_merchants",
    "approve_merchants",
    "view_transactions",
    "view_compliance",
    "handle_compliance",
    "manage_staff",
  ],
  manager: [
    "view_dashboard",
    "view_merchants",
    "approve_merchants",
    "view_transactions",
    "view_compliance",
    "handle_compliance",
  ],
  staff: [
    "view_dashboard",
    "view_merchants",
    "view_transactions",
    "view_compliance",
  ],
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  owner: "Owner",
  manager: "Manager",
  staff: "Staff",
};

// ─── Helpers ───

const BCRYPT_ROUNDS = 12;

function staffKey(id: string): string {
  return `admin_staff:${id}`;
}

function emailIndexKey(email: string): string {
  return `admin_email:${email.toLowerCase().trim()}`;
}

function generateId(): string {
  return `staff_${crypto.randomBytes(6).toString("hex")}`;
}

/** Check if a role has a specific permission. */
export function hasPermission(role: AdminRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Check if role A can manage role B (only higher roles can manage lower). */
export function canManageRole(actorRole: AdminRole, targetRole: AdminRole): boolean {
  const hierarchy: AdminRole[] = ["owner", "manager", "staff"];
  return hierarchy.indexOf(actorRole) < hierarchy.indexOf(targetRole);
}

// ─── Bootstrap: seed the owner account ───

/**
 * Ensure at least one owner account exists.
 * Uses ADMIN_OWNER_EMAIL and ADMIN_OWNER_PASSWORD env vars.
 * Called on first login attempt if no staff exist.
 */
export async function ensureOwnerExists(): Promise<void> {
  const idsRaw = await redis.get("admin_staff_ids");
  const ids: string[] = typeof idsRaw === "string" ? JSON.parse(idsRaw) : (idsRaw as string[] | null) ?? [];

  // If any staff exist, don't auto-seed
  if (ids.length > 0) return;

  const email = process.env.ADMIN_OWNER_EMAIL;
  const password = process.env.ADMIN_OWNER_PASSWORD;

  if (!email || !password) {
    console.error("[admin-staff] No staff exist and ADMIN_OWNER_EMAIL / ADMIN_OWNER_PASSWORD not set. Admin login disabled.");
    return;
  }

  await createStaffMember({
    email,
    name: "Owner",
    role: "owner",
    password,
    createdBy: "system",
  });
}

// ─── CRUD ───

export async function createStaffMember(input: {
  email: string;
  name: string;
  role: AdminRole;
  password: string;
  createdBy: string;
}): Promise<AdminStaffMember | { error: string }> {
  const email = input.email.toLowerCase().trim();

  // Check duplicate email
  const existingId = await redis.get(emailIndexKey(email));
  if (existingId) {
    return { error: "A staff member with this email already exists." };
  }

  const id = generateId();
  const member: AdminStaffMember = {
    id,
    email,
    name: input.name.trim(),
    role: input.role,
    passwordHash: hashSync(input.password, BCRYPT_ROUNDS),
    active: true,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
  };

  // Save to Redis
  const idsRaw = await redis.get("admin_staff_ids");
  const ids: string[] = typeof idsRaw === "string" ? JSON.parse(idsRaw) : (idsRaw as string[] | null) ?? [];
  ids.push(id);

  await redis.pipeline()
    .set(staffKey(id), JSON.stringify(member))
    .set(emailIndexKey(email), id)
    .set("admin_staff_ids", JSON.stringify(ids))
    .exec();

  return member;
}

export async function getStaffMember(id: string): Promise<AdminStaffMember | null> {
  const raw = await redis.get(staffKey(id));
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw as AdminStaffMember;
}

export async function getStaffByEmail(email: string): Promise<AdminStaffMember | null> {
  const id = await redis.get(emailIndexKey(email.toLowerCase().trim()));
  if (!id) return null;
  return getStaffMember(typeof id === "string" ? id : String(id));
}

export async function listStaffMembers(): Promise<AdminStaffMember[]> {
  const idsRaw = await redis.get("admin_staff_ids");
  const ids: string[] = typeof idsRaw === "string" ? JSON.parse(idsRaw) : (idsRaw as string[] | null) ?? [];
  if (ids.length === 0) return [];

  const pipe = redis.pipeline();
  for (const id of ids) pipe.get(staffKey(id));
  const results = await pipe.exec();

  const members: AdminStaffMember[] = [];
  for (const raw of results) {
    if (!raw) continue;
    try {
      const m = typeof raw === "string" ? JSON.parse(raw) : raw as AdminStaffMember;
      members.push(m);
    } catch { /* skip corrupted */ }
  }
  return members.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function updateStaffMember(
  id: string,
  patch: {
    name?: string;
    role?: AdminRole;
    password?: string;
    active?: boolean;
  },
): Promise<AdminStaffMember | null> {
  const member = await getStaffMember(id);
  if (!member) return null;

  if (patch.name !== undefined) member.name = patch.name.trim();
  if (patch.role !== undefined) member.role = patch.role;
  if (patch.password !== undefined) member.passwordHash = hashSync(patch.password, BCRYPT_ROUNDS);
  if (patch.active !== undefined) {
    member.active = patch.active;
    if (!patch.active) member.deactivatedAt = new Date().toISOString();
    else member.deactivatedAt = undefined;
  }

  await redis.set(staffKey(id), JSON.stringify(member));
  return member;
}

export async function deleteStaffMember(id: string): Promise<boolean> {
  const member = await getStaffMember(id);
  if (!member) return false;

  const idsRaw = await redis.get("admin_staff_ids");
  const ids: string[] = typeof idsRaw === "string" ? JSON.parse(idsRaw) : (idsRaw as string[] | null) ?? [];
  const filtered = ids.filter(i => i !== id);

  await redis.pipeline()
    .del(staffKey(id))
    .del(emailIndexKey(member.email))
    .set("admin_staff_ids", JSON.stringify(filtered))
    .exec();

  return true;
}

// ─── Authentication ───

export type StaffLoginResult =
  | { ok: true; member: AdminStaffMember }
  | { ok: false; error: string };

export async function authenticateStaff(
  email: string,
  password: string,
): Promise<StaffLoginResult> {
  // Ensure owner is seeded on first login
  await ensureOwnerExists();

  const member = await getStaffByEmail(email);
  if (!member) {
    return { ok: false, error: "Invalid email or password." };
  }

  if (!member.active) {
    return { ok: false, error: "This account has been deactivated. Contact your admin." };
  }

  if (!compareSync(password, member.passwordHash)) {
    return { ok: false, error: "Invalid email or password." };
  }

  // Update last login
  member.lastLoginAt = new Date().toISOString();
  await redis.set(staffKey(member.id), JSON.stringify(member));

  return { ok: true, member };
}
