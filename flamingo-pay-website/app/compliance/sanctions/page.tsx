"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ComplianceGate } from "../_components/ComplianceGate";
import { ComplianceNav } from "../_components/ComplianceNav";
import Link from "next/link";

type MatchEntry = {
  id: string;
  name: string;
  type: string;
  lists: string[];
  score: number;
  country?: string;
  programmes?: string[];
  source?: "sanctions" | "pep";
  pepPosition?: string;
  pepTier?: "senior" | "family" | "associate";
};

type FlagType = "sanctions" | "pep" | "both";

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
  flagType?: FlagType;
};

type SanctionsMeta = {
  lastRefresh: string;
  totalEntries: number;
  sources: string[];
  refreshDurationMs: number;
};

type PepMeta = {
  lastRefresh: string;
  totalEntries: number;
  sources: string[];
  refreshDurationMs: number;
  saCuratedCount: number;
  openSanctionsCount: number;
};

type ScreenResult = {
  matched: boolean;
  score: number;
  matchType: string;
  matchedName: string;
  entries: MatchEntry[];
  sanctionsMatched?: boolean;
  pepMatched?: boolean;
};

export default function SanctionsPage() {
  return (
    <ComplianceGate>
      <ComplianceNav />
      <Inner />
    </ComplianceGate>
  );
}

function Inner() {
  const [flags, setFlags] = useState<SanctionsFlag[]>([]);
  const [meta, setMeta] = useState<SanctionsMeta | null>(null);
  const [pepMeta, setPepMeta] = useState<PepMeta | null>(null);
  const [pepProvider, setPepProvider] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [batching, setBatching] = useState(false);
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "cleared" | "blocked" | "pep" | "sanctions">("all");

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
        setPepMeta(data.pepMeta ?? null);
        setPepProvider(data.pepProvider ?? "");
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
        setPepMeta(data.pepMeta ?? null);
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
    : filter === "pep"
    ? flags.filter(f => f.flagType === "pep" || f.flagType === "both")
    : filter === "sanctions"
    ? flags.filter(f => !f.flagType || f.flagType === "sanctions" || f.flagType === "both")
    : flags.filter(f => f.status === filter);

  const pendingCount = flags.filter(f => f.status === "pending").length;
  const blockedCount = flags.filter(f => f.status === "blocked").length;
  const pepFlagCount = flags.filter(f => f.flagType === "pep" || f.flagType === "both").length;

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600">
            Compliance · FICA Screening
          </span>
          <h1
            className="display mt-2 font-black text-flamingo-dark leading-[0.9]"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", letterSpacing: "-0.035em" }}
          >
            Sanctions & PEP.
          </h1>
          <p className="mt-2 text-sm text-flamingo-dark/60">
            UN · OFAC · EU · SA FIC · PEP — FICA compliance screening
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2 text-sm font-bold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] transition hover:bg-flamingo-cream active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E] disabled:opacity-50"
          >
            {refreshing ? "Updating lists..." : "Refresh Lists"}
          </button>
          <button
            onClick={handleBatch}
            disabled={batching}
            className="rounded-xl border-2 border-flamingo-dark bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_0_#1A1A2E] transition hover:bg-red-500 active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E] disabled:opacity-50"
          >
            {batching ? "Screening all..." : "Batch Re-screen"}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Sanctions Entries" value={meta?.totalEntries?.toLocaleString() ?? "—"} />
        <StatCard label="PEP Entries" value={pepMeta?.totalEntries?.toLocaleString() ?? "—"} />
        <StatCard label="Pending Flags" value={String(pendingCount)} alert={pendingCount > 0} />
        <StatCard label="PEP Flags" value={String(pepFlagCount)} alert={pepFlagCount > 0} />
        <StatCard label="Blocked" value={String(blockedCount)} />
      </div>

      {/* Last refresh info */}
      {(meta || pepMeta) && (
        <div className="mt-3 space-y-1">
          {meta && (
            <p className="text-xs text-flamingo-dark/50">
              Sanctions: {meta.totalEntries.toLocaleString()} entries · {meta.sources.join(", ")} · refreshed {new Date(meta.lastRefresh).toLocaleString("en-ZA")}
            </p>
          )}
          {pepMeta && (
            <p className="text-xs text-flamingo-dark/50">
              PEP: {pepMeta.totalEntries.toLocaleString()} entries ({pepMeta.saCuratedCount} SA curated + {pepMeta.openSanctionsCount.toLocaleString()} OpenSanctions) · refreshed {new Date(pepMeta.lastRefresh).toLocaleString("en-ZA")}
            </p>
          )}
          {pepProvider && (
            <p className="text-xs text-flamingo-dark/40">
              PEP provider: {pepProvider}
            </p>
          )}
        </div>
      )}
      {!meta && !pepMeta && (
        <p className="mt-3 text-xs text-red-600 font-bold">
          No lists loaded yet — click &quot;Refresh Lists&quot; to download sanctions + PEP data from OpenSanctions.
        </p>
      )}

      {/* Manual screen tool */}
      <div className="mt-6 rounded-2xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_4px_0_0_#1A1A2E]">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-flamingo-dark/50 mb-3">
          Manual Name Check
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={screenName}
            onChange={e => setScreenName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleScreen()}
            placeholder="Enter a name to screen..."
            className="flex-1 rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-4 py-2 text-sm font-semibold text-flamingo-dark placeholder:text-flamingo-dark/40 focus:outline-none focus:ring-2 focus:ring-red-300/50"
          />
          <button
            onClick={handleScreen}
            disabled={screening || !screenName.trim()}
            className="rounded-xl border-2 border-flamingo-dark bg-amber-400 px-5 py-2 text-sm font-bold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] transition hover:bg-amber-300 active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E] disabled:opacity-50"
          >
            {screening ? "Checking..." : "Screen"}
          </button>
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
                          {e.source === "pep" ? "PEP" : e.type} · {e.lists.join(", ")}
                          {e.country ? ` · ${e.country}` : ""}
                          {e.pepPosition ? ` · ${e.pepPosition}` : ""}
                        </p>
                        {e.source === "pep" && (
                          <span className="mt-1 inline-block rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
                            PEP{e.pepTier ? ` — ${e.pepTier}` : ""}
                          </span>
                        )}
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
      <div className="mt-8 flex flex-wrap gap-2">
        {(["all", "pending", "cleared", "blocked", "pep", "sanctions"] as const).map(f => {
          const count = f === "all" ? flags.length
            : f === "pep" ? pepFlagCount
            : f === "sanctions" ? flags.filter(fl => !fl.flagType || fl.flagType === "sanctions" || fl.flagType === "both").length
            : flags.filter(fl => fl.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition " +
                (filter === f
                  ? f === "pep" ? "border-purple-600 bg-purple-100 text-purple-700 shadow-[0_2px_0_0_#7C3AED]"
                  : "border-flamingo-dark bg-red-50 text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E]"
                  : "border-transparent text-flamingo-dark/60 hover:border-flamingo-dark/20")
              }
            >
              {f === "all" ? `All (${count})`
                : f === "pep" ? `PEP (${count})`
                : f === "sanctions" ? `Sanctions (${count})`
                : `${f.charAt(0).toUpperCase() + f.slice(1)} (${count})`}
            </button>
          );
        })}
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
                  className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-flamingo-cream/50 transition"
                >
                  <StatusBadge status={flag.status} />
                  <FlagTypeBadge flagType={flag.flagType} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-flamingo-dark truncate">{flag.merchantName}</span>
                      <span className="text-xs text-flamingo-dark/40 font-mono">{flag.merchantId}</span>
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
                    <span className="text-flamingo-dark/30 text-lg">{isExpanded ? "▲" : "▼"}</span>
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
                            Screening Matches
                          </h3>
                          <div className="space-y-2">
                            {flag.matches.map((m, i) => (
                              <div key={i} className="rounded-xl border border-flamingo-dark/10 bg-flamingo-cream p-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-sm text-flamingo-dark">{m.name}</span>
                                  <span className={
                                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold " +
                                    (m.score >= 90 ? "bg-red-100 text-red-700"
                                      : m.score >= 70 ? "bg-orange-100 text-orange-700"
                                      : "bg-yellow-100 text-yellow-700")
                                  }>
                                    {m.score}% match
                                  </span>
                                </div>
                                <p className="text-xs text-flamingo-dark/60 mt-1">
                                  {m.source === "pep" ? "PEP" : `Type: ${m.type}`} · Lists: {m.lists.join(", ")}
                                  {m.country ? ` · Country: ${m.country}` : ""}
                                  {m.pepPosition ? ` · ${m.pepPosition}` : ""}
                                  {m.programmes?.length ? ` · ${m.programmes.join(", ")}` : ""}
                                </p>
                                {m.source === "pep" && m.pepTier && (
                                  <span className="mt-1 inline-block rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
                                    PEP — {m.pepTier}
                                  </span>
                                )}
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
                              placeholder="Add a note (optional)..."
                              rows={2}
                              className="w-full rounded-xl border-2 border-flamingo-dark/20 bg-flamingo-cream px-4 py-2 text-sm text-flamingo-dark placeholder:text-flamingo-dark/40 focus:border-flamingo-dark focus:outline-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleResolve(flag.merchantId, "cleared")}
                                className="flex-1 rounded-xl border-2 border-green-600 bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700 shadow-[0_3px_0_0_#166534] transition hover:bg-green-100 active:translate-y-[2px] active:shadow-[0_1px_0_0_#166534]"
                              >
                                Clear — False Positive
                              </button>
                              <button
                                onClick={() => handleResolve(flag.merchantId, "blocked")}
                                className="flex-1 rounded-xl border-2 border-red-600 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 shadow-[0_3px_0_0_#991B1B] transition hover:bg-red-100 active:translate-y-[2px] active:shadow-[0_1px_0_0_#991B1B]"
                              >
                                Block Merchant
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Link to merchant */}
                        <Link
                          href={`/admin/merchants/${flag.merchantId}`}
                          className="inline-block text-xs font-bold text-red-600 hover:underline"
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
      <div className="mt-10 rounded-2xl border-2 border-flamingo-dark bg-flamingo-cream p-6 shadow-[0_4px_0_0_#1A1A2E]">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-flamingo-dark/50">
          How screening works
        </h2>
        <div className="mt-3 space-y-2 text-sm text-flamingo-dark/70">
          <p>
            Every merchant signup is automatically screened against international sanctions lists
            (UN Security Council, US OFAC SDN, EU Financial Sanctions, SA FIC Targeted Financial Sanctions)
            and Politically Exposed Persons (PEP) databases including a curated South African PEP list
            and OpenSanctions global PEP data.
          </p>
          <p>
            Names are fuzzy-matched using normalisation, token overlap, and Levenshtein distance.
            Matches scoring above 65% are flagged for manual review. Flags are categorised as
            &quot;sanctions&quot;, &quot;pep&quot;, or &quot;both&quot; depending on the match source.
            A compliance officer must then clear the flag (false positive) or block the merchant.
          </p>
          <p>
            PEP screening is required under FICA section 21A. The SA curated list covers Cabinet ministers,
            Premiers, SOE boards, judiciary, SARB governors, former PEPs, and PEP family members.
            The plug-in architecture supports future integration with Refinitiv World-Check or similar providers.
          </p>
          <p>
            Use &quot;Refresh Lists&quot; to download the latest sanctions + PEP data from OpenSanctions, and
            &quot;Batch Re-screen&quot; to re-check all active merchants against the updated lists.
          </p>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={
      "rounded-2xl border-2 bg-white p-4 " +
      (alert ? "border-red-400" : "border-flamingo-dark/10")
    }>
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-flamingo-dark/50">{label}</p>
      <p className={
        "display mt-1 text-2xl font-black " +
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

function FlagTypeBadge({ flagType }: { flagType?: FlagType }) {
  if (!flagType) return null;
  const styles: Record<string, string> = {
    sanctions: "bg-orange-100 text-orange-700 border-orange-300",
    pep: "bg-purple-100 text-purple-700 border-purple-300",
    both: "bg-red-100 text-red-800 border-red-400",
  };
  const labels: Record<string, string> = {
    sanctions: "Sanctions",
    pep: "PEP",
    both: "Sanctions + PEP",
  };
  return (
    <span className={
      "shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider " +
      (styles[flagType] ?? "")
    }>
      {labels[flagType] ?? flagType}
    </span>
  );
}
