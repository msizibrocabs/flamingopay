/**
 * KYC primitives that are safe to import from BOTH client and server
 * components. No Redis, no `server-only`, no side effects — pure types,
 * constants, and pure functions.
 *
 * `lib/store.ts` re-exports these so existing server-side imports keep
 * working. Client components (e.g. /merchant/signup) should import
 * directly from this file to avoid pulling in the server-only store.
 */

export type KycTier = "simplified" | "standard" | "enhanced";

export type DocumentKind =
  | "rica_phone"
  | "id"
  | "selfie"
  | "affidavit"
  | "company_reg"
  | "proof_of_address"
  | "bank_letter"
  | "source_of_funds";

/**
 * Volume thresholds (monthly, ZAR) that determine KYC tier.
 *
 * Simplified is FICA Directive 6 simplified due diligence for very-low-risk
 * informal traders — RICA-registered phone + sworn affidavit + selfie,
 * capped at R5 000/month. SA ID number is optional.
 */
export const KYC_THRESHOLDS = {
  simplified: 5_000, // < R5k/month
  standard: 100_000, // R5k – R100k/month
  // enhanced: > R100k/month
} as const;

/** Determine KYC tier from expected monthly volume. */
export function kycTierForVolume(monthlyVolume: number): KycTier {
  if (monthlyVolume < KYC_THRESHOLDS.simplified) return "simplified";
  if (monthlyVolume <= KYC_THRESHOLDS.standard) return "standard";
  return "enhanced";
}

/** Human-readable tier labels. */
export const KYC_TIER_LABELS: Record<KycTier, string> = {
  simplified: "Simplified (< R5k/month)",
  standard: "Standard (R5k – R100k/month)",
  enhanced: "Enhanced (> R100k/month)",
};

/**
 * Document labels — exported so signup UI, admin detail and compliance
 * queue all use identical wording.
 */
export const DOC_LABELS: Record<DocumentKind, string> = {
  rica_phone: "RICA-registered phone",
  id: "SA ID document",
  selfie: "Photo (selfie)",
  affidavit: "Sworn affidavit",
  company_reg: "CIPC company registration",
  proof_of_address: "Proof of address (utility bill)",
  bank_letter: "Bank confirmation letter",
  source_of_funds: "Source of funds declaration",
};

/**
 * Documents required per KYC tier (cumulative):
 *   Simplified  (< R5k/mo) : RICA phone, selfie, affidavit             (3 docs)
 *                            — FICA Directive 6 simplified due diligence.
 *                              SA ID number optional; if supplied, SAID +
 *                              AML/PEP still run via VerifyNow.
 *   Standard (R5k–R100k/mo): ID, selfie, PoA + bank letter + aff/CIPC   (5 docs)
 *   Enhanced   (> R100k/mo): + source of funds                          (6 docs)
 */
export function docsForTier(
  tier: KycTier,
  businessType: string,
): DocumentKind[] {
  if (tier === "simplified") {
    return ["rica_phone", "selfie", "affidavit"];
  }

  const docs: DocumentKind[] = ["id", "selfie", "proof_of_address", "bank_letter"];
  const isCompany = /pty|ltd|cc|company|bakery|studio|boutique|transport/i.test(
    businessType,
  );
  docs.push(isCompany ? "company_reg" : "affidavit");

  if (tier === "standard") return docs;

  docs.push("source_of_funds");
  return docs;
}
