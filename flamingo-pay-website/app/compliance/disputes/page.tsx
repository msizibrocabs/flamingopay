"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ComplianceGate } from "../_components/ComplianceGate";
import { ComplianceNav } from "../_components/ComplianceNav";
import { Reveal, RevealGroup, RevealItem } from "../../../components/motion/Reveal";
import { AnimatedCounter } from "../../../components/motion/AnimatedCounter";
import { formatZAR, timeAgo } from "../../../lib/merchant";

type Dispute = {
  id: string;
  ref: string;
  status: string;
  reason: string;
  amount: number;
  merchantName: string;
  merchantId: string;
  txnDate: string;
  createdAt: string;
  updatedAt: string;
  buyerPhone?: string;
  buyerEmail?: string;
  description: string;
  merchantResponse?: {
    action: string;
    note: string;
    respondedAt: string;
    partialAmount?: number;
  };
  resolution?: {
    decision: string;
    note: string;
    resolvedBy: string;
    resolvedAt: string;
    refundAmount?: number;
  };
};

type Stats = {
  total: number;
  open: number;
  awaitingMerchant: number;
  escalated: number;
  resolved: number;
  totalRefunded: number;
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "under_review", label: "Under review" },
  { value: "merchant_notified", label: "Merchant notified" },
  { value: "merchant_responded", label: "Merchant responded" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved_refund", label: "Refund approved" },
  { value: "resolved_partial", label: "Partial refund" },
  { value: "resolved_rejected", label: "Rejected" },
  { value: "refund_pending", label: "Refund pending" },
  { value: "closed", label: "Closed" },
];

const STATUS_PILLS: Record<string, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-blue-100 text-blue-700 border-blue-300" },
  under_review: { label: "Review", cls: "bg-amber-100 text-amber-700 border-amber-300" },
  merchant_notified: { label: "Notified", cls: "bg-amber-100 text-amber-700 border-amber-300" },
  merchant_responded: { label: "Responded", cls: "bg-purple-100 text-purple-700 border-purple-300" },
  escalated: { label: "Escalated", cls: "bg-orange-100 text-orange-700 border-orange-300" },
  resolved_refund: { label: "Refunded", cls: "bg-green-100 text-green-700 border-green-300" },
  resolved_partial: { label: "Partial", cls: "bg-green-100 text-green-700 border-green-300" },
  resolved_rejected: { label: "Rejected", cls: "bg-red-100 text-red-700 border-red-300" },
  refund_pending: { label: "Refund pending", cls: "bg-teal-100 text-teal-700 border-teal-300" },
  closed: { label: "Closed", cls: "bg-gray-100 text-gray-600 border-gray-300" },
};

const REASON_LABELS: Record<string, string> = {
  wrong_amount: "Wrong amount",
  goods_not_received: "Not received",
  duplicate_charge: "Duplicate",
  unauthorized: "Unauthorized",
  payment_error: "Wrong merchant",
  other: "Other",
};

export default function ComplianceDisputesPage() {
  return (
    <ComplianceGate>
      <ComplianceNav />
      <DisputesList />
    </ComplianceGate>
  );
}

function DisputesList() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolveForm, setResolveForm] = useState<{
    decision: string;
    note: string;
    refundAmount: string;
  }>({ decision: "", note: "", refundAmount: "" });

  function load() {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    fetch(`/api/compliance/disputes${qs}`)
      .then((r) => r.json())
      .then((d) => {
        setDisputes(d.disputes ?? []);
        setStats(d.stats ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filter]);

  async function handleResolve(disputeId: string) {
    if (!resolveForm.decision) return;
    try {
      const res = await fetch(`/api/compliance/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: resolveForm.decision,
          note: resolveForm.note,
          resolvedBy: "Compliance Officer",
          refundAmount: resolveForm.refundAmount ? Number(resolveForm.refundAmount) : undefined,
        }),
      });
      if (res.ok) {
        setResolving(null);
        setResolveForm({ decision: "", note: "", refundAmount: "" });
        load();
      }
    } catch {}
  }

  async function handleMarkRefund(disputeId: string) {
    try {
      await fetch(`/api/compliance/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markRefundDone: true }),
      });
      load();
    } catch {}
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <Reveal>
        <div className="mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600">
            Compliance · Disputes
          </span>
          <h1
            className="display mt-2 font-black text-flamingo-dark leading-[0.9]"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", letterSpacing: "-0.035em" }}
          >
            Buyer disputes.
          </h1>
        </div>
      </Reveal>

      {/* Stats */}
      {stats && (
        <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <RevealItem>
            <MiniStat label="Total" value={stats.total} tone="gray" />
          </RevealItem>
          <RevealItem>
            <MiniStat label="Open" value={stats.open} tone="blue" highlight={stats.open > 0} />
          </RevealItem>
          <RevealItem>
            <MiniStat label="Awaiting merchant" value={stats.awaitingMerchant} tone="amber" />
          </RevealItem>
          <RevealItem>
            <MiniStat label="Escalated" value={stats.escalated} tone="orange" highlight={stats.escalated > 0} />
          </RevealItem>
          <RevealItem>
            <MiniStat label="Resolved" value={stats.resolved} tone="green" />
          </RevealItem>
        </RevealGroup>
      )}

      {/* Filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-lg border-2 px-3 py-1 text-xs font-bold transition ${
              filter === f.value
                ? "border-flamingo-dark bg-red-50 text-flamingo-dark shadow-[0_2px_0_0_#1A1A2E]"
                : "border-flamingo-dark/20 text-flamingo-dark/60 hover:bg-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border-2 border-flamingo-dark/20 bg-white/60" />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-flamingo-dark/40 bg-white/70 p-6 text-center">
          <p className="display text-lg font-extrabold text-flamingo-dark">No disputes</p>
          <p className="mt-1 text-sm text-flamingo-dark/60">
            {filter ? "No disputes with this status." : "No disputes have been filed yet."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {disputes.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_4px_0_0_#1A1A2E]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-flamingo-dark/50">{d.ref}</span>
                    <StatusPill status={d.status} />
                  </div>
                  <p className="mt-1 text-base font-extrabold text-flamingo-dark">
                    {formatZAR(d.amount)} — {d.merchantName}
                  </p>
                  <p className="text-xs text-flamingo-dark/60">
                    {REASON_LABELS[d.reason] ?? d.reason} · Filed {timeAgo(d.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-flamingo-dark/70">{d.description}</p>
                  {d.buyerPhone && (
                    <p className="mt-1 text-xs text-flamingo-dark/50">
                      Contact: {d.buyerPhone} {d.buyerEmail ? `/ ${d.buyerEmail}` : ""}
                    </p>
                  )}
                </div>
              </div>

              {/* Merchant response */}
              {d.merchantResponse && (
                <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50 p-3">
                  <p className="text-xs font-bold text-purple-700">
                    Merchant: {d.merchantResponse.action === "accept" ? "Accepted" : d.merchantResponse.action === "reject" ? "Rejected" : "Partial offer"}
                    {d.merchantResponse.partialAmount ? ` (${formatZAR(d.merchantResponse.partialAmount)})` : ""}
                  </p>
                  {d.merchantResponse.note && (
                    <p className="mt-1 text-xs text-purple-700/70">{d.merchantResponse.note}</p>
                  )}
                </div>
              )}

              {/* Resolution */}
              {d.resolution && (
                <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3">
                  <p className="text-xs font-bold text-green-700">
                    Resolved: {d.resolution.decision === "refund_full" ? "Full refund" : d.resolution.decision === "refund_partial" ? `Partial refund (${formatZAR(d.resolution.refundAmount ?? 0)})` : "Rejected"}
                  </p>
                  {d.resolution.note && (
                    <p className="mt-1 text-xs text-green-700/70">{d.resolution.note}</p>
                  )}
                  <p className="mt-1 text-xs text-green-600/50">By {d.resolution.resolvedBy} · {timeAgo(d.resolution.resolvedAt)}</p>
                </div>
              )}

              {/* Actions */}
              {!d.resolution && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {resolving === d.id ? (
                    <div className="w-full space-y-2 rounded-xl border-2 border-flamingo-dark/20 bg-flamingo-cream p-3">
                      <div className="flex gap-2">
                        {(["refund_full", "refund_partial", "reject"] as const).map((dec) => (
                          <button
                            key={dec}
                            onClick={() => setResolveForm((f) => ({ ...f, decision: dec }))}
                            className={`rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition ${
                              resolveForm.decision === dec
                                ? "border-flamingo-dark bg-white text-flamingo-dark shadow-[0_2px_0_0_#1A1A2E]"
                                : "border-flamingo-dark/20 text-flamingo-dark/60"
                            }`}
                          >
                            {dec === "refund_full" ? "Full refund" : dec === "refund_partial" ? "Partial refund" : "Reject"}
                          </button>
                        ))}
                      </div>
                      {resolveForm.decision === "refund_partial" && (
                        <input
                          type="number"
                          placeholder="Refund amount"
                          value={resolveForm.refundAmount}
                          onChange={(e) => setResolveForm((f) => ({ ...f, refundAmount: e.target.value }))}
                          className="w-full rounded-lg border-2 border-flamingo-dark bg-white px-3 py-2 text-sm outline-none"
                        />
                      )}
                      <textarea
                        placeholder="Resolution note..."
                        value={resolveForm.note}
                        onChange={(e) => setResolveForm((f) => ({ ...f, note: e.target.value }))}
                        rows={2}
                        className="w-full rounded-lg border-2 border-flamingo-dark bg-white px-3 py-2 text-sm outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolve(d.id)}
                          disabled={!resolveForm.decision}
                          className="rounded-lg border-2 border-flamingo-dark bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-[0_2px_0_0_#1A1A2E] disabled:opacity-50"
                        >
                          Confirm resolution
                        </button>
                        <button
                          onClick={() => { setResolving(null); setResolveForm({ decision: "", note: "", refundAmount: "" }); }}
                          className="text-xs font-bold text-flamingo-dark/50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setResolving(d.id)}
                      className="rounded-lg border-2 border-flamingo-dark bg-white px-3 py-1.5 text-xs font-bold text-flamingo-dark shadow-[0_2px_0_0_#1A1A2E] hover:bg-flamingo-cream"
                    >
                      Resolve dispute
                    </button>
                  )}
                </div>
              )}

              {/* Mark refund done */}
              {d.status === "refund_pending" && (
                <button
                  onClick={() => handleMarkRefund(d.id)}
                  className="mt-2 rounded-lg border-2 border-green-600 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100"
                >
                  Mark refund as completed
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  const info = STATUS_PILLS[status] ?? { label: status, cls: "bg-gray-100 text-gray-600 border-gray-300" };
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${info.cls}`}>
      {info.label}
    </span>
  );
}

function MiniStat({
  label,
  value,
  tone,
  highlight,
}: {
  label: string;
  value: number;
  tone: "gray" | "blue" | "amber" | "orange" | "green";
  highlight?: boolean;
}) {
  const bg = {
    gray: "bg-gray-50",
    blue: "bg-blue-50",
    amber: "bg-amber-50",
    orange: "bg-orange-50",
    green: "bg-green-50",
  }[tone];
  return (
    <div
      className={`rounded-2xl border-2 border-flamingo-dark p-3 shadow-[0_4px_0_0_#1A1A2E] ${bg} ${
        highlight ? "ring-4 ring-red-200" : ""
      }`}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-flamingo-dark/70">{label}</p>
      <p
        className="display mt-1 font-black text-flamingo-dark tabular-nums leading-none"
        style={{ fontSize: "clamp(1.25rem, 2.5vw, 2rem)", letterSpacing: "-0.03em" }}
      >
        <AnimatedCounter to={value} duration={1} locale="en-ZA" />
      </p>
    </div>
  );
}
