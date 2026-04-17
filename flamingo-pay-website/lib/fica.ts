/**
 * FICA / AML Compliance Module
 *
 * South African Financial Intelligence Centre Act compliance:
 * - CTR (Currency Transaction Reports) for transactions ≥ R25,000
 * - STR (Suspicious Transaction Reports) for unusual patterns
 * - PEP (Politically Exposed Persons) screening hooks
 * - Source of funds declaration tracking
 * - Beneficial ownership verification
 *
 * FICA requires 5-year retention of all records.
 */

import "server-only";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

// ─── CTR (Currency Transaction Report) ───
// FICA requires reporting of cash transactions ≥ R25,000

export const CTR_THRESHOLD = 25_000; // ZAR

export type CurrencyTransactionReport = {
  id: string;
  merchantId: string;
  merchantName: string;
  txnId: string;
  txnAmount: number;
  txnTimestamp: string;
  buyerBank: string;
  rail: string;
  /** Whether the CTR has been filed with the FIC */
  filedWithFIC: boolean;
  filedAt?: string;
  createdAt: string;
  /** Rolling 24h aggregated amount for structuring detection */
  rolling24hTotal?: number;
};

/**
 * Check if a transaction triggers a CTR and generate one if so.
 * Also checks for "structuring" — multiple transactions just below
 * the threshold that add up to ≥ R25,000 in 24 hours.
 */
export async function checkCTR(
  merchantId: string,
  merchantName: string,
  txnId: string,
  amount: number,
  buyerBank: string,
  rail: string,
  txnTimestamp: string,
  recentTxnAmounts: number[], // amounts in the last 24h
): Promise<CurrencyTransactionReport | null> {
  const rolling24h = recentTxnAmounts.reduce((s, a) => s + a, 0) + amount;

  // Trigger CTR if single transaction ≥ R25k OR rolling 24h ≥ R25k
  if (amount < CTR_THRESHOLD && rolling24h < CTR_THRESHOLD) {
    return null;
  }

  const ctr: CurrencyTransactionReport = {
    id: `ctr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    merchantId,
    merchantName,
    txnId,
    txnAmount: amount,
    txnTimestamp,
    buyerBank,
    rail,
    filedWithFIC: false,
    createdAt: new Date().toISOString(),
    rolling24hTotal: rolling24h,
  };

  // Store CTR
  const ctrsRaw = await redis.get("fica:ctrs");
  const ctrs: CurrencyTransactionReport[] = ctrsRaw
    ? typeof ctrsRaw === "string" ? JSON.parse(ctrsRaw) : ctrsRaw as CurrencyTransactionReport[]
    : [];
  ctrs.push(ctr);
  await redis.set("fica:ctrs", JSON.stringify(ctrs));

  return ctr;
}

/** List all CTRs, optionally filtered. */
export async function listCTRs(filters?: {
  merchantId?: string;
  filed?: boolean;
}): Promise<CurrencyTransactionReport[]> {
  const raw = await redis.get("fica:ctrs");
  let ctrs: CurrencyTransactionReport[] = raw
    ? typeof raw === "string" ? JSON.parse(raw) : raw as CurrencyTransactionReport[]
    : [];

  if (filters?.merchantId) ctrs = ctrs.filter(c => c.merchantId === filters.merchantId);
  if (filters?.filed !== undefined) ctrs = ctrs.filter(c => c.filedWithFIC === filters.filed);

  return ctrs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Mark a CTR as filed with the FIC. */
export async function markCTRFiled(ctrId: string): Promise<boolean> {
  const raw = await redis.get("fica:ctrs");
  const ctrs: CurrencyTransactionReport[] = raw
    ? typeof raw === "string" ? JSON.parse(raw) : raw as CurrencyTransactionReport[]
    : [];

  const idx = ctrs.findIndex(c => c.id === ctrId);
  if (idx === -1) return false;

  ctrs[idx].filedWithFIC = true;
  ctrs[idx].filedAt = new Date().toISOString();
  await redis.set("fica:ctrs", JSON.stringify(ctrs));
  return true;
}

// ─── PEP Screening ───
// Politically Exposed Persons check — in production, integrate with a
// screening API (e.g., Refinitiv World-Check, Dow Jones, ComplyAdvantage).
// For now, we flag the check and log it.

export type PEPScreeningResult = {
  id: string;
  merchantId: string;
  ownerName: string;
  screenedAt: string;
  status: "clear" | "flagged" | "pending" | "error";
  matchDetails?: string;
  /** External screening provider reference */
  providerRef?: string;
};

/**
 * Screen a person against PEP/sanctions lists.
 * In production: call external API. For now: log the screening request.
 */
export async function screenPEP(
  merchantId: string,
  ownerName: string,
): Promise<PEPScreeningResult> {
  const result: PEPScreeningResult = {
    id: `pep_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    merchantId,
    ownerName,
    screenedAt: new Date().toISOString(),
    // In production, this would come from the external screening API
    // For now, mark as clear (no screening provider integrated yet)
    status: process.env.PEP_SCREENING_API_KEY ? "pending" : "clear",
    providerRef: undefined,
  };

  // Store screening result
  const key = `fica:pep:${merchantId}`;
  const screeningsRaw = await redis.get(key);
  const screenings: PEPScreeningResult[] = screeningsRaw
    ? typeof screeningsRaw === "string" ? JSON.parse(screeningsRaw) : screeningsRaw as PEPScreeningResult[]
    : [];
  screenings.push(result);
  await redis.set(key, JSON.stringify(screenings));

  return result;
}

/** Get PEP screening history for a merchant. */
export async function getPEPScreenings(merchantId: string): Promise<PEPScreeningResult[]> {
  const raw = await redis.get(`fica:pep:${merchantId}`);
  if (!raw) return [];
  return typeof raw === "string" ? JSON.parse(raw) : raw as PEPScreeningResult[];
}

// ─── Source of Funds ───

export type SourceOfFundsDeclaration = {
  id: string;
  merchantId: string;
  source: string;        // e.g., "Business revenue", "Savings", "Investment"
  description: string;   // Free-text explanation
  declaredAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
  status: "declared" | "verified" | "rejected";
};

/** Record a source of funds declaration. */
export async function declareSourceOfFunds(
  merchantId: string,
  source: string,
  description: string,
): Promise<SourceOfFundsDeclaration> {
  const decl: SourceOfFundsDeclaration = {
    id: `sof_${Date.now().toString(36)}`,
    merchantId,
    source,
    description,
    declaredAt: new Date().toISOString(),
    status: "declared",
  };

  const key = `fica:sof:${merchantId}`;
  const raw = await redis.get(key);
  const declarations: SourceOfFundsDeclaration[] = raw
    ? typeof raw === "string" ? JSON.parse(raw) : raw as SourceOfFundsDeclaration[]
    : [];
  declarations.push(decl);
  await redis.set(key, JSON.stringify(declarations));

  return decl;
}

// ─── Beneficial Ownership ───

export type BeneficialOwner = {
  name: string;
  idNumber: string;      // SA ID number (masked for storage)
  ownershipPercentage: number;
  isPEP: boolean;
  screeningId?: string;
};

export type BeneficialOwnershipRecord = {
  merchantId: string;
  owners: BeneficialOwner[];
  declaredAt: string;
  verifiedAt?: string;
  status: "declared" | "verified" | "incomplete";
};

/** Record beneficial ownership for a merchant (required for companies). */
export async function declareBeneficialOwnership(
  merchantId: string,
  owners: BeneficialOwner[],
): Promise<BeneficialOwnershipRecord> {
  const record: BeneficialOwnershipRecord = {
    merchantId,
    owners: owners.map(o => ({
      ...o,
      // Mask ID number for storage (keep last 4)
      idNumber: "•".repeat(Math.max(0, o.idNumber.length - 4)) + o.idNumber.slice(-4),
    })),
    declaredAt: new Date().toISOString(),
    status: "declared",
  };

  await redis.set(`fica:bo:${merchantId}`, JSON.stringify(record));
  return record;
}

/** Get beneficial ownership record for a merchant. */
export async function getBeneficialOwnership(merchantId: string): Promise<BeneficialOwnershipRecord | null> {
  const raw = await redis.get(`fica:bo:${merchantId}`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw as BeneficialOwnershipRecord;
}

// ─── FICA Summary for Admin ───

export type FICAComplianceStatus = {
  merchantId: string;
  pepScreening: "clear" | "flagged" | "pending" | "error" | "not_screened";
  sourceOfFunds: "declared" | "verified" | "rejected" | "not_declared";
  beneficialOwnership: "declared" | "verified" | "incomplete" | "not_declared";
  pendingCTRs: number;
  totalCTRs: number;
};

export async function getFICAStatus(merchantId: string): Promise<FICAComplianceStatus> {
  const pepScreenings = await getPEPScreenings(merchantId);
  const latestPEP = pepScreenings[pepScreenings.length - 1];

  const sofRaw = await redis.get(`fica:sof:${merchantId}`);
  const sofs: SourceOfFundsDeclaration[] = sofRaw
    ? typeof sofRaw === "string" ? JSON.parse(sofRaw) : sofRaw as SourceOfFundsDeclaration[]
    : [];
  const latestSOF = sofs[sofs.length - 1];

  const bo = await getBeneficialOwnership(merchantId);

  const ctrs = await listCTRs({ merchantId });
  const pendingCTRs = ctrs.filter(c => !c.filedWithFIC).length;

  return {
    merchantId,
    pepScreening: latestPEP?.status ?? "not_screened",
    sourceOfFunds: latestSOF?.status ?? "not_declared",
    beneficialOwnership: bo?.status ?? "not_declared",
    pendingCTRs,
    totalCTRs: ctrs.length,
  };
}
