"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ComplianceGate } from "../_components/ComplianceGate";
import { ComplianceNav } from "../_components/ComplianceNav";
import { Reveal, RevealGroup, RevealItem } from "../../../components/motion/Reveal";
import { AnimatedCounter } from "../../../components/motion/AnimatedCounter";
import { formatZAR, timeAgo } from "../../../lib/merchant";
import {
  STR_STATUS_LABELS,
  STR_STATUS_COLORS,
  RISK_LEVEL_COLORS,
} from "../../../lib/compliance-ui";
import { daysSince } from "../../../lib/time";

type STR = {
  id: string;
  merchantId: string;
  merchantName: string;
  reason: string;
  description: string;
  relatedTxnIds: string[];
  totalAmount: number;
  status: "draft" | "pending_review" | "filed" | "dismissed";
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  filedWithFIC: boolean;
  filedAt?: string;
  ficReference?: string;
  riskLevel?: "low" | "medium" | "high" | "critical";
  notes?: string;
};

type STRStats = {
  total: number;
  draft?: number;
  pendingReview: number;
  filed: number;
  dismissed: number;
};

// Status labels + colours are imported from lib/compliance-ui.ts so every
// FICA surface (flags, STRs, EDD, CTRs) stays in sync.
const STATUS_COLORS = STR_STATUS_COLORS;
const STATUS_LABELS = STR_STATUS_LABELS;
const RISK_COLORS = RISK_LEVEL_COLORS;

// FIC Act s29(3): STRs must be filed within 15 working days of forming a suspicion.
// Warn at 10 days, flag overdue at 15.
const STR_FILING_DEADLINE_DAYS = 15;
const STR_WARNING_DAYS = 10;

function filingUrgency(str: { status: string; createdAt: string; filedAt?: string }):
  | { label: string; className: string; title: string }
  | null {
  if (str.status !== "pending_review" && str.status !== "draft") return null;
  const days = daysSince(str.createdAt);
  if (days >= STR_FILING_DEADLINE_DAYS) {
    return {
      label: `Overdue · ${days}d`,
      className: "bg-red-600 text-white",
      title: `FIC s29(3) filing deadline is ${STR_FILING_DEADLINE_DAYS} working days — this STR is ${days} days old.`,
    };
  }
  if (days >= STR_WARNING_DAYS) {
    const remaining = STR_FILING_DEADLINE_DAYS - days;
    return {
      label: `${remaining}d left`,
      className: "bg-amber-500 text-white",
      title: `FIC s29(3) filing deadline — ${remaining} working days remaining.`,
    };
  }
  return null;
}

const REASON_LABELS: Record<string, string> = {
  structuring: "Structuring",
  velocity_spike: "Velocity spike",
  unusual_hours: "Unusual hours",
  round_amounts: "Round amounts",
  rapid_fire: "Rapid-fire",
  refund_abuse: "Refund abuse",
  manual: "Manual",
};

const REASON_ICONS: Record<string, string> = {
  structuring: "🧱",
  velocity_spike: "📈",
  unusual_hours: "🌙",
  round_amounts: "🔢",
  rapid_fire: "⚡",
  refund_abuse: "🔄",
  manual: "🖊️",
};

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "pending_review", label: "Pending review" },
  { key: "filed", label: "Filed" },
  { key: "dismissed", label: "Dismissed" },
];

export default function STRListPage() {
  return (
    <ComplianceGate>
      <ComplianceNav />
      <STRList />
    </ComplianceGate>
  );
}

function STRList() {
  const [strs, setStrs] = useState<STR[]>([]);
  const [stats, setStats] = useState<STRStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [dismissModal, setDismissModal] = useState<STR | null>(null);
  const [dismissReason, setDismissReason] = useState("");

  const fetchData = (selectedTab: string) => {
    const params = new URLSearchParams({ stats: "true" });
    if (selectedTab !== "all") params.set("status", selectedTab);
    setLoading(true);
    fetch(`/api/compliance/strs?${params}`)
      .then(r => r.json())
      .then(d => {
        setStrs(d.strs ?? []);
        setStats(d.stats ?? null);
      })
      .catch(() => setStrs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(tab); }, [tab]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function updateSTR(strId: string, updates: Record<string, unknown>) {
    setActionId(strId);
    try {
      const res = await fetch("/api/compliance/strs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ strId, ...updates }),
      });
      if (res.ok) {
        showToast("STR updated");
        fetchData(tab);
      }
    } catch { showToast("Failed to update"); }
    setActionId(null);
  }

  async function confirmDismiss() {
    if (!dismissModal || !dismissReason.trim()) return;
    await updateSTR(dismissModal.id, { status: "dismissed", notes: `Dismissed: ${dismissReason}` });
    setDismissModal(null);
    setDismissReason("");
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2 text-sm font-bold shadow-[0_4px_0_0_#1A1A2E]">
          {toast}
        </div>
      )}

      {/* Dismiss modal */}
      {dismissModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-flamingo-dark/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border-2 border-flamingo-dark bg-white p-6 shadow-[0_8px_0_0_#1A1A2E]">
            <h3 className="display text-lg font-extrabold text-flamingo-dark">Dismiss STR</h3>
            <p className="mt-1 text-sm text-flamingo-dark/60">
              Dismissing STR for <strong>{dismissModal.merchantName}</strong>
            </p>
            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-widest text-flamingo-dark/50">
                Reason for dismissal
              </span>
              <textarea
                value={dismissReason}
                onChange={e => setDismissReason(e.target.value)}
                placeholder="e.g. Legitimate business activity — verified with merchant"
                rows={3}
                className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-2 text-sm font-semibold text-flamingo-dark outline-none placeholder:text-flamingo-dark/30"
                autoFocus
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDismissModal(null)}
                className="rounded-lg border-2 border-flamingo-dark/30 bg-white px-4 py-2 text-sm font-bold text-flamingo-dark/70">
                Cancel
              </button>
              <button onClick={confirmDismiss}
                disabled={!dismissReason.trim() || actionId === dismissModal.id}
                className="rounded-lg border-2 border-flamingo-dark bg-flamingo-pink-soft px-4 py-2 text-sm font-extrabold text-flamingo-pink-deep shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50">
                {actionId === dismissModal.id ? "Dismissing..." : "Confirm Dismiss"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Reveal>
        <div className="mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600">
            Compliance · FICA Section 29
          </span>
          <h1 className="display mt-2 font-black text-flamingo-dark leading-[0.9]"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", letterSpacing: "-0.035em" }}>
            Suspicious Transaction Reports.
          </h1>
          <p className="mt-2 text-sm text-flamingo-dark/60">
            Auto-detected and manually created STRs. Review, escalate, and file with the Financial Intelligence Centre.
          </p>
        </div>
      </Reveal>

      {stats && (
        <RevealGroup className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <RevealItem><StatCard label="Draft" value={stats.draft ?? (stats.total - stats.pendingReview - stats.filed - stats.dismissed)} tone="gray" /></RevealItem>
          <RevealItem><StatCard label="Pending review" value={stats.pendingReview} tone="amber" highlight={stats.pendingReview > 0} /></RevealItem>
          <RevealItem><StatCard label="Filed with FIC" value={stats.filed} tone="green" /></RevealItem>
          <RevealItem><StatCard label="Dismissed" value={stats.dismissed} tone="purple" /></RevealItem>
        </RevealGroup>
      )}

      <Reveal delay={0.1}>
        <div className="mb-4 flex flex-wrap gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={"rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition " +
                (tab === t.key
                  ? "border-flamingo-dark bg-red-50 text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E]"
                  : "border-transparent text-flamingo-dark/60 hover:border-flamingo-dark/20")}>
              {t.label}
            </button>
          ))}
        </div>
      </Reveal>

      {loading ? (
        <div className="py-20 text-center text-flamingo-dark/40">Loading STRs...</div>
      ) : strs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-flamingo-dark/20 py-16 text-center">
          <p className="text-lg font-bold text-flamingo-dark/40">No STRs found</p>
          <p className="mt-1 text-sm text-flamingo-dark/30">
            STRs are auto-generated when suspicious patterns are detected in transactions.
          </p>
        </div>
      ) : (
        <RevealGroup className="space-y-3">
          {strs.map(str => (
            <RevealItem key={str.id}>
              <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_4px_0_0_#1A1A2E] transition hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#1A1A2E]">
                <Link
                  href={`/compliance/strs/${str.id}`}
                  className="block focus:outline-none"
                  aria-label={`Review STR ${str.id}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{REASON_ICONS[str.reason] ?? "🚨"}</span>
                        <span className="font-extrabold text-flamingo-dark text-sm">{str.merchantName}</span>
                        <span className="text-[10px] text-flamingo-dark/40">{str.id}</span>
                      </div>
                      <p className="text-xs text-flamingo-dark/60">{str.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {str.riskLevel && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${RISK_COLORS[str.riskLevel]}`}>
                          {str.riskLevel}
                        </span>
                      )}
                      {(() => {
                        const urgency = filingUrgency(str);
                        return urgency ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${urgency.className}`}
                            title={urgency.title}
                          >
                            {urgency.label}
                          </span>
                        ) : null;
                      })()}
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${STATUS_COLORS[str.status]}`}>
                        {STATUS_LABELS[str.status]}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-flamingo-dark/50">
                    <span>{REASON_LABELS[str.reason] ?? str.reason}</span>
                    <span>Amount: {formatZAR(str.totalAmount)}</span>
                    <span>{str.relatedTxnIds.length} related txn(s)</span>
                    {str.ficReference && <span className="text-green-700 font-bold">FIC Ref: {str.ficReference}</span>}
                    {str.notes && <span className="italic">{str.notes}</span>}
                    <span className="ml-auto">{timeAgo(str.createdAt)}</span>
                  </div>
                </Link>

                {/* Actions */}
                {str.status !== "filed" && str.status !== "dismissed" && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-flamingo-dark/10 pt-3">
                    {str.status === "draft" && (
                      <button onClick={() => updateSTR(str.id, { status: "pending_review" })}
                        disabled={actionId === str.id}
                        className="rounded-lg border-2 border-flamingo-dark bg-amber-400 px-3 py-1 text-xs font-bold text-flamingo-dark shadow-[0_2px_0_0_#1A1A2E] disabled:opacity-50">
                        Escalate to Review
                      </button>
                    )}
                    {(str.status === "draft" || str.status === "pending_review") && (
                      <Link
                        href={`/compliance/strs/${str.id}`}
                        className="rounded-lg border-2 border-flamingo-dark bg-green-500 px-3 py-1 text-xs font-extrabold text-white shadow-[0_2px_0_0_#1A1A2E]"
                      >
                        Review &amp; file →
                      </Link>
                    )}
                    {(str.status === "draft" || str.status === "pending_review") && (
                      <button onClick={() => { setDismissModal(str); setDismissReason(""); }}
                        disabled={actionId === str.id}
                        className="rounded-lg border-2 border-flamingo-dark/20 px-3 py-1 text-xs font-bold text-flamingo-dark/50 disabled:opacity-50">
                        Dismiss
                      </button>
                    )}
                    <span className="ml-auto text-[11px] font-bold text-flamingo-dark/40">
                      {str.relatedTxnIds.length} txn{str.relatedTxnIds.length === 1 ? "" : "s"} · tap to view manifest
                    </span>
                  </div>
                )}
                {(str.status === "filed" || str.status === "dismissed") && (
                  <div className="mt-3 flex items-center justify-end border-t border-flamingo-dark/10 pt-3">
                    <Link
                      href={`/compliance/strs/${str.id}`}
                      className="text-xs font-bold text-flamingo-dark/60 underline-offset-2 hover:text-flamingo-dark hover:underline"
                    >
                      View filing record →
                    </Link>
                  </div>
                )}
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </main>
  );
}

function StatCard({ label, value, tone, highlight }: {
  label: string; value: number; tone: string; highlight?: boolean;
}) {
  const toneMap: Record<string, string> = {
    gray: "border-flamingo-dark/10 bg-white",
    amber: highlight ? "border-amber-400 bg-amber-50" : "border-flamingo-dark/10 bg-white",
    green: "border-flamingo-dark/10 bg-white",
    purple: "border-flamingo-dark/10 bg-white",
  };
  const numColor: Record<string, string> = {
    gray: "text-flamingo-dark",
    amber: highlight ? "text-amber-600" : "text-flamingo-dark",
    green: "text-green-600",
    purple: "text-purple-600",
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
