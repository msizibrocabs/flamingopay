/**
 * Flamingo Pay — Formal Complaints Handling System
 *
 * Implements FSCA Conduct Standard, PASA/NPS Act, and POPIA timelines.
 *
 * Redis keys:
 *   complaint:{id}       → JSON Complaint
 *   complaint_ids         → JSON string[] (all complaint IDs)
 *   complaints:merchant:{merchantId} → JSON string[] (complaint IDs for a merchant)
 */

import "server-only";
import { Redis } from "@upstash/redis";
import { MS_PER_DAY } from "./time";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

// ─── Types ──────────────────────────────────────────────────

export type ComplaintCategory =
  | "payment_dispute"
  | "fees_charges"
  | "service_quality"
  | "data_privacy"
  | "sanctions_fica"
  | "fraud_security"
  | "staff_conduct"
  | "other";

export type ComplaintStatus =
  | "received"       // Just submitted
  | "acknowledged"   // Written acknowledgement sent (SLA: 1 business day)
  | "investigating"  // Under investigation (SLA: 10 business days)
  | "resolved"       // Outcome provided (SLA: 15 business days)
  | "escalated"      // Escalated to next level
  | "closed";        // Finalised (complainant accepted or external referral)

export type EscalationLevel = 1 | 2 | 3;

export type ComplaintOutcome = "upheld" | "partially_upheld" | "not_upheld" | "pending";

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  payment_dispute: "Payment Dispute",
  fees_charges: "Fees & Charges",
  service_quality: "Service Quality",
  data_privacy: "Data & Privacy (POPIA)",
  sanctions_fica: "Sanctions / FICA",
  fraud_security: "Fraud & Security",
  staff_conduct: "Staff Conduct",
  other: "Other",
};

export const CATEGORY_FRAMEWORK: Record<ComplaintCategory, string> = {
  payment_dispute: "PASA / NPS Act",
  fees_charges: "FSCA Conduct Standard",
  service_quality: "Internal SLA",
  data_privacy: "POPIA / Information Regulator",
  sanctions_fica: "FIC Act / FICA",
  fraud_security: "NPS Act / PASA",
  staff_conduct: "FSCA Conduct Standard",
  other: "Internal",
};

/** SLA timelines in business days */
export const SLA = {
  acknowledge: 1,      // Written acknowledgement
  assess: 3,           // Categorise and assign
  investigate: 10,     // Complete investigation
  resolve: 15,         // Provide outcome
  escalate: 5,         // Escalate if unresolved
  popia_response: 30,  // POPIA data complaint (calendar days)
} as const;

export type ComplaintEvent = {
  timestamp: string;
  action: string;
  actor: string;     // "system", staff name, or "merchant"
  note?: string;
};

export type Complaint = {
  id: string;                    // CMP-XXXXXXXX
  merchantId: string;
  merchantName: string;
  complainantName: string;
  complainantEmail?: string;
  complainantPhone?: string;
  category: ComplaintCategory;
  subject: string;
  description: string;
  /** Related transaction ID (if payment dispute) */
  relatedTxnId?: string;
  status: ComplaintStatus;
  level: EscalationLevel;
  outcome: ComplaintOutcome;
  outcomeNote?: string;
  /** Assigned handler name */
  handler?: string;
  /** Timeline tracking */
  createdAt: string;
  acknowledgedAt?: string;
  assessedAt?: string;
  resolvedAt?: string;
  escalatedAt?: string;
  closedAt?: string;
  /** SLA deadline (ISO date) for the current stage */
  slaDeadline?: string;
  /** Whether SLA was breached */
  slaBreach: boolean;
  /** Event log */
  events: ComplaintEvent[];
};

// ─── Helpers ────────────────────────────────────────────────

function generateComplaintId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `CMP-${code}`;
}

/** Calculate a business day deadline from a given date. */
export function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++; // Skip weekends
  }
  return result;
}

/** Check if an SLA deadline has been breached. */
export function isBreached(deadline: string | undefined): boolean {
  if (!deadline) return false;
  return new Date() > new Date(deadline);
}

/** Get the SLA deadline label for the current status. */
export function slaForStatus(status: ComplaintStatus, createdAt: string): string | undefined {
  const created = new Date(createdAt);
  switch (status) {
    case "received":
      return addBusinessDays(created, SLA.acknowledge).toISOString();
    case "acknowledged":
      return addBusinessDays(created, SLA.assess).toISOString();
    case "investigating":
      return addBusinessDays(created, SLA.resolve).toISOString();
    default:
      return undefined;
  }
}

// ─── CRUD ───────────────────────────────────────────────────

export type NewComplaintInput = {
  merchantId: string;
  merchantName: string;
  complainantName: string;
  complainantEmail?: string;
  complainantPhone?: string;
  category: ComplaintCategory;
  subject: string;
  description: string;
  relatedTxnId?: string;
};

export async function createComplaint(input: NewComplaintInput): Promise<Complaint> {
  let id = generateComplaintId();
  while (await redis.exists(`complaint:${id}`)) {
    id = generateComplaintId();
  }

  const now = new Date().toISOString();
  const slaDeadline = addBusinessDays(new Date(), SLA.acknowledge).toISOString();

  const complaint: Complaint = {
    id,
    merchantId: input.merchantId,
    merchantName: input.merchantName,
    complainantName: input.complainantName,
    complainantEmail: input.complainantEmail,
    complainantPhone: input.complainantPhone,
    category: input.category,
    subject: input.subject,
    description: input.description,
    relatedTxnId: input.relatedTxnId,
    status: "received",
    level: 1,
    outcome: "pending",
    createdAt: now,
    slaDeadline,
    slaBreach: false,
    events: [
      { timestamp: now, action: "Complaint submitted", actor: "merchant" },
    ],
  };

  // Store complaint and update indices
  const allIdsRaw = await redis.get("complaint_ids");
  const allIds: string[] = typeof allIdsRaw === "string" ? JSON.parse(allIdsRaw) : (allIdsRaw as string[] | null) ?? [];
  allIds.push(id);

  const merchantIdsRaw = await redis.get(`complaints:merchant:${input.merchantId}`);
  const merchantIds: string[] = typeof merchantIdsRaw === "string" ? JSON.parse(merchantIdsRaw) : (merchantIdsRaw as string[] | null) ?? [];
  merchantIds.push(id);

  await redis.pipeline()
    .set(`complaint:${id}`, JSON.stringify(complaint))
    .set("complaint_ids", JSON.stringify(allIds))
    .set(`complaints:merchant:${input.merchantId}`, JSON.stringify(merchantIds))
    .exec();

  return complaint;
}

export async function getComplaint(id: string): Promise<Complaint | null> {
  const raw = await redis.get(`complaint:${id}`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw as Complaint;
}

export async function listComplaints(filters?: {
  merchantId?: string;
  status?: ComplaintStatus;
  category?: ComplaintCategory;
}): Promise<Complaint[]> {
  let ids: string[];

  if (filters?.merchantId) {
    const raw = await redis.get(`complaints:merchant:${filters.merchantId}`);
    ids = typeof raw === "string" ? JSON.parse(raw) : (raw as string[] | null) ?? [];
  } else {
    const raw = await redis.get("complaint_ids");
    ids = typeof raw === "string" ? JSON.parse(raw) : (raw as string[] | null) ?? [];
  }

  if (ids.length === 0) return [];

  const pipe = redis.pipeline();
  for (const id of ids) pipe.get(`complaint:${id}`);
  const results = await pipe.exec();

  let complaints: Complaint[] = [];
  for (const raw of results) {
    if (!raw) continue;
    const c: Complaint = typeof raw === "string" ? JSON.parse(raw) : raw as Complaint;
    // Update breach status on read
    if (c.slaDeadline && !c.slaBreach && isBreached(c.slaDeadline)) {
      c.slaBreach = true;
    }
    complaints.push(c);
  }

  // Apply filters
  if (filters?.status) {
    complaints = complaints.filter(c => c.status === filters.status);
  }
  if (filters?.category) {
    complaints = complaints.filter(c => c.category === filters.category);
  }

  return complaints.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateComplaint(
  id: string,
  patch: {
    status?: ComplaintStatus;
    handler?: string;
    outcome?: ComplaintOutcome;
    outcomeNote?: string;
    level?: EscalationLevel;
    note?: string;
    actor?: string;
  },
): Promise<Complaint | null> {
  const complaint = await getComplaint(id);
  if (!complaint) return null;

  const now = new Date().toISOString();
  const actor = patch.actor || "system";
  const events = [...complaint.events];

  // Status transitions
  if (patch.status && patch.status !== complaint.status) {
    complaint.status = patch.status;

    switch (patch.status) {
      case "acknowledged":
        complaint.acknowledgedAt = now;
        complaint.slaDeadline = addBusinessDays(new Date(complaint.createdAt), SLA.assess).toISOString();
        events.push({ timestamp: now, action: "Complaint acknowledged", actor, note: patch.note });
        break;
      case "investigating":
        complaint.assessedAt = now;
        complaint.slaDeadline = addBusinessDays(new Date(complaint.createdAt), SLA.resolve).toISOString();
        events.push({ timestamp: now, action: "Investigation started", actor, note: patch.note });
        break;
      case "resolved":
        complaint.resolvedAt = now;
        complaint.slaDeadline = undefined;
        events.push({ timestamp: now, action: "Complaint resolved", actor, note: patch.note });
        break;
      case "escalated":
        complaint.escalatedAt = now;
        complaint.level = Math.min(3, complaint.level + 1) as EscalationLevel;
        complaint.slaDeadline = addBusinessDays(new Date(), SLA.escalate).toISOString();
        events.push({ timestamp: now, action: `Escalated to Level ${complaint.level}`, actor, note: patch.note });
        break;
      case "closed":
        complaint.closedAt = now;
        complaint.slaDeadline = undefined;
        events.push({ timestamp: now, action: "Complaint closed", actor, note: patch.note });
        break;
      default:
        events.push({ timestamp: now, action: `Status changed to ${patch.status}`, actor, note: patch.note });
    }
  } else if (patch.note) {
    events.push({ timestamp: now, action: "Note added", actor, note: patch.note });
  }

  if (patch.handler) complaint.handler = patch.handler;
  if (patch.outcome) complaint.outcome = patch.outcome;
  if (patch.outcomeNote) complaint.outcomeNote = patch.outcomeNote;
  if (patch.level) complaint.level = patch.level;

  // Check breach
  if (complaint.slaDeadline && isBreached(complaint.slaDeadline)) {
    complaint.slaBreach = true;
  }

  complaint.events = events;
  await redis.set(`complaint:${id}`, JSON.stringify(complaint));
  return complaint;
}

// ─── Stats ──────────────────────────────────────────────────

export async function complaintStats() {
  const all = await listComplaints();
  const open = all.filter(c => !["resolved", "closed"].includes(c.status));
  const breached = all.filter(c => c.slaBreach && !["resolved", "closed"].includes(c.status));
  const resolvedThisMonth = all.filter(c => {
    if (!c.resolvedAt) return false;
    const now = new Date();
    const resolved = new Date(c.resolvedAt);
    return resolved.getMonth() === now.getMonth() && resolved.getFullYear() === now.getFullYear();
  });

  // Average resolution time (in business days)
  const resolvedWithTime = all.filter(c => c.resolvedAt);
  let avgDays = 0;
  if (resolvedWithTime.length > 0) {
    const totalMs = resolvedWithTime.reduce((s, c) => {
      return s + (new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime());
    }, 0);
    avgDays = Math.round(totalMs / resolvedWithTime.length / MS_PER_DAY);
  }

  // Category breakdown
  const byCategory: Record<string, number> = {};
  for (const c of all) {
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
  }

  return {
    total: all.length,
    open: open.length,
    breached: breached.length,
    resolvedThisMonth: resolvedThisMonth.length,
    avgResolutionDays: avgDays,
    byCategory,
    byStatus: {
      received: all.filter(c => c.status === "received").length,
      acknowledged: all.filter(c => c.status === "acknowledged").length,
      investigating: all.filter(c => c.status === "investigating").length,
      resolved: all.filter(c => c.status === "resolved").length,
      escalated: all.filter(c => c.status === "escalated").length,
      closed: all.filter(c => c.status === "closed").length,
    },
  };
}
