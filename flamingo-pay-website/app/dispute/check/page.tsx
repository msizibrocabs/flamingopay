"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type DisputeInfo = {
  ref: string;
  status: string;
  reason: string;
  amount: number;
  merchantName: string;
  txnDate: string;
  createdAt: string;
  updatedAt: string;
  refundAmount?: number;
  merchantResponse?: {
    action: string;
    respondedAt: string;
  };
  resolution?: {
    decision: string;
    resolvedAt: string;
  };
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  new: { label: "Submitted", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: "📩" },
  under_review: { label: "Under review", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: "🔍" },
  merchant_notified: { label: "Merchant notified", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: "📤" },
  merchant_responded: { label: "Merchant responded", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: "💬" },
  escalated: { label: "Escalated to compliance", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: "⚠️" },
  resolved_refund: { label: "Resolved — Refund approved", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: "✅" },
  resolved_partial: { label: "Resolved — Partial refund", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: "✅" },
  resolved_rejected: { label: "Resolved — No refund", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: "❌" },
  refund_pending: { label: "Refund processing", color: "text-teal-700", bg: "bg-teal-50 border-teal-200", icon: "💸" },
  closed: { label: "Closed", color: "text-gray-700", bg: "bg-gray-50 border-gray-200", icon: "📁" },
};

const REASON_LABELS: Record<string, string> = {
  wrong_amount: "Wrong amount charged",
  goods_not_received: "Goods or services not received",
  duplicate_charge: "Duplicate charge",
  unauthorized: "Unauthorized transaction",
  payment_error: "Payment to wrong merchant",
  other: "Other",
};

const DECISION_LABELS: Record<string, string> = {
  refund_full: "Full refund approved",
  refund_partial: "Partial refund approved",
  reject: "Dispute rejected — no refund",
};

const ACTION_LABELS: Record<string, string> = {
  accept: "Merchant accepted the dispute",
  reject: "Merchant rejected the dispute",
  partial: "Merchant offered a partial refund",
};

export default function DisputeCheckPage() {
  const searchParams = useSearchParams();
  const prefilled = searchParams.get("ref") ?? "";

  const [ref, setRef] = useState(prefilled);
  const [dispute, setDispute] = useState<DisputeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const formatZAR = (n: number) => `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  const formatDateTime = (s: string) =>
    new Date(s).toLocaleString("en-ZA", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  async function lookup() {
    const trimmed = ref.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setDispute(null);
    setSearched(true);
    try {
      const res = await fetch(`/api/disputes/lookup?ref=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Dispute not found.");
        return;
      }
      setDispute(data.dispute);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-lookup if ref is prefilled from URL
  useEffect(() => {
    if (prefilled) lookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status = dispute ? STATUS_MAP[dispute.status] ?? STATUS_MAP.new : null;

  return (
    <main className="min-h-dvh bg-flamingo-cream">
      <div className="mx-auto max-w-lg px-5 py-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink shadow-[0_4px_0_0_#1A1A2E]">
              <span className="display text-2xl font-extrabold text-white">F</span>
            </div>
          </Link>
          <h1 className="display mt-3 text-2xl font-extrabold text-flamingo-dark">
            Check dispute status
          </h1>
          <p className="mt-1 text-sm text-flamingo-dark/60">
            Enter your dispute reference number to see the latest update.
          </p>
        </div>

        {/* Lookup form */}
        <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_6px_0_0_#1A1A2E]">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
              Dispute reference
            </span>
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup()}
              placeholder="e.g. DSP-AB12CD"
              className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-center font-mono text-lg font-extrabold uppercase tracking-widest text-flamingo-dark outline-none"
            />
          </label>
          <button
            onClick={lookup}
            disabled={loading || !ref.trim()}
            className="mt-3 w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-pink px-4 py-3 text-sm font-extrabold text-white shadow-[0_3px_0_0_#1A1A2E] transition hover:bg-flamingo-pink-deep disabled:opacity-50"
          >
            {loading ? "Looking up..." : "Check status"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {dispute && status && (
          <div className="mt-5 space-y-4">
            {/* Status banner */}
            <div className={`rounded-2xl border-2 ${status.bg} p-4`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{status.icon}</span>
                <div>
                  <p className={`text-base font-extrabold ${status.color}`}>{status.label}</p>
                  <p className="text-xs text-flamingo-dark/50">
                    Last updated: {formatDateTime(dispute.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Dispute details */}
            <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_4px_0_0_#1A1A2E]">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-flamingo-dark/50">
                Dispute details
              </p>
              <div className="space-y-2.5">
                <Row label="Reference" value={dispute.ref} mono />
                <Row label="Amount" value={formatZAR(dispute.amount)} />
                <Row label="Merchant" value={dispute.merchantName} />
                <Row label="Transaction date" value={formatDate(dispute.txnDate)} />
                <Row label="Reason" value={REASON_LABELS[dispute.reason] ?? dispute.reason} />
                <Row label="Filed on" value={formatDateTime(dispute.createdAt)} />
                {dispute.refundAmount != null && dispute.refundAmount > 0 && (
                  <Row label="Refund amount" value={formatZAR(dispute.refundAmount)} highlight />
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_4px_0_0_#1A1A2E]">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-flamingo-dark/50">
                Timeline
              </p>
              <div className="relative space-y-4 border-l-2 border-flamingo-dark/10 pl-4">
                {/* Filed */}
                <TimelineEntry
                  title="Dispute filed"
                  time={formatDateTime(dispute.createdAt)}
                  active
                />

                {/* Merchant response */}
                {dispute.merchantResponse && (
                  <TimelineEntry
                    title={ACTION_LABELS[dispute.merchantResponse.action] ?? "Merchant responded"}
                    time={formatDateTime(dispute.merchantResponse.respondedAt)}
                    active
                  />
                )}

                {/* Resolution */}
                {dispute.resolution && (
                  <TimelineEntry
                    title={DECISION_LABELS[dispute.resolution.decision] ?? "Dispute resolved"}
                    time={formatDateTime(dispute.resolution.resolvedAt)}
                    active
                  />
                )}

                {/* Pending steps */}
                {!dispute.merchantResponse && !["resolved_refund", "resolved_partial", "resolved_rejected", "closed"].includes(dispute.status) && (
                  <TimelineEntry
                    title="Awaiting merchant response"
                    time="Within 48 hours"
                    active={false}
                  />
                )}
                {!dispute.resolution && !["resolved_refund", "resolved_partial", "resolved_rejected", "closed"].includes(dispute.status) && (
                  <TimelineEntry
                    title="Compliance review"
                    time="Pending"
                    active={false}
                  />
                )}
              </div>
            </div>

            {/* Help text */}
            <div className="rounded-xl border-2 border-flamingo-dark/10 bg-white p-4 text-center">
              <p className="text-xs text-flamingo-dark/50">
                Need help? Contact us at{" "}
                <a href="mailto:disputes@flamingopay.co.za" className="font-semibold text-flamingo-pink hover:underline">
                  disputes@flamingopay.co.za
                </a>{" "}
                or call{" "}
                <a href="tel:+27639477208" className="font-semibold text-flamingo-pink hover:underline">
                  063 947 7208
                </a>
              </p>
            </div>
          </div>
        )}

        {/* No result message */}
        {searched && !loading && !dispute && !error && (
          <p className="mt-4 text-center text-sm text-flamingo-dark/50">
            No dispute found with that reference.
          </p>
        )}

        {/* Bottom nav */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <Link href="/dispute" className="text-sm font-semibold text-flamingo-pink hover:underline">
            File a new dispute
          </Link>
          <Link href="/" className="text-sm font-semibold text-flamingo-dark/40 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-flamingo-dark/50">{label}</span>
      <span className={`max-w-[60%] text-right text-sm font-semibold ${
        highlight ? "text-green-700" : "text-flamingo-dark"
      } ${mono ? "font-mono text-xs break-all" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function TimelineEntry({ title, time, active }: { title: string; time: string; active: boolean }) {
  return (
    <div className="relative">
      <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 ${
        active ? "border-flamingo-pink bg-flamingo-pink" : "border-flamingo-dark/20 bg-white"
      }`} />
      <p className={`text-sm font-semibold ${active ? "text-flamingo-dark" : "text-flamingo-dark/40"}`}>{title}</p>
      <p className={`text-xs ${active ? "text-flamingo-dark/50" : "text-flamingo-dark/30"}`}>{time}</p>
    </div>
  );
}
