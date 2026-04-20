"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ComplianceGate } from "../_components/ComplianceGate";
import { ComplianceNav } from "../_components/ComplianceNav";
import { Reveal, RevealGroup, RevealItem } from "../../../components/motion/Reveal";
import { AnimatedCounter } from "../../../components/motion/AnimatedCounter";
import { formatZAR, timeAgo } from "../../../lib/merchant";

type CTR = {
  id: string;
  merchantId: string;
  merchantName: string;
  txnId: string;
  amount: number;
  timestamp: string;
  filedWithFIC: boolean;
  filedAt?: string;
};

type CTRStats = {
  total: number;
  pending: number;
  filed: number;
};

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "filed", label: "Filed" },
];

export default function CTRListPage() {
  return (
    <ComplianceGate>
      <ComplianceNav />
      <CTRList />
    </ComplianceGate>
  );
}

function CTRList() {
  const [ctrs, setCtrs] = useState<CTR[]>([]);
  const [stats, setStats] = useState<CTRStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [filingId, setFilingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const fetchData = (selectedTab: string) => {
    const params = new URLSearchParams();
    if (selectedTab === "pending") params.set("filed", "false");
    if (selectedTab === "filed") params.set("filed", "true");
    setLoading(true);
    fetch(`/api/compliance/ctrs?${params}`)
      .then(r => r.json())
      .then(d => {
        setCtrs(d.ctrs ?? []);
        setStats(d.stats ?? null);
      })
      .catch(() => setCtrs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(tab); }, [tab]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function fileWithFIC(ctrId: string) {
    setFilingId(ctrId);
    try {
      const res = await fetch("/api/compliance/ctrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ctrId }),
      });
      if (res.ok) {
        showToast("CTR filed with FIC");
        fetchData(tab);
      } else {
        showToast("Failed to file CTR");
      }
    } catch {
      showToast("Failed to file CTR");
    }
    setFilingId(null);
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
            Compliance · FICA Section 28
          </span>
          <h1 className="display mt-2 font-black text-flamingo-dark leading-[0.9]"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", letterSpacing: "-0.035em" }}>
            Cash Threshold Reports.
          </h1>
          <p className="mt-2 text-sm text-flamingo-dark/60">
            Transactions exceeding R25,000 that must be reported to the Financial Intelligence Centre within 15 days.
          </p>
        </div>
      </Reveal>

      {stats && (
        <RevealGroup className="mb-6 grid grid-cols-3 gap-3">
          <RevealItem><StatCard label="Total CTRs" value={stats.total} tone="gray" /></RevealItem>
          <RevealItem><StatCard label="Pending Filing" value={stats.pending} tone="amber" highlight={stats.pending > 0} /></RevealItem>
          <RevealItem><StatCard label="Filed with FIC" value={stats.filed} tone="green" /></RevealItem>
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
        <div className="py-20 text-center text-flamingo-dark/40">Loading CTRs...</div>
      ) : ctrs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-flamingo-dark/20 py-16 text-center">
          <p className="text-lg font-bold text-flamingo-dark/40">No CTRs found</p>
          <p className="mt-1 text-sm text-flamingo-dark/30">
            CTRs are auto-generated when a single transaction exceeds R25,000.
          </p>
        </div>
      ) : (
        <RevealGroup className="space-y-3">
          {ctrs.map(ctr => (
            <RevealItem key={ctr.id}>
              <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_4px_0_0_#1A1A2E]">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">💰</span>
                      <span className="font-extrabold text-flamingo-dark text-sm">{ctr.merchantName}</span>
                      <span className="text-[10px] text-flamingo-dark/40">{ctr.id}</span>
                    </div>
                    <p className="text-xs text-flamingo-dark/60">
                      Transaction {ctr.txnId} exceeds R25,000 threshold
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                      ctr.filedWithFIC
                        ? "bg-green-100 text-green-800 border-green-300"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                    }`}>
                      {ctr.filedWithFIC ? "Filed with FIC" : "Pending Filing"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-flamingo-dark/50">
                  <span className="font-bold text-flamingo-dark">{formatZAR(ctr.amount)}</span>
                  <span>Merchant: {ctr.merchantId}</span>
                  {ctr.filedAt && <span className="text-green-700 font-bold">Filed: {new Date(ctr.filedAt).toLocaleDateString("en-ZA")}</span>}
                  <span className="ml-auto">{timeAgo(ctr.timestamp)}</span>
                </div>

                {/* File action */}
                {!ctr.filedWithFIC && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-flamingo-dark/10 pt-3">
                    <button onClick={() => fileWithFIC(ctr.id)}
                      disabled={filingId === ctr.id}
                      className="rounded-lg border-2 border-flamingo-dark bg-green-500 px-3 py-1 text-xs font-bold text-white shadow-[0_2px_0_0_#1A1A2E] disabled:opacity-50">
                      {filingId === ctr.id ? "Filing..." : "File with FIC"}
                    </button>
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
  };
  const numColor: Record<string, string> = {
    gray: "text-flamingo-dark",
    amber: highlight ? "text-amber-600" : "text-flamingo-dark",
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
