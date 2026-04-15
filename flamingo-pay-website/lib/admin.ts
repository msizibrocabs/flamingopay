/**
 * Admin (Flamingo staff) client-side session helpers.
 *
 * DEMO ONLY. Real admin auth should be SSO or a secure server session
 * (NextAuth / Clerk / Supabase). Right now we gate the UI with a
 * localStorage flag + a shared demo passcode, which stops casual clicks
 * but is NOT a security boundary.
 */

const ADMIN_KEY = "flamingo_admin_session";

// TODO: replace with proper server auth before production.
export const DEMO_ADMIN_PASSCODE = "flamingo2026";

export type AdminSession = {
  name: string;
  signedInAt: string;
};

export function adminSignIn(name: string) {
  if (typeof window === "undefined") return;
  const session: AdminSession = {
    name: name || "Flamingo Staff",
    signedInAt: new Date().toISOString(),
  };
  window.localStorage.setItem(ADMIN_KEY, JSON.stringify(session));
}

export function adminSignOut() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_KEY);
}

export function currentAdmin(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}
