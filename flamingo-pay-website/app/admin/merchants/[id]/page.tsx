"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminGate } from "../../_components/AdminGate";
import { AdminNav } from "../../_components/AdminNav";
import { StatusPill } from "../../_components/StatusPill";
import { Reveal } from "../../../../components/motion/Reveal";
import { flamingoConfetti } from "../../../../components/motion/Confetti";
import { formatZAR, timeAgo } from "../../../../lib/merchant";
import type {
  DocumentKind,
  DocumentStatus,
  MerchantApplication,
  MerchantDocument,
  MerchantStatus,
  StoredTxn,
} from "../../../../lib/store";
import { getBusinessProfile } from "../../../../lib/business-profiles";

type TxnStats = {
  count: number;
  completedCount: number;
  refundedCount: number;
  processed: number;
  refundedValue: number;
  fees: number;
  feeRate: number;
  feeFixed: number;
};

export default function MerchantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AdminGate>
      <AdminNav />
      <Detail id={id} />
    </AdminGate>
  );
}

function Detail({ id }: { id: string }) {
  const [m, setM] = useState<MerchantApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState<MerchantStatus | null>(null);
  const [error, setError] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [txns, setTxns] = useState<StoredTxn[]>([]);
  const [stats, setStats] = useState<TxnStats | null>(null);
  const [showAllTxns, setShowAllTxns] = useState(false);
  const [txnQuery, setTxnQuery] = useState("");
  const [txnDateFrom, setTxnDateFrom] = useState("");
  const [txnDateTo, setTxnDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/merchants/${id}`, { cache: "no-store" });
      if (res.status === 404) {
        setNotFound(true);
      } else {
        const d = await res.json();
        setM(d.merchant ?? null);
      }
      const tx = await fetch(`/api/merchants/${id}/transactions`, { cache: "no-store" });
      if (tx.ok) {
        const td = await tx.json();
        setTxns(td.transactions ?? []);
        setStats(td.stats ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateDoc(kind: DocumentKind, status: DocumentStatus, note?: string) {
    const res = await fetch(`/api/merchants/${id}/documents`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, status, note }),
    });
    const d = await res.json();
    if (res.ok && d.merchant) setM(d.merchant);
  }

  async function updateStatus(status: MerchantStatus, reasonText?: string) {
    setSaving(status);
    setError("");
    try {
      const res = await fetch(`/api/merchants/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason: reasonText }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Update failed");
      } else {
        setM(d.merchant);
        setRejectOpen(false);
        setReason("");
        if (status === "approved") {
          flamingoConfetti();
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-8">
        <div className="h-40 animate-pulse rounded-2xl border-2 border-flamingo-dark/20 bg-white/60" />
      </main>
    );
  }
  if (notFound || !m) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-12 text-center">
        <p className="display text-2xl font-extrabold text-flamingo-dark">
          Merchant not found
        </p>
        <Link
          href="/admin/merchants"
          className="mt-4 inline-block rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2 text-sm font-bold shadow-[0_3px_0_0_#1A1A2E]"
        >
          ← Back to merchants
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-6">
      <Link
        href="/admin/merchants"
        className="inline-block text-sm font-bold text-flamingo-pink-deep underline-offset-2 hover:underline"
      >
        ← Merchants
      </Link>

      {/* Header card */}
      <Reveal>
      <section className="mt-4 rounded-3xl border-2 border-flamingo-dark bg-white p-6 shadow-[0_6px_0_0_#1A1A2E]">
        <div className="flex flex-wrap items-start gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink text-2xl font-extrabold text-white shadow-[0_3px_0_0_#1A1A2E]">
            {m.businessName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <span className="display-eyebrow text-[10px] text-flamingo-pink-deep">Merchant file</span>
            <h1
              className="display font-black text-flamingo-dark leading-none mt-1"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 3rem)", letterSpacing: "-0.035em" }}
            >
              {m.businessName}
            </h1>
            <p className="mt-2 text-sm text-flamingo-dark/70">
              {m.businessType} · Applied {timeAgo(m.createdAt)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill status={m.status} />
              <code className="rounded-md bg-flamingo-cream px-2 py-0.5 text-xs font-mono text-flamingo-dark/70">
                {m.id}
              </code>
            </div>
          </div>
        </div>

        {m.status === "rejected" && m.rejectionReason && (
          <div className="mt-4 rounded-xl border-2 border-flamingo-pink bg-flamingo-pink-soft px-3 py-2 text-sm font-semibold text-flamingo-pink-deep">
            Rejected reason: {m.rejectionReason}
          </div>
        )}
      </section>
      </Reveal>

      {/* Action bar */}
      <Reveal delay={0.1}>
      <section className="mt-4 rounded-2xl border-2 border-flamingo-dark bg-flamingo-cream p-4 shadow-[0_6px_0_0_#1A1A2E]">
        <p className="text-xs font-bold uppercase tracking-widest text-flamingo-dark/70">
          Actions
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => updateStatus("approved")}
            disabled={m.status === "approved" || saving !== null}
            className="btn-pink rounded-xl border-2 border-flamingo-dark bg-flamingo-mint px-4 py-2 text-sm font-extrabold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50"
          >
            {saving === "approved" ? "Approving…" : "✓ Approve"}
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setRejectOpen(true)}
            disabled={m.status === "rejected" || saving !== null}
            className="rounded-xl border-2 border-flamingo-dark bg-flamingo-pink-soft px-4 py-2 text-sm font-extrabold text-flamingo-pink-deep shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50"
          >
            ✕ Reject
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => updateStatus("suspended")}
            disabled={m.status === "suspended" || saving !== null}
            className="rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2 text-sm font-extrabold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50"
          >
            ⏸ Suspend
          </motion.button>
          {m.status !== "pending" && (
            <button
              onClick={() => updateStatus("pending")}
              disabled={saving !== null}
              className="ml-auto rounded-xl border-2 border-flamingo-dark/40 bg-white px-4 py-2 text-sm font-bold text-flamingo-dark/70 disabled:opacity-50"
            >
              Reset to pending
            </button>
          )}
        </div>
        {error && (
          <p className="mt-3 rounded-lg bg-flamingo-pink-soft px-3 py-2 text-sm font-semibold text-flamingo-pink-deep">
            {error}
          </p>
        )}

        <AnimatePresence>
        {rejectOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-4 overflow-hidden rounded-xl border-2 border-flamingo-dark bg-white p-3">
            <label className="text-xs font-bold uppercase tracking-widest text-flamingo-dark/70">
              Reason for rejection (shown to merchant)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Phone number could not be verified (RICA mismatch)"
              className="mt-1 block w-full rounded-lg border-2 border-flamingo-dark/40 bg-flamingo-cream px-3 py-2 text-sm text-flamingo-dark outline-none"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectOpen(false);
                  setReason("");
                }}
                className="rounded-lg border-2 border-flamingo-dark/40 bg-white px-3 py-1.5 text-sm font-bold text-flamingo-dark/70"
              >
                Cancel
              </button>
              <button
                onClick={() => updateStatus("rejected", reason)}
                disabled={!reason.trim() || saving !== null}
                className="rounded-lg border-2 border-flamingo-dark bg-flamingo-pink-soft px-3 py-1.5 text-sm font-extrabold text-flamingo-pink-deep shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50"
              >
                {saving === "rejected" ? "Rejecting…" : "Confirm reject"}
              </button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </section>
      </Reveal>

      {/* FICA Status */}
      <FICAStatusSection merchantId={id} />

      {/* Details grid */}
      <Reveal delay={0.2}>
      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <InfoCard title="Owner">
          <Row k="Name" v={m.ownerName} />
          <Row k="Phone" v={m.phone} />
        </InfoCard>
        <InfoCard title="Business">
          <Row k="Type" v={m.businessType} />
          <Row k="Address" v={m.address || "—"} />
          <Row k="KYC tier" v={
            m.kycTier === "simplified" ? "Simplified (< R25k)"
            : m.kycTier === "standard" ? "Standard (R25k–R100k)"
            : m.kycTier === "enhanced" ? "Enhanced (> R100k)"
            : "—"
          } />
          <Row k="Expected volume" v={m.expectedMonthlyVolume ? formatZAR(m.expectedMonthlyVolume) + "/month" : "—"} />
        </InfoCard>
        <InfoCard title="Payout">
          <Row k="Bank" v={m.bank} />
          <Row k="Account" v={`•••• ${m.accountLast4}`} />
          <Row k="Type" v={m.accountType} />
        </InfoCard>
        <MonitoringCard businessType={m.businessType} />
        <InfoCard title="Lifetime">
          <Row k="Transactions" v={m.txnCount.toLocaleString("en-ZA")} />
          <Row k="Volume" v={formatZAR(m.grossVolume)} />
          <Row k="Created" v={new Date(m.createdAt).toLocaleString("en-ZA")} />
          {m.approvedAt && (
            <Row k="Approved" v={new Date(m.approvedAt).toLocaleString("en-ZA")} />
          )}
          {m.rejectedAt && (
            <Row k="Rejected" v={new Date(m.rejectedAt).toLocaleString("en-ZA")} />
          )}
        </InfoCard>
      </section>
      </Reveal>

      {/* Money movement — processed + fees */}
      {stats && (
        <Reveal delay={0.25}>
        <section className="mt-6">
          <h2 className="display-eyebrow text-[10px] text-flamingo-pink-deep">Money movement</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <BigStat label="Processed" value={formatZAR(stats.processed)} tint="bg-flamingo-mint" sub={`${stats.completedCount} completed`} />
            <BigStat label="Refunded" value={formatZAR(stats.refundedValue)} tint="bg-flamingo-pink-soft" sub={`${stats.refundedCount} refunds`} />
            <BigStat label={`Fees (${(stats.feeRate * 100).toFixed(1)}% + R${stats.feeFixed?.toFixed(2) ?? "0.99"})`} value={formatZAR(stats.fees)} tint="bg-flamingo-butter" sub="Collected by Flamingo" />
            <BigStat label="Transactions" value={stats.count.toLocaleString("en-ZA")} tint="bg-flamingo-sky" sub="Total on file" />
          </div>
        </section>
        </Reveal>
      )}

      {/* Transactions list */}
      <Reveal delay={0.3}>
      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <h2
            className="display font-black text-flamingo-dark leading-none"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", letterSpacing: "-0.03em" }}
          >
            Transactions.
          </h2>
          {txns.length > 8 && !txnQuery && !txnDateFrom && !txnDateTo && (
            <button
              onClick={() => setShowAllTxns(v => !v)}
              className="text-sm font-bold text-flamingo-pink-deep underline-offset-2 hover:underline"
            >
              {showAllTxns ? "Show fewer" : `Show all ${txns.length}`}
            </button>
          )}
        </div>

        {/* Transaction search + date range filter */}
        {txns.length > 0 && (
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <input
              type="search"
              value={txnQuery}
              onChange={e => setTxnQuery(e.target.value)}
              placeholder="Search reference or bank…"
              className="flex-1 rounded-xl border-2 border-flamingo-dark bg-white px-3 py-2 text-sm font-semibold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] outline-none placeholder:text-flamingo-dark/40"
            />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 rounded-xl border-2 border-flamingo-dark bg-white px-3 py-2 shadow-[0_3px_0_0_#1A1A2E]">
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-flamingo-dark/50">From</span>
                <input
                  type="date"
                  value={txnDateFrom}
                  onChange={e => setTxnDateFrom(e.target.value)}
                  max={txnDateTo || undefined}
                  className="bg-transparent text-sm font-bold text-flamingo-dark outline-none [color-scheme:light]"
                />
              </label>
              <label className="flex items-center gap-1.5 rounded-xl border-2 border-flamingo-dark bg-white px-3 py-2 shadow-[0_3px_0_0_#1A1A2E]">
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-flamingo-dark/50">To</span>
                <input
                  type="date"
                  value={txnDateTo}
                  onChange={e => setTxnDateTo(e.target.value)}
                  min={txnDateFrom || undefined}
                  className="bg-transparent text-sm font-bold text-flamingo-dark outline-none [color-scheme:light]"
                />
              </label>
              {(txnDateFrom || txnDateTo) && (
                <button
                  onClick={() => { setTxnDateFrom(""); setTxnDateTo(""); }}
                  className="text-xs font-bold text-flamingo-pink-deep hover:underline"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {(() => {
          const filteredTxns = txns.filter(tx => {
            if (txnDateFrom || txnDateTo) {
              const d = new Date(tx.timestamp).toISOString().slice(0, 10);
              if (txnDateFrom && d < txnDateFrom) return false;
              if (txnDateTo && d > txnDateTo) return false;
            }
            if (txnQuery) {
              const q = txnQuery.toLowerCase();
              if (
                !tx.reference.toLowerCase().includes(q) &&
                !tx.buyerBank.toLowerCase().includes(q)
              ) return false;
            }
            return true;
          });
          const hasFilters = !!(txnQuery || txnDateFrom || txnDateTo);
          const displayTxns = hasFilters
            ? filteredTxns
            : (showAllTxns ? filteredTxns : filteredTxns.slice(0, 8));

          return txns.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-flamingo-dark/40 bg-white p-8 text-center text-sm text-flamingo-dark/60">
              No transactions yet. Once this merchant starts taking pings, they&rsquo;ll land here.
            </div>
          ) : filteredTxns.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-flamingo-dark/40 bg-white p-8 text-center text-sm text-flamingo-dark/60">
              No transactions match that filter.
            </div>
          ) : (
            <>
              {hasFilters && (
                <p className="mb-2 text-xs font-bold text-flamingo-dark/60">
                  {filteredTxns.length} of {txns.length} transactions
                </p>
              )}
              <div className="overflow-hidden rounded-2xl border-2 border-flamingo-dark bg-white shadow-[0_6px_0_0_#1A1A2E]">
                <div className="hidden grid-cols-[90px_120px_1fr_120px_120px_110px] gap-3 bg-flamingo-cream px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-flamingo-dark/60 sm:grid">
                  <span>Rail</span>
                  <span>Reference</span>
                  <span>Buyer bank</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right">Fee</span>
                  <span className="text-right">When</span>
                </div>
                <ul className="divide-y divide-flamingo-dark/10">
                  {displayTxns.map(tx => (
                    <li key={tx.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[90px_120px_1fr_120px_120px_110px]">
                      <span className={`w-fit rounded-full border-2 border-flamingo-dark px-2 py-0.5 text-[10px] font-extrabold uppercase ${tx.rail === "payshap" ? "bg-flamingo-mint" : "bg-flamingo-sky"}`}>
                        {tx.rail === "payshap" ? "PayShap" : "EFT"}
                      </span>
                      <span className="hidden truncate font-mono text-xs text-flamingo-dark/70 sm:block">{tx.reference}</span>
                      <span className="min-w-0 truncate text-sm font-semibold text-flamingo-dark">
                        <span className="sm:hidden text-xs text-flamingo-dark/60 mr-1">{tx.reference} ·</span>
                        {tx.buyerBank}
                      </span>
                      <span className={`text-right text-sm font-extrabold tabular-nums ${tx.status === "refunded" ? "text-flamingo-dark/40 line-through" : "text-flamingo-dark"}`}>
                        {formatZAR(tx.amount)}
                      </span>
                      <span className="hidden text-right text-xs text-flamingo-dark/70 tabular-nums sm:block">
                        {tx.status === "completed" || tx.status === "partial_refund" ? formatZAR(tx.amount * (stats?.feeRate ?? 0.029) + (stats?.feeFixed ?? 0.99)) : "—"}
                      </span>
                      <span className="hidden text-right text-xs text-flamingo-dark/60 sm:block">
                        {timeAgo(tx.timestamp)}
                        {tx.status === "refunded" && (
                          <span className="ml-1 rounded-full bg-flamingo-pink-soft px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-flamingo-pink-deep">R</span>
                        )}
                        {tx.status === "partial_refund" && (
                          <span className="ml-1 rounded-full bg-flamingo-butter px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-flamingo-dark">P</span>
                        )}
                        {tx.status === "pending" && (
                          <span className="ml-1 rounded-full bg-flamingo-cream px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-flamingo-dark/50">⏳</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          );
        })()}
      </section>
      </Reveal>

      {/* Documents */}
      <Reveal delay={0.35}>
      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2
              className="display font-black text-flamingo-dark leading-none"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", letterSpacing: "-0.03em" }}
            >
              Documents.
            </h2>
            <p className="mt-1 text-sm text-flamingo-dark/60">
              KYC paperwork on file for this merchant.
            </p>
          </div>
          <DocSummary docs={m.documents} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {m.documents.map(doc => (
            <DocCard key={doc.kind} doc={doc} onUpdate={updateDoc} />
          ))}
        </div>
      </section>
      </Reveal>

      {/* Shortcuts for approved merchants */}
      {m.status === "approved" && (
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          className="mt-4 rounded-2xl border-2 border-flamingo-dark bg-flamingo-mint p-4 shadow-[0_6px_0_0_#1A1A2E]">
          <p className="text-sm font-extrabold text-flamingo-dark">
            This merchant can log in and access their dashboard & QR code.
          </p>
          <p className="mt-1 text-xs text-flamingo-dark/70">
            Signing in with phone {m.phone} goes to <code>/merchant/dashboard</code>.
          </p>
        </motion.section>
      )}

      <button
        onClick={load}
        className="mt-6 text-xs font-bold text-flamingo-dark/50 underline-offset-2 hover:underline"
      >
        Refresh
      </button>
    </main>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_6px_0_0_#1A1A2E]">
      <p className="display-eyebrow text-[10px] text-flamingo-pink-deep">
        {title}
      </p>
      <dl className="mt-2 space-y-1.5">{children}</dl>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs font-semibold text-flamingo-dark/60">{k}</dt>
      <dd className="text-right text-sm font-bold text-flamingo-dark">{v}</dd>
    </div>
  );
}

function BigStat({
  label,
  value,
  sub,
  tint,
}: {
  label: string;
  value: string;
  sub?: string;
  tint: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`rounded-2xl border-2 border-flamingo-dark ${tint} p-4 shadow-[0_6px_0_0_#1A1A2E]`}
    >
      <p className="display-eyebrow text-[10px] text-flamingo-dark/70">{label}</p>
      <p
        className="display mt-2 font-black text-flamingo-dark tabular-nums leading-none"
        style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", letterSpacing: "-0.03em" }}
      >
        {value}
      </p>
      {sub && <p className="mt-2 text-xs text-flamingo-dark/60">{sub}</p>}
    </motion.div>
  );
}

function DocSummary({ docs }: { docs: MerchantDocument[] }) {
  const verified = docs.filter(d => d.status === "verified").length;
  const submitted = docs.filter(d => d.status === "submitted").length;
  const required = docs.filter(d => d.status === "required").length;
  const rejected = docs.filter(d => d.status === "rejected").length;
  const total = docs.length;
  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest">
      <span className="rounded-full border-2 border-flamingo-dark bg-flamingo-mint px-2 py-1 text-flamingo-dark">
        {verified}/{total} verified
      </span>
      {submitted > 0 && (
        <span className="rounded-full border-2 border-flamingo-dark bg-flamingo-butter px-2 py-1 text-flamingo-dark">
          {submitted} to review
        </span>
      )}
      {required > 0 && (
        <span className="rounded-full border-2 border-flamingo-dark bg-white px-2 py-1 text-flamingo-dark">
          {required} missing
        </span>
      )}
      {rejected > 0 && (
        <span className="rounded-full border-2 border-flamingo-dark bg-flamingo-pink-soft px-2 py-1 text-flamingo-pink-deep">
          {rejected} rejected
        </span>
      )}
    </div>
  );
}

const DOC_TINT: Record<DocumentStatus, string> = {
  verified: "bg-flamingo-mint",
  submitted: "bg-flamingo-butter",
  required: "bg-white",
  rejected: "bg-flamingo-pink-soft",
};

const DOC_ICON: Record<DocumentKind, string> = {
  id: "🪪",
  selfie: "🤳",
  affidavit: "📜",
  company_reg: "🏢",
  proof_of_address: "📮",
  bank_letter: "🏦",
  source_of_funds: "💼",
};

function DocCard({
  doc,
  onUpdate,
}: {
  doc: MerchantDocument;
  onUpdate: (kind: DocumentKind, status: DocumentStatus, note?: string) => void | Promise<void>;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState(doc.note ?? "");
  const [busy, setBusy] = useState<DocumentStatus | null>(null);

  async function act(status: DocumentStatus, note?: string) {
    setBusy(status);
    try {
      await onUpdate(doc.kind, status, note);
      setRejectOpen(false);
    } finally {
      setBusy(null);
    }
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-2xl border-2 border-flamingo-dark ${DOC_TINT[doc.status]} p-4 shadow-[0_6px_0_0_#1A1A2E]`}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-xl border-2 border-flamingo-dark bg-white text-lg">
          {DOC_ICON[doc.kind]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="display-eyebrow text-[10px] text-flamingo-dark/60">
            {doc.kind.replace(/_/g, " ")}
          </p>
          <p className="text-sm font-extrabold text-flamingo-dark">{doc.label}</p>
          <DocStatusBadge status={doc.status} />
          <div className="mt-2 text-xs text-flamingo-dark/70 space-y-0.5">
            {doc.fileName && <p className="font-mono truncate">📎 {doc.fileName}</p>}
            {doc.blobUrl && (
              <a href={doc.blobUrl.startsWith("demo://") ? "#" : `/api/documents/view?url=${encodeURIComponent(doc.blobUrl)}`} target="_blank" rel="noopener noreferrer"
                className="inline-block font-bold text-flamingo-pink-deep underline-offset-2 hover:underline">
                View uploaded file →
              </a>
            )}
            {doc.submittedAt && <p>Submitted {timeAgo(doc.submittedAt)}</p>}
            {doc.verifiedAt && <p>Verified {timeAgo(doc.verifiedAt)}</p>}
            {doc.rejectedAt && <p>Rejected {timeAgo(doc.rejectedAt)}</p>}
            {doc.note && doc.status === "rejected" && (
              <p className="rounded-lg bg-white/70 p-2 text-flamingo-pink-deep">
                Reason: {doc.note}
              </p>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {rejectOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden rounded-xl border-2 border-flamingo-dark bg-white p-3"
          >
            <label className="display-eyebrow text-[10px] text-flamingo-dark/70">
              Reason (shown to merchant)
            </label>
            <textarea
              rows={2}
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="e.g. Photo is blurry, please re-upload"
              className="mt-1 block w-full rounded-lg border-2 border-flamingo-dark/40 bg-flamingo-cream px-3 py-2 text-sm text-flamingo-dark outline-none"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => setRejectOpen(false)}
                disabled={busy !== null}
                className="rounded-lg border-2 border-flamingo-dark/40 bg-white px-3 py-1.5 text-sm font-bold text-flamingo-dark/70"
              >
                Cancel
              </button>
              <button
                onClick={() => act("rejected", rejectNote)}
                disabled={!rejectNote.trim() || busy !== null}
                className="rounded-lg border-2 border-flamingo-dark bg-flamingo-pink-soft px-3 py-1.5 text-sm font-extrabold text-flamingo-pink-deep shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50"
              >
                {busy === "rejected" ? "Saving…" : "Confirm reject"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!rejectOpen && (
        <div className="mt-3 flex flex-wrap gap-2">
          {doc.status === "submitted" && (
            <>
              <button
                onClick={() => act("verified")}
                disabled={busy !== null}
                className="flex-1 rounded-lg border-2 border-flamingo-dark bg-flamingo-mint px-3 py-1.5 text-xs font-extrabold uppercase text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50"
              >
                {busy === "verified" ? "Verifying…" : "✓ Verify"}
              </button>
              <button
                onClick={() => {
                  setRejectNote(doc.note ?? "");
                  setRejectOpen(true);
                }}
                disabled={busy !== null}
                className="flex-1 rounded-lg border-2 border-flamingo-dark bg-flamingo-pink-soft px-3 py-1.5 text-xs font-extrabold uppercase text-flamingo-pink-deep shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50"
              >
                ✕ Reject
              </button>
            </>
          )}
          {doc.status === "verified" && (
            <button
              onClick={() => act("submitted")}
              disabled={busy !== null}
              className="flex-1 rounded-lg border-2 border-flamingo-dark/40 bg-white px-3 py-1.5 text-xs font-bold uppercase text-flamingo-dark/70 disabled:opacity-50"
            >
              Mark as submitted again
            </button>
          )}
          {doc.status === "required" && (
            <button
              onClick={() => act("submitted", "Simulated upload")}
              disabled={busy !== null}
              className="flex-1 rounded-lg border-2 border-dashed border-flamingo-dark/40 bg-white px-3 py-1.5 text-xs font-bold uppercase text-flamingo-dark/70 disabled:opacity-50"
            >
              {busy === "submitted" ? "Uploading…" : "Simulate upload"}
            </button>
          )}
          {doc.status === "rejected" && (
            <button
              onClick={() => act("required")}
              disabled={busy !== null}
              className="flex-1 rounded-lg border-2 border-flamingo-dark bg-white px-3 py-1.5 text-xs font-extrabold uppercase text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50"
            >
              Request again
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

function MonitoringCard({ businessType }: { businessType: string }) {
  const p = getBusinessProfile(businessType);
  const pad2 = (h: number) => h.toString().padStart(2, "0");
  const unusualDisabled = p.unusualHourStart === p.unusualHourEnd;
  return (
    <div className="rounded-2xl border-2 border-flamingo-dark bg-flamingo-sky p-4 shadow-[0_6px_0_0_#1A1A2E]">
      <p className="display-eyebrow text-[10px] text-flamingo-dark/70">
        Monitoring profile
      </p>
      <p className="mt-0.5 text-xs font-bold text-flamingo-dark">{businessType}</p>
      <dl className="mt-2 space-y-1.5">
        <Row k="High amount flag" v={`≥ R${p.highAmountThreshold.toLocaleString("en-ZA")}`} />
        <Row k="Velocity limit" v={`${p.velocityMax} txns / ${p.velocityWindowMinutes} min`} />
        <Row k="Unusual hours" v={unusualDisabled ? "Disabled" : `${pad2(p.unusualHourStart)}:00–${pad2(p.unusualHourEnd)}:00`} />
        <Row k="Anomaly trigger" v={`≥ ${p.anomalyMultiplier}× merchant avg`} />
      </dl>
    </div>
  );
}

type FICAStatus = {
  kycComplete: boolean;
  kycTier: string;
  pepScreened: boolean;
  pepStatus: string;
  sanctionsScreened: boolean;
  sanctionsStatus: string;
  documentsVerified: boolean;
  documentProgress: string;
  ctrsGenerated: number;
  strsGenerated: number;
  eddStatus: string;
  eddCaseCount: number;
  overallCompliant: boolean;
};

function FICAStatusSection({ merchantId }: { merchantId: string }) {
  const [fica, setFica] = useState<FICAStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/merchants/${merchantId}/fica-status`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setFica(d))
      .catch(() => setFica(null))
      .finally(() => setLoading(false));
  }, [merchantId]);

  if (loading) {
    return (
      <Reveal delay={0.15}>
        <div className="mt-4 h-24 animate-pulse rounded-2xl border-2 border-flamingo-dark/20 bg-white/60" />
      </Reveal>
    );
  }

  if (!fica) return null;

  const checks = [
    { label: "KYC verification", ok: fica.kycComplete, detail: fica.kycTier },
    { label: "PEP screening", ok: fica.pepStatus === "clear", detail: fica.pepStatus },
    { label: "Sanctions screening", ok: fica.sanctionsStatus === "clear", detail: fica.sanctionsStatus },
    { label: "Documents verified", ok: fica.documentsVerified, detail: fica.documentProgress },
  ];

  return (
    <Reveal delay={0.15}>
      <section className={`mt-4 rounded-2xl border-2 p-4 shadow-[0_6px_0_0_#1A1A2E] ${
        fica.overallCompliant
          ? "border-flamingo-dark bg-flamingo-mint"
          : "border-flamingo-dark bg-flamingo-pink-soft"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-flamingo-dark/70">FICA Compliance Status</p>
            <p className={`text-sm font-extrabold ${fica.overallCompliant ? "text-green-700" : "text-flamingo-pink-deep"}`}>
              {fica.overallCompliant ? "✓ Compliant" : "⚠ Action Required"}
            </p>
          </div>
          <Link href="/compliance" className="text-xs font-bold text-flamingo-pink-deep underline-offset-2 hover:underline">
            Compliance portal →
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {checks.map(c => (
            <div key={c.label} className="flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2">
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-extrabold text-white ${c.ok ? "bg-green-500" : "bg-red-500"}`}>
                {c.ok ? "✓" : "✕"}
              </span>
              <span className="text-xs font-bold text-flamingo-dark">{c.label}</span>
              <span className="ml-auto text-[10px] font-bold text-flamingo-dark/50 uppercase">{c.detail}</span>
            </div>
          ))}
        </div>
        {(fica.ctrsGenerated > 0 || fica.strsGenerated > 0 || fica.eddCaseCount > 0) && (
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-flamingo-dark/70">
            {fica.ctrsGenerated > 0 && <span className="font-bold">{fica.ctrsGenerated} CTR(s)</span>}
            {fica.strsGenerated > 0 && <span className="font-bold text-red-700">{fica.strsGenerated} STR(s)</span>}
            {fica.eddCaseCount > 0 && (
              <Link href="/compliance/edd" className="font-bold text-red-700 underline-offset-2 hover:underline">
                {fica.eddCaseCount} EDD case(s) — {fica.eddStatus}
              </Link>
            )}
          </div>
        )}
      </section>
    </Reveal>
  );
}

function DocStatusBadge({ status }: { status: DocumentStatus }) {
  const styles: Record<DocumentStatus, { bg: string; text: string; label: string }> = {
    verified: { bg: "bg-flamingo-dark", text: "text-flamingo-cream", label: "Verified" },
    submitted: { bg: "bg-flamingo-pink", text: "text-white", label: "To review" },
    required: { bg: "bg-white border-2 border-flamingo-dark/40", text: "text-flamingo-dark/60", label: "Missing" },
    rejected: { bg: "bg-flamingo-pink-deep", text: "text-white", label: "Rejected" },
  };
  const s = styles[status];
  return (
    <span className={`mt-1 inline-block rounded-full ${s.bg} ${s.text} px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest`}>
      {s.label}
    </span>
  );
}
