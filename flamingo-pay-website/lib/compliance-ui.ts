/**
 * Flamingo Pay — Shared compliance-UI helpers.
 *
 * Centralised status label + colour maps for the compliance surfaces
 * (flags, EDD cases, STRs, CTRs). Before this existed, each page
 * defined its own STATUS_LABELS / STATUS_COLORS which drifted over
 * time — e.g. EDD used "investigation" while flags used "investigating".
 *
 * UI code should import the constants from here. If a status value
 * genuinely needs to differ between modules (e.g. CTR has no rich
 * status enum, just filed/pending), keep that local — but common
 * values like "pending_review" / "filed" / "dismissed" should only
 * be labelled once.
 */

// ─── Flag statuses ───────────────────────────────────────────

export const FLAG_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  investigating: "Investigating",
  cleared: "Cleared",
  confirmed: "Confirmed fraud",
};

export const FLAG_STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-800 border-red-300",
  investigating: "bg-amber-100 text-amber-800 border-amber-300",
  cleared: "bg-green-100 text-green-800 border-green-300",
  confirmed: "bg-purple-100 text-purple-800 border-purple-300",
};

// ─── STR statuses (FIC Act s29) ──────────────────────────────

export const STR_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  filed: "Filed with FIC",
  dismissed: "Dismissed",
};

export const STR_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  pending_review: "bg-amber-100 text-amber-800 border-amber-300",
  filed: "bg-green-100 text-green-800 border-green-300",
  dismissed: "bg-purple-100 text-purple-600 border-purple-300",
};

// ─── EDD statuses ────────────────────────────────────────────
// NOTE: EDD uses "investigation" (noun) rather than "investigating" (verb)
// to match the rest of the lifecycle nouns (opened, approved, rejected).
// Kept as-is for data compatibility — labels below bridge the gap.

export const EDD_STATUS_LABELS: Record<string, string> = {
  opened: "Open",
  investigation: "Investigating",
  pending_approval: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  closed: "Closed",
};

export const EDD_STATUS_COLORS: Record<string, string> = {
  opened: "bg-red-100 text-red-800 border-red-300",
  investigation: "bg-amber-100 text-amber-800 border-amber-300",
  pending_approval: "bg-blue-100 text-blue-800 border-blue-300",
  approved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-purple-100 text-purple-800 border-purple-300",
  closed: "bg-gray-100 text-gray-600 border-gray-300",
};

// ─── Risk levels (shared across sanctions, EDD, STR) ─────────

export const RISK_LEVEL_COLORS: Record<string, string> = {
  low: "bg-green-500 text-white",
  medium: "bg-amber-500 text-white",
  high: "bg-orange-500 text-white",
  critical: "bg-red-600 text-white",
};
