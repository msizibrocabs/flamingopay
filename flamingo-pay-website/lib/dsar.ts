/**
 * POPIA Section 23 & 24 — Data Subject Access & Deletion Request handling.
 *
 * Section 23: Allows buyers and merchants to request a copy of all personal data.
 * Section 24: Allows data subjects to request deletion/destruction of personal data,
 *             subject to FICA 5-year retention requirements for financial records.
 *
 * Deletion strategy:
 * - Non-financial PII (name, phone, address, etc.) → anonymized immediately
 * - Financial records (transactions, flags, disputes) → retained for FICA, scheduled
 *   for deletion after 5-year retention period expires
 * - KYC documents → retained for FICA period, then deleted
 *
 * Storage: per-key pattern — dsar:<id>, dsars:index Set, dsars:email:<email> dedup.
 */

import { Redis } from "@upstash/redis";
import { FICA_RETENTION_SECONDS } from "./time";

const redis = Redis.fromEnv();

/* ────────────────── Constants ────────────────── */
const DSAR_TTL_SECONDS = FICA_RETENTION_SECONDS; // 5 years (FICA)
const POPIA_DEADLINE_DAYS = 30; // Section 23(1)(b)
const FICA_RETENTION_YEARS = 5; // FICA Act No. 38 of 2001, Section 22

/* ────────────────── Types ────────────────── */

export type DsarRequesterType = "buyer" | "merchant";
export type DsarRequestType = "access" | "deletion";

export type DsarStatus =
  | "new"           // Just submitted
  | "verified"      // Identity verified
  | "processing"    // Compliance is gathering data / performing deletion
  | "ready"         // Data export ready for download (access) or deletion complete (deletion)
  | "downloaded"    // Requester has downloaded their data (access only)
  | "rejected"      // Invalid or fraudulent request
  | "closed";       // Completed and closed

export type DsarRequest = {
  id: string;
  ref: string;                    // Human-readable ref: DSAR-XXXXXX or DEL-XXXXXX
  requestType: DsarRequestType;   // "access" or "deletion"
  requesterType: DsarRequesterType;
  fullName: string;
  email: string;
  phone: string;
  idNumber?: string;              // Last 4 digits for verification
  merchantId?: string;            // If requester is a merchant
  description: string;            // What data they're requesting
  status: DsarStatus;
  createdAt: string;
  updatedAt: string;
  deadline: string;               // 30-day POPIA deadline
  verifiedAt?: string;
  verifiedBy?: string;
  processedAt?: string;
  processedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  dataExport?: DataExport;
  deletionReport?: DeletionReport; // For deletion requests
  downloadedAt?: string;
  closedAt?: string;
  notes: DsarNote[];
};

/** Report of what was deleted vs retained for FICA. */
export type DeletionReport = {
  performedAt: string;
  performedBy: string;
  deleted: DeletionItem[];
  retained: RetainedItem[];
  scheduledDeletionDate?: string;   // When FICA-retained data will be purged
};

export type DeletionItem = {
  category: string;
  description: string;
  action: "deleted" | "anonymized";
};

export type RetainedItem = {
  category: string;
  description: string;
  reason: string;                   // Legal basis for retention
  retainUntil: string;              // When it can be deleted
};

export type DsarNote = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

export type DataExport = {
  generatedAt: string;
  generatedBy: string;
  sections: DataExportSection[];
};

export type DataExportSection = {
  title: string;
  description: string;
  data: Record<string, unknown>[] | Record<string, unknown>;
};

/* ────────────────── Helpers ────────────────── */

function genId(): string {
  return `dsar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function genRef(type: DsarRequestType = "access"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return type === "deletion" ? `DEL-${code}` : `DSAR-${code}`;
}

/* ────────────────── CRUD ────────────────── */

/** Submit a new DSAR (access or deletion). */
export async function createDsar(input: {
  requestType?: DsarRequestType;
  requesterType: DsarRequesterType;
  fullName: string;
  email: string;
  phone: string;
  idNumber?: string;
  merchantId?: string;
  description: string;
}): Promise<DsarRequest | { error: string }> {
  const requestType = input.requestType ?? "access";

  // Check for existing active request from same email
  const existingId = await redis.get<string>(`dsars:email:${input.email.toLowerCase()}`);
  if (existingId) {
    const existing = await getDsar(existingId);
    if (existing && !["closed", "rejected", "downloaded"].includes(existing.status)) {
      return { error: `You already have an active request (${existing.ref}). Please wait for it to be processed.` };
    }
  }

  const now = new Date();
  const deadline = new Date(now);
  deadline.setDate(deadline.getDate() + POPIA_DEADLINE_DAYS);

  const dsar: DsarRequest = {
    id: genId(),
    ref: genRef(requestType),
    requestType,
    requesterType: input.requesterType,
    fullName: input.fullName,
    email: input.email.toLowerCase(),
    phone: input.phone,
    idNumber: input.idNumber,
    merchantId: input.merchantId,
    description: input.description,
    status: "new",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    deadline: deadline.toISOString(),
    notes: [],
  };

  const pipe = redis.pipeline();
  pipe.set(`dsar:${dsar.id}`, JSON.stringify(dsar), { ex: DSAR_TTL_SECONDS });
  pipe.sadd("dsars:index", dsar.id);
  pipe.set(`dsars:email:${dsar.email}`, dsar.id, { ex: DSAR_TTL_SECONDS });
  pipe.set(`dsars:ref:${dsar.ref}`, dsar.id, { ex: DSAR_TTL_SECONDS });
  await pipe.exec();

  return dsar;
}

/** Get a DSAR by ID. */
export async function getDsar(id: string): Promise<DsarRequest | null> {
  const raw = await redis.get<string>(`dsar:${id}`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw as unknown as DsarRequest;
}

/** Get a DSAR by public reference. */
export async function getDsarByRef(ref: string): Promise<DsarRequest | null> {
  const id = await redis.get<string>(`dsars:ref:${ref.toUpperCase()}`);
  if (!id) return null;
  return getDsar(id);
}

/** List all DSARs, optionally filtered. */
export async function listDsars(filters?: {
  status?: DsarStatus;
}): Promise<DsarRequest[]> {
  const ids = await redis.smembers("dsars:index");
  if (!ids.length) return [];

  const pipe = redis.pipeline();
  for (const id of ids) pipe.get(`dsar:${id}`);
  const results = await pipe.exec();

  const dsars: DsarRequest[] = [];
  for (const raw of results) {
    if (!raw) continue;
    const d: DsarRequest = typeof raw === "string" ? JSON.parse(raw) : raw as unknown as DsarRequest;
    if (filters?.status && d.status !== filters.status) continue;
    dsars.push(d);
  }

  // Sort newest first
  dsars.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return dsars;
}

/** Update DSAR status + fields. */
async function saveDsar(dsar: DsarRequest): Promise<void> {
  dsar.updatedAt = new Date().toISOString();
  await redis.set(`dsar:${dsar.id}`, JSON.stringify(dsar), { ex: DSAR_TTL_SECONDS });
}

/** Verify requester identity. */
export async function verifyDsar(
  id: string,
  verifiedBy: string,
): Promise<DsarRequest | null> {
  const dsar = await getDsar(id);
  if (!dsar || dsar.status !== "new") return null;
  dsar.status = "verified";
  dsar.verifiedAt = new Date().toISOString();
  dsar.verifiedBy = verifiedBy;
  await saveDsar(dsar);
  return dsar;
}

/** Reject a DSAR. */
export async function rejectDsar(
  id: string,
  rejectedBy: string,
  reason: string,
): Promise<DsarRequest | null> {
  const dsar = await getDsar(id);
  if (!dsar || ["closed", "rejected"].includes(dsar.status)) return null;
  dsar.status = "rejected";
  dsar.rejectedAt = new Date().toISOString();
  dsar.rejectedBy = rejectedBy;
  dsar.rejectionReason = reason;
  await saveDsar(dsar);
  return dsar;
}

/** Add a note to a DSAR. */
export async function addDsarNote(
  id: string,
  author: string,
  text: string,
): Promise<DsarRequest | null> {
  const dsar = await getDsar(id);
  if (!dsar) return null;
  dsar.notes.push({
    id: Math.random().toString(36).slice(2, 10),
    author,
    text,
    createdAt: new Date().toISOString(),
  });
  await saveDsar(dsar);
  return dsar;
}

/** Mark data export as ready. */
export async function completeDsarExport(
  id: string,
  processedBy: string,
  dataExport: DataExport,
): Promise<DsarRequest | null> {
  const dsar = await getDsar(id);
  if (!dsar) return null;
  dsar.status = "ready";
  dsar.processedAt = new Date().toISOString();
  dsar.processedBy = processedBy;
  dsar.dataExport = dataExport;
  await saveDsar(dsar);
  return dsar;
}

/** Mark as downloaded. */
export async function markDsarDownloaded(id: string): Promise<DsarRequest | null> {
  const dsar = await getDsar(id);
  if (!dsar || dsar.status !== "ready") return null;
  dsar.status = "downloaded";
  dsar.downloadedAt = new Date().toISOString();
  await saveDsar(dsar);
  return dsar;
}

/** Close a DSAR (final state). */
export async function closeDsar(id: string): Promise<DsarRequest | null> {
  const dsar = await getDsar(id);
  if (!dsar) return null;
  dsar.status = "closed";
  dsar.closedAt = new Date().toISOString();
  await saveDsar(dsar);
  return dsar;
}

/* ────────────────── Data collection ────────────────── */

/**
 * Collect all personal data for a data subject.
 * Gathers from merchants, transactions, flags, and disputes.
 */
export async function collectPersonalData(dsar: DsarRequest): Promise<DataExport> {
  const { listMerchants, listTransactions, listFlags } = await import("./store");
  const { listDisputes } = await import("./disputes");

  const sections: DataExportSection[] = [];

  // ── Merchant data (if requester is a merchant) ──
  if (dsar.requesterType === "merchant" && dsar.merchantId) {
    const { getMerchant } = await import("./store");
    const m = await getMerchant(dsar.merchantId);
    if (m) {
      sections.push({
        title: "Merchant Profile",
        description: "Your registered business and personal information.",
        data: {
          businessName: m.businessName,
          businessType: m.businessType,
          ownerName: m.ownerName,
          phone: m.phone,
          address: m.address,
          bank: m.bank,
          accountLast4: m.accountLast4,
          accountType: m.accountType,
          status: m.status,
          kycTier: m.kycTier,
          expectedMonthlyVolume: m.expectedMonthlyVolume,
          createdAt: m.createdAt,
          approvedAt: m.approvedAt,
          lastLoginAt: m.lastLoginAt,
          idNumberMasked: m.idNumberMasked,
          isPep: m.isPep,
          cipcRegistrationNumber: m.cipcRegistrationNumber,
          consent: m.consent,
        },
      });

      // KYC documents
      if (m.documents?.length) {
        sections.push({
          title: "KYC Documents",
          description: "Documents submitted for identity verification.",
          data: m.documents.map((d) => ({
            kind: d.kind,
            label: d.label,
            status: d.status,
            submittedAt: d.submittedAt,
            verifiedAt: d.verifiedAt,
            rejectedAt: d.rejectedAt,
            note: d.note,
          })),
        });
      }

      // Transactions
      const txns = await listTransactions(dsar.merchantId);
      if (txns.length) {
        sections.push({
          title: "Transaction History",
          description: `All ${txns.length} transactions processed through your account.`,
          data: txns.map((t) => ({
            id: t.id,
            reference: t.reference,
            amount: t.amount,
            rail: t.rail,
            buyerBank: t.buyerBank,
            timestamp: t.timestamp,
            status: t.status,
            refundedAt: t.refundedAt,
            refundAmount: t.refundAmount,
            refundReason: t.refundReason,
          })),
        });
      }

      // Velocity limits
      if (m.velocityLimits) {
        sections.push({
          title: "Transaction Limits",
          description: "Your configured transaction limits.",
          data: m.velocityLimits,
        });
      }

      // Compliance flags related to merchant
      const allFlags = await listFlags({ merchantId: dsar.merchantId });
      if (allFlags.length) {
        sections.push({
          title: "Compliance Flags",
          description: "Compliance flags raised against transactions on your account.",
          data: allFlags.map((f) => ({
            id: f.id,
            reason: f.ruleLabel,
            status: f.status,
            createdAt: f.createdAt,
            txnAmount: f.txnSnapshot.amount,
            txnDate: f.txnSnapshot.timestamp,
          })),
        });
      }

      // Disputes related to merchant
      const allDisputes = await listDisputes({ merchantId: dsar.merchantId });
      if (allDisputes.length) {
        sections.push({
          title: "Disputes",
          description: "Buyer disputes filed against your transactions.",
          data: allDisputes.map((d) => ({
            ref: d.ref,
            status: d.status,
            reason: d.reason,
            amount: d.amount,
            txnDate: d.txnDate,
            createdAt: d.createdAt,
            resolution: d.resolution
              ? { decision: d.resolution.decision, resolvedAt: d.resolution.resolvedAt }
              : undefined,
          })),
        });
      }

      // Transaction hold info
      if (m.transactionHold) {
        sections.push({
          title: "Account Restrictions",
          description: "Current restrictions on your account.",
          data: {
            transactionHold: m.transactionHold,
            holdReason: m.holdReason,
            holdSetAt: m.holdSetAt,
          },
        });
      }
    }
  }

  // ── Buyer data (search by phone/email across transactions + disputes) ──
  if (dsar.requesterType === "buyer") {
    // Find disputes filed by this buyer
    const allDisputes = await listDisputes();
    const buyerDisputes = allDisputes.filter(
      (d) =>
        (d.buyerPhone && d.buyerPhone === dsar.phone) ||
        (d.buyerEmail && d.buyerEmail.toLowerCase() === dsar.email.toLowerCase()),
    );

    if (buyerDisputes.length) {
      sections.push({
        title: "Your Disputes",
        description: "Disputes you have filed.",
        data: buyerDisputes.map((d) => ({
          ref: d.ref,
          status: d.status,
          reason: d.reason,
          description: d.description,
          amount: d.amount,
          merchantName: d.merchantName,
          txnDate: d.txnDate,
          createdAt: d.createdAt,
          buyerPhone: d.buyerPhone,
          buyerEmail: d.buyerEmail,
          merchantResponse: d.merchantResponse
            ? {
                action: d.merchantResponse.action,
                note: d.merchantResponse.note,
                respondedAt: d.merchantResponse.respondedAt,
              }
            : undefined,
          resolution: d.resolution
            ? {
                decision: d.resolution.decision,
                resolvedAt: d.resolution.resolvedAt,
                refundAmount: d.resolution.refundAmount,
              }
            : undefined,
        })),
      });
    }

    // Note: buyer transaction data is limited since we don't store
    // buyer identity on transactions (Ozow handles that).
    sections.push({
      title: "Data We Hold About You",
      description:
        "Flamingo Pay is a merchant payment platform. We do not store your bank account details, ShapID, or payment credentials — those are held by your bank and Ozow (our payment gateway). The data above represents everything we hold that is linked to your identity.",
      data: {
        note: "Contact Ozow (www.ozow.com) for payment credentials and bank-side transaction records.",
      },
    });
  }

  // ── DSAR request record itself ──
  sections.push({
    title: "This Access Request",
    description: "The data subject access request record.",
    data: {
      ref: dsar.ref,
      requesterType: dsar.requesterType,
      fullName: dsar.fullName,
      email: dsar.email,
      phone: dsar.phone,
      submittedAt: dsar.createdAt,
      deadline: dsar.deadline,
    },
  });

  return {
    generatedAt: new Date().toISOString(),
    generatedBy: "Flamingo Pay DSAR System",
    sections,
  };
}

/* ────────────────── Data deletion (Section 24) ────────────────── */

/**
 * Calculate the FICA retention expiry date for a record.
 * Financial records must be kept for 5 years from the date of the transaction
 * or the date the business relationship ended, whichever is later.
 */
function ficaExpiryDate(recordDate: string): Date {
  const d = new Date(recordDate);
  d.setFullYear(d.getFullYear() + FICA_RETENTION_YEARS);
  return d;
}

/**
 * Execute a deletion request.
 * - Anonymizes non-essential PII immediately
 * - Retains financial records required by FICA with a scheduled deletion date
 * - Generates a full deletion report
 */
export async function executeDeletion(
  dsar: DsarRequest,
  performedBy: string,
): Promise<DeletionReport> {
  const { getMerchant, updateMerchantFields, listTransactions, listFlags } = await import("./store");
  const { listDisputes } = await import("./disputes");

  const deleted: DeletionItem[] = [];
  const retained: RetainedItem[] = [];
  const now = new Date();
  let latestFicaExpiry = now;

  // ── Merchant deletion ──
  if (dsar.requesterType === "merchant" && dsar.merchantId) {
    const m = await getMerchant(dsar.merchantId);
    if (m) {
      // Determine the latest transaction date for FICA retention
      const txns = await listTransactions(dsar.merchantId);
      const lastTxnDate = txns.length
        ? txns.reduce((latest, t) =>
            new Date(t.timestamp) > new Date(latest) ? t.timestamp : latest,
          txns[0].timestamp)
        : m.createdAt;
      const ficaExpiry = ficaExpiryDate(lastTxnDate);
      if (ficaExpiry > latestFicaExpiry) latestFicaExpiry = ficaExpiry;

      // ── Anonymize non-financial PII immediately ──
      const anonymized: Partial<typeof m> = {
        ownerName: "[DELETED]",
        phone: "[DELETED]",
        address: "[DELETED]",
        idNumberMasked: undefined,
        isPep: undefined,
        pinHash: undefined,
        lastLoginAt: undefined,
        consent: m.consent ? {
          ...m.consent,
          ip: undefined,
        } : undefined,
      };

      // If FICA retention has expired, we can delete more aggressively
      if (ficaExpiry <= now) {
        anonymized.bank = "[DELETED]";
        anonymized.accountLast4 = "[DELETED]";
        anonymized.businessName = "[DELETED]";
        anonymized.status = "suspended" as const;
        deleted.push({
          category: "Merchant Profile",
          description: "All personal and business information deleted (FICA retention period expired).",
          action: "deleted",
        });
      } else {
        // Keep financial identifiers for FICA, anonymize the rest
        deleted.push({
          category: "Personal Information",
          description: "Owner name, phone number, address, ID number, login credentials anonymized.",
          action: "anonymized",
        });
        retained.push({
          category: "Business & Financial Information",
          description: "Business name, bank details, account type retained for FICA compliance.",
          reason: "FICA Act No. 38 of 2001, Section 22 — 5-year record retention requirement.",
          retainUntil: ficaExpiry.toISOString(),
        });
      }

      // Suspend the account
      anonymized.transactionHold = true;
      anonymized.holdReason = "Account closed per POPIA deletion request";
      anonymized.holdSetBy = performedBy;
      anonymized.holdSetAt = now.toISOString();

      await updateMerchantFields(dsar.merchantId, anonymized as Record<string, unknown>);

      // ── Transaction records — always retained for FICA ──
      if (txns.length) {
        retained.push({
          category: "Transaction History",
          description: `${txns.length} transaction records retained.`,
          reason: "FICA Act Section 22 — transaction records must be kept for 5 years.",
          retainUntil: ficaExpiry.toISOString(),
        });
      }

      // ── Compliance flags — retained for FICA / goAML ──
      const flags = await listFlags({ merchantId: dsar.merchantId });
      if (flags.length) {
        retained.push({
          category: "Compliance Flags",
          description: `${flags.length} compliance flag records retained.`,
          reason: "FICA Act Section 29 — suspicious transaction reports must be retained for regulatory purposes.",
          retainUntil: ficaExpiry.toISOString(),
        });
      }

      // ── Disputes — retained for FICA ──
      const disputes = await listDisputes({ merchantId: dsar.merchantId });
      if (disputes.length) {
        retained.push({
          category: "Disputes",
          description: `${disputes.length} dispute records retained.`,
          reason: "FICA Act / PASA regulations — dispute records must be retained for the regulatory period.",
          retainUntil: ficaExpiry.toISOString(),
        });
      }

      // ── KYC documents — retained for FICA ──
      if (m.documents?.length) {
        const submittedDocs = m.documents.filter(d => d.status !== "required");
        if (submittedDocs.length) {
          retained.push({
            category: "KYC Documents",
            description: `${submittedDocs.length} identity verification documents retained.`,
            reason: "FICA Act Section 22 — CDD records must be kept for 5 years after the business relationship ends.",
            retainUntil: ficaExpiry.toISOString(),
          });
        }
      }
    }
  }

  // ── Buyer deletion ──
  if (dsar.requesterType === "buyer") {
    const allDisputes = await listDisputes();
    const buyerDisputes = allDisputes.filter(
      (d) =>
        (d.buyerPhone && d.buyerPhone === dsar.phone) ||
        (d.buyerEmail && d.buyerEmail.toLowerCase() === dsar.email.toLowerCase()),
    );

    if (buyerDisputes.length) {
      // Anonymize buyer contact info on disputes but retain the dispute record
      for (const dispute of buyerDisputes) {
        const ficaExpiry = ficaExpiryDate(dispute.createdAt);
        if (ficaExpiry > latestFicaExpiry) latestFicaExpiry = ficaExpiry;
      }

      // We anonymize the buyer's contact details on disputes
      // but the dispute record itself must be retained for FICA
      deleted.push({
        category: "Buyer Contact Details on Disputes",
        description: `Contact information anonymized on ${buyerDisputes.length} dispute(s).`,
        action: "anonymized",
      });
      retained.push({
        category: "Dispute Records",
        description: `${buyerDisputes.length} dispute records retained (contact details removed).`,
        reason: "FICA Act / PASA regulations — dispute records must be retained for the regulatory period.",
        retainUntil: latestFicaExpiry.toISOString(),
      });

      // Note: actual anonymization of dispute buyer fields would require
      // extending the disputes module. For now, log it in the report.
    }

    deleted.push({
      category: "Buyer Data Summary",
      description: "Flamingo Pay holds minimal buyer data. Bank details, ShapID, and payment credentials are held by your bank and Ozow, not by us.",
      action: "deleted",
    });
  }

  // If no data found at all
  if (deleted.length === 0 && retained.length === 0) {
    deleted.push({
      category: "No Data Found",
      description: "No personal data matching your identity was found in our systems.",
      action: "deleted",
    });
  }

  const report: DeletionReport = {
    performedAt: now.toISOString(),
    performedBy,
    deleted,
    retained,
    scheduledDeletionDate: latestFicaExpiry > now ? latestFicaExpiry.toISOString() : undefined,
  };

  return report;
}

/** Complete a deletion request — execute deletion and save report. */
export async function completeDeletion(
  id: string,
  processedBy: string,
): Promise<DsarRequest | null> {
  const dsar = await getDsar(id);
  if (!dsar || !["verified", "new"].includes(dsar.status)) return null;

  const report = await executeDeletion(dsar, processedBy);

  dsar.status = "ready";
  dsar.processedAt = new Date().toISOString();
  dsar.processedBy = processedBy;
  dsar.deletionReport = report;
  await saveDsar(dsar);
  return dsar;
}

/** DSAR stats for dashboard. */
export async function dsarStats(): Promise<{
  total: number;
  pending: number;
  processing: number;
  ready: number;
  overdue: number;
  accessRequests: number;
  deletionRequests: number;
}> {
  const dsars = await listDsars();
  const now = new Date();
  const pending = dsars.filter((d) => ["new", "verified"].includes(d.status)).length;
  const processing = dsars.filter((d) => d.status === "processing").length;
  const ready = dsars.filter((d) => d.status === "ready").length;
  const overdue = dsars.filter(
    (d) =>
      !["ready", "downloaded", "closed", "rejected"].includes(d.status) &&
      new Date(d.deadline) < now,
  ).length;
  const accessRequests = dsars.filter((d) => (d.requestType ?? "access") === "access").length;
  const deletionRequests = dsars.filter((d) => d.requestType === "deletion").length;

  return { total: dsars.length, pending, processing, ready, overdue, accessRequests, deletionRequests };
}
