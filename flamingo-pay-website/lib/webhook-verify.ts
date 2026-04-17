/**
 * Webhook signature verification for payment providers.
 *
 * Ozow uses SHA-512 hash of concatenated fields + API key.
 * PayShap uses HMAC-SHA256 with a shared secret.
 *
 * Both providers send a POST with a JSON body + signature header.
 * We verify the signature before processing to prevent spoofing.
 */

import "server-only";
import { createHash, createHmac, timingSafeEqual } from "crypto";

// ─── Ozow Webhook Verification ───
// Ozow concatenates specific fields in order and hashes with SHA-512
// Docs: https://docs.ozow.com/docs/notifications

const OZOW_API_KEY = process.env.OZOW_API_KEY ?? "";
const OZOW_PRIVATE_KEY = process.env.OZOW_PRIVATE_KEY ?? "";

export type OzowNotification = {
  SiteCode: string;
  TransactionId: string;
  TransactionReference: string;
  Amount: string;
  Status: string;       // "Complete" | "Cancelled" | "Error" | "Abandoned" | "PendingInvestigation"
  Optional1?: string;
  Optional2?: string;
  Optional3?: string;
  Optional4?: string;
  Optional5?: string;
  CurrencyCode: string;
  IsTest: string;
  StatusMessage?: string;
  Hash: string;          // SHA-512 hash for verification
};

/**
 * Verify an Ozow webhook notification hash.
 * Concatenation order: SiteCode + TransactionId + TransactionReference +
 * Amount + Status + Optional1-5 + CurrencyCode + IsTest + ApiKey
 * Then SHA-512 hash and compare (case-insensitive).
 */
export function verifyOzowSignature(notification: OzowNotification): boolean {
  if (!OZOW_PRIVATE_KEY) {
    console.error("[WEBHOOK] OZOW_PRIVATE_KEY not configured");
    return false;
  }

  const concat = [
    notification.SiteCode,
    notification.TransactionId,
    notification.TransactionReference,
    notification.Amount,
    notification.Status,
    notification.Optional1 ?? "",
    notification.Optional2 ?? "",
    notification.Optional3 ?? "",
    notification.Optional4 ?? "",
    notification.Optional5 ?? "",
    notification.CurrencyCode,
    notification.IsTest,
    OZOW_PRIVATE_KEY,
  ].join("");

  const expected = createHash("sha512").update(concat.toLowerCase()).digest("hex").toLowerCase();
  const received = notification.Hash.toLowerCase();

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch {
    return false;
  }
}

// ─── PayShap / Generic HMAC-SHA256 Verification ───

const PAYSHAP_WEBHOOK_SECRET = process.env.PAYSHAP_WEBHOOK_SECRET ?? "";

export type PayShapNotification = {
  eventType: "payment.completed" | "payment.failed" | "payment.refunded" | "settlement.completed";
  paymentId: string;
  merchantReference: string;
  amount: number;
  currency: string;
  status: string;
  buyerBank?: string;
  rail: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

/**
 * Verify a PayShap webhook signature (HMAC-SHA256).
 * The signature is sent in the `X-PayShap-Signature` header.
 * It's computed over the raw request body.
 */
export function verifyPayShapSignature(rawBody: string, signature: string): boolean {
  if (!PAYSHAP_WEBHOOK_SECRET) {
    console.error("[WEBHOOK] PAYSHAP_WEBHOOK_SECRET not configured");
    return false;
  }

  const expected = createHmac("sha256", PAYSHAP_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Map Ozow status strings to our internal transaction status.
 */
export function ozowStatusToInternal(ozowStatus: string): "completed" | "pending" | "refunded" | null {
  switch (ozowStatus.toLowerCase()) {
    case "complete":
      return "completed";
    case "pendinginvestigation":
    case "pending":
      return "pending";
    case "cancelled":
    case "error":
    case "abandoned":
      return null; // Don't create transaction for failed payments
    default:
      return null;
  }
}
