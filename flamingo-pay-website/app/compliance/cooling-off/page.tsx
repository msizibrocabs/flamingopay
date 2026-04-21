"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ComplianceGate } from "../_components/ComplianceGate";
import { ComplianceNav } from "../_components/ComplianceNav";
import { Reveal, RevealGroup, RevealItem } from "../../../components/motion/Reveal";
import { AnimatedCounter } from "../../../components/motion/AnimatedCounter";
import { formatZAR, timeAgo } from "../../../lib/merchant";

type CoolingOffRequest = {
  id: string;
  transactionId: string;
  transactionRef: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  buyerEmail?: string;
  buyerPhone?: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
};

type Stats = {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  totalRefundValue: number;
};

type Filter = "all" | "pending" | "approved" | "rejected";

export default function CoolingOffPage() {
  return (
    <ComplianceGate>
      <ComplianceNav />
      <Inner />
    </ComplianceGate>
  );
}

function Inner() {
  const [requests, setRequests] = useState<CoolingOffRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(true);
  const [actionReq, setActionReq] = useState<CoolingOffRequest | null>(null);
  const [actionType, setActionType] = useState<"approved" | "rejected">("approved");
  const [actionNote, setActionNote] = useState("");
  const [acting, setActing] = useState(false);

  const load = () => {
    const url = filter === "all"
      ? "/api/compliance/cooling-off"
      : `/api/compliance/cooling-off?status=${filter}`;
    setLoading(true);
    fetch(url)
      .then(r => r.json())
      .then(data => {
        setRequests(data.requests ?? []);
        setStats(data.stats ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  async function handleResolve() {
    if (!actionReq) return;
    setActing(true);
    try {
      const res = await fetch("/api/compliance/cooling-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: actionReq.id,
          decision: actionType,
          note: actionNote || undefined,
        }),
      });
      if (res.ok) {
        setActionReq(null);
        setActionNote("");
        load();
      }
    } catch {
      // ignore
    } finally {
      setActing(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <Reveal>
        <div className="mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600">
            Compliance · ECT Act s44
          </span>
          <h1
            className="display mt-2 font-black text-flamingo-dark leading-[0.9]"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.035em" }}
          >
            Cooling-Off Requests.
          </h1>
          <p className="mt-2 text-sm text-flamingo-dark/60">
            Buyer cancellation requests under the 7-day cooling-off period (ECT Act Section 44 / CPA Section 16).
          </p>
        </div>
      </Reveal>

      {/* Stats */}
      {stats && (
        <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <RevealItem>
            <StatCard label="Pending" value={stats.pending} tone="red" highlight={stats.pending > 0} />
          </RevealItem>
          <RevealItem>
            <StatCard label="Approved" value={stats.approved} tone="green" />
          </RevealItem>
          <RevealItem>
            <StatCard label="Rejected" value={stats.rejected} tone="purple" />
          </RevealItem>
          <RevealItem>
            <StatCard label="Total refunds" value={stats.totalRefundValue} tone="amber" money />
          </RevealItem>
        </RevealGroup>
      )}

      {/* Filter tabs */}
      <div className="mt-6 flex gap-2">
        {(["pending", "approved", "rejected", "all"] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border-2 border-flamingo-dark px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide transition-colors ${
              filter === f
                ? "bg-red-600 text-white"
                : "bg-white text-flamingo-dark hover:bg-flamingo-cream"
            }`}
          >
            {f === "all" ? "All" : f}
            {f === "pending" && stats && stats.pending > 0 && (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                {stats.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Request list */}
      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border-2 border-flamingo-dark/20 bg-white/60" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-flamingo-dark/40 bg-white/70 p-8 text-center">
            <p className="text-lg font-extrabold text-flamingo-dark">No requests</p>
            <p className="mt-1 text-sm text-flamingo-dark/60">
              {filter === "pending"
                ? "No cooling-off cancellation requests pending review."
                : `No ${filter} requests found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_4px_0_0_#1A1A2E]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-flamingo-dark">
                        {req.transactionRef}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="mt-1 text-sm text-flamingo-dark/70">
                      <strong>{formatZAR(req.amount)}</strong> from{" "}
                      <strong>{req.merchantName}</strong> ({req.merchantId})
                    </p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-flamingo-dark/50">
                      <span>Requested {timeAgo(req.requestedAt)}</span>
                      {req.buyerEmail && <span>Email: {req.buyerEmail}</span>}
                      {req.buyerPhone && <span>Phone: {req.buyerPhone}</span>}
                    </div>
                    {req.resolvedAt && (
                      <p className="mt-1 text-xs text-flamingo-dark/50">
                        Resolved by {req.resolvedBy} · {timeAgo(req.resolvedAt)}
                        {req.resolutionNote && ` — "${req.resolutionNote}"`}
                      </p>
                    )}
                  </div>

                  {req.status === "pending" && (
                    <div className="flex flex-none gap-2">
                      <button
                        onClick={() => {
                          setActionReq(req);
                          setActionType("approved");
                          setActionNote("");
                        }}
                        className="rounded-xl border-2 border-green-600 bg-green-50 px-3 py-1.5 text-xs font-extrabold text-green-700 hover:bg-green-100"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setActionReq(req);
                          setActionType("rejected");
                          setActionNote("");
                        }}
                        className="rounded-xl border-2 border-red-600 bg-red-50 px-3 py-1.5 text-xs font-extrabold text-red-700 hover:bg-red-100"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Action modal */}
      <AnimatePresence>
        {actionReq && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-flamingo-dark/40 backdrop-blur-sm"
            onClick={() => setActionReq(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="mx-4 w-full max-w-md rounded-2xl border-2 border-flamingo-dark bg-white p-6 shadow-[0_8px_0_0_#1A1A2E]"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-extrabold text-flamingo-dark">
                {actionType === "approved" ? "Approve Cancellation" : "Reject Cancellation"}
              </h3>
              <p className="mt-1 text-sm text-flamingo-dark/70">
                {actionType === "approved"
                  ? `Approving will process a full refund of ${formatZAR(actionReq.amount)} for transaction ${actionReq.transactionRef}.`
                  : `Rejecting will deny the cooling-off request for ${actionReq.transactionRef}. The buyer will not receive a refund.`}
              </p>

              <div className="mt-4">
                <label className="block text-xs font-bold text-flamingo-dark/60">
                  Note {actionType === "rejected" ? "(required)" : "(optional)"}
                </label>
                <textarea
                  value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                  placeholder={
                    actionType === "approved"
                      ? "Cooling-off request verified, processing refund…"
                      : "Reason for rejection…"
                  }
                  rows={3}
                  className="mt-1 w-full rounded-xl border-2 border-flamingo-dark/30 bg-flamingo-cream px-3 py-2.5 text-sm text-flamingo-dark placeholder:text-flamingo-dark/30 focus:border-flamingo-pink focus:outline-none resize-none"
                />
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setActionReq(null)}
                  className="flex-1 rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2.5 text-sm font-extrabold text-flamingo-dark hover:bg-flamingo-cream"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolve}
                  disabled={acting || (actionType === "rejected" && !actionNote.trim())}
                  className={`flex-1 rounded-xl border-2 border-flamingo-dark px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50 ${
                    actionType === "approved"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {acting
                    ? "Processing…"
                    : actionType === "approved"
                      ? "Approve & Refund"
                      : "Reject Request"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function StatusBadge({ status }: { status: CoolingOffRequest["status"] }) {
  const styles = {
    pending: "bg-amber-100 text-amber-800 border-amber-300",
    approved: "bg-green-100 text-green-800 border-green-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase ${styles[status]}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value, tone, highlight, money }: {
  label: string; value: number; tone: "red" | "amber" | "green" | "purple"; highlight?: boolean; money?: boolean;
}) {
  const bg = { red: "bg-red-50", amber: "bg-amber-50", green: "bg-green-50", purple: "bg-purple-50" }[tone];
  return (
    <motion.div whileHover={{ y: -3 }} className={
      "rounded-2xl border-2 border-flamingo-dark p-4 shadow-[0_6px_0_0_#1A1A2E] " + bg + (highlight ? " ring-4 ring-red-200" : "")
    }>
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-flamingo-dark/70">{label}</p>
      <p className="display mt-2 font-black text-flamingo-dark tabular-nums leading-none"
        style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", letterSpacing: "-0.03em" }}>
        {money ? formatZAR(value) : <AnimatedCounter to={value} duration={1} locale="en-ZA" />}
      </p>
    </motion.div>
  );
}
