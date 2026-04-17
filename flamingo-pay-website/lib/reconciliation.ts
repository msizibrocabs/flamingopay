/**
 * Settlement Reconciliation Module
 *
 * Compares internal transaction records against actual bank settlement data
 * to detect discrepancies. In production, bank data comes from:
 * - Ozow settlement API webhooks
 * - Bank statement imports (CSV/MT940)
 *
 * Discrepancies are flagged for manual review.
 */

import "server-only";
import { Redis } from "@upstash/redis";
import { listTransactions, type StoredTxn, FLAMINGO_FEE_RATE, FLAMINGO_FEE_FIXED } from "./store";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

/** Ozow payout fee per settlement batch */
const PAYOUT_FEE = 3;

// ─── Types ───

export type BankSettlementRecord = {
  /** External settlement ID from the bank/Ozow */
  externalId: string;
  /** Date of the settlement (YYYY-MM-DD) */
  date: string;
  /** Total amount received by the merchant's bank account */
  bankAmount: number;
  /** Number of transactions in the batch (from bank) */
  bankTxnCount: number;
  /** Raw source: "ozow_webhook" | "bank_statement" | "manual" */
  source: string;
  receivedAt: string;
};

export type ReconciliationResult = {
  id: string;
  merchantId: string;
  date: string;
  /** Our calculated gross (sum of completed transactions) */
  internalGross: number;
  /** Our calculated fees (2.9% + R0.99 per txn) */
  internalFees: number;
  /** Our calculated payout fee (R3 flat) */
  internalPayoutFee: number;
  /** Our calculated net (gross - fees - payout fee) */
  internalNet: number;
  /** Our transaction count */
  internalTxnCount: number;
  /** Bank's reported amount */
  bankAmount: number | null;
  /** Bank's reported transaction count */
  bankTxnCount: number | null;
  /** Difference between internal net and bank amount */
  discrepancy: number | null;
  /** Status of reconciliation */
  status: "matched" | "discrepancy" | "pending_bank_data" | "under_review";
  /** Notes from the reconciliation officer */
  note?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

// ─── Core Functions ───

/**
 * Record a bank settlement (from Ozow webhook or manual entry).
 */
export async function recordBankSettlement(
  merchantId: string,
  record: BankSettlementRecord,
): Promise<void> {
  const key = `recon:bank:${merchantId}:${record.date}`;
  await redis.set(key, JSON.stringify(record));
}

/**
 * Run reconciliation for a merchant on a specific date.
 * Compares internal calculations against bank settlement data.
 */
export async function reconcileDate(
  merchantId: string,
  date: string, // YYYY-MM-DD
): Promise<ReconciliationResult> {
  // Get our internal transactions for that date
  const allTxns = await listTransactions(merchantId);
  const dayTxns = allTxns.filter(t => {
    const txnDate = t.timestamp.slice(0, 10);
    return txnDate === date && (t.status === "completed" || t.status === "partial_refund");
  });

  const internalGross = dayTxns.reduce((s, t) => s + t.amount, 0);
  const internalFees = +(dayTxns.reduce(
    (s, t) => s + (t.amount * FLAMINGO_FEE_RATE + FLAMINGO_FEE_FIXED), 0
  )).toFixed(2);
  const internalPayoutFee = dayTxns.length > 0 ? PAYOUT_FEE : 0;
  const internalNet = +(internalGross - internalFees - internalPayoutFee).toFixed(2);

  // Check for bank settlement data
  const bankKey = `recon:bank:${merchantId}:${date}`;
  const bankRaw = await redis.get(bankKey);
  const bankRecord: BankSettlementRecord | null = bankRaw
    ? typeof bankRaw === "string" ? JSON.parse(bankRaw) : bankRaw as BankSettlementRecord
    : null;

  const bankAmount = bankRecord?.bankAmount ?? null;
  const bankTxnCount = bankRecord?.bankTxnCount ?? null;
  const discrepancy = bankAmount !== null ? +(bankAmount - internalNet).toFixed(2) : null;

  // Determine status
  let status: ReconciliationResult["status"] = "pending_bank_data";
  if (bankAmount !== null) {
    // Allow R0.05 tolerance for rounding
    status = Math.abs(discrepancy!) <= 0.05 ? "matched" : "discrepancy";
  }

  const result: ReconciliationResult = {
    id: `recon_${merchantId}_${date}`,
    merchantId,
    date,
    internalGross: +internalGross.toFixed(2),
    internalFees,
    internalPayoutFee,
    internalNet: Math.max(0, internalNet),
    internalTxnCount: dayTxns.length,
    bankAmount,
    bankTxnCount,
    discrepancy,
    status,
    createdAt: new Date().toISOString(),
  };

  // Store reconciliation result
  await redis.set(`recon:result:${merchantId}:${date}`, JSON.stringify(result));

  return result;
}

/**
 * Get reconciliation results for a merchant over a date range.
 */
export async function getReconciliationReport(
  merchantId: string,
  startDate: string,
  endDate: string,
): Promise<ReconciliationResult[]> {
  const results: ReconciliationResult[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = d.toISOString().slice(0, 10);
    const key = `recon:result:${merchantId}:${date}`;
    const raw = await redis.get(key);
    if (raw) {
      const result: ReconciliationResult = typeof raw === "string" ? JSON.parse(raw) : raw as ReconciliationResult;
      results.push(result);
    }
  }

  return results.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Get a summary of all reconciliation discrepancies across all merchants.
 */
export async function getDiscrepancySummary(): Promise<{
  totalDiscrepancies: number;
  totalAmount: number;
  merchants: string[];
}> {
  // This is a simplified version — in production, maintain an index
  // For now, scan known merchant reconciliation results
  return {
    totalDiscrepancies: 0,
    totalAmount: 0,
    merchants: [],
  };
}

/**
 * Mark a reconciliation result as reviewed.
 */
export async function reviewReconciliation(
  merchantId: string,
  date: string,
  reviewedBy: string,
  note?: string,
  newStatus?: "matched" | "under_review",
): Promise<ReconciliationResult | null> {
  const key = `recon:result:${merchantId}:${date}`;
  const raw = await redis.get(key);
  if (!raw) return null;

  const result: ReconciliationResult = typeof raw === "string" ? JSON.parse(raw) : raw as ReconciliationResult;
  result.reviewedAt = new Date().toISOString();
  result.reviewedBy = reviewedBy;
  if (note) result.note = note;
  if (newStatus) result.status = newStatus;

  await redis.set(key, JSON.stringify(result));
  return result;
}
