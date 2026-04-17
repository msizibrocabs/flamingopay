/**
 * Immutable audit log stored in Redis.
 *
 * Every sensitive action (login, status change, flag action, freeze,
 * refund, document review) is recorded here. FICA requires 5-year
 * retention — in production, these should also be streamed to
 * long-term storage (S3/BigQuery).
 *
 * Redis key: audit_log → JSON AuditEntry[]
 * Each entry is append-only; entries are never modified or deleted.
 */

import "server-only";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

export type AuditAction =
  | "login"
  | "login_failed"
  | "logout"
  | "merchant_created"
  | "merchant_approved"
  | "merchant_rejected"
  | "merchant_suspended"
  | "merchant_unsuspended"
  | "merchant_deleted"
  | "merchant_profile_updated"
  | "document_submitted"
  | "document_verified"
  | "document_rejected"
  | "document_reset"
  | "transaction_created"
  | "transaction_refunded"
  | "flag_created"
  | "flag_updated"
  | "flag_cleared"
  | "flag_confirmed"
  | "merchant_frozen"
  | "merchant_unfrozen"
  | "consent_given"
  | "account_deleted";

export type AuditEntry = {
  id: string;
  timestamp: string;
  action: AuditAction;
  role: "merchant" | "admin" | "compliance" | "system";
  actorId: string;
  actorName: string;
  targetId?: string;
  targetType?: "merchant" | "transaction" | "flag" | "document";
  detail: string;
  ip?: string;
  metadata?: Record<string, unknown>;
};

const AUDIT_KEY = "audit_log";

/** Append an entry to the audit log. Never fails the parent operation. */
export async function appendAuditLog(entry: Omit<AuditEntry, "id" | "timestamp">): Promise<void> {
  try {
    const full: AuditEntry = {
      ...entry,
      id: `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    const raw = await redis.get(AUDIT_KEY);
    const log: AuditEntry[] = raw
      ? typeof raw === "string" ? JSON.parse(raw) : (raw as AuditEntry[])
      : [];

    log.push(full);

    // Keep last 10,000 entries in Redis (older should be archived)
    const trimmed = log.length > 10_000 ? log.slice(-10_000) : log;
    await redis.set(AUDIT_KEY, JSON.stringify(trimmed));
  } catch (err) {
    // Audit logging should never break the parent operation
    console.error("Audit log write failed:", err);
  }
}

/** Read audit log entries with optional filters. */
export async function getAuditLog(filters?: {
  action?: AuditAction;
  role?: string;
  actorId?: string;
  targetId?: string;
  limit?: number;
}): Promise<AuditEntry[]> {
  const raw = await redis.get(AUDIT_KEY);
  let log: AuditEntry[] = raw
    ? typeof raw === "string" ? JSON.parse(raw) : (raw as AuditEntry[])
    : [];

  if (filters?.action) log = log.filter(e => e.action === filters.action);
  if (filters?.role) log = log.filter(e => e.role === filters.role);
  if (filters?.actorId) log = log.filter(e => e.actorId === filters.actorId);
  if (filters?.targetId) log = log.filter(e => e.targetId === filters.targetId);

  // Most recent first
  log.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return log.slice(0, filters?.limit ?? 200);
}
