/**
 * ECT Act Section 44 — 7-day Cooling-Off Period
 *
 * Online transactions in South Africa are subject to a 7-day cooling-off period
 * under the Electronic Communications and Transactions Act (ECT Act) and the
 * Consumer Protection Act (CPA). During this window, a buyer may cancel the
 * transaction without penalty and receive a full refund.
 *
 * This module provides helpers for:
 * - Checking if a transaction is within the cooling-off window
 * - Calculating remaining time
 * - Processing cancellation requests
 * - Identifying transactions with payout holds
 *
 * Redis key: cooling_off_requests → JSON CoolingOffRequest[]
 */

import "server-only";
import { Redis } from "@upstash/redis";
import type { StoredTxn } from "./store";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

/** 7 days in milliseconds. */
export const COOLING_OFF_DAYS = 7;
export const COOLING_OFF_MS = COOLING_OFF_DAYS * 24 * 3600 * 1000;

export type CoolingOffRequest = {
  id: string;
  transactionId: string;
  transactionRef: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  buyerEmail?: string;
  buyerPhone?: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
};

const REQUESTS_KEY = "cooling_off_requests";

// ---------------------- Helpers ----------------------

/** Check if a transaction is still within its cooling-off period. */
export function isWithinCoolingOff(txn: StoredTxn): boolean {
  if (!txn.coolingOffExpiresAt) {
    // Legacy transactions without the field — calculate from timestamp
    const expires = new Date(txn.timestamp).getTime() + COOLING_OFF_MS;
    return Date.now() < expires;
  }
  return Date.now() < new Date(txn.coolingOffExpiresAt).getTime();
}

/** Get remaining cooling-off time in ms (0 if expired). */
export function getCoolingOffRemaining(txn: StoredTxn): number {
  const expiresAt = txn.coolingOffExpiresAt
    ? new Date(txn.coolingOffExpiresAt).getTime()
    : new Date(txn.timestamp).getTime() + COOLING_OFF_MS;
  return Math.max(0, expiresAt - Date.now());
}

/** Human-readable countdown, e.g. "3d 14h remaining". */
export function formatCoolingOffRemaining(txn: StoredTxn): string {
  const ms = getCoolingOffRemaining(txn);
  if (ms <= 0) return "Expired";
  const days = Math.floor(ms / (24 * 3600 * 1000));
  const hours = Math.floor((ms % (24 * 3600 * 1000)) / (3600 * 1000));
  if (days > 0) return `${days}d ${hours}h remaining`;
  const mins = Math.floor((ms % (3600 * 1000)) / (60 * 1000));
  return hours > 0 ? `${hours}h ${mins}m remaining` : `${mins}m remaining`;
}

/**
 * Check if a transaction's payout should be held.
 * Payouts are held while the cooling-off period is active OR while a
 * cancellation request is pending.
 */
export function isPayoutHeld(txn: StoredTxn): boolean {
  if (txn.coolingOffStatus === "requested") return true;
  if (txn.status === "refunded" || txn.status === "partial_refund") return false;
  return isWithinCoolingOff(txn);
}

// ---------------------- Cancellation Requests ----------------------

async function loadRequests(): Promise<CoolingOffRequest[]> {
  const raw = await redis.get(REQUESTS_KEY);
  if (!raw) return [];
  return typeof raw === "string" ? JSON.parse(raw) : (raw as CoolingOffRequest[]);
}

async function saveRequests(reqs: CoolingOffRequest[]): Promise<void> {
  await redis.set(REQUESTS_KEY, JSON.stringify(reqs));
}

/** Create a cooling-off cancellation request. */
export async function createCoolingOffRequest(
  txn: StoredTxn,
  merchantId: string,
  merchantName: string,
  buyerEmail?: string,
  buyerPhone?: string,
): Promise<CoolingOffRequest> {
  const reqs = await loadRequests();

  // Check for duplicate
  const existing = reqs.find(r => r.transactionId === txn.id && r.status === "pending");
  if (existing) return existing;

  const req: CoolingOffRequest = {
    id: `co_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    transactionId: txn.id,
    transactionRef: txn.reference,
    merchantId,
    merchantName,
    amount: txn.amount,
    buyerEmail,
    buyerPhone,
    status: "pending",
    requestedAt: new Date().toISOString(),
  };

  reqs.push(req);
  await saveRequests(reqs);
  return req;
}

/** List all cooling-off requests, optionally filtered. */
export async function listCoolingOffRequests(filters?: {
  status?: "pending" | "approved" | "rejected";
  merchantId?: string;
}): Promise<CoolingOffRequest[]> {
  let reqs = await loadRequests();
  if (filters?.status) reqs = reqs.filter(r => r.status === filters.status);
  if (filters?.merchantId) reqs = reqs.filter(r => r.merchantId === filters.merchantId);
  return reqs.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

/** Get cooling-off stats for dashboard. */
export async function coolingOffStats(): Promise<{
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  totalRefundValue: number;
}> {
  const reqs = await loadRequests();
  return {
    totalRequests: reqs.length,
    pending: reqs.filter(r => r.status === "pending").length,
    approved: reqs.filter(r => r.status === "approved").length,
    rejected: reqs.filter(r => r.status === "rejected").length,
    totalRefundValue: reqs.filter(r => r.status === "approved").reduce((s, r) => s + r.amount, 0),
  };
}

/** Resolve a cooling-off request (approve or reject). */
export async function resolveCoolingOffRequest(
  requestId: string,
  decision: "approved" | "rejected",
  resolvedBy: string,
  note?: string,
): Promise<CoolingOffRequest | null> {
  const reqs = await loadRequests();
  const idx = reqs.findIndex(r => r.id === requestId);
  if (idx === -1) return null;

  reqs[idx] = {
    ...reqs[idx],
    status: decision,
    resolvedAt: new Date().toISOString(),
    resolvedBy,
    resolutionNote: note,
  };
  await saveRequests(reqs);
  return reqs[idx];
}

/** Find a request by transaction ID. */
export async function getCoolingOffRequestByTxn(txnId: string): Promise<CoolingOffRequest | null> {
  const reqs = await loadRequests();
  return reqs.find(r => r.transactionId === txnId) ?? null;
}

/** Find a request by ID. */
export async function getCoolingOffRequest(requestId: string): Promise<CoolingOffRequest | null> {
  const reqs = await loadRequests();
  return reqs.find(r => r.id === requestId) ?? null;
}
