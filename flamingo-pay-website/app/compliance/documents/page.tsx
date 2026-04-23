"use client";

import { useEffect, useState, useCallback } from "react";
import { ComplianceGate } from "../_components/ComplianceGate";
import { ComplianceNav } from "../_components/ComplianceNav";
import { Reveal, RevealGroup, RevealItem } from "../../../components/motion/Reveal";
import { AnimatedCounter } from "../../../components/motion/AnimatedCounter";
import { timeAgo } from "../../../lib/merchant";
import { currentComplianceOfficer } from "../../../lib/compliance";

// ─── Types ─────────────────────────────────────────────

type DocStatus = "required" | "submitted" | "verified" | "rejected";

type MerchantDocument = {
  kind: string;
  label: string;
  status: DocStatus;
  submittedAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  note?: string;
  fileName?: string;
  blobUrl?: string;
};

type KycCheck = {
  service: string;
  status: "pending" | "passed" | "failed" | "error";
  summary?: string;
  confidence?: number;
};

type KycRecord = {
  status: string;
  checks: KycCheck[];
  isPep?: boolean;
  hasSanctionsHit?: boolean;
};

type ReviewItem = {
  merchantId: string;
  merchantName: string;
  ownerName: string;
  businessType: string;
  kycTier: string;
  merchantStatus: string;
  createdAt: string;
  documents: MerchantDocument[];
  kycRecord: KycRecord | null;
  counts: {
    total: number;
    submitted: number;
    verified: number;
    rejected: number;
    required: number;
  };
};

type Summary = {
  merchantsInQueue: number;
  totalPending: number;
  totalRejected: number;
  totalVerified: number;
};

// ─── Constants ─────────────────────────────────────────

const FILTERS = [
  { key: "pending", label: "Pending review" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const DOC_ICONS: Record<string, string> = {
  rica_phone: "📱",
  id: "🪪",
  selfie: "🤳",
  affidavit: "📜",
  company_reg: "🏢",
  proof_of_address: "📮",
  bank_letter: "🏦",
  source_of_funds: "💼",
};

const STATUS_STYLE: Record<DocStatus, { label: string; cls: string }> = {
  required: { label: "Missing", cls: "bg-gray-100 text-gray-600 border-gray-300" },
  submitted: { label: "Awaiting Review", cls: "bg-blue-100 text-blue-700 border-blue-300" },
  verified: { label: "Verified", cls: "bg-green-100 text-green-700 border-green-300" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-700 border-red-300" },
};

const KYC_SERVICE_LABELS: Record<string, string> = {
  said_verify: "SA ID Verification",
  id_photo_enhanced: "Biometric Liveness",
  face_match: "Face Match",
  aml_pep_sanctions: "AML/PEP/Sanctions",
  bank_avs: "Bank Account (AVS)",
  cipc_company: "CIPC Company",
  cipc_director: "CIPC Director",
};

// ─── Page ──────────────────────────────────────────────

export default function DocumentReviewPage() {
  return (
    <ComplianceGate>
      <ComplianceNav />
      <DocumentReviewQueue />
    </ComplianceGate>
  );
}

function DocumentReviewQueue() {
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const fetchQueue = useCallback(() => {
    setLoading(true);
    fetch(`/api/compliance/documents?filter=${filter}`)
      .then(r => r.json())
      .then(d => {
        setQueue(d.queue ?? []);
        setSummary(d.summary ?? null);
      })
      .catch(() => setQueue([]))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2 text-sm font-bold shadow-[0_4px_0_0_#1A1A2E]">
          {toast}
        </div>
      )}

      <Reveal>
        <div className="mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600">
            Compliance · FICA Document Review
          </span>
          <h1
            className="display mt-2 font-black text-flamingo-dark leading-[0.9]"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", letterSpacing: "-0.035em" }}
          >
            Document verification.
          </h1>
          <p className="mt-2 text-sm text-flamingo-dark/60">
            Review uploaded KYC documents alongside VerifyNow automated checks. Approve or reject with notes.
          </p>
        </div>
      </Reveal>

      {/* Stats */}
      {summary && (
        <RevealGroup className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <RevealItem>
            <StatCard label="In Queue" value={summary.merchantsInQueue} tone="gray" />
          </RevealItem>
          <RevealItem>
            <StatCard label="Pending Docs" value={summary.totalPending} tone="blue" highlight={summary.totalPending > 0} />
          </RevealItem>
          <RevealItem>
            <StatCard label="Rejected" value={summary.totalRejected} tone="red" />
          </RevealItem>
          <RevealItem>
            <StatCard label="Verified" value={summary.totalVerified} tone="green" />
          </RevealItem>
        </RevealGroup>
      )}

      {/* Filter tabs */}
      <Reveal delay={0.1}>
        <div className="mb-4 flex flex-wrap gap-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setExpandedId(null); }}
              className={
                "rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition " +
                (filter === f.key
                  ? "border-flamingo-dark bg-red-50 text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E]"
                  : "border-transparent text-flamingo-dark/60 hover:border-flamingo-dark/20")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </Reveal>

      {/* Queue */}
      {loading ? (
        <div className="py-20 text-center text-flamingo-dark/40">Loading document queue...</div>
      ) : queue.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-flamingo-dark/20 py-16 text-center">
          <p className="text-lg font-bold text-flamingo-dark/40">No documents to review</p>
          <p className="mt-1 text-sm text-flamingo-dark/30">
            {filter === "pending"
              ? "All submitted documents have been reviewed."
              : filter === "rejected"
                ? "No documents currently rejected."
                : "No merchants with documents found."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map(item => (
            <MerchantDocCard
              key={item.merchantId}
              item={item}
              expanded={expandedId === item.merchantId}
              onToggle={() => setExpandedId(expandedId === item.merchantId ? null : item.merchantId)}
              onUpdate={() => { fetchQueue(); showToast("Document updated"); }}
            />
          ))}
        </div>
      )}
    </main>
  );
}

// ─── Merchant Card ─────────────────────────────────────

function MerchantDocCard({
  item,
  expanded,
  onToggle,
  onUpdate,
}: {
  item: ReviewItem;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: () => void;
}) {
  const pendingCount = item.counts.submitted;
  const rejectedCount = item.counts.rejected;

  return (
    <div className="rounded-2xl border-2 border-flamingo-dark bg-white shadow-[0_4px_0_0_#1A1A2E] overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-flamingo-cream/50 transition"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-flamingo-dark">{item.merchantName}</span>
            <span className="text-[10px] text-flamingo-dark/40 font-mono">{item.merchantId}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
              item.merchantStatus === "approved" ? "bg-green-100 text-green-700 border-green-300"
                : item.merchantStatus === "pending" ? "bg-amber-100 text-amber-700 border-amber-300"
                  : "bg-gray-100 text-gray-600 border-gray-300"
            }`}>
              {item.merchantStatus}
            </span>
          </div>
          <p className="text-xs text-flamingo-dark/50 mt-0.5">
            {item.ownerName} · {item.businessType} · KYC: {item.kycTier} · Applied {timeAgo(item.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pendingCount > 0 && (
            <span className="rounded-full bg-blue-100 border border-blue-300 px-2 py-0.5 text-[10px] font-extrabold text-blue-700">
              {pendingCount} pending
            </span>
          )}
          {rejectedCount > 0 && (
            <span className="rounded-full bg-red-100 border border-red-300 px-2 py-0.5 text-[10px] font-extrabold text-red-700">
              {rejectedCount} rejected
            </span>
          )}
          <span className="text-flamingo-dark/30 text-lg">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t-2 border-flamingo-dark/10 px-5 py-4 space-y-4">
          {/* VerifyNow automated results */}
          <VerifyNowSummary kycRecord={item.kycRecord} />

          {/* Document list */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-flamingo-dark/50 mb-3">
              Uploaded Documents — Human Review
            </h3>
            <div className="space-y-2">
              {item.documents.map(doc => (
                <DocReviewRow
                  key={doc.kind}
                  doc={doc}
                  merchantId={item.merchantId}
                  onUpdate={onUpdate}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VerifyNow Summary ─────────────────────────────────

function VerifyNowSummary({ kycRecord }: { kycRecord: KycRecord | null }) {
  if (!kycRecord) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
        <p className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-1">
          VerifyNow Automated Checks
        </p>
        <p className="text-sm text-gray-400">Not yet run — awaiting document submission.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    passed: "text-green-600",
    failed: "text-red-600",
    pending: "text-amber-600",
    error: "text-red-600",
  };
  const statusIcons: Record<string, string> = {
    passed: "✅",
    failed: "❌",
    pending: "⏳",
    error: "⚠️",
  };

  return (
    <div className="rounded-xl bg-flamingo-cream border-2 border-flamingo-dark/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-extrabold uppercase tracking-widest text-flamingo-dark/50">
          VerifyNow Automated Checks
        </p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
          kycRecord.status === "verified" ? "bg-green-100 text-green-700"
            : kycRecord.status === "failed" ? "bg-red-100 text-red-700"
              : kycRecord.status === "requires_review" ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-600"
        }`}>
          {kycRecord.status.replace("_", " ")}
        </span>
      </div>

      {(kycRecord.isPep || kycRecord.hasSanctionsHit) && (
        <div className="mb-3 rounded-lg border-2 border-red-300 bg-red-50 px-3 py-2">
          {kycRecord.isPep && (
            <p className="text-xs font-bold text-red-700">⚠️ PEP Identified — Enhanced Due Diligence required</p>
          )}
          {kycRecord.hasSanctionsHit && (
            <p className="text-xs font-bold text-red-700">🛡️ Sanctions match detected</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {kycRecord.checks.map(check => (
          <div key={check.service} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs">
            <span>{statusIcons[check.status] ?? "⬜"}</span>
            <span className="font-bold text-flamingo-dark flex-1">
              {KYC_SERVICE_LABELS[check.service] ?? check.service}
            </span>
            <span className={`font-extrabold uppercase text-[10px] ${statusColors[check.status] ?? ""}`}>
              {check.status}
            </span>
            {check.confidence != null && (
              <span className="text-flamingo-dark/40">{check.confidence}%</span>
            )}
          </div>
        ))}
      </div>
      {kycRecord.checks.length === 0 && (
        <p className="text-xs text-flamingo-dark/40">No automated checks recorded yet.</p>
      )}
    </div>
  );
}

// ─── Individual Document Review Row ─────────────────────

function DocReviewRow({
  doc,
  merchantId,
  onUpdate,
}: {
  doc: MerchantDocument;
  merchantId: string;
  onUpdate: () => void;
}) {
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const officer = typeof window !== "undefined"
    ? currentComplianceOfficer()?.name ?? "Compliance Officer"
    : "Compliance Officer";

  async function handleSubmit() {
    if (action === "reject" && !note.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/merchants/${merchantId}/documents`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          kind: doc.kind,
          status: action === "approve" ? "verified" : "rejected",
          note: note.trim() || (action === "approve" ? `Verified by ${officer}` : undefined),
          reviewedBy: officer,
        }),
      });
      if (res.ok) {
        setAction(null);
        setNote("");
        onUpdate();
      }
    } catch {}
    setSubmitting(false);
  }

  const style = STATUS_STYLE[doc.status] ?? STATUS_STYLE.required;
  const canReview = doc.status === "submitted";
  const hasFile = !!doc.blobUrl || !!doc.fileName;

  return (
    <div className={`rounded-xl border-2 p-3 ${
      doc.status === "submitted" ? "border-blue-300 bg-blue-50/50"
        : doc.status === "rejected" ? "border-red-200 bg-red-50/30"
          : doc.status === "verified" ? "border-green-200 bg-green-50/30"
            : "border-flamingo-dark/10 bg-white"
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">{DOC_ICONS[doc.kind] ?? "📄"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-extrabold text-flamingo-dark">{doc.label}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${style.cls}`}>
              {style.label}
            </span>
          </div>

          {/* Metadata */}
          <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-flamingo-dark/50">
            {doc.submittedAt && <span>Submitted: {timeAgo(doc.submittedAt)}</span>}
            {doc.verifiedAt && <span className="text-green-600 font-bold">Verified: {timeAgo(doc.verifiedAt)}</span>}
            {doc.rejectedAt && <span className="text-red-600 font-bold">Rejected: {timeAgo(doc.rejectedAt)}</span>}
            {doc.fileName && <span>File: {doc.fileName}</span>}
          </div>

          {/* Previous note */}
          {doc.note && (
            <p className="mt-1 text-xs text-flamingo-dark/60 bg-white/80 rounded-lg px-2 py-1 border border-flamingo-dark/5">
              {doc.status === "rejected" ? "Rejection reason: " : "Note: "}{doc.note}
            </p>
          )}

          {/* View document link */}
          {hasFile && doc.blobUrl && !doc.blobUrl.startsWith("demo://") && (
            <a
              href={doc.blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
            >
              📎 View uploaded document
            </a>
          )}
          {hasFile && (!doc.blobUrl || doc.blobUrl.startsWith("demo://")) && (
            <span className="mt-1 inline-block text-xs text-flamingo-dark/30">
              📎 {doc.fileName ?? "File uploaded"} (demo mode — no preview)
            </span>
          )}
        </div>

        {/* Quick action buttons */}
        {canReview && !action && (
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setAction("approve")}
              className="rounded-lg border-2 border-flamingo-dark bg-green-500 px-3 py-1.5 text-xs font-bold text-white shadow-[0_2px_0_0_#1A1A2E] transition hover:bg-green-400 active:translate-y-[1px]"
            >
              Verify
            </button>
            <button
              onClick={() => setAction("reject")}
              className="rounded-lg border-2 border-flamingo-dark bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-[0_2px_0_0_#1A1A2E] transition hover:bg-red-400 active:translate-y-[1px]"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Inline action form */}
      {action && (
        <div className="mt-3 rounded-lg border-2 border-flamingo-dark/20 bg-white p-3">
          <p className="text-xs font-extrabold text-flamingo-dark mb-2">
            {action === "approve" ? "✅ Verify Document" : "❌ Reject Document"}
          </p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={action === "approve"
              ? "Optional note (e.g. 'Clear copy, details match ID check')..."
              : "Rejection reason (required — merchant will see this)..."
            }
            rows={2}
            className="w-full rounded-lg border-2 border-flamingo-dark/20 bg-flamingo-cream px-3 py-2 text-sm focus:border-flamingo-dark focus:outline-none"
            autoFocus
          />
          <div className="mt-2 flex gap-2 justify-end">
            <button
              onClick={() => { setAction(null); setNote(""); }}
              className="text-xs font-bold text-flamingo-dark/50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || (action === "reject" && !note.trim())}
              className={`rounded-lg border-2 border-flamingo-dark px-4 py-1.5 text-xs font-bold text-white shadow-[0_2px_0_0_#1A1A2E] disabled:opacity-50 ${
                action === "approve" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {submitting ? "Saving..." : action === "approve" ? "Confirm Verification" : "Confirm Rejection"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────

function StatCard({ label, value, tone, highlight }: {
  label: string; value: number; tone: string; highlight?: boolean;
}) {
  const toneMap: Record<string, string> = {
    gray: "border-flamingo-dark/10 bg-white",
    blue: highlight ? "border-blue-400 bg-blue-50" : "border-flamingo-dark/10 bg-white",
    red: "border-flamingo-dark/10 bg-white",
    green: "border-flamingo-dark/10 bg-white",
  };
  const numColor: Record<string, string> = {
    gray: "text-flamingo-dark",
    blue: highlight ? "text-blue-600" : "text-flamingo-dark",
    red: "text-red-600",
    green: "text-green-600",
  };
  return (
    <div className={`rounded-2xl border-2 p-4 ${toneMap[tone] ?? ""}`}>
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-flamingo-dark/50">{label}</p>
      <p className={`display mt-1 text-3xl font-black ${numColor[tone] ?? ""}`}>
        <AnimatedCounter to={value} />
      </p>
    </div>
  );
}
