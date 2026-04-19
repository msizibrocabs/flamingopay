/**
 * Flamingo Pay — VerifyNow Integration
 *
 * South African identity verification, background checks, and business
 * verification via VerifyNow (verifynow.co.za).
 *
 * Services integrated:
 *   1. SAID Verification       — Home Affairs ID number validation (R2.99)
 *   2. ID + Photo (Enhanced)   — Biometric liveness + Home Affairs photo match (R29.90)
 *   3. Face Match              — Selfie ↔ ID photo comparison (R29.90)
 *   4. AML/PEP/Sanctions       — FIC-compliant screening (R14.95)
 *   5. Bank Account Verify     — AVS: confirm account ownership (R17.94)
 *   6. CIPC Company Match      — Verify company registration (R59.80)
 *   7. CIPC Director Search    — Verify company directors (R59.80)
 *
 * Environment variables:
 *   VERIFYNOW_API_KEY       — API key from verifynow.co.za dashboard
 *   VERIFYNOW_BASE_URL      — API base URL (default: https://api.verifynow.co.za/v1)
 *
 * Redis keys:
 *   kyc:{merchantId}        — JSON KycVerificationRecord
 */

import "server-only";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

// ─── Configuration ──────────────────────────────────────────

const BASE_URL =
  process.env.VERIFYNOW_BASE_URL || "https://api.verifynow.co.za/v1";

function getApiKey(): string {
  const key = process.env.VERIFYNOW_API_KEY;
  if (!key) {
    throw new Error(
      "VERIFYNOW_API_KEY is not set. Add it to .env.local to enable identity verification.",
    );
  }
  return key;
}

// ─── Types ──────────────────────────────────────────────────

/** Overall KYC verification status for a merchant. */
export type KycStatus =
  | "not_started"
  | "in_progress"
  | "verified"
  | "failed"
  | "requires_review";

/** Individual check status. */
export type CheckStatus = "pending" | "passed" | "failed" | "error";

/** A single verification check result. */
export type VerificationCheck = {
  service: string;
  status: CheckStatus;
  /** VerifyNow reference ID for this check. */
  referenceId?: string;
  /** When the check was initiated. */
  requestedAt: string;
  /** When the result came back. */
  completedAt?: string;
  /** Confidence score 0–100 (where applicable). */
  confidence?: number;
  /** Human-readable result summary. */
  summary?: string;
  /** Raw response data (redacted of sensitive info). */
  details?: Record<string, unknown>;
  /** Error message if the check failed. */
  error?: string;
  /** Cost in credits. */
  credits?: number;
};

/** Full KYC verification record for a merchant. */
export type KycVerificationRecord = {
  merchantId: string;
  /** Overall KYC verification status. */
  status: KycStatus;
  /** When verification was initiated. */
  startedAt: string;
  /** When all checks completed. */
  completedAt?: string;
  /** Individual check results. */
  checks: VerificationCheck[];
  /** SA ID number (last 6 digits masked for storage). */
  idNumberMasked?: string;
  /** Whether the person is a PEP. */
  isPep?: boolean;
  /** Whether the person has sanctions hits. */
  hasSanctionsHit?: boolean;
  /** Total credits consumed. */
  totalCredits: number;
  /** Admin notes. */
  notes?: string;
};

// ─── API Client ─────────────────────────────────────────────

type ApiResponse<T = Record<string, unknown>> = {
  success: boolean;
  data?: T;
  error?: string;
  referenceId?: string;
};

async function callVerifyNow<T = Record<string, unknown>>(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  const apiKey = getApiKey();

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Source": "flamingo-pay",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[verifynow] ${endpoint} HTTP ${res.status}: ${text}`);
      return {
        success: false,
        error: `VerifyNow API error: ${res.status} ${res.statusText}`,
      };
    }

    const json = await res.json();
    return { success: true, data: json as T, referenceId: json.referenceId };
  } catch (err) {
    console.error(`[verifynow] ${endpoint} fetch error:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

// ─── Individual Verification Services ───────────────────────

/**
 * 1. SAID Verification — validate a 13-digit SA ID against Home Affairs.
 *    Returns: name, surname, date of birth, gender, citizenship status,
 *    deceased status.
 */
export async function verifySAID(idNumber: string): Promise<VerificationCheck> {
  const now = new Date().toISOString();
  const result = await callVerifyNow("/identity/said", {
    id_number: idNumber,
  });

  if (!result.success) {
    return {
      service: "said_verification",
      status: "error",
      requestedAt: now,
      completedAt: new Date().toISOString(),
      error: result.error,
      credits: 1,
    };
  }

  const data = result.data as Record<string, unknown>;
  const isValid = data?.valid === true || data?.status === "valid";
  const isDeceased = data?.deceased === true;

  return {
    service: "said_verification",
    status: isDeceased ? "failed" : isValid ? "passed" : "failed",
    referenceId: result.referenceId,
    requestedAt: now,
    completedAt: new Date().toISOString(),
    confidence: isValid ? 100 : 0,
    summary: isDeceased
      ? "ID belongs to a deceased person"
      : isValid
        ? "SA ID verified against Home Affairs"
        : "SA ID could not be verified",
    details: {
      firstName: data?.first_name ?? data?.firstName,
      surname: data?.surname ?? data?.lastName,
      dateOfBirth: data?.date_of_birth ?? data?.dateOfBirth,
      gender: data?.gender,
      citizenshipStatus: data?.citizenship_status ?? data?.citizenshipStatus,
      deceased: isDeceased,
    },
    credits: 1,
  };
}

/**
 * 2. ID + Photo (Enhanced) — biometric identity verification.
 *    Matches a selfie against the Home Affairs photo on file.
 *    Includes liveness detection to prevent spoofing.
 */
export async function verifyIdPhoto(
  idNumber: string,
  selfieBase64: string,
): Promise<VerificationCheck> {
  const now = new Date().toISOString();
  const result = await callVerifyNow("/identity/id-photo-enhanced", {
    id_number: idNumber,
    selfie: selfieBase64,
  });

  if (!result.success) {
    return {
      service: "id_photo_enhanced",
      status: "error",
      requestedAt: now,
      completedAt: new Date().toISOString(),
      error: result.error,
      credits: 10,
    };
  }

  const data = result.data as Record<string, unknown>;
  const matchScore = typeof data?.confidence === "number" ? data.confidence as number : 0;
  const isLive = data?.liveness === true || data?.liveness_passed === true;
  const isMatch = matchScore >= 70 && isLive;

  return {
    service: "id_photo_enhanced",
    status: isMatch ? "passed" : "failed",
    referenceId: result.referenceId,
    requestedAt: now,
    completedAt: new Date().toISOString(),
    confidence: matchScore,
    summary: !isLive
      ? "Liveness check failed — possible spoofing attempt"
      : isMatch
        ? `Face matched with ${matchScore}% confidence`
        : `Face match below threshold (${matchScore}%)`,
    details: {
      matchScore,
      livenessDetected: isLive,
      photoSource: "Home Affairs",
    },
    credits: 10,
  };
}

/**
 * 3. Face Match — compare selfie to ID document photo.
 *    Used when the merchant uploads an ID photo separately.
 */
export async function verifyFaceMatch(
  idPhotoBase64: string,
  selfieBase64: string,
): Promise<VerificationCheck> {
  const now = new Date().toISOString();
  const result = await callVerifyNow("/identity/face-match", {
    id_photo: idPhotoBase64,
    selfie: selfieBase64,
  });

  if (!result.success) {
    return {
      service: "face_match",
      status: "error",
      requestedAt: now,
      completedAt: new Date().toISOString(),
      error: result.error,
      credits: 10,
    };
  }

  const data = result.data as Record<string, unknown>;
  const matchScore = typeof data?.confidence === "number" ? data.confidence as number : 0;
  const isMatch = matchScore >= 70;

  return {
    service: "face_match",
    status: isMatch ? "passed" : "failed",
    referenceId: result.referenceId,
    requestedAt: now,
    completedAt: new Date().toISOString(),
    confidence: matchScore,
    summary: isMatch
      ? `Selfie matches ID photo (${matchScore}% confidence)`
      : `Selfie does not match ID photo (${matchScore}% confidence)`,
    details: { matchScore },
    credits: 10,
  };
}

/**
 * 4. AML/PEP/Sanctions — screen a person or entity against sanctions
 *    lists, PEP databases, and adverse media.
 */
export async function verifyAmlPepSanctions(
  fullName: string,
  idNumber?: string,
  dateOfBirth?: string,
): Promise<VerificationCheck> {
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = { full_name: fullName };
  if (idNumber) payload.id_number = idNumber;
  if (dateOfBirth) payload.date_of_birth = dateOfBirth;

  const result = await callVerifyNow("/background/aml-pep-sanctions", payload);

  if (!result.success) {
    return {
      service: "aml_pep_sanctions",
      status: "error",
      requestedAt: now,
      completedAt: new Date().toISOString(),
      error: result.error,
      credits: 5,
    };
  }

  const data = result.data as Record<string, unknown>;
  const hits = (data?.hits as unknown[]) ?? [];
  const isPep = data?.is_pep === true;
  const isSanctioned = data?.is_sanctioned === true;
  const hasHits = hits.length > 0 || isPep || isSanctioned;

  return {
    service: "aml_pep_sanctions",
    status: hasHits ? "failed" : "passed",
    referenceId: result.referenceId,
    requestedAt: now,
    completedAt: new Date().toISOString(),
    confidence: hasHits ? 0 : 100,
    summary: isSanctioned
      ? `SANCTIONED — ${hits.length} hit(s) found`
      : isPep
        ? `PEP identified — ${hits.length} hit(s) found, requires enhanced due diligence`
        : hasHits
          ? `${hits.length} potential match(es) found — manual review required`
          : "No AML/PEP/sanctions hits",
    details: {
      isPep,
      isSanctioned,
      hitCount: hits.length,
      // Don't store full hit details — just summaries
      hitSummaries: (hits as Array<Record<string, unknown>>).slice(0, 5).map((h) => ({
        name: h.name,
        type: h.type,
        list: h.list ?? h.source,
      })),
    },
    credits: 5,
  };
}

/**
 * 5. Bank Account Verify — confirm that a bank account belongs to
 *    the person with the given ID number (AVS).
 */
export async function verifyBankAccount(
  idNumber: string,
  bankName: string,
  accountNumber: string,
  accountType: "cheque" | "savings",
): Promise<VerificationCheck> {
  const now = new Date().toISOString();
  const result = await callVerifyNow("/background/bank-account-verify", {
    id_number: idNumber,
    bank_name: bankName,
    account_number: accountNumber,
    account_type: accountType,
  });

  if (!result.success) {
    return {
      service: "bank_account_verify",
      status: "error",
      requestedAt: now,
      completedAt: new Date().toISOString(),
      error: result.error,
      credits: 6,
    };
  }

  const data = result.data as Record<string, unknown>;
  const isVerified =
    data?.account_exists === true && data?.id_matches === true;
  const accountActive = data?.account_active !== false;

  return {
    service: "bank_account_verify",
    status: isVerified && accountActive ? "passed" : "failed",
    referenceId: result.referenceId,
    requestedAt: now,
    completedAt: new Date().toISOString(),
    confidence: isVerified ? 100 : 0,
    summary: !isVerified
      ? "Bank account does not match the ID number provided"
      : !accountActive
        ? "Bank account is not active"
        : "Bank account verified — account matches ID holder",
    details: {
      accountExists: data?.account_exists,
      idMatches: data?.id_matches,
      accountActive,
      accountType: data?.account_type,
    },
    credits: 6,
  };
}

/**
 * 6. CIPC Company Match — verify company registration with CIPC.
 *    Returns company status, directors, registration date.
 */
export async function verifyCipcCompany(
  registrationNumber: string,
  companyName?: string,
): Promise<VerificationCheck> {
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    registration_number: registrationNumber,
  };
  if (companyName) payload.company_name = companyName;

  const result = await callVerifyNow("/business/cipc-company-match", payload);

  if (!result.success) {
    return {
      service: "cipc_company_match",
      status: "error",
      requestedAt: now,
      completedAt: new Date().toISOString(),
      error: result.error,
      credits: 20,
    };
  }

  const data = result.data as Record<string, unknown>;
  const companyStatus = (data?.status as string) ?? "";
  const isActive =
    companyStatus.toLowerCase() === "in business" ||
    companyStatus.toLowerCase() === "active" ||
    companyStatus.toLowerCase() === "registered";

  return {
    service: "cipc_company_match",
    status: isActive ? "passed" : "failed",
    referenceId: result.referenceId,
    requestedAt: now,
    completedAt: new Date().toISOString(),
    confidence: isActive ? 100 : 0,
    summary: isActive
      ? `Company verified — status: ${companyStatus}`
      : `Company not active — status: ${companyStatus || "not found"}`,
    details: {
      companyName: data?.company_name,
      registrationNumber: data?.registration_number,
      companyStatus,
      registrationDate: data?.registration_date,
      companyType: data?.company_type,
      directors: data?.directors,
    },
    credits: 20,
  };
}

/**
 * 7. CIPC Director Search — verify that a person is a director of a company.
 */
export async function verifyCipcDirector(
  idNumber: string,
  registrationNumber?: string,
): Promise<VerificationCheck> {
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = { id_number: idNumber };
  if (registrationNumber) payload.registration_number = registrationNumber;

  const result = await callVerifyNow("/business/cipc-director-search", payload);

  if (!result.success) {
    return {
      service: "cipc_director_search",
      status: "error",
      requestedAt: now,
      completedAt: new Date().toISOString(),
      error: result.error,
      credits: 20,
    };
  }

  const data = result.data as Record<string, unknown>;
  const directorships = (data?.directorships as unknown[]) ?? [];
  const isDirector = directorships.length > 0;

  return {
    service: "cipc_director_search",
    status: isDirector ? "passed" : "failed",
    referenceId: result.referenceId,
    requestedAt: now,
    completedAt: new Date().toISOString(),
    confidence: isDirector ? 100 : 0,
    summary: isDirector
      ? `Director of ${directorships.length} company(ies)`
      : "No directorships found for this ID number",
    details: {
      directorshipCount: directorships.length,
      companies: (directorships as Array<Record<string, unknown>>)
        .slice(0, 10)
        .map((d) => ({
          companyName: d.company_name,
          registrationNumber: d.registration_number,
          status: d.status,
        })),
    },
    credits: 20,
  };
}

// ─── Orchestrator: Full KYC Verification ────────────────────

export type KycVerificationInput = {
  merchantId: string;
  /** 13-digit SA ID number. */
  idNumber: string;
  /** Full name as per ID document. */
  fullName: string;
  /** Base64-encoded selfie photo. */
  selfieBase64?: string;
  /** Bank details for AVS. */
  bankName: string;
  accountNumber: string;
  accountType: "cheque" | "savings";
  /** For business merchants — CIPC registration number. */
  cipcRegistrationNumber?: string;
  /** Business name for CIPC matching. */
  businessName?: string;
  /** Date of birth (YYYY-MM-DD) for enhanced AML screening. */
  dateOfBirth?: string;
};

/**
 * Run the full KYC verification suite for a merchant.
 *
 * Checks run in this order:
 *   Phase 1 (parallel):  SAID Verification + AML/PEP/Sanctions
 *   Phase 2 (if Phase 1 passes): ID + Photo Enhanced (biometric)
 *   Phase 3 (parallel):  Bank Account Verify + CIPC (if applicable)
 *
 * Short-circuits if SAID fails or sanctions are flagged.
 */
export async function runFullKycVerification(
  input: KycVerificationInput,
): Promise<KycVerificationRecord> {
  const now = new Date().toISOString();
  const record: KycVerificationRecord = {
    merchantId: input.merchantId,
    status: "in_progress",
    startedAt: now,
    checks: [],
    idNumberMasked: maskIdNumber(input.idNumber),
    totalCredits: 0,
  };

  // Save initial state
  await saveKycRecord(record);

  // ─── Phase 1: SAID + AML/PEP (parallel) ───
  console.log(`[kyc] ${input.merchantId}: Starting Phase 1 — SAID + AML/PEP`);
  const [saidCheck, amlCheck] = await Promise.all([
    verifySAID(input.idNumber),
    verifyAmlPepSanctions(input.fullName, input.idNumber, input.dateOfBirth),
  ]);

  record.checks.push(saidCheck, amlCheck);
  record.totalCredits += (saidCheck.credits ?? 0) + (amlCheck.credits ?? 0);

  // Check AML results
  const amlDetails = amlCheck.details as Record<string, unknown> | undefined;
  record.isPep = amlDetails?.isPep === true;
  record.hasSanctionsHit = amlDetails?.isSanctioned === true;

  // Short-circuit: if ID is invalid, stop here
  if (saidCheck.status === "failed") {
    record.status = "failed";
    record.completedAt = new Date().toISOString();
    record.notes = "SA ID verification failed — cannot proceed with KYC";
    await saveKycRecord(record);
    return record;
  }

  // Short-circuit: if sanctioned, flag for manual review
  if (record.hasSanctionsHit) {
    record.status = "requires_review";
    record.completedAt = new Date().toISOString();
    record.notes = "Sanctions hit detected — requires compliance officer review";
    await saveKycRecord(record);
    return record;
  }

  // PEP doesn't block, but flags for enhanced due diligence
  if (record.isPep) {
    record.notes = "PEP identified — enhanced due diligence required";
  }

  // ─── Phase 2: Biometric verification ───
  if (input.selfieBase64) {
    console.log(`[kyc] ${input.merchantId}: Starting Phase 2 — Biometric`);
    const bioCheck = await verifyIdPhoto(input.idNumber, input.selfieBase64);
    record.checks.push(bioCheck);
    record.totalCredits += bioCheck.credits ?? 0;

    if (bioCheck.status === "failed") {
      record.status = "failed";
      record.completedAt = new Date().toISOString();
      record.notes =
        (record.notes ? record.notes + ". " : "") +
        "Biometric verification failed";
      await saveKycRecord(record);
      return record;
    }
  }

  // ─── Phase 3: Bank AVS + CIPC (parallel) ───
  console.log(`[kyc] ${input.merchantId}: Starting Phase 3 — Bank AVS + CIPC`);
  const phase3Promises: Promise<VerificationCheck>[] = [
    verifyBankAccount(
      input.idNumber,
      input.bankName,
      input.accountNumber,
      input.accountType,
    ),
  ];

  // Add CIPC checks for registered businesses
  const isRegisteredBiz = !!input.cipcRegistrationNumber;
  if (isRegisteredBiz) {
    phase3Promises.push(
      verifyCipcCompany(input.cipcRegistrationNumber!, input.businessName),
      verifyCipcDirector(input.idNumber, input.cipcRegistrationNumber),
    );
  }

  const phase3Results = await Promise.all(phase3Promises);
  record.checks.push(...phase3Results);
  record.totalCredits += phase3Results.reduce(
    (sum, c) => sum + (c.credits ?? 0),
    0,
  );

  // Determine overall status
  const allPassed = record.checks.every(
    (c) => c.status === "passed" || c.status === "error",
  );
  const anyFailed = record.checks.some((c) => c.status === "failed");
  const anyError = record.checks.some((c) => c.status === "error");

  if (anyFailed) {
    record.status = "failed";
  } else if (record.isPep || anyError) {
    record.status = "requires_review";
  } else if (allPassed) {
    record.status = "verified";
  } else {
    record.status = "requires_review";
  }

  record.completedAt = new Date().toISOString();
  await saveKycRecord(record);

  console.log(
    `[kyc] ${input.merchantId}: Verification complete — ${record.status} (${record.checks.length} checks, ${record.totalCredits} credits)`,
  );

  return record;
}

// ─── Storage ────────────────────────────────────────────────

/** Save or update a KYC verification record. */
export async function saveKycRecord(
  record: KycVerificationRecord,
): Promise<void> {
  await redis.set(`kyc:${record.merchantId}`, JSON.stringify(record));
}

/** Get a merchant's KYC verification record. */
export async function getKycRecord(
  merchantId: string,
): Promise<KycVerificationRecord | null> {
  const raw = await redis.get(`kyc:${merchantId}`);
  if (!raw) return null;
  return typeof raw === "string"
    ? JSON.parse(raw)
    : (raw as KycVerificationRecord);
}

// ─── Helpers ────────────────────────────────────────────────

/** Mask a SA ID number for safe storage: show first 6 (DOB), mask the rest. */
function maskIdNumber(id: string): string {
  if (id.length < 13) return "***masked***";
  return id.slice(0, 6) + "*******";
}

/**
 * Determine which checks are required for a given KYC tier.
 * Higher tiers require more checks.
 */
export function requiredChecksForTier(
  tier: "simplified" | "standard" | "enhanced",
  isRegisteredBusiness: boolean,
): string[] {
  // All tiers require identity + AML
  const checks = ["said_verification", "aml_pep_sanctions"];

  if (tier === "standard" || tier === "enhanced") {
    // Standard+ needs biometric + bank AVS
    checks.push("id_photo_enhanced", "bank_account_verify");
  }

  if (tier === "enhanced") {
    // Enhanced adds face match for extra assurance
    checks.push("face_match");
  }

  // Registered businesses always need CIPC checks
  if (isRegisteredBusiness) {
    checks.push("cipc_company_match", "cipc_director_search");
  }

  return checks;
}

/**
 * Calculate the credit cost for a set of checks.
 */
export function estimateCredits(checkServices: string[]): number {
  const costs: Record<string, number> = {
    said_verification: 1,
    id_photo_enhanced: 10,
    face_match: 10,
    aml_pep_sanctions: 5,
    bank_account_verify: 6,
    cipc_company_match: 20,
    cipc_director_search: 20,
  };
  return checkServices.reduce((sum, s) => sum + (costs[s] ?? 0), 0);
}
