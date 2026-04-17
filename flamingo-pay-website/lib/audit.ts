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

/**
 * FICA requires 5-year retention of all audit records.
 * Strategy:
 * - Hot storage: Last 10,000 entries in Redis (fast queries)
 * - Monthly archives: Older entries moved to Redis keys by month (audit_archive:YYYY-MM)
 * - Each archive key has a 5-year TTL (1827 days)
 *
 * In production, archives should also be streamed to S3/BigQuery for
 * truly durable long-term storage. The monthly Redis archives are a
 * pragmatic middle ground.
 */

const ARCHIVE_TTL_SECONDS = 1827 * 86400; // ~5 years in seconds

/** Append an entry to the audit log. Never fails the parent operation. */
export async function appendAuditLog(entry: Omit<AuditEntry, "id" | "timestamp">): Promise<void> {
  try {
    const now = new Date();
    const full: AuditEntry = {
      ...entry,
      id: `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now.toISOString(),
    };

    const raw = await redis.get(AUDIT_KEY);
    const log: AuditEntry[] = raw
      ? typeof raw === "string" ? JSON.parse(raw) : (raw as AuditEntry[])
      : [];

    log.push(full);

    // Archive entries beyond 10,000 to monthly archive keys
    if (log.length > 10_000) {
      const toArchive = log.slice(0, log.length - 10_000);
      const kept = log.slice(-10_000);

      // Group archived entries by month
      const byMonth: Record<string, AuditEntry[]> = {};
      for (const e of toArchive) {
        const month = e.timestamp.slice(0, 7); // YYYY-MM
        byMonth[month] = byMonth[month] || [];
        byMonth[month].push(e);
      }

      // Append to monthly archive keys with 5-year TTL
      const pipe = redis.pipeline();
      for (const [month, entries] of Object.entries(byMonth)) {
        const archiveKey = `audit_archive:${month}`;
        // Get existing archive, append, and save
        // Using a simpler approach: just set with the entries
        // In production, use Redis APPEND or a proper time-series
        pipe.get(archiveKey);
      }
      const archiveResults = await pipe.exec();

      const writePipe = redis.pipeline();
      let i = 0;
      for (const [month, entries] of Object.entries(byMonth)) {
        const archiveKey = `audit_archive:${month}`;
        const existingRaw = archiveResults[i];
        const existing: AuditEntry[] = existingRaw
          ? typeof existingRaw === "string" ? JSON.parse(existingRaw) : existingRaw as AuditEntry[]
          : [];
        existing.push(...entries);
        writePipe.set(archiveKey, JSON.stringify(existing));
        writePipe.expire(archiveKey, ARCHIVE_TTL_SECONDS);
        i++;
      }
      writePipe.set(AUDIT_KEY, JSON.stringify(kept));
      await writePipe.exec();
    } else {
      await redis.set(AUDIT_KEY, JSON.stringify(log));
    }
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

/**
 * Query archived audit logs by month (FICA 5-year retention).
 * @param month - Format: YYYY-MM (e.g., "2025-06")
 */
export async function getArchivedAuditLog(month: string): Promise<AuditEntry[]> {
  const raw = await redis.get(`audit_archive:${month}`);
  if (!raw) return [];
  const entries: AuditEntry[] = typeof raw === "string" ? JSON.parse(raw) : raw as AuditEntry[];
  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * List available audit archive months.
 * Returns months that have archived entries (up to 5 years back).
 */
export async function listAuditArchiveMonths(): Promise<string[]> {
  const months: string[] = [];
  const now = new Date();
  // Check up to 60 months (5 years) back
  for (let i = 0; i < 60; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.toISOString().slice(0, 7);
    const exists = await redis.exists(`audit_archive:${month}`);
    if (exists) months.push(month);
  }
  return months;
}
