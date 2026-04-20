"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ComplianceGate } from "../_components/ComplianceGate";
import { ComplianceNav } from "../_components/ComplianceNav";
import { Reveal, RevealGroup, RevealItem } from "../../../components/motion/Reveal";
import { AnimatedCounter } from "../../../components/motion/AnimatedCounter";
import { formatZAR, timeAgo } from "../../../lib/merchant";
import { currentComplianceOfficer } from "../../../lib/compliance";

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

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  pending_review: "bg-amber-100 text-amber-800 border-amber-300",
  filed: "bg-green-100 text-green-800 border-green-300",
  dismissed: "bg-purple-100 text-purple-600 border-purple-300",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  filed: "Filed with FIC",
  dismissed: "Dismissed",
};

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-500 text-white",
  medium: "bg-amber-500 text-white",
  high: "bg-orange-500 text-white",
  critical: "bg-red-600 text-white",
};

const REASON_LABELS: Record<string, string> = {
  structuring: "Structuring",
  velocity_spike: "Velocity Spike",
  unusual_hours: "Unusual Hours",
  round_amounts: "Round Amounts",
  rapid_fire: "Rapid-Fire",
  refund_abuse: "Refund Abuse",
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
  { key: "pending_review", label: "Pending Review" },
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

  async function handleFileWithFIC(str: STR) {
    const ref = prompt("Enter FIC reference number (optional):");
    await updateSTR(str.id, {
      status: "filed",
      ficReference: ref || undefined,
      notes: `Filed with FIC by ${currentComplianceOfficer()?.name ?? "officer"}`,
    });
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
          <RevealItem><StatCard label="Pending Review" value={stats.pendingReview} tone="amber" highlight={stats.pendingReview > 0} /></RevealItem>
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
              <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_4px_0_0_#1A1A2E]">
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

                {/* Actions */}
                {str.status !== "filed" && str.status !== "dismissed" && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-flamingo-dark/10 pt-3">
                    {str.status === "draft" && (
                      <button onClick={() => updateSTR(str.id, { status: "pending_review" })}
                        disabled={actionId === str.id}
                        className="rounded-lg border-2 border-flamingo-dark bg-amber-400 px-3 py-1 text-xs font-bold text-flamingo-dark shadow-[0_2px_0_0_#1A1A2E] disabled:opacity-50">
                        Escalate to Review
                      </button>
                    )}
                    {(str.status === "draft" || str.status === "pending_review") && (
                      <button onClick={() => handleFileWithFIC(str)}
                        disabled={actionId === str.id}
                        className="rounded-lg border-2 border-flamingo-dark bg-green-500 px-3 py-1 text-xs font-bold text-white shadow-[0_2px_0_0_#1A1A2E] disabled:opacity-50">
                        File with FIC
                      </button>
                    )}
                    {(str.status === "draft" || str.status === "pending_review") && (
                      <button onClick={() => {
                        const reason = prompt("Reason for dismissal:");
                        if (reason) updateSTR(str.id, { status: "dismissed", notes: `Dismissed: ${reason}` });
                      }}
                        disabled={actionId === str.id}
                        className="rounded-lg border-2 border-flamingo-dark/20 px-3 py-1 text-xs font-bold text-flamingo-dark/50 disabled:opacity-50">
                        Dismiss
                      </button>
                    )}
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
