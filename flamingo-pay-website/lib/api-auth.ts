/**
 * Server-side API authentication helpers.
 *
 * Uses a simple cookie-based session token system.
 * Each role (merchant, admin, compliance) gets its own cookie.
 * Tokens are stored in Redis with expiry for server-side validation.
 */

import "server-only";
import { Redis } from "@upstash/redis";
import { cookies } from "next/headers";
import crypto from "crypto";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

// Session TTL: 30 minutes
const SESSION_TTL = 30 * 60;

export type SessionRole = "merchant" | "admin" | "compliance";

export type ServerSession = {
  role: SessionRole;
  id: string;           // merchantId for merchants, name for admin/compliance
  name: string;
  createdAt: string;
  lastActiveAt: string;
};

const COOKIE_NAMES: Record<SessionRole, string> = {
  merchant: "fp_merchant_token",
  admin: "fp_admin_token",
  compliance: "fp_compliance_token",
};

function redisKey(token: string): string {
  return `session:${token}`;
}

/** Create a new server session and set the cookie. */
export async function createSession(
  role: SessionRole,
  id: string,
  name: string,
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const session: ServerSession = {
    role,
    id,
    name,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  await redis.set(redisKey(token), JSON.stringify(session), { ex: SESSION_TTL });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES[role], token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });

  return token;
}

/** Validate and return the current session for a role. Extends TTL on each valid request. */
export async function getSession(role: SessionRole): Promise<ServerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAMES[role])?.value;
  if (!token) return null;

  const raw = await redis.get(redisKey(token));
  if (!raw) return null;

  const session: ServerSession = typeof raw === "string" ? JSON.parse(raw) : raw as ServerSession;
  if (session.role !== role) return null;

  // Extend session TTL on activity (sliding window)
  session.lastActiveAt = new Date().toISOString();
  await redis.set(redisKey(token), JSON.stringify(session), { ex: SESSION_TTL });

  return session;
}

/** Destroy a session. */
export async function destroySession(role: SessionRole): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAMES[role])?.value;
  if (token) {
    await redis.del(redisKey(token));
  }
  cookieStore.set(COOKIE_NAMES[role], "", { maxAge: 0, path: "/" });
}

/** Require a valid session or return a 401 Response. */
export async function requireSession(role: SessionRole): Promise<ServerSession | Response> {
  const session = await getSession(role);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session;
}

// ---- Passcode verification ----
// Passcodes MUST be set via environment variables in production.
// If not set, login is blocked entirely (no hardcoded fallbacks).

import { compareSync, hashSync } from "bcryptjs";

const ENV_PASSCODES: Record<string, string | undefined> = {
  admin: process.env.ADMIN_PASSCODE,
  compliance: process.env.COMPLIANCE_PASSCODE,
};

// Pre-hash env passcodes on startup for constant-time comparison.
// If env var is missing, the hash stays undefined and login is rejected.
const PASSCODE_HASHES: Record<string, string | undefined> = {};
for (const [role, raw] of Object.entries(ENV_PASSCODES)) {
  PASSCODE_HASHES[role] = raw ? hashSync(raw, 10) : undefined;
}

export function verifyPasscode(role: "admin" | "compliance", input: string): boolean {
  const hash = PASSCODE_HASHES[role];
  if (!hash) {
    // No passcode configured — block login entirely
    console.error(`[AUTH] ${role} passcode not configured. Set ${role.toUpperCase()}_PASSCODE env var.`);
    return false;
  }
  return compareSync(input, hash);
}
