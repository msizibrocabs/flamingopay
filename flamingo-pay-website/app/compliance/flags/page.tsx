"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ComplianceGate } from "../_components/ComplianceGate";
import { ComplianceNav } from "../_components/ComplianceNav";
import { FlagPill } from "../_components/FlagPill";
import { Reveal } from "../../../components/motion/Reveal";
import { formatZAR, timeAgo } from "../../../lib/merchant";
import type { FlagStatus, TxnFlag } from "../../../lib/store";

const TABS: { key: FlagStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "investigating", label: "Investigating" },
  { key: "cleared", label: "Cleared" },
  { key: "confirmed", label: "Confirmed" },
];

export default function FlagsListPage() {
  return (
    <ComplianceGate>
      <ComplianceNav />
      <FlagsList />
    </ComplianceGate>
  );
}

function FlagsList() {
  const [flags, setFlags] = useState<TxnFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FlagStatus | "all">("all");
  const [rescanning, setRescanning] = useState(false);
  const [rescanResult, setRescanResult] = useState<{ scanned: number; flagsCreated: number; error?: string } | null>(null);

  const fetchFlags = (selectedTab: FlagStatus | "all") => {
    const url = selectedTab === "all" ? "/api/compliance/flags" : `/api/compliance/flags?status=${selectedTab}`;
    setLoading(true);
    fetch(url)
      .then(r => r.json())
      .then(d => setFlags(d.flags ?? []))
      .catch(() => setFlags([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFlags(tab);
  }, [tab]);

  const handleRescan = async () => {
    setRescanning(true);
    setRescanResult(null);
    try {
      const res = await fetch("/api/compliance/flags/rescan", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setRescanResult({ scanned: 0, flagsCreated: 0, error: data.error ?? `Server error (${res.status})` });
        return;
      }
      setRescanResult({ scanned: data.scanned ?? 0, flagsCreated: data.flagsCreated ?? 0 });
      // Refresh the flags list
      fetchFlags(tab);
    } catch (err) {
      setRescanResult({ scanned: 0, flagsCreated: 0, error: `Network error: ${err}` });
    } finally {
      setRescanning(false);
    }
  };

  const reasonIcons: Record<string, string> = { high_amount: "💰", velocity: "⚡", unusual_hours: "🌙", manual: "🖊️" };

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <Reveal>
        <div className="mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600">Compliance · Flags</span>
          <h1 className="display mt-2 font-black text-flamingo-dark leading-[0.9]"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", letterSpacing: "-0.035em" }}>
            All flags.
          </h1>
        </div>
      </Reveal>

      <div className="mb-6 flex items-center gap-2 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={
            "shrink-0 rounded-xl border-2 px-3 py-1.5 text-sm font-bold transition " +
            (tab === t.key
              ? "border-flamingo-dark bg-red-50 text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E]"
              : "border-flamingo-dark/20 text-flamingo-dark/60 hover:bg-flamingo-cream")
          }>
            {t.label}
          </button>
        ))}
        <button
          onClick={handleRescan}
          disabled={rescanning}
          className="ml-auto shrink-0 rounded-xl border-2 border-red-600 bg-red-600 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {rescanning ? "Scanning…" : "🔄 Rescan All Transactions"}
        </button>
      </div>

      {rescanResult && (
        <div className={`mb-4 rounded-xl border-2 px-4 py-3 text-sm font-semibold ${
          rescanResult.error
            ? "border-red-600 bg-red-50 text-red-800"
            : "border-green-600 bg-green-50 text-green-800"
        }`}>
          {rescanResult.error
            ? `Rescan failed: ${rescanResult.error}`
            : `Rescan complete: ${rescanResult.scanned} transactions scanned, ${rescanResult.flagsCreated} new flags generated.`}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border-2 border-flamingo-dark/20 bg-white/60" />
          ))}
        </div>
      ) : flags.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-flamingo-dark/40 bg-white/70 p-6 text-center">
          <p className="display text-lg font-extrabold text-flamingo-dark">
            {tab === "all" ? "No flags yet" : `No ${tab} flags`}
          </p>
          <p className="mt-1 text-sm text-flamingo-dark/60">
            {tab === "all" ? "Flags will appear here as transactions are monitored." : "Try switching to a different filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border-2 border-flamingo-dark bg-white shadow-[0_6px_0_0_#1A1A2E]">
          {flags.map((f, i) => (
            <Link key={f.id} href={`/compliance/flags/${f.id}`}
              className={"flex items-center gap-3 px-4 py-3 transition hover:bg-red-50 " +
                (i !== flags.length - 1 ? "border-b border-flamingo-dark/10" : "")}>
              <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-flamingo-dark bg-red-100 text-lg">
                {reasonIcons[f.reason] ?? "🚩"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-bold text-flamingo-dark">{formatZAR(f.txnSnapshot.amount)}</p>
                  <span className="flex-none text-[11px] font-semibold text-flamingo-dark/60">{timeAgo(f.createdAt)}</span>
                </div>
                <p className="truncate text-xs text-flamingo-dark/60">
                  {f.ruleLabel} · {f.txnSnapshot.buyerBank} · Ref: {f.txnSnapshot.reference}
                </p>
                <p className="truncate text-[10px] text-flamingo-dark/50">Merchant: {f.merchantId}</p>
              </div>
              <FlagPill status={f.status} />
              <span className="text-flamingo-dark/40 text-sm">→</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
