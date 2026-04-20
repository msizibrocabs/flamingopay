"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ComplianceGate } from "../_components/ComplianceGate";
import { ComplianceNav } from "../_components/ComplianceNav";
import { Reveal, RevealGroup, RevealItem } from "../../../components/motion/Reveal";
import { AnimatedCounter } from "../../../components/motion/AnimatedCounter";

type RiskFactor = {
  name: string;
  score: number;
  detail: string;
};

type MerchantRiskScore = {
  merchantId: string;
  merchantName: string;
  totalScore: number;
  level: "low" | "medium" | "high" | "critical";
  factors: RiskFactor[];
  calculatedAt: string;
};

type RiskSummary = {
  totalMerchants: number;
  averageScore: number;
  byLevel: Record<string, number>;
};

const LEVEL_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800 border-green-300",
  medium: "bg-amber-100 text-amber-800 border-amber-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  critical: "bg-red-100 text-red-800 border-red-300",
};

const LEVEL_BAR: Record<string, string> = {
  low: "bg-green-500",
  medium: "bg-amber-500",
  high: "bg-orange-500",
  critical: "bg-red-600",
};

const LEVEL_CARD_TONE: Record<string, { border: string; num: string }> = {
  low: { border: "border-flamingo-dark/10 bg-white", num: "text-green-600" },
  medium: { border: "border-flamingo-dark/10 bg-white", num: "text-amber-600" },
  high: { border: "border-orange-400 bg-orange-50", num: "text-orange-600" },
  critical: { border: "border-red-400 bg-red-50", num: "text-red-600" },
};

export default function RiskDashboardPage() {
  return (
    <ComplianceGate>
      <ComplianceNav />
      <RiskDashboard />
    </ComplianceGate>
  );
}

function RiskDashboard() {
  const [scores, setScores] = useState<MerchantRiskScore[]>([]);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/compliance/risk")
      .then(r => r.json())
      .then(d => {
        setScores(d.scores ?? []);
        setSummary(d.summary ?? null);
      })
      .catch(() => setScores([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all"
    ? scores
    : scores.filter(s => s.level === filter);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <Reveal>
        <div className="mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600">
            Compliance · Risk Assessment
          </span>
          <h1 className="display mt-2 font-black text-flamingo-dark leading-[0.9]"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", letterSpacing: "-0.035em" }}>
            Risk Scoring.
          </h1>
          <p className="mt-2 text-sm text-flamingo-dark/60">
            Automated merchant risk scores (0–100) based on transaction patterns, KYC, sanctions history, and STR filings.
          </p>
        </div>
      </Reveal>

      {/* Portfolio summary */}
      {summary && (
        <RevealGroup className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <RevealItem>
            <div className="rounded-2xl border-2 border-flamingo-dark/10 bg-white p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-flamingo-dark/50">Total Merchants</p>
              <p className="display mt-1 text-3xl font-black text-flamingo-dark">
                <AnimatedCounter to={summary.totalMerchants} />
              </p>
            </div>
          </RevealItem>
          <RevealItem>
            <div className={`rounded-2xl border-2 p-4 ${LEVEL_CARD_TONE.low.border}`}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-flamingo-dark/50">Low Risk</p>
              <p className={`display mt-1 text-3xl font-black ${LEVEL_CARD_TONE.low.num}`}>
                <AnimatedCounter to={summary.byLevel.low ?? 0} />
              </p>
            </div>
          </RevealItem>
          <RevealItem>
            <div className={`rounded-2xl border-2 p-4 ${LEVEL_CARD_TONE.medium.border}`}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-flamingo-dark/50">Medium Risk</p>
              <p className={`display mt-1 text-3xl font-black ${LEVEL_CARD_TONE.medium.num}`}>
                <AnimatedCounter to={summary.byLevel.medium ?? 0} />
              </p>
            </div>
          </RevealItem>
          <RevealItem>
            <div className={`rounded-2xl border-2 p-4 ${LEVEL_CARD_TONE.high.border}`}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-flamingo-dark/50">High Risk</p>
              <p className={`display mt-1 text-3xl font-black ${LEVEL_CARD_TONE.high.num}`}>
                <AnimatedCounter to={summary.byLevel.high ?? 0} />
              </p>
            </div>
          </RevealItem>
          <RevealItem>
            <div className={`rounded-2xl border-2 p-4 ${LEVEL_CARD_TONE.critical.border}`}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-flamingo-dark/50">Critical Risk</p>
              <p className={`display mt-1 text-3xl font-black ${LEVEL_CARD_TONE.critical.num}`}>
                <AnimatedCounter to={summary.byLevel.critical ?? 0} />
              </p>
            </div>
          </RevealItem>
        </RevealGroup>
      )}

      {/* Average score gauge */}
      {summary && (
        <Reveal delay={0.08}>
          <div className="mb-6 rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_4px_0_0_#1A1A2E]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-flamingo-dark/50">Portfolio Average Score</p>
                <p className="display mt-1 text-4xl font-black text-flamingo-dark">{summary.averageScore}<span className="text-lg text-flamingo-dark/40">/100</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-flamingo-dark/50">Distribution</p>
                <div className="mt-1 flex h-4 w-48 overflow-hidden rounded-full border border-flamingo-dark/20">
                  {(["low", "medium", "high", "critical"] as const).map(level => {
                    const count = summary.byLevel[level] ?? 0;
                    const pct = summary.totalMerchants > 0 ? (count / summary.totalMerchants) * 100 : 0;
                    return pct > 0 ? (
                      <div key={level} className={`${LEVEL_BAR[level]} h-full`} style={{ width: `${pct}%` }}
                        title={`${level}: ${count}`} />
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* Filter tabs */}
      <Reveal delay={0.1}>
        <div className="mb-4 flex flex-wrap gap-1">
          {[
            { key: "all", label: "All" },
            { key: "critical", label: "Critical" },
            { key: "high", label: "High" },
            { key: "medium", label: "Medium" },
            { key: "low", label: "Low" },
          ].map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={"rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition " +
                (filter === t.key
                  ? "border-flamingo-dark bg-red-50 text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E]"
                  : "border-transparent text-flamingo-dark/60 hover:border-flamingo-dark/20")}>
              {t.label}
            </button>
          ))}
        </div>
      </Reveal>

      {/* Merchant list */}
      {loading ? (
        <div className="py-20 text-center text-flamingo-dark/40">Calculating risk scores...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-flamingo-dark/20 py-16 text-center">
          <p className="text-lg font-bold text-flamingo-dark/40">No merchants found</p>
          <p className="mt-1 text-sm text-flamingo-dark/30">
            {filter === "all" ? "No approved merchants to score." : `No merchants with ${filter} risk level.`}
          </p>
        </div>
      ) : (
        <RevealGroup className="space-y-3">
          {filtered.map(s => (
            <RevealItem key={s.merchantId}>
              <div
                className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_4px_0_0_#1A1A2E] cursor-pointer transition hover:shadow-[0_2px_0_0_#1A1A2E] hover:translate-y-[2px]"
                onClick={() => setExpanded(expanded === s.merchantId ? null : s.merchantId)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative h-10 w-10 shrink-0">
                      <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.5" fill="none"
                          className={LEVEL_BAR[s.level].replace("bg-", "stroke-")}
                          strokeWidth="3" strokeDasharray={`${s.totalScore} ${100 - s.totalScore}`}
                          strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-flamingo-dark">
                        {s.totalScore}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-flamingo-dark text-sm truncate">{s.merchantName}</p>
                      <p className="text-[10px] text-flamingo-dark/40">{s.merchantId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${LEVEL_COLORS[s.level]}`}>
                      {s.level}
                    </span>
                    <span className="text-xs text-flamingo-dark/40">{expanded === s.merchantId ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Expanded: risk factors */}
                {expanded === s.merchantId && s.factors.length > 0 && (
                  <div className="mt-3 border-t border-flamingo-dark/10 pt-3 space-y-2">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-flamingo-dark/50">Risk Factors</p>
                    {s.factors.map((f, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-20 shrink-0">
                          <div className="flex h-2 overflow-hidden rounded-full bg-flamingo-dark/10">
                            <div className={`h-full rounded-full ${f.score >= 20 ? "bg-red-500" : f.score >= 10 ? "bg-orange-400" : f.score >= 5 ? "bg-amber-400" : "bg-green-400"}`}
                              style={{ width: `${Math.min(100, (f.score / 25) * 100)}%` }} />
                          </div>
                        </div>
                        <span className="w-8 text-right text-xs font-extrabold text-flamingo-dark tabular-nums">{f.score}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-flamingo-dark">{f.name}</span>
                          <span className="ml-2 text-xs text-flamingo-dark/50">{f.detail}</span>
                        </div>
                      </div>
                    ))}
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
