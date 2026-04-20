/**
 * Enhanced Due Diligence (EDD) Module
 *
 * FICA and FIC Guidance Note 7 require Enhanced Due Diligence for:
 * - Politically Exposed Persons (PEPs) and their close associates
 * - Sanctions near-matches (fuzzy match score 65–94)
 * - Merchants whose actual volumes significantly exceed declared volumes
 * - High-risk business types or geographies
 * - Any merchant flagged by compliance for elevated risk
 *
 * EDD goes beyond standard KYC (Simplified/Standard CDD) by requiring:
 * - Senior management sign-off before onboarding
 * - Enhanced source of funds/wealth verification
 * - Ongoing enhanced monitoring with tighter review cycles
 * - More frequent re-screening (quarterly vs. annual)
 *
 * Redis keys:
 *   edd:{caseId}      → JSON EDDCase
 *   edd:index          → Redis Set of all case IDs
 *   edd:merchant:{id}  → Redis Set of case IDs for a merchant
 */

import "server-only";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

/** 5-year TTL for FICA compliance (seconds). */
const EDD_TTL_SECONDS = 5 * 365 * 86400; // 1,827 days

// ─── Types ───────────────────────────────────────────────────

export type EDDTrigger =
  | "pep_identified"
  | "sanctions_near_match"
  | "volume_deviation"
  | "high_risk_business"
  | "adverse_media"
  | "str_filed"
  | "manual_referral";

export type EDDStatus =
  | "opened"           // Case created, awaiting investigation
  | "investigation"    // Compliance officer actively reviewing
  | "pending_approval" // Investigation done, awaiting senior sign-off
  | "approved"         // Senior management approved — merchant may proceed
  | "rejected"         // Merchant rejected — account frozen or closed
  | "closed";          // Case closed (e.g., trigger resolved, false positive)

export type EDDCheckType =
  | "source_of_funds"
  | "source_of_wealth"
  | "pep_relationship_map"
  | "beneficial_ownership_deep"
  | "business_visit"
  | "enhanced_id_verification"
  | "bank_statement_review"
  | "third_party_intelligence"
  | "adverse_media_search"
  | "verifynow_rescreening"
  | "volume_analysis"
  | "management_interview";

export type EDDCheck = {
  type: EDDCheckType;
  label: string;
  required: boolean;
  status: "pending" | "in_progress" | "completed" | "waived";
  completedBy?: string;
  completedAt?: string;
  findings?: string;
  /** Supporting document reference (e.g., Vercel Blob URL). */
  documentRef?: string;
};

export type EDDTimelineEntry = {
  timestamp: string;
  action: string;
  actor: string;
  detail?: string;
};

export type EDDCase = {
  id: string;
  merchantId: string;
  merchantName: string;
  ownerName: string;
  trigger: EDDTrigger;
  triggerDetail: string;
  status: EDDStatus;
  riskLevel: "high" | "critical";
  /** Required and completed EDD checks. */
  checks: EDDCheck[];
  /** Full audit timeline of every action taken. */
  timeline: EDDTimelineEntry[];
  /** Investigating compliance officer. */
  assignedTo?: string;
  assignedAt?: string;
  /** Senior manager who approved/rejected. */
  decidedBy?: string;
  decidedAt?: string;
  decisionNote?: string;
  /** If approved, conditions attached to the merchant. */
  conditions?: string[];
  /** Next review date (ongoing monitoring). */
  nextReviewDate?: string;
  /** Review frequency in days (PEP = 90, others = 180). */
  reviewFrequencyDays: number;
  createdAt: string;
  updatedAt: string;
};

// ─── Required Checks per Trigger ─────────────────────────────

const PEP_CHECKS: EDDCheck[] = [
  { type: "pep_relationship_map", label: "Map PEP relationship (direct, family, associate)", required: true, status: "pending" },
  { type: "source_of_funds", label: "Verify source of funds (bank statements, invoices)", required: true, status: "pending" },
  { type: "source_of_wealth", label: "Verify source of wealth (assets, employment history)", required: true, status: "pending" },
  { type: "beneficial_ownership_deep", label: "Deep beneficial ownership analysis", required: true, status: "pending" },
  { type: "adverse_media_search", label: "Adverse media / negative news search", required: true, status: "pending" },
  { type: "verifynow_rescreening", label: "VerifyNow AML/PEP re-screening (fresh check)", required: true, status: "pending" },
  { type: "management_interview", label: "Senior management review and sign-off", required: true, status: "pending" },
];

const SANCTIONS_NEAR_MATCH_CHECKS: EDDCheck[] = [
  { type: "enhanced_id_verification", label: "Enhanced ID verification (confirm identity is NOT the sanctioned person)", required: true, status: "pending" },
  { type: "verifynow_rescreening", label: "VerifyNow AML/PEP re-screening with full name + DOB", required: true, status: "pending" },
  { type: "adverse_media_search", label: "Adverse media / negative news search", required: true, status: "pending" },
  { type: "source_of_funds", label: "Verify source of funds", required: true, status: "pending" },
  { type: "third_party_intelligence", label: "Third-party intelligence report (if score > 80)", required: false, status: "pending" },
  { type: "management_interview", label: "Senior management review and sign-off", required: true, status: "pending" },
];

const VOLUME_DEVIATION_CHECKS: EDDCheck[] = [
  { type: "volume_analysis", label: "Analyse transaction patterns vs. declared profile", required: true, status: "pending" },
  { type: "source_of_funds", label: "Verify source of funds for increased volume", required: true, status: "pending" },
  { type: "business_visit", label: "Physical or virtual business verification", required: false, status: "pending" },
  { type: "bank_statement_review", label: "Review recent bank statements for consistency", required: true, status: "pending" },
  { type: "management_interview", label: "Senior management review and sign-off", required: true, status: "pending" },
];

const HIGH_RISK_CHECKS: EDDCheck[] = [
  { type: "source_of_funds", label: "Verify source of funds", required: true, status: "pending" },
  { type: "source_of_wealth", label: "Verify source of wealth", required: true, status: "pending" },
  { type: "beneficial_ownership_deep", label: "Deep beneficial ownership analysis", required: true, status: "pending" },
  { type: "adverse_media_search", label: "Adverse media / negative news search", required: true, status: "pending" },
  { type: "business_visit", label: "Physical or virtual business verification", required: false, status: "pending" },
  { type: "management_interview", label: "Senior management review and sign-off", required: true, status: "pending" },
];

const STR_FILED_CHECKS: EDDCheck[] = [
  { type: "volume_analysis", label: "Full transaction pattern analysis", required: true, status: "pending" },
  { type: "source_of_funds", label: "Verify source of funds", required: true, status: "pending" },
  { type: "adverse_media_search", label: "Adverse media / negative news search", required: true, status: "pending" },
  { type: "third_party_intelligence", label: "Third-party intelligence report", required: true, status: "pending" },
  { type: "verifynow_rescreening", label: "VerifyNow AML/PEP re-screening", required: true, status: "pending" },
  { type: "management_interview", label: "Senior management review and sign-off", required: true, status: "pending" },
];

function checksForTrigger(trigger: EDDTrigger): EDDCheck[] {
  switch (trigger) {
    case "pep_identified":
      return PEP_CHECKS.map(c => ({ ...c }));
    case "sanctions_near_match":
      return SANCTIONS_NEAR_MATCH_CHECKS.map(c => ({ ...c }));
    case "volume_deviation":
      return VOLUME_DEVIATION_CHECKS.map(c => ({ ...c }));
    case "high_risk_business":
    case "adverse_media":
    case "manual_referral":
      return HIGH_RISK_CHECKS.map(c => ({ ...c }));
    case "str_filed":
      return STR_FILED_CHECKS.map(c => ({ ...c }));
  }
}

function reviewFrequency(trigger: EDDTrigger): number {
  // PEPs and STR-filed merchants get quarterly reviews (90 days)
  // Others get semi-annual reviews (180 days)
  switch (trigger) {
    case "pep_identified":
    case "str_filed":
      return 90;
    case "sanctions_near_match":
      return 90;
    default:
      return 180;
  }
}

function generateId(): string {
  return `edd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Core Operations ─────────────────────────────────────────

/**
 * Open a new EDD case for a merchant.
 * Called automatically when PEP/sanctions triggers are detected,
 * or manually by compliance officers.
 */
export async function openEDDCase(input: {
  merchantId: string;
  merchantName: string;
  ownerName: string;
  trigger: EDDTrigger;
  triggerDetail: string;
  riskLevel?: "high" | "critical";
  openedBy: string;
}): Promise<EDDCase> {
  const id = generateId();
  const now = new Date().toISOString();
  const freqDays = reviewFrequency(input.trigger);
  const nextReview = new Date(Date.now() + freqDays * 86400000).toISOString().split("T")[0];

  const eddCase: EDDCase = {
    id,
    merchantId: input.merchantId,
    merchantName: input.merchantName,
    ownerName: input.ownerName,
    trigger: input.trigger,
    triggerDetail: input.triggerDetail,
    status: "opened",
    riskLevel: input.riskLevel ?? (input.trigger === "pep_identified" || input.trigger === "str_filed" ? "critical" : "high"),
    checks: checksForTrigger(input.trigger),
    timeline: [{
      timestamp: now,
      action: "case_opened",
      actor: input.openedBy,
      detail: `EDD case opened — trigger: ${input.trigger}. ${input.triggerDetail}`,
    }],
    reviewFrequencyDays: freqDays,
    nextReviewDate: nextReview,
    createdAt: now,
    updatedAt: now,
  };

  // Store case + update indexes
  await Promise.all([
    redis.set(`edd:${id}`, JSON.stringify(eddCase), { ex: EDD_TTL_SECONDS }),
    redis.sadd("edd:index", id),
    redis.sadd(`edd:merchant:${input.merchantId}`, id),
  ]);

  return eddCase;
}

/**
 * Assign an EDD case to a compliance officer for investigation.
 */
export async function assignEDDCase(
  caseId: string,
  officerName: string,
): Promise<EDDCase | null> {
  const eddCase = await getEDDCase(caseId);
  if (!eddCase) return null;

  const now = new Date().toISOString();
  eddCase.status = "investigation";
  eddCase.assignedTo = officerName;
  eddCase.assignedAt = now;
  eddCase.updatedAt = now;
  eddCase.timeline.push({
    timestamp: now,
    action: "assigned",
    actor: officerName,
    detail: `Case assigned to ${officerName} for investigation`,
  });

  await redis.set(`edd:${caseId}`, JSON.stringify(eddCase), { ex: EDD_TTL_SECONDS });
  return eddCase;
}

/**
 * Complete an EDD check within a case.
 */
export async function completeEDDCheck(
  caseId: string,
  checkType: EDDCheckType,
  input: {
    completedBy: string;
    findings: string;
    documentRef?: string;
  },
): Promise<EDDCase | null> {
  const eddCase = await getEDDCase(caseId);
  if (!eddCase) return null;

  const check = eddCase.checks.find(c => c.type === checkType);
  if (!check) return null;

  const now = new Date().toISOString();
  check.status = "completed";
  check.completedBy = input.completedBy;
  check.completedAt = now;
  check.findings = input.findings;
  if (input.documentRef) check.documentRef = input.documentRef;

  eddCase.updatedAt = now;
  eddCase.timeline.push({
    timestamp: now,
    action: "check_completed",
    actor: input.completedBy,
    detail: `Completed: ${check.label}. Findings: ${input.findings}`,
  });

  // If all required checks are done, move to pending_approval
  const allRequiredDone = eddCase.checks
    .filter(c => c.required)
    .every(c => c.status === "completed" || c.status === "waived");

  if (allRequiredDone && eddCase.status === "investigation") {
    eddCase.status = "pending_approval";
    eddCase.timeline.push({
      timestamp: now,
      action: "ready_for_approval",
      actor: "system",
      detail: "All required EDD checks completed — awaiting senior management sign-off",
    });
  }

  await redis.set(`edd:${caseId}`, JSON.stringify(eddCase), { ex: EDD_TTL_SECONDS });
  return eddCase;
}

/**
 * Waive a non-required EDD check with justification.
 */
export async function waiveEDDCheck(
  caseId: string,
  checkType: EDDCheckType,
  input: { waivedBy: string; justification: string },
): Promise<EDDCase | null> {
  const eddCase = await getEDDCase(caseId);
  if (!eddCase) return null;

  const check = eddCase.checks.find(c => c.type === checkType);
  if (!check || check.required) return null; // Cannot waive required checks

  const now = new Date().toISOString();
  check.status = "waived";
  check.completedBy = input.waivedBy;
  check.completedAt = now;
  check.findings = `Waived: ${input.justification}`;

  eddCase.updatedAt = now;
  eddCase.timeline.push({
    timestamp: now,
    action: "check_waived",
    actor: input.waivedBy,
    detail: `Waived: ${check.label}. Justification: ${input.justification}`,
  });

  await redis.set(`edd:${caseId}`, JSON.stringify(eddCase), { ex: EDD_TTL_SECONDS });
  return eddCase;
}

/**
 * Senior management decision — approve or reject the merchant.
 */
export async function decideEDDCase(
  caseId: string,
  input: {
    decision: "approved" | "rejected";
    decidedBy: string;
    note: string;
    conditions?: string[];
  },
): Promise<EDDCase | null> {
  const eddCase = await getEDDCase(caseId);
  if (!eddCase) return null;

  if (eddCase.status !== "pending_approval" && eddCase.status !== "investigation") {
    return null; // Can only decide cases in investigation or pending_approval
  }

  const now = new Date().toISOString();
  eddCase.status = input.decision;
  eddCase.decidedBy = input.decidedBy;
  eddCase.decidedAt = now;
  eddCase.decisionNote = input.note;
  eddCase.updatedAt = now;

  if (input.decision === "approved" && input.conditions) {
    eddCase.conditions = input.conditions;
  }

  // Set next review date for approved merchants
  if (input.decision === "approved") {
    const nextReview = new Date(Date.now() + eddCase.reviewFrequencyDays * 86400000)
      .toISOString().split("T")[0];
    eddCase.nextReviewDate = nextReview;
  }

  eddCase.timeline.push({
    timestamp: now,
    action: `decision_${input.decision}`,
    actor: input.decidedBy,
    detail: input.decision === "approved"
      ? `APPROVED by senior management. ${input.conditions?.length ? `Conditions: ${input.conditions.join("; ")}` : "No conditions."} Note: ${input.note}`
      : `REJECTED by senior management. Note: ${input.note}`,
  });

  await redis.set(`edd:${caseId}`, JSON.stringify(eddCase), { ex: EDD_TTL_SECONDS });
  return eddCase;
}

/**
 * Add a note or timeline entry to an EDD case.
 */
export async function addEDDNote(
  caseId: string,
  actor: string,
  note: string,
): Promise<EDDCase | null> {
  const eddCase = await getEDDCase(caseId);
  if (!eddCase) return null;

  const now = new Date().toISOString();
  eddCase.updatedAt = now;
  eddCase.timeline.push({
    timestamp: now,
    action: "note_added",
    actor,
    detail: note,
  });

  await redis.set(`edd:${caseId}`, JSON.stringify(eddCase), { ex: EDD_TTL_SECONDS });
  return eddCase;
}

/**
 * Close an EDD case (e.g., false positive, merchant voluntarily left).
 */
export async function closeEDDCase(
  caseId: string,
  closedBy: string,
  reason: string,
): Promise<EDDCase | null> {
  const eddCase = await getEDDCase(caseId);
  if (!eddCase) return null;

  const now = new Date().toISOString();
  eddCase.status = "closed";
  eddCase.updatedAt = now;
  eddCase.timeline.push({
    timestamp: now,
    action: "case_closed",
    actor: closedBy,
    detail: `Case closed: ${reason}`,
  });

  await redis.set(`edd:${caseId}`, JSON.stringify(eddCase), { ex: EDD_TTL_SECONDS });
  return eddCase;
}

// ─── Queries ─────────────────────────────────────────────────

/** Get a single EDD case by ID. */
export async function getEDDCase(caseId: string): Promise<EDDCase | null> {
  const raw = await redis.get(`edd:${caseId}`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw as EDDCase;
}

/** Get all EDD cases for a specific merchant. */
export async function getEDDCasesForMerchant(merchantId: string): Promise<EDDCase[]> {
  const ids = await redis.smembers(`edd:merchant:${merchantId}`);
  if (!ids || ids.length === 0) return [];

  const cases: EDDCase[] = [];
  // Fetch in batches of 10
  for (let i = 0; i < ids.length; i += 10) {
    const batch = ids.slice(i, i + 10);
    const results = await Promise.all(
      batch.map(id => redis.get(`edd:${id}`)),
    );
    for (const raw of results) {
      if (raw) {
        cases.push(typeof raw === "string" ? JSON.parse(raw) : raw as EDDCase);
      }
    }
  }

  return cases.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** List all EDD cases, optionally filtered by status. */
export async function listEDDCases(filter?: {
  status?: EDDStatus;
  trigger?: EDDTrigger;
}): Promise<EDDCase[]> {
  const ids = await redis.smembers("edd:index");
  if (!ids || ids.length === 0) return [];

  const cases: EDDCase[] = [];
  for (let i = 0; i < ids.length; i += 10) {
    const batch = ids.slice(i, i + 10);
    const results = await Promise.all(
      batch.map(id => redis.get(`edd:${id}`)),
    );
    for (const raw of results) {
      if (raw) {
        const c = typeof raw === "string" ? JSON.parse(raw) : raw as EDDCase;
        if (filter?.status && c.status !== filter.status) continue;
        if (filter?.trigger && c.trigger !== filter.trigger) continue;
        cases.push(c);
      }
    }
  }

  return cases.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Get EDD dashboard stats. */
export async function getEDDStats(): Promise<{
  total: number;
  opened: number;
  investigation: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  closed: number;
  byTrigger: Record<EDDTrigger, number>;
  overdueReviews: number;
}> {
  const cases = await listEDDCases();
  const now = new Date().toISOString().split("T")[0];

  const stats = {
    total: cases.length,
    opened: 0,
    investigation: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
    closed: 0,
    byTrigger: {} as Record<EDDTrigger, number>,
    overdueReviews: 0,
  };

  for (const c of cases) {
    switch (c.status) {
      case "opened": stats.opened++; break;
      case "investigation": stats.investigation++; break;
      case "pending_approval": stats.pendingApproval++; break;
      case "approved": stats.approved++; break;
      case "rejected": stats.rejected++; break;
      case "closed": stats.closed++; break;
    }
    stats.byTrigger[c.trigger] = (stats.byTrigger[c.trigger] ?? 0) + 1;

    // Check for overdue reviews (approved merchants past their review date)
    if (c.status === "approved" && c.nextReviewDate && c.nextReviewDate < now) {
      stats.overdueReviews++;
    }
  }

  return stats;
}

// ─── Auto-Trigger: Volume Deviation Detection ────────────────

/**
 * Check if a merchant's actual volume deviates significantly from their
 * declared expected monthly volume. Call this periodically (e.g., monthly)
 * or after each transaction.
 *
 * Triggers EDD if actual volume exceeds declared volume by the threshold
 * multiplier (default 2x). For example, a merchant who declared R10k/month
 * but is processing R25k/month would trigger EDD.
 */
export async function checkVolumeDeviation(
  merchantId: string,
  merchantName: string,
  ownerName: string,
  declaredMonthlyVolume: number,
  actualMonthlyVolume: number,
  thresholdMultiplier: number = 2.0,
): Promise<EDDCase | null> {
  if (actualMonthlyVolume <= declaredMonthlyVolume * thresholdMultiplier) {
    return null; // Within acceptable range
  }

  // Check if there's already an open volume deviation case for this merchant
  const existingCases = await getEDDCasesForMerchant(merchantId);
  const hasOpenVolumeCase = existingCases.some(
    c => c.trigger === "volume_deviation" && !["rejected", "closed"].includes(c.status),
  );
  if (hasOpenVolumeCase) return null; // Don't duplicate

  const deviation = ((actualMonthlyVolume / declaredMonthlyVolume) * 100 - 100).toFixed(0);

  return openEDDCase({
    merchantId,
    merchantName,
    ownerName,
    trigger: "volume_deviation",
    triggerDetail: `Actual monthly volume R${actualMonthlyVolume.toLocaleString("en-ZA")} is ${deviation}% above declared R${declaredMonthlyVolume.toLocaleString("en-ZA")}/month (${(actualMonthlyVolume / declaredMonthlyVolume).toFixed(1)}x threshold)`,
    riskLevel: actualMonthlyVolume > declaredMonthlyVolume * 5 ? "critical" : "high",
    openedBy: "system",
  });
}

/**
 * Auto-trigger EDD for a PEP-identified merchant.
 * Called from the KYC verification flow when VerifyNow returns isPep = true.
 */
export async function triggerPepEDD(
  merchantId: string,
  merchantName: string,
  ownerName: string,
  pepDetail: string,
): Promise<EDDCase> {
  // Check for existing open PEP case
  const existingCases = await getEDDCasesForMerchant(merchantId);
  const existing = existingCases.find(
    c => c.trigger === "pep_identified" && !["rejected", "closed"].includes(c.status),
  );
  if (existing) return existing;

  return openEDDCase({
    merchantId,
    merchantName,
    ownerName,
    trigger: "pep_identified",
    triggerDetail: pepDetail,
    riskLevel: "critical",
    openedBy: "system",
  });
}

/**
 * Auto-trigger EDD for a sanctions near-match.
 * Called when sanctions screening returns a fuzzy match (score 65–94).
 */
export async function triggerSanctionsNearMatchEDD(
  merchantId: string,
  merchantName: string,
  ownerName: string,
  matchDetail: string,
  matchScore: number,
): Promise<EDDCase> {
  const existingCases = await getEDDCasesForMerchant(merchantId);
  const existing = existingCases.find(
    c => c.trigger === "sanctions_near_match" && !["rejected", "closed"].includes(c.status),
  );
  if (existing) return existing;

  return openEDDCase({
    merchantId,
    merchantName,
    ownerName,
    trigger: "sanctions_near_match",
    triggerDetail: `Sanctions near-match (score ${matchScore}/100): ${matchDetail}`,
    riskLevel: matchScore >= 80 ? "critical" : "high",
    openedBy: "system",
  });
}
