/**
 * POPIA Data Retention Policy Enforcement
 *
 * POPIA (Protection of Personal Information Act) requires:
 * - Personal data must not be kept longer than necessary
 * - Data subjects can request deletion (already implemented via PATCH /api/merchants/:id/update)
 * - Retention periods must be documented and enforced
 *
 * However, FICA overrides POPIA for financial records:
 * - Transaction records: 5 years (FICA requirement)
 * - Audit logs: 5 years (FICA requirement)
 * - KYC documents: 5 years after relationship ends (FICA)
 * - Merchant PII: Retained while active, 5 years after account closure (FICA)
 *
 * This module handles automated cleanup of expired data.
 */

import "server-only";
import { Redis } from "@upstash/redis";
import { appendAuditLog } from "./audit";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

// Retention periods (in days)
export const RETENTION_POLICY = {
  /** Active merchant data: no expiry while account is active */
  activeMerchant: Infinity,
  /** Deleted merchant PII: 5 years after deletion (FICA) */
  deletedMerchantPII: 5 * 365,
  /** Transaction records: 5 years (FICA) */
  transactions: 5 * 365,
  /** Audit logs: 5 years (FICA) — handled by audit.ts archive TTL */
  auditLogs: 5 * 365,
  /** KYC documents: 5 years after relationship ends */
  kycDocuments: 5 * 365,
  /** Failed login attempts: 24 hours */
  loginAttempts: 1,
  /** OTP codes: 10 minutes (handled by OTP TTL) */
  otpCodes: 0,
  /** Session tokens: 30 minutes (handled by session TTL) */
  sessions: 0,
  /** Idempotency keys: 24 hours (handled by TTL) */
  idempotencyKeys: 1,
  /** Compliance flags: 5 years (FICA) */
  complianceFlags: 5 * 365,
  /** CTR reports: 5 years (FICA) */
  ctrReports: 5 * 365,
} as const;

export type RetentionCategory = keyof typeof RETENTION_POLICY;

/**
 * Record of when a merchant account was closed (for retention tracking).
 */
type ClosureRecord = {
  merchantId: string;
  closedAt: string;
  retainUntil: string; // 5 years after closure
  piiPurged: boolean;
  purgedAt?: string;
};

/**
 * Record an account closure for retention tracking.
 * Called when a merchant deletes their account.
 */
export async function recordAccountClosure(merchantId: string): Promise<void> {
  const now = new Date();
  const retainUntil = new Date(now.getTime() + RETENTION_POLICY.deletedMerchantPII * 86400000);

  const record: ClosureRecord = {
    merchantId,
    closedAt: now.toISOString(),
    retainUntil: retainUntil.toISOString(),
    piiPurged: false,
  };

  // Store closure record
  const key = `retention:closure:${merchantId}`;
  await redis.set(key, JSON.stringify(record));

  // Add to list of pending purges
  const listRaw = await redis.get("retention:pending_purges");
  const list: string[] = listRaw
    ? typeof listRaw === "string" ? JSON.parse(listRaw) : listRaw as string[]
    : [];
  if (!list.includes(merchantId)) {
    list.push(merchantId);
    await redis.set("retention:pending_purges", JSON.stringify(list));
  }
}

/**
 * Run the data retention cleanup job.
 * Should be called periodically (e.g., daily via cron/scheduled task).
 *
 * Actions:
 * 1. Purge PII for merchants whose retention period has expired
 * 2. Clean up expired temporary data
 * 3. Log all purge actions to audit trail
 */
export async function runRetentionCleanup(): Promise<{
  purgedMerchants: string[];
  errors: string[];
}> {
  const purgedMerchants: string[] = [];
  const errors: string[] = [];
  const now = new Date();

  // Check pending purges
  const listRaw = await redis.get("retention:pending_purges");
  const pendingIds: string[] = listRaw
    ? typeof listRaw === "string" ? JSON.parse(listRaw) : listRaw as string[]
    : [];

  for (const merchantId of pendingIds) {
    try {
      const recordRaw = await redis.get(`retention:closure:${merchantId}`);
      if (!recordRaw) continue;

      const record: ClosureRecord = typeof recordRaw === "string"
        ? JSON.parse(recordRaw)
        : recordRaw as ClosureRecord;

      if (record.piiPurged) continue;

      // Check if retention period has passed
      if (new Date(record.retainUntil) > now) continue;

      // Purge PII — delete the merchant record entirely
      // (Transaction records are kept separately and have their own TTL)
      await redis.del(`merchant:${merchantId}`);

      // Mark as purged
      record.piiPurged = true;
      record.purgedAt = now.toISOString();
      await redis.set(`retention:closure:${merchantId}`, JSON.stringify(record));

      purgedMerchants.push(merchantId);

      await appendAuditLog({
        action: "account_deleted",
        role: "system",
        actorId: "retention-scheduler",
        actorName: "Data Retention Scheduler",
        targetId: merchantId,
        targetType: "merchant",
        detail: `PII purged after ${RETENTION_POLICY.deletedMerchantPII}-day retention period`,
      });
    } catch (err) {
      errors.push(`${merchantId}: ${err}`);
    }
  }

  // Remove purged merchants from pending list
  if (purgedMerchants.length > 0) {
    const remaining = pendingIds.filter(id => !purgedMerchants.includes(id));
    await redis.set("retention:pending_purges", JSON.stringify(remaining));
  }

  return { purgedMerchants, errors };
}

/**
 * Get the current retention status for reporting/compliance.
 */
export async function getRetentionReport(): Promise<{
  policy: typeof RETENTION_POLICY;
  pendingPurges: number;
  completedPurges: number;
}> {
  const listRaw = await redis.get("retention:pending_purges");
  const pendingIds: string[] = listRaw
    ? typeof listRaw === "string" ? JSON.parse(listRaw) : listRaw as string[]
    : [];

  let completed = 0;
  for (const id of pendingIds) {
    const raw = await redis.get(`retention:closure:${id}`);
    if (raw) {
      const record: ClosureRecord = typeof raw === "string" ? JSON.parse(raw) : raw as ClosureRecord;
      if (record.piiPurged) completed++;
    }
  }

  return {
    policy: RETENTION_POLICY,
    pendingPurges: pendingIds.length - completed,
    completedPurges: completed,
  };
}
