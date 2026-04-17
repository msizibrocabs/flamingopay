/**
 * Compliance officer client-side session helpers.
 *
 * DEMO ONLY — mirrors the admin auth pattern but uses a separate
 * localStorage key and passcode so the two roles stay distinct.
 */

const COMPLIANCE_KEY = "flamingo_compliance_session";

export const DEMO_COMPLIANCE_PASSCODE = "compliance2026";

export type ComplianceSession = {
  name: string;
  signedInAt: string;
};

export function complianceSignIn(name: string) {
  if (typeof window === "undefined") return;
  const session: ComplianceSession = {
    name: name || "Compliance Officer",
    signedInAt: new Date().toISOString(),
  };
  window.localStorage.setItem(COMPLIANCE_KEY, JSON.stringify(session));
}

export function complianceSignOut() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(COMPLIANCE_KEY);
}

export function currentComplianceOfficer(): ComplianceSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(COMPLIANCE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ComplianceSession;
  } catch {
    return null;
  }
}
