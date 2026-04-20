"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ComplianceGate } from "../_components/ComplianceGate";
import { ComplianceNav } from "../_components/ComplianceNav";
import { Reveal, RevealGroup, RevealItem } from "../../../components/motion/Reveal";
import { AnimatedCounter } from "../../../components/motion/AnimatedCounter";
import { timeAgo } from "../../../lib/merchant";

// ─── Types (mirroring lib/edd.ts) ────────────────────────────

type EDDTrigger =
  | "pep_identified"
  | "sanctions_near_match"
  | "volume_deviation"
  | "high_risk_business"
  | "adverse_media"
  | "str_filed"
  | "manual_referral";

type EDDStatus =
  | "opened"
  | "investigation"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "closed";

type EDDCase = {
  id: string;
  merchantId: string;
  merchantName: string;
  ownerName: string;
  trigger: EDDTrigger;
  triggerDetail: string;
  status: EDDStatus;
  riskLevel: "high" | "critical";
  checks: { type: string; label: string; required: boolean; status: string }[];
  assignedTo?: string;
  decidedBy?: string;
  decidedAt?: string;
  nextReviewDate?: string;
  reviewFrequencyDays: number;
  createdAt: string;
  updatedAt: string;
};

type EDDStats = {
  total: number;
  opened: number;
  investigation: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  closed: number;
  byTrigger: Record<string, number>;
  overdueReviews: number;
};

// ─── Constants ───────────────────────────────────────────────

const STATUS_TABS: { key: EDDStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "opened", label: "Open" },
  { key: "investigation", label: "Investigating" },
  { key: "pending_approval", label: "Pending Approval" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "closed", label: "Closed" },
];

const STATUS_COLORS: Record<EDDStatus, string> = {
  opened: "bg-red-100 text-red-800 border-red-300",
  investigation: "bg-amber-100 text-amber-800 border-amber-300",
  pending_approval: "bg-blue-100 text-blue-800 border-blue-300",
  approved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-purple-100 text-purple-800 border-purple-300",
  closed: "bg-gray-100 text-gray-600 border-gray-300",
};

const STATUS_LABELS: Record<EDDStatus, string> = {
  opened: "Open",
  investigation: "Investigating",
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  closed: "Closed",
};

const TRIGGER_LABELS: Record<EDDTrigger, string> = {
  pep_identified: "PEP Identified",
  sanctions_near_match: "Sanctions Near-Match",
  volume_deviation: "Volume Deviation",
  high_risk_business: "High-Risk Business",
  adverse_media: "Adverse Media",
  str_filed: "STR Filed",
  manual_referral: "Manual Referral",
};

const TRIGGER_ICONS: Record<EDDTrigger, string> = {
  pep_identified: "👤",
  sanctions_near_match: "🛡️",
  volume_deviation: "📈",
  high_risk_business: "⚠️",
  adverse_media: "📰",
  str_filed: "🚨",
  manual_referral: "🖊️",
};

const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-amber-500 text-white",
};

// ─── Page ────────────────────────────────────────────────────

export default function EDDListPage() {
  return (
    <ComplianceGate>
      <ComplianceNav />
      <EDDList />
    </ComplianceGate>
  );
}

function EDDList() {
  const [cases, setCases] = useState<EDDCase[]>([]);
  const [stats, setStats] = useState<EDDStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<EDDStatus | "all">("all");

  const fetchCases = (selectedTab: EDDStatus | "all") => {
    const params = selectedTab === "all" ? "" : `?status=${selectedTab}`;
    setLoading(true);
    Promise.all([
      fetch(`/api/compliance/edd${params}`).then(r => r.json()),
      fetch("/api/compliance/edd?stats=true").then(r => r.json()),
    ])
      .then(([casesData, statsData]) => {
        setCases(casesData.cases ?? []);
        setStats(statsData.stats ?? null);
      })
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCases(tab);
  }, [tab]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      {/* Header */}
      <Reveal>
        <div className="mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600">
            Compliance · Enhanced Due Diligence
          </span>
          <h1
            className="display mt-2 font-black text-flamingo-dark leading-[0.9]"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", letterSpacing: "-0.035em" }}
          >
            EDD Cases.
          </h1>
          <p className="mt-2 text-sm text-flamingo-dark/60">
            FICA-required enhanced screening for PEPs, sanctions near-matches, and high-risk merchants.
          </p>
        </div>
      </Reveal>

      {/* Stats Cards */}
      {stats && (
        <RevealGroup className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <RevealItem>
            <StatCard label="Open" value={stats.opened} tone="red" highlight={stats.opened > 0} />
          </RevealItem>
          <RevealItem>
            <StatCard label="Investigating" value={stats.investigation} tone="amber" />
          </RevealItem>
          <RevealItem>
            <StatCard label="Pending Approval" value={stats.pendingApproval} tone="blue" highlight={stats.pendingApproval > 0} />
          </RevealItem>
          <RevealItem>
            <StatCard label="Approved" value={stats.approved} tone="green" />
          </RevealItem>
          <RevealItem>
            <StatCard label="Overdue Reviews" value={stats.overdueReviews} tone="red" highlight={stats.overdueReviews > 0} />
          </RevealItem>
        </RevealGroup>
      )}

      {/* Trigger breakdown */}
      {stats && Object.keys(stats.byTrigger).length > 0 && (
        <Reveal delay={0.1}>
          <div className="mb-6 flex flex-wrap gap-2">
            {Object.entries(stats.byTrigger).map(([trigger, count]) => (
              <span
                key={trigger}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-flamingo-dark/10 bg-white px-3 py-1 text-xs font-bold text-flamingo-dark"
              >
                {TRIGGER_ICONS[trigger as EDDTrigger] ?? "📋"}{" "}
                {TRIGGER_LABELS[trigger as EDDTrigger] ?? trigger}: {count}
              </span>
            ))}
          </div>
        </Reveal>
      )}

      {/* Tabs */}
      <Reveal delay={0.15}>
        <div className="mb-4 flex flex-wrap gap-1">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                "rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition " +
                (tab === t.key
                  ? "border-flamingo-dark bg-red-50 text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E]"
                  : "border-transparent text-flamingo-dark/60 hover:border-flamingo-dark/20")
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </Reveal>

      {/* Cases List */}
      {loading ? (
        <div className="py-20 text-center text-flamingo-dark/40">Loading EDD cases...</div>
      ) : cases.length === 0 ? (
        <Reveal>
          <div className="rounded-2xl border-2 border-dashed border-flamingo-dark/20 py-16 text-center">
            <p className="text-lg font-bold text-flamingo-dark/40">No EDD cases found</p>
            <p className="mt-1 text-sm text-flamingo-dark/30">
              {tab === "all"
                ? "EDD cases are opened automatically when PEPs, sanctions near-matches, or volume deviations are detected."
                : `No cases with status "${STATUS_LABELS[tab as EDDStatus]}".`}
            </p>
          </div>
        </Reveal>
      ) : (
        <RevealGroup className="space-y-3">
          {cases.map(c => (
            <RevealItem key={c.id}>
              <Link
                href={`/compliance/edd/${c.id}`}
                className="group block rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_4px_0_0_#1A1A2E] transition hover:shadow-[0_2px_0_0_#1A1A2E] hover:translate-y-[2px]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-lg">{TRIGGER_ICONS[c.trigger]}</span>
                      <span className="font-extrabold text-flamingo-dark text-sm">
                        {c.merchantName}
                      </span>
                      <span className="text-xs text-flamingo-dark/50">({c.ownerName})</span>
                    </div>
                    <p className="text-xs text-flamingo-dark/60 truncate max-w-lg">
                      {c.triggerDetail}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${RISK_COLORS[c.riskLevel]}`}>
                      {c.riskLevel}
                    </span>
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${STATUS_COLORS[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-flamingo-dark/50">
                  <span>{TRIGGER_LABELS[c.trigger]}</span>
                  <span>
                    Checks: {c.checks.filter(ch => ch.status === "completed" || ch.status === "waived").length}/{c.checks.length}
                  </span>
                  {c.assignedTo && <span>Assigned: {c.assignedTo}</span>}
                  {c.nextReviewDate && (
                    <span className={c.nextReviewDate < new Date().toISOString().split("T")[0] ? "text-red-600 font-bold" : ""}>
                      Next review: {c.nextReviewDate}
                    </span>
                  )}
                  <span className="ml-auto">{timeAgo(c.createdAt)}</span>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </main>
  );
}

// ─── Stat Card ───────────────────────────────────────────────

function StatCard({ label, value, tone, highlight }: {
  label: string;
  value: number;
  tone: "red" | "amber" | "green" | "blue" | "purple";
  highlight?: boolean;
}) {
  const toneMap = {
    red: highlight ? "border-red-400 bg-red-50" : "border-flamingo-dark/10 bg-white",
    amber: "border-flamingo-dark/10 bg-white",
    green: "border-flamingo-dark/10 bg-white",
    blue: highlight ? "border-blue-400 bg-blue-50" : "border-flamingo-dark/10 bg-white",
    purple: "border-flamingo-dark/10 bg-white",
  };
  const numColor = {
    red: highlight ? "text-red-600" : "text-flamingo-dark",
    amber: "text-amber-600",
    green: "text-green-600",
    blue: highlight ? "text-blue-600" : "text-flamingo-dark",
    purple: "text-purple-600",
  };
  return (
    <div className={`rounded-2xl border-2 p-4 ${toneMap[tone]}`}>
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-flamingo-dark/50">{label}</p>
      <p className={`display mt-1 text-3xl font-black ${numColor[tone]}`}>
        <AnimatedCounter to={value} />
      </p>
    </div>
  );
}
