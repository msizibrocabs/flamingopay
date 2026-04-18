"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminGate } from "../_components/AdminGate";
import { AdminNav } from "../_components/AdminNav";
import Link from "next/link";

type MatchEntry = {
  id: string;
  name: string;
  type: string;
  lists: string[];
  score: number;
  country?: string;
  programmes?: string[];
};

type SanctionsFlag = {
  merchantId: string;
  merchantName: string;
  ownerName: string;
  flaggedAt: string;
  status: "pending" | "cleared" | "blocked";
  resolvedAt?: string;
  resolvedBy?: string;
  note?: string;
  matches: MatchEntry[];
};

type SanctionsMeta = {
  lastRefresh: string;
  totalEntries: number;
  sources: string[];
  refreshDurationMs: number;
};

type ScreenResult = {
  matched: boolean;
  score: number;
  matchType: string;
  matchedName: string;
  entries: MatchEntry[];
};

export default function SanctionsPage() {
  return (
    <AdminGate requirePermission="manage_staff">
      <AdminNav />
      <Inner />
    </AdminGate>
  );
}

function Inner() {
  const [flags, setFlags] = useState<SanctionsFlag[]>([]);
  const [meta, setMeta] = useState<SanctionsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [batching, setBatching] = useState(false);
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "cleared" | "blocked">("all");

  // Manual screen state
  const [screenName, setScreenName] = useState("");
  const [screening, setScreening] = useState(false);
  const [screenResult, setScreenResult] = useState<ScreenResult | null>(null);

  const fetchFlags = useCallback(async () => {
    try {
      const res = await fetch("/api/sanctions/flags");
      if (res.ok) {
        const data = await res.json();
        setFlags(data.flags ?? []);
        setMeta(data.meta ?? null);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchFlags(); }, [fetchFlags]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/sanctions/refresh", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setMeta(data.meta);
      }
    } catch { /* ignore */ }
    setRefreshing(false);
  }

  async function handleBatch() {
    setBatching(true);
    try {
      await fetch("/api/sanctions/batch", { method: "POST" });
      await fetchFlags();
    } catch { /* ignore */ }
    setBatching(false);
  }

  async function handleResolve(merchantId: string, status: "cleared" | "blocked") {
    try {
      const res = await fetch("/api/sanctions/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId, status, note: resolveNote }),
      });
      if (res.ok) {
        await fetchFlags();
        setExpandedFlag(null);
        setResolveNote("");
      }
    } catch { /* ignore */ }
  }

  async function handleScreen() {
    if (!screenName.trim()) return;
    setScreening(true);
    setScreenResult(null);
    try {
      const res = await fetch("/api/sanctions/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: screenName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setScreenResult(data);
      }
    } catch { /* ignore */ }
    setScreening(false);
  }

  const filtered = filter === "all"
    ? flags
    : flags.filter(f => f.status === filter);

  const pendingCount = flags.filter(f => f.status === "pending").length;
  const blockedCount = flags.filter(f => f.status === "blocked").length;
  const clearedCount = flags.filter(f => f.status === "cleared").length;

  if (loading) {
    return (
      <main className="min-h-dvh bg-flamingo-cream">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-flamingo-pink border-t-transparent" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-flamingo-cream">
      <div className="mx-auto max-w-5xl px-5 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="display text-2xl font-extrabold text-flamingo-dark">
              Sanctions Screening
            </h1>
            <p className="mt-1 text-sm text-flamingo-dark/60">
              UN · OFAC · EU · SA FIC — FICA compliance screening
            </p>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 1 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2 text-sm font-bold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] transition disabled:opacity-50 active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E]"
            >
              {refreshing ? "Updating lists…" : "Refresh Lists"}
            </motion.button>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 1 }}
              onClick={handleBatch}
              disabled={batching}
              className="rounded-xl border-2 border-flamingo-dark bg-flamingo-pink px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_0_#1A1A2E] transition disabled:opacity-50 active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E]"
            >
              {batching ? "Screening all…" : "Batch Re-screen"}
            </motion.button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="List Entries" value={meta?.totalEntries?.toLocaleString() ?? "—"} />
          <StatCard label="Pending Flags" value={String(pendingCount)} alert={pendingCount > 0} />
          <StatCard label="Blocked" value={String(blockedCount)} />
          <StatCard label="Cleared" value={String(clearedCount)} />
        </div>

        {/* Last refresh info */}
        {meta && (
          <p className="mt-3 text-xs text-flamingo-dark/50">
            Lists last refreshed: {new Date(meta.lastRefresh).toLocaleString("en-ZA")} ·{" "}
            {meta.sources.join(", ")} · {meta.totalEntries.toLocaleString()} entries ·{" "}
            took {(meta.refreshDurationMs / 1000).toFixed(1)}s
          </p>
        )}
        {!meta && (
          <p className="mt-3 text-xs text-flamingo-pink font-bold">
            No sanctions lists loaded yet — click &quot;Refresh Lists&quot; to download from OpenSanctions.
          </p>
        )}

        {/* Manual screen tool */}
        <div className="mt-6 rounded-2xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_4px_0_0_#1A1A2E]">
          <h2 className="display text-base font-extrabold text-flamingo-dark mb-3">
            Manual Name Check
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={screenName}
              onChange={e => setScreenName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleScreen()}
              placeholder="Enter a name to screen…"
              className="flex-1 rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-4 py-2 text-sm font-semibold text-flamingo-dark placeholder:text-flamingo-dark/40 focus:outline-none focus:ring-2 focus:ring-flamingo-pink/50"
            />
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 1 }}
              onClick={handleScreen}
              disabled={screening || !screenName.trim()}
              className="rounded-xl border-2 border-flamingo-dark bg-flamingo-butter px-5 py-2 text-sm font-bold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] transition disabled:opacity-50 active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E]"
            >
              {screening ? "Checking…" : "Screen"}
            </motion.button>
          </div>

          <AnimatePresence>
            {screenResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                {screenResult.matched ? (
                  <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
                    <p className="text-sm font-bold text-red-700">
                      Match found — Score: {screenResult.score}/100 ({screenResult.matchType})
                    </p>
                    <div className="mt-2 space-y-2">
                      {screenResult.entries.map((e, i) => (
                        <div key={i} className="rounded-lg bg-white p-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-flamingo-dark">{e.name}</span>
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              {e.score}%
                            </span>
                          </div>
                          <p className="mt-1 text-flamingo-dark/60">
                            {e.type} · {e.lists.join(", ")}
                            {e.country ? ` · ${e.country}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4">
                    <p className="text-sm font-bold text-green-700">
                      No match found for &quot;{screenResult.matchedName}&quot;
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter pills */}
        <div className="mt-8 flex gap-2">
          {(["all", "pending", "cleared", "blocked"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition " +
                (filter === f
                  ? "border-flamingo-dark bg-flamingo-butter text-flamingo-dark shadow-[0_2px_0_0_#1A1A2E]"
                  : "border-flamingo-dark/20 bg-white text-flamingo-dark/60 hover:bg-flamingo-cream")
              }
            >
              {f === "all" ? `All (${flags.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${flags.filter(fl => fl.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Flags list */}
        <div className="mt-4 space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-flamingo-dark/20 py-12 text-center">
              <p className="text-sm font-semibold text-flamingo-dark/50">
                {flags.length === 0
                  ? "No sanctions flags yet. Run a batch screen or refresh the lists."
                  : "No flags match this filter."}
              </p>
            </div>
          )}

          <AnimatePresence>
            {filtered.map(flag => {
              const isExpanded = expandedFlag === flag.merchantId;
              return (
                <motion.div
                  key={flag.merchantId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={
                    "rounded-2xl border-2 bg-white shadow-[0_4px_0_0_#1A1A2E] overflow-hidden " +
                    (flag.status === "pending"
                      ? "border-red-400"
                      : flag.status === "blocked"
                      ? "border-flamingo-dark"
                      : "border-green-400")
                  }
                >
                  <button
                    onClick={() => setExpandedFlag(isExpanded ? null : flag.merchantId)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  >
                    {/* Status badge */}
                    <StatusBadge status={flag.status} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-flamingo-dark truncate">
                          {flag.merchantName}
                        </span>
                        <span className="text-xs text-flamingo-dark/40 font-mono">
                          {flag.merchantId}
                        </span>
                      </div>
                      <p className="text-xs text-flamingo-dark/60 mt-0.5">
                        Owner: {flag.ownerName} · Flagged: {new Date(flag.flaggedAt).toLocaleDateString("en-ZA")}
                        {flag.resolvedBy && ` · Resolved by ${flag.resolvedBy}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                        {flag.matches.length} match{flag.matches.length !== 1 ? "es" : ""}
                      </span>
                      <svg
                        className={`h-4 w-4 text-flamingo-dark/40 transition ${isExpanded ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t-2 border-flamingo-dark/10"
                      >
                        <div className="p-5 space-y-4">
                          {/* Matched entries */}
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-flamingo-dark/50 mb-2">
                              Sanctions Matches
                            </h3>
                            <div className="space-y-2">
                              {flag.matches.map((m, i) => (
                                <div
                                  key={i}
                                  className="rounded-xl border border-flamingo-dark/10 bg-flamingo-cream p-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-sm text-flamingo-dark">
                                      {m.name}
                                    </span>
                                    <span className={
                                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold " +
                                      (m.score >= 90
                                        ? "bg-red-100 text-red-700"
                                        : m.score >= 70
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-yellow-100 text-yellow-700")
                                    }>
                                      {m.score}% match
                                    </span>
                                  </div>
                                  <p className="text-xs text-flamingo-dark/60 mt-1">
                                    Type: {m.type} · Lists: {m.lists.join(", ")}
                                    {m.country ? ` · Country: ${m.country}` : ""}
                                    {m.programmes?.length ? ` · ${m.programmes.join(", ")}` : ""}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Resolution note */}
                          {flag.note && (
                            <div className="rounded-xl bg-flamingo-cream p-3">
                              <p className="text-xs font-bold text-flamingo-dark/50">Resolution note:</p>
                              <p className="text-sm text-flamingo-dark mt-1">{flag.note}</p>
                            </div>
                          )}

                          {/* Actions (only for pending flags) */}
                          {flag.status === "pending" && (
                            <div className="space-y-3 pt-2">
                              <textarea
                                value={resolveNote}
                                onChange={e => setResolveNote(e.target.value)}
                                placeholder="Add a note (optional)…"
                                rows={2}
                                className="w-full rounded-xl border-2 border-flamingo-dark/20 bg-flamingo-cream px-4 py-2 text-sm text-flamingo-dark placeholder:text-flamingo-dark/40 focus:border-flamingo-dark focus:outline-none"
                              />
                              <div className="flex gap-2">
                                <motion.button
                                  whileHover={{ y: -2 }}
                                  whileTap={{ y: 1 }}
                                  onClick={() => handleResolve(flag.merchantId, "cleared")}
                                  className="flex-1 rounded-xl border-2 border-green-600 bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700 shadow-[0_3px_0_0_#166534] transition active:translate-y-[2px] active:shadow-[0_1px_0_0_#166534]"
                                >
                                  Clear — False Positive
                                </motion.button>
                                <motion.button
                                  whileHover={{ y: -2 }}
                                  whileTap={{ y: 1 }}
                                  onClick={() => handleResolve(flag.merchantId, "blocked")}
                                  className="flex-1 rounded-xl border-2 border-red-600 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 shadow-[0_3px_0_0_#991B1B] transition active:translate-y-[2px] active:shadow-[0_1px_0_0_#991B1B]"
                                >
                                  Block Merchant
                                </motion.button>
                              </div>
                            </div>
                          )}

                          {/* Link to merchant */}
                          <Link
                            href={`/admin/merchants/${flag.merchantId}`}
                            className="inline-block text-xs font-bold text-flamingo-pink hover:underline"
                          >
                            View merchant profile →
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Info section */}
        <div className="mt-10 rounded-2xl border-2 border-dashed border-flamingo-dark/20 bg-white p-6">
          <h2 className="display text-base font-extrabold text-flamingo-dark">
            How screening works
          </h2>
          <div className="mt-3 space-y-2 text-sm text-flamingo-dark/70">
            <p>
              Every merchant signup is automatically screened against four international sanctions lists:
              the UN Security Council Consolidated List, US OFAC SDN list, EU Financial Sanctions, and
              South Africa&apos;s FIC Targeted Financial Sanctions list.
            </p>
            <p>
              Names are fuzzy-matched using normalisation, token overlap, and Levenshtein distance.
              Matches scoring above 65% are flagged for manual review. A compliance officer must then
              clear the flag (false positive) or block the merchant.
            </p>
            <p>
              Use &quot;Refresh Lists&quot; to download the latest data from OpenSanctions, and
              &quot;Batch Re-screen&quot; to re-check all active merchants against the updated lists.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={
      "rounded-2xl border-2 bg-white p-4 shadow-[0_3px_0_0_#1A1A2E] " +
      (alert ? "border-red-400" : "border-flamingo-dark")
    }>
      <p className="text-xs font-bold uppercase tracking-wider text-flamingo-dark/50">
        {label}
      </p>
      <p className={
        "display mt-1 text-2xl font-extrabold " +
        (alert ? "text-red-600" : "text-flamingo-dark")
      }>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: SanctionsFlag["status"] }) {
  const styles = {
    pending: "bg-red-100 text-red-700 border-red-300",
    cleared: "bg-green-100 text-green-700 border-green-300",
    blocked: "bg-flamingo-dark text-white border-flamingo-dark",
  };
  return (
    <span className={
      "shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider " +
      styles[status]
    }>
      {status}
    </span>
  );
}
