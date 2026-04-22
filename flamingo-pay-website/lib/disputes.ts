/**
 * Buyer dispute management — Redis-backed dispute system.
 *
 * Dispute flow:
 *   1. Buyer files dispute via /dispute page (no account needed)
 *   2. System auto-checks for duplicates and simple cases
 *   3. Merchant gets 48h to respond (accept / reject / partial)
 *   4. If unresolved → escalates to compliance team
 *   5. Compliance makes binding decision within 5 business days
 *
 * PASA alignment:
 *   - 60-day dispute window from transaction date
 *   - PayShap payments are irrevocable — refunds are new payments from merchant to buyer
 *   - All disputes documented for FIC / goAML reporting
 *
 * Redis keys:
 *   dispute:{id}          → JSON Dispute
 *   disputes:index        → Set of all dispute IDs
 *   disputes:txn:{txnId}  → dispute ID (prevents duplicate disputes per txn)
 */

import "server-only";
import { Redis } from "@upstash/redis";
import { appendAuditLog } from "./audit";
import { FICA_RETENTION_SECONDS, MS_PER_DAY, MS_PER_HOUR } from "./time";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

// ─── Types ───

export type DisputeReason =
  | "wrong_amount"
  | "goods_not_received"
  | "duplicate_charge"
  | "unauthorized"
  | "payment_error"
  | "other";

export const DISPUTE_REASON_LABELS: Record<DisputeReason, string> = {
  wrong_amount: "Wrong amount charged",
  goods_not_received: "Goods or services not received",
  duplicate_charge: "Duplicate charge",
  unauthorized: "Unauthorized transaction",
  payment_error: "Payment made in error (wrong merchant)",
  other: "Other",
};

export type DisputeStatus =
  | "open"              // Just filed
  | "auto_flagged"      // System detected issue (e.g. duplicate)
  | "merchant_review"   // Waiting for merchant response
  | "merchant_accepted" // Merchant accepted the dispute
  | "merchant_rejected" // Merchant rejected — escalating
  | "escalated"         // With compliance team
  | "refund_approved"   // Refund authorized
  | "refund_completed"  // Refund payment sent
  | "rejected"          // Dispute rejected (no refund)
  | "closed";           // Resolved and closed

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  open: "Open",
  auto_flagged: "Auto-flagged",
  merchant_review: "Awaiting merchant",
  merchant_accepted: "Merchant accepted",
  merchant_rejected: "Merchant rejected",
  escalated: "Under review",
  refund_approved: "Refund approved",
  refund_completed: "Refund sent",
  rejected: "Rejected",
  closed: "Closed",
};

export type Dispute = {
  id: string;
  /** Short reference for the buyer, e.g. "DSP-A7K3" */
  ref: string;
  txnId: string;
  txnRef: string;
  merchantId: string;
  merchantName: string;
  /** Transaction amount in ZAR */
  amount: number;
  /** Transaction date */
  txnDate: string;
  /** Buyer's phone number (if provided) */
  buyerPhone?: string;
  /** Buyer's email (if provided) */
  buyerEmail?: string;
  reason: DisputeReason;
  description: string;
  /** URL to uploaded evidence (bank statement screenshot, etc.) */
  evidenceUrl?: string;
  status: DisputeStatus;
  /** Refund amount (may differ from txn amount for partial refunds) */
  refundAmount?: number;
  /** Merchant's response */
  merchantResponse?: {
    action: "accept" | "reject" | "partial";
    note: string;
    partialAmount?: number;
    respondedAt: string;
  };
  /** Compliance resolution */
  resolution?: {
    decision: "refund_full" | "refund_partial" | "reject";
    note: string;
    resolvedBy: string;
    resolvedAt: string;
    refundAmount?: number;
  };
  createdAt: string;
  updatedAt: string;
  /** Deadline for merchant response (48h from creation) */
  merchantDeadline: string;
  /** Deadline for compliance resolution (5 business days from escalation) */
  complianceDeadline?: string;
  /** Was this auto-detected (e.g. duplicate charge)? */
  autoDetected: boolean;
};

// ─── Constants ───

/** 5-year TTL for FICA compliance (seconds) */
const DISPUTE_TTL = FICA_RETENTION_SECONDS;
/** 60-day dispute window (milliseconds) */
const DISPUTE_WINDOW_MS = 60 * MS_PER_DAY;
/** 48-hour merchant response deadline (milliseconds) */
const MERCHANT_DEADLINE_MS = 48 * MS_PER_HOUR;

// ─── Helpers ───

function generateDisputeId(): string {
  return `dsp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function generateDisputeRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "";
  for (let i = 0; i < 4; i++) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return `DSP-${ref}`;
}

// ─── Storage ───

async function saveDispute(dispute: Dispute): Promise<void> {
  const pipeline = redis.pipeline();
  pipeline.set(`dispute:${dispute.id}`, JSON.stringify(dispute), { ex: DISPUTE_TTL });
  pipeline.sadd("disputes:index", dispute.id);
  pipeline.expire("disputes:index", DISPUTE_TTL);
  // Index by txnId to prevent duplicate disputes
  pipeline.set(`disputes:txn:${dispute.txnId}`, dispute.id, { ex: DISPUTE_TTL });
  await pipeline.exec();
}

export async function getDispute(disputeId: string): Promise<Dispute | null> {
  const raw = await redis.get(`dispute:${disputeId}`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw as Dispute;
}

export async function getDisputeByRef(ref: string): Promise<Dispute | null> {
  const all = await listDisputes();
  return all.find(d => d.ref === ref.toUpperCase()) ?? null;
}

export async function getDisputeByTxnId(txnId: string): Promise<Dispute | null> {
  const disputeId = await redis.get(`disputes:txn:${txnId}`);
  if (!disputeId) return null;
  return getDispute(typeof disputeId === "string" ? disputeId : String(disputeId));
}

export async function listDisputes(filters?: {
  status?: DisputeStatus;
  merchantId?: string;
}): Promise<Dispute[]> {
  const ids: string[] = await redis.smembers("disputes:index") as string[];
  if (ids.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const id of ids) pipeline.get(`dispute:${id}`);
  const results = await pipeline.exec();

  let disputes: Dispute[] = [];
  const staleIds: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const raw = results[i];
    if (!raw) { staleIds.push(ids[i]); continue; }
    const d: Dispute = typeof raw === "string" ? JSON.parse(raw) : raw as Dispute;
    disputes.push(d);
  }

  // Clean up stale IDs
  if (staleIds.length > 0) {
    const cleanup = redis.pipeline();
    for (const id of staleIds) cleanup.srem("disputes:index", id);
    await cleanup.exec();
  }

  if (filters?.status) disputes = disputes.filter(d => d.status === filters.status);
  if (filters?.merchantId) disputes = disputes.filter(d => d.merchantId === filters.merchantId);

  return disputes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ─── Actions ───

export type CreateDisputeInput = {
  txnId: string;
  txnRef: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  txnDate: string;
  buyerPhone?: string;
  buyerEmail?: string;
  reason: DisputeReason;
  description: string;
  evidenceUrl?: string;
};

export async function createDispute(
  input: CreateDisputeInput,
): Promise<Dispute | { error: string }> {
  // Check if transaction is within 60-day dispute window
  const txnTime = new Date(input.txnDate).getTime();
  const now = Date.now();
  if (now - txnTime > DISPUTE_WINDOW_MS) {
    return { error: "This transaction is older than 60 days and can no longer be disputed." };
  }

  // Check for existing dispute on this transaction
  const existing = await getDisputeByTxnId(input.txnId);
  if (existing) {
    return { error: `A dispute already exists for this transaction (${existing.ref}). Check its status at /dispute/check.` };
  }

  const id = generateDisputeId();
  const ref = generateDisputeRef();
  const nowISO = new Date().toISOString();
  const merchantDeadline = new Date(now + MERCHANT_DEADLINE_MS).toISOString();

  // Auto-detect duplicate charges
  let autoDetected = false;
  let initialStatus: DisputeStatus = "merchant_review";

  if (input.reason === "duplicate_charge") {
    // Check if there are multiple transactions with the same amount to the same
    // merchant within a short window (10 minutes)
    const { listTransactions } = await import("./store");
    const txns = await listTransactions(input.merchantId);
    const txnTime = new Date(input.txnDate).getTime();
    const duplicates = txns.filter(t => {
      const tTime = new Date(t.timestamp).getTime();
      return (
        t.id !== input.txnId &&
        t.amount === input.amount &&
        Math.abs(tTime - txnTime) < 10 * 60 * 1000 // within 10 minutes
      );
    });
    if (duplicates.length > 0) {
      autoDetected = true;
      initialStatus = "auto_flagged";
    }
  }

  const dispute: Dispute = {
    id,
    ref,
    txnId: input.txnId,
    txnRef: input.txnRef,
    merchantId: input.merchantId,
    merchantName: input.merchantName,
    amount: input.amount,
    txnDate: input.txnDate,
    buyerPhone: input.buyerPhone,
    buyerEmail: input.buyerEmail,
    reason: input.reason,
    description: input.description,
    evidenceUrl: input.evidenceUrl,
    status: initialStatus,
    createdAt: nowISO,
    updatedAt: nowISO,
    merchantDeadline,
    autoDetected,
  };

  await saveDispute(dispute);

  await appendAuditLog({
    action: "flag_updated" as import("./audit").AuditAction,
    role: "system" as "compliance",
    actorId: input.buyerPhone ?? "buyer",
    actorName: "Buyer",
    targetId: id,
    targetType: "flag",
    detail: `Dispute ${ref} filed: ${DISPUTE_REASON_LABELS[input.reason]} — R${input.amount} at ${input.merchantName}`,
  });

  return dispute;
}

export async function merchantRespondToDispute(
  disputeId: string,
  response: {
    action: "accept" | "reject" | "partial";
    note: string;
    partialAmount?: number;
  },
): Promise<Dispute | null> {
  const dispute = await getDispute(disputeId);
  if (!dispute) return null;

  const now = new Date().toISOString();
  dispute.merchantResponse = {
    ...response,
    respondedAt: now,
  };
  dispute.updatedAt = now;

  if (response.action === "accept") {
    dispute.status = "merchant_accepted";
    dispute.refundAmount = dispute.amount;
  } else if (response.action === "partial") {
    dispute.status = "merchant_accepted";
    dispute.refundAmount = response.partialAmount ?? dispute.amount;
  } else {
    // Merchant rejected — escalate to compliance
    dispute.status = "escalated";
    // 5 business days ≈ 7 calendar days
    dispute.complianceDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  await saveDispute(dispute);
  return dispute;
}

export async function resolveDispute(
  disputeId: string,
  resolution: {
    decision: "refund_full" | "refund_partial" | "reject";
    note: string;
    resolvedBy: string;
    refundAmount?: number;
  },
): Promise<Dispute | null> {
  const dispute = await getDispute(disputeId);
  if (!dispute) return null;

  const now = new Date().toISOString();
  dispute.resolution = {
    ...resolution,
    resolvedAt: now,
  };
  dispute.updatedAt = now;

  if (resolution.decision === "reject") {
    dispute.status = "rejected";
  } else {
    dispute.status = "refund_approved";
    dispute.refundAmount = resolution.decision === "refund_full"
      ? dispute.amount
      : (resolution.refundAmount ?? dispute.amount);
  }

  await saveDispute(dispute);

  await appendAuditLog({
    action: "flag_updated" as import("./audit").AuditAction,
    role: "compliance",
    actorId: resolution.resolvedBy,
    actorName: resolution.resolvedBy,
    targetId: disputeId,
    targetType: "flag",
    detail: `Dispute ${dispute.ref} resolved: ${resolution.decision} — ${resolution.note}`,
  });

  return dispute;
}

export async function markRefundCompleted(disputeId: string): Promise<Dispute | null> {
  const dispute = await getDispute(disputeId);
  if (!dispute) return null;

  dispute.status = "refund_completed";
  dispute.updatedAt = new Date().toISOString();
  await saveDispute(dispute);
  return dispute;
}

export async function disputeStats(): Promise<{
  total: number;
  open: number;
  awaitingMerchant: number;
  escalated: number;
  resolved: number;
  totalRefunded: number;
}> {
  const disputes = await listDisputes();
  const open = disputes.filter(d => ["open", "auto_flagged", "merchant_review"].includes(d.status)).length;
  const awaitingMerchant = disputes.filter(d => d.status === "merchant_review").length;
  const escalated = disputes.filter(d => d.status === "escalated").length;
  const resolved = disputes.filter(d => ["refund_completed", "rejected", "closed"].includes(d.status)).length;
  const totalRefunded = disputes
    .filter(d => d.status === "refund_completed" && d.refundAmount)
    .reduce((s, d) => s + (d.refundAmount ?? 0), 0);

  return { total: disputes.length, open, awaitingMerchant, escalated, resolved, totalRefunded };
}

/**
 * Find transactions matching buyer's lookup criteria.
 * Used when the buyer doesn't have their reference number.
 */
export async function findTransactionsByDetails(criteria: {
  amount?: number;
  dateFrom?: string;
  dateTo?: string;
  merchantName?: string;
}): Promise<Array<{
  txn: import("./store").StoredTxn;
  merchantId: string;
  merchantName: string;
}>> {
  const { listMerchants, listTransactions } = await import("./store");
  const merchants = await listMerchants();
  const results: Array<{
    txn: import("./store").StoredTxn;
    merchantId: string;
    merchantName: string;
  }> = [];

  for (const m of merchants) {
    if (m.status !== "approved") continue;
    if (criteria.merchantName && !m.businessName.toLowerCase().includes(criteria.merchantName.toLowerCase())) continue;

    const txns = await listTransactions(m.id);
    for (const txn of txns) {
      if (txn.status !== "completed") continue;

      // Amount match (within R1 tolerance for rounding)
      if (criteria.amount && Math.abs(txn.amount - criteria.amount) > 1) continue;

      // Date range
      if (criteria.dateFrom && txn.timestamp < criteria.dateFrom) continue;
      if (criteria.dateTo && txn.timestamp > criteria.dateTo) continue;

      results.push({ txn, merchantId: m.id, merchantName: m.businessName });
    }
  }

  return results.sort((a, b) => b.txn.timestamp.localeCompare(a.txn.timestamp)).slice(0, 20);
}
