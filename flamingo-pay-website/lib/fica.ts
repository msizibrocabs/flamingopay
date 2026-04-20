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

// server-only guard is enforced by store.ts (the sole importer)
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

// ─── STR (Suspicious Transaction Report) ───
// FICA s29 — mandatory reporting of suspicious or unusual transactions.
// Patterns detected: structuring, velocity spikes, unusual hours, round amounts.

export type STRReason =
  | "structuring"          // Multiple txns just below CTR threshold
  | "velocity_spike"       // Sudden volume increase (3x 7-day average)
  | "unusual_hours"        // Transactions between 00:00–05:00
  | "round_amounts"        // Repeated round-number transactions
  | "rapid_fire"           // >10 txns in 1 hour
  | "refund_abuse"         // >20% refund rate in 30 days
  | "manual";              // Compliance officer raised manually

export type SuspiciousTransactionReport = {
  id: string;
  merchantId: string;
  merchantName: string;
  reason: STRReason;
  description: string;
  /** Transaction IDs that triggered the STR */
  relatedTxnIds: string[];
  totalAmount: number;
  status: "draft" | "pending_review" | "filed" | "dismissed";
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  filedWithFIC: boolean;
  filedAt?: string;
  ficReference?: string;
  /** Risk level assessed by the compliance officer */
  riskLevel?: "low" | "medium" | "high" | "critical";
  notes?: string;
};

/**
 * Analyse a merchant's recent transactions for suspicious patterns.
 * Called after each transaction. Returns an STR if patterns detected.
 */
export async function checkSTR(
  merchantId: string,
  merchantName: string,
  txnId: string,
  amount: number,
  txnTimestamp: string,
  recentTxns: { id: string; amount: number; timestamp: string; status: string }[],
): Promise<SuspiciousTransactionReport | null> {
  const reasons: { reason: STRReason; description: string; txnIds: string[]; total: number }[] = [];
  const now = new Date(txnTimestamp);
  const currentHour = now.getHours();

  // 1. Structuring detection — multiple txns in 24h just below R25k each but totalling ≥ R25k
  const day = 24 * 3600000;
  const last24h = recentTxns.filter(
    t => t.status === "completed" && new Date(t.timestamp).getTime() > now.getTime() - day,
  );
  const subThresholdTxns = last24h.filter(t => t.amount >= 15000 && t.amount < CTR_THRESHOLD);
  if (subThresholdTxns.length >= 2) {
    const total = subThresholdTxns.reduce((s, t) => s + t.amount, 0) + (amount >= 15000 && amount < CTR_THRESHOLD ? amount : 0);
    if (total >= CTR_THRESHOLD) {
      reasons.push({
        reason: "structuring",
        description: `${subThresholdTxns.length + 1} transactions between R15k-R25k in 24h totalling R${total.toLocaleString("en-ZA")} — possible structuring to avoid CTR threshold`,
        txnIds: [...subThresholdTxns.map(t => t.id), txnId],
        total,
      });
    }
  }

  // 2. Velocity spike — today's volume > 3x the 7-day daily average
  const sevenDaysAgo = new Date(now.getTime() - 7 * day);
  const last7d = recentTxns.filter(
    t => t.status === "completed" && new Date(t.timestamp) >= sevenDaysAgo,
  );
  const dailyAvg7d = last7d.length > 0 ? last7d.reduce((s, t) => s + t.amount, 0) / 7 : 0;
  const todayTotal = last24h.reduce((s, t) => s + t.amount, 0) + amount;
  if (dailyAvg7d > 0 && todayTotal > dailyAvg7d * 3 && todayTotal > 5000) {
    reasons.push({
      reason: "velocity_spike",
      description: `Today's volume R${todayTotal.toLocaleString("en-ZA")} is ${(todayTotal / dailyAvg7d).toFixed(1)}x the 7-day daily average of R${dailyAvg7d.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`,
      txnIds: [...last24h.map(t => t.id), txnId],
      total: todayTotal,
    });
  }

  // 3. Unusual hours — transactions between midnight and 5am
  if (currentHour >= 0 && currentHour < 5) {
    const nightTxns = last24h.filter(t => {
      const h = new Date(t.timestamp).getHours();
      return h >= 0 && h < 5;
    });
    if (nightTxns.length >= 3) {
      reasons.push({
        reason: "unusual_hours",
        description: `${nightTxns.length + 1} transactions between 00:00-05:00 in the last 24 hours`,
        txnIds: [...nightTxns.map(t => t.id), txnId],
        total: nightTxns.reduce((s, t) => s + t.amount, 0) + amount,
      });
    }
  }

  // 4. Rapid-fire — >10 transactions in the last hour
  const lastHour = recentTxns.filter(
    t => t.status === "completed" && new Date(t.timestamp).getTime() > now.getTime() - 3600000,
  );
  if (lastHour.length >= 10) {
    reasons.push({
      reason: "rapid_fire",
      description: `${lastHour.length + 1} transactions in the last hour — unusually high frequency`,
      txnIds: [...lastHour.map(t => t.id), txnId],
      total: lastHour.reduce((s, t) => s + t.amount, 0) + amount,
    });
  }

  // 5. Round amounts — >5 transactions at exactly round amounts (R100, R500, R1000, etc.) in 24h
  const roundAmounts = [100, 200, 500, 1000, 2000, 5000, 10000, 20000];
  const roundTxns = last24h.filter(t => roundAmounts.includes(t.amount));
  if (roundAmounts.includes(amount)) roundTxns.push({ id: txnId, amount, timestamp: txnTimestamp, status: "completed" });
  if (roundTxns.length >= 5) {
    reasons.push({
      reason: "round_amounts",
      description: `${roundTxns.length} transactions at exact round amounts in 24h — possible money laundering pattern`,
      txnIds: roundTxns.map(t => t.id),
      total: roundTxns.reduce((s, t) => s + t.amount, 0),
    });
  }

  // 6. Refund abuse — >20% refund rate in last 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * day);
  const last30d = recentTxns.filter(t => new Date(t.timestamp) >= thirtyDaysAgo);
  const completedCount = last30d.filter(t => t.status === "completed").length;
  const refundedCount = last30d.filter(t => t.status === "refunded" || t.status === "partial_refund").length;
  if (completedCount >= 10 && refundedCount / completedCount > 0.2) {
    reasons.push({
      reason: "refund_abuse",
      description: `${refundedCount}/${completedCount} transactions refunded (${((refundedCount / completedCount) * 100).toFixed(0)}%) in 30 days — exceeds 20% threshold`,
      txnIds: last30d.filter(t => t.status === "refunded" || t.status === "partial_refund").map(t => t.id),
      total: last30d.filter(t => t.status === "refunded" || t.status === "partial_refund").reduce((s, t) => s + t.amount, 0),
    });
  }

  if (reasons.length === 0) return null;

  // Use the most severe reason as the primary
  const primary = reasons[0];
  const str: SuspiciousTransactionReport = {
    id: `str_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    merchantId,
    merchantName,
    reason: primary.reason,
    description: reasons.map(r => r.description).join("; "),
    relatedTxnIds: [...new Set(reasons.flatMap(r => r.txnIds))],
    totalAmount: primary.total,
    status: "pending_review",
    createdAt: new Date().toISOString(),
    filedWithFIC: false,
  };

  // Store STR — check for recent duplicate (same merchant + reason within 24h)
  const strs = await listSTRs();
  const recentDuplicate = strs.find(
    s =>
      s.merchantId === merchantId &&
      s.reason === primary.reason &&
      new Date(s.createdAt).getTime() > now.getTime() - day,
  );
  if (recentDuplicate) {
    // Update the existing STR instead of creating a duplicate
    return null;
  }

  strs.push(str);
  await redis.set("fica:strs", JSON.stringify(strs));

  console.log(`[STR] Created ${str.id} for ${merchantName}: ${primary.reason}`);
  return str;
}

/** List all STRs, optionally filtered. */
export async function listSTRs(filters?: {
  merchantId?: string;
  status?: SuspiciousTransactionReport["status"];
  filed?: boolean;
}): Promise<SuspiciousTransactionReport[]> {
  const raw = await redis.get("fica:strs");
  let strs: SuspiciousTransactionReport[] = raw
    ? typeof raw === "string" ? JSON.parse(raw) : raw as SuspiciousTransactionReport[]
    : [];

  if (filters?.merchantId) strs = strs.filter(s => s.merchantId === filters.merchantId);
  if (filters?.status) strs = strs.filter(s => s.status === filters.status);
  if (filters?.filed !== undefined) strs = strs.filter(s => s.filedWithFIC === filters.filed);

  return strs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Update an STR (review, file, dismiss). */
export async function updateSTR(
  strId: string,
  update: {
    status?: SuspiciousTransactionReport["status"];
    riskLevel?: SuspiciousTransactionReport["riskLevel"];
    reviewedBy?: string;
    notes?: string;
    ficReference?: string;
  },
): Promise<SuspiciousTransactionReport | null> {
  const raw = await redis.get("fica:strs");
  const strs: SuspiciousTransactionReport[] = raw
    ? typeof raw === "string" ? JSON.parse(raw) : raw as SuspiciousTransactionReport[]
    : [];

  const idx = strs.findIndex(s => s.id === strId);
  if (idx === -1) return null;

  if (update.status) strs[idx].status = update.status;
  if (update.riskLevel) strs[idx].riskLevel = update.riskLevel;
  if (update.reviewedBy) {
    strs[idx].reviewedBy = update.reviewedBy;
    strs[idx].reviewedAt = new Date().toISOString();
  }
  if (update.notes) strs[idx].notes = update.notes;
  if (update.ficReference) strs[idx].ficReference = update.ficReference;
  if (update.status === "filed") {
    strs[idx].filedWithFIC = true;
    strs[idx].filedAt = new Date().toISOString();
  }

  await redis.set("fica:strs", JSON.stringify(strs));
  return strs[idx];
}

/** Create a manual STR (compliance officer raised). */
export async function createManualSTR(
  merchantId: string,
  merchantName: string,
  description: string,
  riskLevel: SuspiciousTransactionReport["riskLevel"],
  createdBy: string,
): Promise<SuspiciousTransactionReport> {
  const str: SuspiciousTransactionReport = {
    id: `str_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    merchantId,
    merchantName,
    reason: "manual",
    description,
    relatedTxnIds: [],
    totalAmount: 0,
    status: "pending_review",
    createdAt: new Date().toISOString(),
    filedWithFIC: false,
    riskLevel,
    reviewedBy: createdBy,
  };

  const strs = await listSTRs();
  strs.push(str);
  await redis.set("fica:strs", JSON.stringify(strs));

  return str;
}

/** Get STR statistics. */
export async function strStats(): Promise<{
  total: number;
  pendingReview: number;
  filed: number;
  dismissed: number;
  byReason: Record<string, number>;
}> {
  const strs = await listSTRs();
  const byReason: Record<string, number> = {};
  for (const s of strs) {
    byReason[s.reason] = (byReason[s.reason] ?? 0) + 1;
  }
  return {
    total: strs.length,
    pendingReview: strs.filter(s => s.status === "pending_review").length,
    filed: strs.filter(s => s.status === "filed").length,
    dismissed: strs.filter(s => s.status === "dismissed").length,
    byReason,
  };
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
 * Screen a person against PEP/sanctions lists via VerifyNow.
 * Uses VerifyNow AML/PEP/Sanctions Check (R14.95 / 5 credits per screen).
 * Screens against global sanctions lists, PEP registers, watchlists,
 * and crime & terrorism databases.
 */
export async function screenPEP(
  merchantId: string,
  ownerName: string,
  idNumber?: string,
  dateOfBirth?: string,
): Promise<PEPScreeningResult> {
  const id = `pep_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const screenedAt = new Date().toISOString();

  let result: PEPScreeningResult;

  try {
    // Call VerifyNow AML/PEP/Sanctions API
    const { verifyAmlPepSanctions } = await import("./verifynow");
    const check = await verifyAmlPepSanctions(ownerName, idNumber, dateOfBirth);

    const details = check.details as Record<string, unknown> | undefined;
    const isPep = details?.isPep === true;
    const isSanctioned = details?.isSanctioned === true;
    const hitCount = (details?.hitCount as number) ?? 0;

    result = {
      id,
      merchantId,
      ownerName,
      screenedAt,
      status: check.status === "error"
        ? "error"
        : (isPep || isSanctioned || hitCount > 0)
          ? "flagged"
          : "clear",
      matchDetails: check.summary,
      providerRef: check.referenceId,
    };
  } catch (err) {
    // If VerifyNow is unreachable, mark as error (never default to clear)
    console.error(`[fica] PEP screening failed for ${merchantId}:`, err);
    result = {
      id,
      merchantId,
      ownerName,
      screenedAt,
      status: "error",
      matchDetails: `Screening failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }

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
