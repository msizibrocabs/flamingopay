"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminGate } from "../_components/AdminGate";
import { AdminNav } from "../_components/AdminNav";
import Link from "next/link";

type ComplaintEvent = {
  timestamp: string;
  action: string;
  actor: string;
  note?: string;
};

type Complaint = {
  id: string;
  merchantId: string;
  merchantName: string;
  complainantName: string;
  complainantEmail?: string;
  complainantPhone?: string;
  category: string;
  subject: string;
  description: string;
  relatedTxnId?: string;
  status: string;
  level: number;
  outcome: string;
  outcomeNote?: string;
  handler?: string;
  createdAt: string;
  acknowledgedAt?: string;
  assessedAt?: string;
  resolvedAt?: string;
  escalatedAt?: string;
  closedAt?: string;
  slaDeadline?: string;
  slaBreach: boolean;
  events: ComplaintEvent[];
};

type Stats = {
  total: number;
  open: number;
  breached: number;
  resolvedThisMonth: number;
  avgResolutionDays: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
};

const CATEGORY_LABELS: Record<string, string> = {
  payment_dispute: "Payment Dispute",
  fees_charges: "Fees & Charges",
  service_quality: "Service Quality",
  data_privacy: "Data & Privacy (POPIA)",
  sanctions_fica: "Sanctions / FICA",
  fraud_security: "Fraud & Security",
  staff_conduct: "Staff Conduct",
  other: "Other",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  received: { label: "Received", color: "bg-flamingo-butter text-flamingo-dark border-flamingo-dark/20" },
  acknowledged: { label: "Acknowledged", color: "bg-blue-100 text-blue-700 border-blue-300" },
  investigating: { label: "Investigating", color: "bg-orange-100 text-orange-700 border-orange-300" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700 border-green-300" },
  escalated: { label: "Escalated", color: "bg-red-100 text-red-700 border-red-300" },
  closed: { label: "Closed", color: "bg-flamingo-dark/10 text-flamingo-dark/60 border-flamingo-dark/20" },
};

const STATUS_FLOW = ["received", "acknowledged", "investigating", "resolved", "closed"];

export default function AdminComplaintsPage() {
  return (
    <AdminGate>
      <AdminNav />
      <Inner />
    </AdminGate>
  );
}

function Inner() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Action state
  const [actionNote, setActionNote] = useState("");
  const [actionOutcome, setActionOutcome] = useState("pending");

  const fetchData = useCallback(async () => {
    const [cRes, sRes] = await Promise.all([
      fetch("/api/complaints"),
      fetch("/api/complaints/stats"),
    ]);
    if (cRes.ok) {
      const d = await cRes.json();
      setComplaints(d.complaints ?? []);
    }
    if (sRes.ok) {
      setStats(await sRes.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAction(id: string, action: string) {
    const body: Record<string, string> = { note: actionNote };

    if (action === "acknowledge") body.status = "acknowledged";
    else if (action === "investigate") body.status = "investigating";
    else if (action === "resolve") {
      body.status = "resolved";
      body.outcome = actionOutcome;
      body.outcomeNote = actionNote;
    }
    else if (action === "escalate") body.status = "escalated";
    else if (action === "close") body.status = "closed";

    await fetch(`/api/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setActionNote("");
    setActionOutcome("pending");
    await fetchData();
  }

  async function handleAddNote(id: string) {
    if (!actionNote.trim()) return;
    await fetch(`/api/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: actionNote }),
    });
    setActionNote("");
    await fetchData();
  }

  // Filtering
  let filtered = complaints;
  if (filter !== "all") {
    filtered = filtered.filter(c => c.status === filter);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c =>
      c.id.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.merchantName.toLowerCase().includes(q) ||
      c.complainantName.toLowerCase().includes(q)
    );
  }

  // SLA countdown helper
  function slaRemaining(deadline: string): string {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return "OVERDUE";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  }

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
        <div>
          <h1 className="display text-2xl font-extrabold text-flamingo-dark">
            Complaints Management
          </h1>
          <p className="mt-1 text-sm text-flamingo-dark/60">
            FSCA · PASA · POPIA compliant — track, investigate, and resolve
          </p>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label="Total" value={stats?.total ?? 0} />
          <StatCard label="Open" value={stats?.open ?? 0} alert={(stats?.open ?? 0) > 0} />
          <StatCard label="SLA Breached" value={stats?.breached ?? 0} alert={(stats?.breached ?? 0) > 0} />
          <StatCard label="Resolved (month)" value={stats?.resolvedThisMonth ?? 0} />
          <StatCard label="Avg Days" value={stats?.avgResolutionDays ?? 0} suffix="d" />
        </div>

        {/* Search + Filters */}
        <div className="mt-6 flex flex-wrap gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search complaints…"
            className="flex-1 min-w-[200px] rounded-xl border-2 border-flamingo-dark/20 bg-white px-4 py-2 text-sm font-semibold text-flamingo-dark placeholder:text-flamingo-dark/40 focus:border-flamingo-dark focus:outline-none"
          />
          <div className="flex gap-1.5 overflow-x-auto">
            {["all", ...STATUS_FLOW, "escalated"].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={
                  "shrink-0 rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition " +
                  (filter === s
                    ? "border-flamingo-dark bg-flamingo-butter text-flamingo-dark shadow-[0_2px_0_0_#1A1A2E]"
                    : "border-flamingo-dark/20 bg-white text-flamingo-dark/60 hover:bg-flamingo-cream")
                }
              >
                {s === "all"
                  ? `All (${complaints.length})`
                  : `${STATUS_CONFIG[s]?.label ?? s} (${complaints.filter(c => c.status === s).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints list */}
        <div className="mt-4 space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-flamingo-dark/20 py-12 text-center">
              <p className="text-sm font-semibold text-flamingo-dark/50">
                No complaints match your criteria.
              </p>
            </div>
          )}

          <AnimatePresence>
            {filtered.map(c => {
              const isExpanded = expandedId === c.id;
              const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.received;
              const nextActions = getNextActions(c.status);

              return (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={
                    "rounded-2xl border-2 bg-white overflow-hidden shadow-[0_4px_0_0_#1A1A2E] " +
                    (c.slaBreach ? "border-red-400" : "border-flamingo-dark")
                  }
                >
                  {/* Header row */}
                  <button
                    onClick={() => {
                      setExpandedId(isExpanded ? null : c.id);
                      setActionNote("");
                      setActionOutcome("pending");
                    }}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left"
                  >
                    <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${cfg.color}`}>
                      {cfg.label}
                    </span>

                    {c.slaBreach && (
                      <span className="shrink-0 rounded-lg bg-red-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                        SLA BREACH
                      </span>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-flamingo-dark truncate">
                        {c.subject}
                      </p>
                      <p className="text-xs text-flamingo-dark/50 mt-0.5">
                        {c.merchantName} ({c.merchantId}) · {CATEGORY_LABELS[c.category] ?? c.category} · L{c.level}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {c.slaDeadline && !["resolved", "closed"].includes(c.status) && (
                        <span className={`text-xs font-bold tabular-nums ${c.slaBreach ? "text-red-600" : "text-flamingo-dark/50"}`}>
                          {slaRemaining(c.slaDeadline)}
                        </span>
                      )}
                      <span className="text-[10px] text-flamingo-dark/40 font-mono">
                        {c.id}
                      </span>
                      <svg
                        className={`h-4 w-4 text-flamingo-dark/40 transition ${isExpanded ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t-2 border-flamingo-dark/10"
                      >
                        <div className="p-5 space-y-4">
                          {/* Info grid */}
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <InfoCell label="Complainant" value={c.complainantName} />
                            <InfoCell label="Category" value={CATEGORY_LABELS[c.category] ?? c.category} />
                            <InfoCell label="Filed" value={new Date(c.createdAt).toLocaleDateString("en-ZA")} />
                            <InfoCell label="Handler" value={c.handler || "Unassigned"} />
                          </div>

                          {/* Description */}
                          <div className="rounded-xl bg-flamingo-cream p-4">
                            <p className="text-xs font-bold text-flamingo-dark/50 mb-1">Description</p>
                            <p className="text-sm text-flamingo-dark whitespace-pre-wrap">{c.description}</p>
                          </div>

                          {/* Outcome */}
                          {c.outcome !== "pending" && (
                            <div className={`rounded-xl p-4 ${c.outcome === "upheld" ? "bg-green-50 border border-green-200" : c.outcome === "partially_upheld" ? "bg-yellow-50 border border-yellow-200" : "bg-red-50 border border-red-200"}`}>
                              <p className="text-xs font-bold text-flamingo-dark/50">Outcome</p>
                              <p className="text-sm font-bold text-flamingo-dark capitalize mt-0.5">
                                {c.outcome.replace("_", " ")}
                              </p>
                              {c.outcomeNote && (
                                <p className="text-xs text-flamingo-dark/70 mt-1">{c.outcomeNote}</p>
                              )}
                            </div>
                          )}

                          {/* Event timeline */}
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-flamingo-dark/50 mb-2">
                              Timeline
                            </p>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {c.events.map((ev, i) => (
                                <div key={i} className="flex gap-3 text-xs">
                                  <span className="shrink-0 text-flamingo-dark/40 tabular-nums w-16">
                                    {new Date(ev.timestamp).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" })}
                                  </span>
                                  <span className="shrink-0 font-semibold text-flamingo-dark w-24 truncate">
                                    {ev.actor}
                                  </span>
                                  <span className="text-flamingo-dark/70">
                                    {ev.action}{ev.note ? ` — ${ev.note}` : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          {!["resolved", "closed"].includes(c.status) && (
                            <div className="space-y-3 pt-2 border-t-2 border-flamingo-dark/10">
                              <p className="text-xs font-bold uppercase tracking-wider text-flamingo-dark/50">
                                Actions
                              </p>

                              {c.status === "investigating" && (
                                <div>
                                  <label className="text-xs font-bold text-flamingo-dark/60 block mb-1">Outcome</label>
                                  <select
                                    value={actionOutcome}
                                    onChange={e => setActionOutcome(e.target.value)}
                                    className="w-full rounded-xl border-2 border-flamingo-dark/20 bg-flamingo-cream px-3 py-2 text-sm font-semibold text-flamingo-dark focus:border-flamingo-dark focus:outline-none"
                                  >
                                    <option value="upheld">Upheld</option>
                                    <option value="partially_upheld">Partially Upheld</option>
                                    <option value="not_upheld">Not Upheld</option>
                                  </select>
                                </div>
                              )}

                              <textarea
                                value={actionNote}
                                onChange={e => setActionNote(e.target.value)}
                                placeholder="Add a note…"
                                rows={2}
                                className="w-full rounded-xl border-2 border-flamingo-dark/20 bg-flamingo-cream px-4 py-2 text-sm text-flamingo-dark placeholder:text-flamingo-dark/40 focus:border-flamingo-dark focus:outline-none"
                              />

                              <div className="flex flex-wrap gap-2">
                                {nextActions.map(action => (
                                  <motion.button
                                    key={action.key}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ y: 1 }}
                                    onClick={() => handleAction(c.id, action.key)}
                                    className={`rounded-xl border-2 px-4 py-2 text-sm font-bold shadow-[0_3px_0_0_#1A1A2E] transition active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E] ${action.style}`}
                                  >
                                    {action.label}
                                  </motion.button>
                                ))}

                                <motion.button
                                  whileHover={{ y: -2 }}
                                  whileTap={{ y: 1 }}
                                  onClick={() => handleAddNote(c.id)}
                                  disabled={!actionNote.trim()}
                                  className="rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2 text-sm font-bold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] transition disabled:opacity-40 active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E]"
                                >
                                  Add Note
                                </motion.button>
                              </div>
                            </div>
                          )}

                          {/* Link */}
                          <Link
                            href={`/admin/merchants/${c.merchantId}`}
                            className="inline-block text-xs font-bold text-flamingo-pink hover:underline"
                          >
                            View merchant →
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
      </div>
    </main>
  );
}

function getNextActions(status: string) {
  const actions: { key: string; label: string; style: string }[] = [];
  switch (status) {
    case "received":
      actions.push({ key: "acknowledge", label: "Acknowledge", style: "border-blue-600 bg-blue-50 text-blue-700" });
      break;
    case "acknowledged":
      actions.push({ key: "investigate", label: "Start Investigation", style: "border-orange-600 bg-orange-50 text-orange-700" });
      break;
    case "investigating":
      actions.push({ key: "resolve", label: "Resolve", style: "border-green-600 bg-green-50 text-green-700" });
      break;
    case "escalated":
      actions.push({ key: "investigate", label: "Re-investigate", style: "border-orange-600 bg-orange-50 text-orange-700" });
      actions.push({ key: "resolve", label: "Resolve", style: "border-green-600 bg-green-50 text-green-700" });
      break;
  }
  if (!["resolved", "closed"].includes(status)) {
    actions.push({ key: "escalate", label: "Escalate", style: "border-red-600 bg-red-50 text-red-700" });
  }
  if (status === "resolved") {
    actions.push({ key: "close", label: "Close", style: "border-flamingo-dark bg-flamingo-dark/10 text-flamingo-dark" });
  }
  return actions;
}

function StatCard({ label, value, alert, suffix }: { label: string; value: number; alert?: boolean; suffix?: string }) {
  return (
    <div className={
      "rounded-2xl border-2 bg-white p-4 shadow-[0_3px_0_0_#1A1A2E] " +
      (alert ? "border-red-400" : "border-flamingo-dark")
    }>
      <p className="text-[10px] font-bold uppercase tracking-wider text-flamingo-dark/50">
        {label}
      </p>
      <p className={
        "display mt-1 text-2xl font-extrabold " +
        (alert ? "text-red-600" : "text-flamingo-dark")
      }>
        {value}{suffix || ""}
      </p>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-flamingo-dark/50">{label}</p>
      <p className="text-sm font-semibold text-flamingo-dark mt-0.5">{value}</p>
    </div>
  );
}
