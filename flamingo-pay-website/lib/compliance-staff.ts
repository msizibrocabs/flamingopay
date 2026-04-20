/**
 * Compliance staff management — Redis-backed accounts with email + password.
 *
 * Mirrors the admin-staff pattern but for the compliance portal.
 * Seeded from COMPLIANCE_OWNER_EMAIL + COMPLIANCE_OWNER_PASSWORD env vars.
 *
 * Redis keys:
 *   compliance_staff:{id}    → JSON ComplianceStaffMember
 *   compliance_staff_ids     → JSON string[]
 *   compliance_email:{email} → staff ID (lookup index)
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

export type ComplianceStaffMember = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
};

// ─── Helpers ───

const BCRYPT_ROUNDS = 12;

function staffKey(id: string): string {
  return `compliance_staff:${id}`;
}

function emailIndexKey(email: string): string {
  return `compliance_email:${email.toLowerCase().trim()}`;
}

function generateId(): string {
  return `comp_${crypto.randomBytes(6).toString("hex")}`;
}

// ─── Bootstrap: seed the compliance officer account ───

export async function ensureComplianceOwnerExists(): Promise<void> {
  const idsRaw = await redis.get("compliance_staff_ids");
  const ids: string[] = typeof idsRaw === "string" ? JSON.parse(idsRaw) : (idsRaw as string[] | null) ?? [];

  if (ids.length > 0) return;

  const email = process.env.COMPLIANCE_OWNER_EMAIL;
  const password = process.env.COMPLIANCE_OWNER_PASSWORD;

  if (!email || !password) {
    console.error("[compliance-staff] No compliance staff exist and COMPLIANCE_OWNER_EMAIL / COMPLIANCE_OWNER_PASSWORD not set. Compliance login disabled.");
    return;
  }

  await createComplianceStaff({
    email,
    name: "Compliance Officer",
    password,
  });
}

// ─── CRUD ───

export async function createComplianceStaff(input: {
  email: string;
  name: string;
  password: string;
}): Promise<ComplianceStaffMember | { error: string }> {
  const email = input.email.toLowerCase().trim();

  const existingId = await redis.get(emailIndexKey(email));
  if (existingId) {
    return { error: "A compliance officer with this email already exists." };
  }

  const id = generateId();
  const member: ComplianceStaffMember = {
    id,
    email,
    name: input.name.trim(),
    passwordHash: hashSync(input.password, BCRYPT_ROUNDS),
    active: true,
    createdAt: new Date().toISOString(),
  };

  const idsRaw = await redis.get("compliance_staff_ids");
  const ids: string[] = typeof idsRaw === "string" ? JSON.parse(idsRaw) : (idsRaw as string[] | null) ?? [];
  ids.push(id);

  await redis.pipeline()
    .set(staffKey(id), JSON.stringify(member))
    .set(emailIndexKey(email), id)
    .set("compliance_staff_ids", JSON.stringify(ids))
    .exec();

  return member;
}

export async function getComplianceStaffByEmail(email: string): Promise<ComplianceStaffMember | null> {
  const id = await redis.get(emailIndexKey(email.toLowerCase().trim()));
  if (!id) return null;
  const raw = await redis.get(staffKey(typeof id === "string" ? id : String(id)));
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw as ComplianceStaffMember;
}

// ─── Authentication ───

export type ComplianceLoginResult =
  | { ok: true; member: ComplianceStaffMember }
  | { ok: false; error: string };

export async function authenticateComplianceStaff(
  email: string,
  password: string,
): Promise<ComplianceLoginResult> {
  await ensureComplianceOwnerExists();

  const member = await getComplianceStaffByEmail(email);
  if (!member) {
    return { ok: false, error: "Invalid email or password." };
  }

  if (!member.active) {
    return { ok: false, error: "This account has been deactivated." };
  }

  if (!compareSync(password, member.passwordHash)) {
    return { ok: false, error: "Invalid email or password." };
  }

  member.lastLoginAt = new Date().toISOString();
  await redis.set(staffKey(member.id), JSON.stringify(member));

  return { ok: true, member };
}
