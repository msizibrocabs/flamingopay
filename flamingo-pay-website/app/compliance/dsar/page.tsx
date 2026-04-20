"use client";

import { useEffect, useState } from "react";
import { ComplianceGate } from "../_components/ComplianceGate";
import { ComplianceNav } from "../_components/ComplianceNav";
import { Reveal, RevealGroup, RevealItem } from "../../../components/motion/Reveal";
import { AnimatedCounter } from "../../../components/motion/AnimatedCounter";
import { timeAgo } from "../../../lib/merchant";

type DsarRequest = {
  id: string;
  ref: string;
  requestType?: string;
  requesterType: string;
  fullName: string;
  email: string;
  phone: string;
  idNumber?: string;
  merchantId?: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deadline: string;
  verifiedBy?: string;
  processedBy?: string;
  rejectionReason?: string;
  dataExport?: unknown;
  deletionReport?: unknown;
  notes: Array<{ id: string; author: string; text: string; createdAt: string }>;
};

type Stats = { total: number; pending: number; processing: number; ready: number; overdue: number };

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "verified", label: "Verified" },
  { value: "processing", label: "Processing" },
  { value: "ready", label: "Ready" },
  { value: "downloaded", label: "Downloaded" },
  { value: "rejected", label: "Rejected" },
  { value: "closed", label: "Closed" },
];

const STATUS_PILLS: Record<string, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-blue-100 text-blue-700 border-blue-300" },
  verified: { label: "Verified", cls: "bg-amber-100 text-amber-700 border-amber-300" },
  processing: { label: "Processing", cls: "bg-amber-100 text-amber-700 border-amber-300" },
  ready: { label: "Ready", cls: "bg-green-100 text-green-700 border-green-300" },
  downloaded: { label: "Downloaded", cls: "bg-green-100 text-green-700 border-green-300" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-700 border-red-300" },
  closed: { label: "Closed", cls: "bg-gray-100 text-gray-600 border-gray-300" },
};

export default function ComplianceDsarPage() {
  return (
    <ComplianceGate>
      <ComplianceNav />
      <DsarList />
    </ComplianceGate>
  );
}

function DsarList() {
  const [dsars, setDsars] = useState<DsarRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [noteText, setNoteText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  function load() {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    fetch(`/api/compliance/dsar${qs}`)
      .then((r) => r.json())
      .then((d) => {
        setDsars(d.dsars ?? []);
        setStats(d.stats ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filter]);

  async function handleAction(dsarId: string, action: string, extra?: Record<string, string>) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/compliance/dsar/${dsarId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, officer: "Compliance Officer", ...extra }),
      });
      if (res.ok) {
        setActiveAction(null);
        setRejectReason("");
        setNoteText("");
        load();
      }
    } catch {} finally {
      setActionLoading(false);
    }
  }

  const isOverdue = (d: DsarRequest) =>
    new Date(d.deadline) < new Date() && !["ready", "downloaded", "closed", "rejected"].includes(d.status);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <Reveal>
        <div className="mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600">
            Compliance · POPIA Section 23
          </span>
          <h1
            className="display mt-2 font-black text-flamingo-dark leading-[0.9]"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", letterSpacing: "-0.035em" }}
          >
            Data requests.
          </h1>
        </div>
      </Reveal>

      {/* Stats */}
      {stats && (
        <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <RevealItem><MiniStat label="Total" value={stats.total} tone="gray" /></RevealItem>
          <RevealItem><MiniStat label="Pending" value={stats.pending} tone="blue" highlight={stats.pending > 0} /></RevealItem>
          <RevealItem><MiniStat label="Processing" value={stats.processing} tone="amber" /></RevealItem>
          <RevealItem><MiniStat label="Ready" value={stats.ready} tone="green" /></RevealItem>
          <RevealItem><MiniStat label="Overdue" value={stats.overdue} tone="red" highlight={stats.overdue > 0} /></RevealItem>
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
      ) : dsars.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-flamingo-dark/40 bg-white/70 p-6 text-center">
          <p className="display text-lg font-extrabold text-flamingo-dark">No requests</p>
          <p className="mt-1 text-sm text-flamingo-dark/60">
            {filter ? "No requests with this status." : "No data access requests have been submitted."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {dsars.map((d) => (
            <div
              key={d.id}
              className={`rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_4px_0_0_#1A1A2E] ${
                isOverdue(d) ? "ring-4 ring-red-200" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-flamingo-dark/50">{d.ref}</span>
                    <StatusPill status={d.status} />
                    {isOverdue(d) && (
                      <span className="rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-extrabold text-red-700">
                        OVERDUE
                      </span>
                    )}
                    <span className="rounded-full border border-flamingo-dark/10 bg-flamingo-cream px-2 py-0.5 text-[10px] font-bold text-flamingo-dark/50">
                      {d.requesterType === "buyer" ? "Buyer" : "Merchant"}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                      (d.requestType ?? "access") === "deletion"
                        ? "border-red-300 bg-red-100 text-red-700"
                        : "border-blue-300 bg-blue-100 text-blue-700"
                    }`}>
                      {(d.requestType ?? "access") === "deletion" ? "Deletion" : "Access"}
                    </span>
                  </div>
                  <p className="mt-1 text-base font-extrabold text-flamingo-dark">{d.fullName}</p>
                  <p className="text-xs text-flamingo-dark/60">
                    {d.email} · {d.phone} · Filed {timeAgo(d.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-flamingo-dark/70">{d.description}</p>
                  {d.merchantId && (
                    <p className="mt-1 text-xs text-flamingo-dark/40 font-mono">Merchant: {d.merchantId}</p>
                  )}
                  {d.idNumber && (
                    <p className="mt-1 text-xs text-flamingo-dark/40">ID last 4: {d.idNumber}</p>
                  )}
                  <p className="mt-1 text-xs text-flamingo-dark/40">
                    Deadline: {new Date(d.deadline).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {d.notes.length > 0 && (
                <div className="mt-3 space-y-1">
                  {d.notes.map((n) => (
                    <div key={n.id} className="rounded-lg border border-flamingo-dark/10 bg-flamingo-cream p-2">
                      <p className="text-xs text-flamingo-dark/70">{n.text}</p>
                      <p className="text-[10px] text-flamingo-dark/40">{n.author} · {timeAgo(n.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Rejection reason */}
              {d.status === "rejected" && d.rejectionReason && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-bold text-red-700">Rejected: {d.rejectionReason}</p>
                </div>
              )}

              {/* Actions */}
              {!["closed", "rejected", "downloaded"].includes(d.status) && (
                <div className="mt-3">
                  {activeAction === d.id ? (
                    <div className="space-y-2 rounded-xl border-2 border-flamingo-dark/20 bg-flamingo-cream p-3">
                      <div className="flex flex-wrap gap-2">
                        {d.status === "new" && (
                          <button
                            onClick={() => handleAction(d.id, "verify")}
                            disabled={actionLoading}
                            className="rounded-lg border-2 border-flamingo-dark bg-green-500 px-3 py-1.5 text-xs font-bold text-white shadow-[0_2px_0_0_#1A1A2E] disabled:opacity-50"
                          >
                            Verify identity
                          </button>
                        )}
                        {["new", "verified"].includes(d.status) && (
                          <button
                            onClick={() => handleAction(d.id, "process")}
                            disabled={actionLoading}
                            className={`rounded-lg border-2 border-flamingo-dark px-3 py-1.5 text-xs font-bold text-white shadow-[0_2px_0_0_#1A1A2E] disabled:opacity-50 ${
                              (d.requestType ?? "access") === "deletion" ? "bg-red-500" : "bg-blue-500"
                            }`}
                          >
                            {actionLoading
                              ? "Processing..."
                              : (d.requestType ?? "access") === "deletion"
                                ? "Execute deletion"
                                : "Generate data export"}
                          </button>
                        )}
                        {d.status === "ready" && (
                          <button
                            onClick={() => handleAction(d.id, "close")}
                            disabled={actionLoading}
                            className="rounded-lg border-2 border-flamingo-dark bg-gray-500 px-3 py-1.5 text-xs font-bold text-white shadow-[0_2px_0_0_#1A1A2E] disabled:opacity-50"
                          >
                            Close request
                          </button>
                        )}
                      </div>

                      {/* Reject */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Rejection reason..."
                          className="flex-1 rounded-lg border-2 border-flamingo-dark bg-white px-3 py-1.5 text-xs outline-none"
                        />
                        <button
                          onClick={() => handleAction(d.id, "reject", { reason: rejectReason })}
                          disabled={actionLoading || !rejectReason}
                          className="rounded-lg border-2 border-red-400 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>

                      {/* Add note */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add a note..."
                          className="flex-1 rounded-lg border-2 border-flamingo-dark bg-white px-3 py-1.5 text-xs outline-none"
                        />
                        <button
                          onClick={() => handleAction(d.id, "note", { noteText })}
                          disabled={actionLoading || !noteText}
                          className="rounded-lg border-2 border-flamingo-dark bg-white px-3 py-1.5 text-xs font-bold text-flamingo-dark disabled:opacity-50"
                        >
                          Add note
                        </button>
                      </div>

                      <button
                        onClick={() => { setActiveAction(null); setRejectReason(""); setNoteText(""); }}
                        className="text-xs font-bold text-flamingo-dark/50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveAction(d.id)}
                      className="rounded-lg border-2 border-flamingo-dark bg-white px-3 py-1.5 text-xs font-bold text-flamingo-dark shadow-[0_2px_0_0_#1A1A2E] hover:bg-flamingo-cream"
                    >
                      Take action
                    </button>
                  )}
                </div>
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
  label, value, tone, highlight,
}: {
  label: string; value: number; tone: "gray" | "blue" | "amber" | "green" | "red"; highlight?: boolean;
}) {
  const bg = { gray: "bg-gray-50", blue: "bg-blue-50", amber: "bg-amber-50", green: "bg-green-50", red: "bg-red-50" }[tone];
  return (
    <div className={`rounded-2xl border-2 border-flamingo-dark p-3 shadow-[0_4px_0_0_#1A1A2E] ${bg} ${highlight ? "ring-4 ring-red-200" : ""}`}>
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-flamingo-dark/70">{label}</p>
      <p className="display mt-1 font-black text-flamingo-dark tabular-nums leading-none"
        style={{ fontSize: "clamp(1.25rem, 2.5vw, 2rem)", letterSpacing: "-0.03em" }}>
        <AnimatedCounter to={value} duration={1} locale="en-ZA" />
      </p>
    </div>
  );
}
