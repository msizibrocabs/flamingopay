/**
 * Flamingo Pay — Shared time constants.
 *
 * Date/time math across the codebase used to repeat raw magic numbers
 * (86_400_000, 1827 * 86400, 5 * 365 * 86400, …) which made it very easy
 * for the seconds/milliseconds distinction to drift. Everything lives here
 * now so that — for example — FICA's 5-year retention is defined in one
 * place and both server-side Redis TTLs and client-side countdowns refer
 * to the same value.
 *
 * Naming convention:
 *   • `MS_PER_*`       — milliseconds (for Date math / setTimeout)
 *   • `SECONDS_PER_*`  — seconds (for Redis EX / TTL)
 *   • `*_DAYS`         — whole days (for deadlines / countdowns)
 */

// ─── Milliseconds (Date math) ────────────────────────────────
export const MS_PER_SECOND = 1_000;
export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 86_400_000;

// ─── Seconds (Redis TTL / Vercel maxDuration) ────────────────
export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 3_600;
export const SECONDS_PER_DAY = 86_400;

// ─── FICA-mandated retention ─────────────────────────────────
// FIC Act s42(2) — records must be kept for at least 5 years from the
// date the business relationship ended or the transaction was concluded.
// 1827 days ≈ 5 × 365.25, matching the value historically used in
// lib/audit.ts and lib/data-retention.ts.
export const FICA_RETENTION_DAYS = 1_827;
export const FICA_RETENTION_SECONDS = FICA_RETENTION_DAYS * SECONDS_PER_DAY;
export const FICA_RETENTION_MS = FICA_RETENTION_DAYS * MS_PER_DAY;

// ─── Helpers ─────────────────────────────────────────────────

/** Whole days between now and the supplied ISO timestamp (clamped ≥ 0). */
export function daysSince(iso: string): number {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / MS_PER_DAY));
}

/** ISO string N days ago. */
export function isoDaysAgo(days: number, from: number = Date.now()): string {
  return new Date(from - days * MS_PER_DAY).toISOString();
}

/** ISO string N days from now. */
export function isoDaysFromNow(days: number, from: number = Date.now()): string {
  return new Date(from + days * MS_PER_DAY).toISOString();
}

/** YYYY-MM-DD N days from now (useful for EDD review-date fields). */
export function dateStringDaysFromNow(days: number, from: number = Date.now()): string {
  return new Date(from + days * MS_PER_DAY).toISOString().split("T")[0];
}
