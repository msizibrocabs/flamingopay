/**
 * FICA / AML constants that are safe to import from BOTH client and server
 * components. No Redis, no `server-only`, no side effects — pure numbers.
 *
 * `lib/fica.ts` re-exports these so existing server-side imports keep
 * working. Client components (e.g. /compliance/strs) should import directly
 * from this file to avoid pulling in the server-only fica module (which
 * dynamically imports verifynow + edd).
 */

// ─── CTR (Currency Transaction Report) ───
// FICA requires reporting of cash transactions ≥ R25,000.
// Filing deadline: 2 business days after the reportable transaction (FIC Act s28(1)).
export const CTR_THRESHOLD = 25_000; // ZAR
export const CTR_FILING_DEADLINE_DAYS = 2; // business days — FIC Act s28(1)

// ─── STR (Suspicious Transaction Report) ───
// Filing deadline: 15 working days after forming a suspicion (FIC Act s29(3)).
// We count 15 calendar days in this field; the UI warns at day 10 and flags
// overdue at day 15 so compliance has visual headroom for weekends/holidays.
export const STR_FILING_DEADLINE_DAYS = 15; // working days — FIC Act s29(3)
export const STR_WARNING_DAYS = 10;
