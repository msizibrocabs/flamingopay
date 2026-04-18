"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MerchantGate } from "../_components/MerchantGate";
import { TabBar } from "../_components/TabBar";
import { TopBar } from "../_components/TopBar";
import { calcNetAmount, calcTxnFee, currentMerchantId, formatZAR, timeAgo } from "../../../lib/merchant";
import { useMerchantTxns } from "../../../lib/useMerchantTxns";
import type { StoredTxn } from "../../../lib/store";

type Filter = "all" | "payshap" | "eft" | "refunded";

export default function TransactionsPage() {
  return (
    <MerchantGate>
      <Inner />
    </MerchantGate>
  );
}

function Inner() {
  const { loading, txns, stats, refund } = useMerchantTxns(currentMerchantId());
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<StoredTxn | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Lock background scroll when the detail sheet is open
  useEffect(() => {
    if (selected) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [selected]);

  // keep selection fresh after refund mutation
  const liveSelected = useMemo(
    () => (selected ? txns.find(t => t.id === selected.id) ?? selected : null),
    [selected, txns],
  );

  const filtered = txns.filter(t => {
    if (filter === "payshap" && t.rail !== "payshap") return false;
    if (filter === "eft" && t.rail !== "eft") return false;
    if (filter === "refunded" && t.status !== "refunded" && t.status !== "partial_refund") return false;
    if (query) {
      const q = query.toLowerCase();
      if (
        !t.reference.toLowerCase().includes(q) &&
        !t.buyerBank.toLowerCase().includes(q)
      ) return false;
    }
    if (dateFrom || dateTo) {
      const txnDate = new Date(t.timestamp).toISOString().slice(0, 10);
      if (dateFrom && txnDate < dateFrom) return false;
      if (dateTo && txnDate > dateTo) return false;
    }
    return true;
  });

  const groups = new Map<string, StoredTxn[]>();
  filtered.forEach(t => {
    const dayLabel = new Date(t.timestamp).toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
    if (!groups.has(dayLabel)) groups.set(dayLabel, []);
    groups.get(dayLabel)!.push(t);
  });

  const totalShown = filtered
    .filter(t => t.status === "completed" || t.status === "partial_refund")
    .reduce((s, t) => s + t.amount, 0);

  function exportCSV() {
    const header = "Date,Reference,Rail,Bank,Amount (ZAR),Fee (ZAR),Status,Refund Amount,Refund Reason\n";
    const rows = filtered.map(t => {
      const date = new Date(t.timestamp).toLocaleString("en-ZA");
      const fee = t.status === "completed" || t.status === "partial_refund" ? (t.amount * 0.029 + 0.99).toFixed(2) : "0.00";
      const refAmt = t.refundAmount != null ? t.refundAmount.toFixed(2) : "";
      const refReason = t.refundReason ? `"${t.refundReason.replace(/"/g, '""')}"` : "";
      return `"${date}","${t.reference}","${t.rail}","${t.buyerBank}","${t.amount.toFixed(2)}","${fee}","${t.status}","${refAmt}",${refReason}`;
    });
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flamingo-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("CSV downloaded");
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <main className="min-h-dvh bg-flamingo-cream pb-28">
      <TopBar
        title="Sales"
        subtitle={
          loading
            ? "Loading…"
            : `${filtered.length} transactions · ${formatZAR(totalShown)}`
        }
      />

      <div className="mx-auto max-w-md px-4">
        {/* Search */}
        <div className="sticky top-[60px] z-30 -mx-4 bg-flamingo-cream px-4 pt-3 pb-2">
          <label className="flex items-center gap-2 rounded-2xl border-2 border-flamingo-dark bg-white px-3 py-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search reference or bank"
              className="min-w-0 flex-1 bg-transparent text-sm text-flamingo-dark outline-none placeholder:text-flamingo-dark/40"
            />
          </label>

          {/* Date range picker */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 rounded-2xl border-2 border-flamingo-dark bg-white px-3 py-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-flamingo-dark/50">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                max={dateTo || undefined}
                className="bg-transparent text-xs font-bold text-flamingo-dark outline-none [color-scheme:light]"
              />
            </label>
            <label className="flex items-center gap-1.5 rounded-2xl border-2 border-flamingo-dark bg-white px-3 py-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-flamingo-dark/50">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                className="bg-transparent text-xs font-bold text-flamingo-dark outline-none [color-scheme:light]"
              />
            </label>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="rounded-full border-2 border-flamingo-dark/30 bg-white px-2.5 py-1.5 text-[10px] font-extrabold uppercase text-flamingo-dark/70 hover:bg-flamingo-cream"
              >
                Clear dates
              </button>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="flex flex-1 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden">
              {(["all", "payshap", "eft", "refunded"] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-none rounded-full border-2 border-flamingo-dark px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide ${
                    filter === f ? "bg-flamingo-pink text-white" : "bg-white text-flamingo-dark"
                  }`}
                >
                  {f === "all" ? "All" : f === "payshap" ? "PayShap" : f === "eft" ? "EFT" : "Refunded"}
                </button>
              ))}
            </div>
            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="flex-none rounded-full border-2 border-flamingo-dark bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-flamingo-dark hover:bg-flamingo-butter disabled:opacity-40"
              title="Export filtered transactions as CSV"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="inline -mt-0.5 mr-1">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
              </svg>
              CSV
            </button>
          </div>
        </div>

        {stats && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            <MiniStat label="Processed" value={formatZAR(stats.processed)} tint="bg-flamingo-mint" />
            <MiniStat label="Refunded" value={formatZAR(stats.refundedValue)} tint="bg-flamingo-pink-soft" />
            <MiniStat label="Fees" value={formatZAR(stats.fees)} tint="bg-flamingo-butter" />
          </div>
        )}

        {/* List */}
        {loading ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-flamingo-dark/40 bg-white p-6 text-center text-sm text-flamingo-dark/60">
            No transactions match that filter.
          </div>
        ) : (
          Array.from(groups.entries()).map(([day, list]) => {
            const dayTotal = list.filter(l => l.status === "completed" || l.status === "partial_refund").reduce((s, l) => s + l.amount, 0);
            return (
              <section key={day} className="mt-4">
                <div className="mb-1 flex items-center justify-between px-1">
                  <h2 className="display-eyebrow text-[10px] text-flamingo-dark/60">{day}</h2>
                  <span className="text-xs font-bold text-flamingo-dark tabular-nums">
                    {formatZAR(dayTotal)}
                  </span>
                </div>
                <ul className="divide-y-2 divide-flamingo-cream rounded-2xl border-2 border-flamingo-dark bg-white shadow-[0_6px_0_0_#1A1A2E]">
                  {list.map(t => (
                    <li key={t.id} id={t.id}>
                      <button
                        onClick={() => setSelected(t)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-flamingo-pink-wash"
                      >
                        <div className={`grid h-10 w-10 flex-none place-items-center rounded-full border-2 border-flamingo-dark text-[11px] font-extrabold ${
                          t.rail === "payshap" ? "bg-flamingo-mint" : "bg-flamingo-sky"
                        }`}>
                          {t.rail === "payshap" ? "PS" : "EFT"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className={`truncate text-sm font-extrabold tabular-nums ${t.status === "refunded" ? "text-flamingo-dark/40 line-through" : "text-flamingo-dark"}`}>
                              {formatZAR(t.amount)}
                            </span>
                            <span className="flex-none text-[11px] font-semibold text-flamingo-dark/60">
                              {timeAgo(t.timestamp)}
                            </span>
                          </div>
                          <div className="truncate text-xs text-flamingo-dark/60">
                            {t.buyerBank} · {t.reference}
                            {t.status === "refunded" && (
                              <span className="ml-2 rounded-full bg-flamingo-pink-soft px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-flamingo-pink-deep">
                                Refunded
                              </span>
                            )}
                            {t.status === "partial_refund" && (
                              <span className="ml-2 rounded-full bg-flamingo-butter px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-flamingo-dark">
                                Partial refund
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>

      {/* Detail sheet */}
      <AnimatePresence>
        {liveSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-flamingo-dark/40 touch-none"
            onClick={() => setSelected(null)}
            onTouchMove={e => e.preventDefault()}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              className="max-h-[90dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-3xl border-t-2 border-flamingo-dark bg-white px-5 pt-3 pb-10 touch-auto"
              style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 2.5rem))" }}
              onClick={e => e.stopPropagation()}
              onTouchMove={e => e.stopPropagation()}
            >
              <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-flamingo-dark/20" />

              {/* Compact header: amount + status + close in one row */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div
                    className={`display font-black tabular-nums ${liveSelected.status === "refunded" ? "text-flamingo-dark/50 line-through" : "text-flamingo-dark"}`}
                    style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", letterSpacing: "-0.03em" }}
                  >
                    {formatZAR(liveSelected.amount)}
                  </div>
                  <div className="text-xs text-flamingo-dark/60">
                    {liveSelected.rail === "payshap" ? "PayShap" : "EFT"} · {liveSelected.buyerBank} · {liveSelected.reference}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                  liveSelected.status === "completed" ? "bg-flamingo-mint text-flamingo-dark" :
                  liveSelected.status === "refunded" ? "bg-flamingo-pink-soft text-flamingo-pink-deep" :
                  liveSelected.status === "partial_refund" ? "bg-flamingo-butter text-flamingo-dark" :
                  "bg-flamingo-cream text-flamingo-dark/60"
                }`}>
                  {labelFor(liveSelected.status)}
                </span>
                <button
                  aria-label="Close"
                  onClick={() => setSelected(null)}
                  className="grid h-8 w-8 flex-none place-items-center rounded-full bg-flamingo-cream"
                >
                  ✕
                </button>
              </div>

              {/* Refund action — IMMEDIATELY visible */}
              {liveSelected.status === "completed" ? (
                <RefundPanel
                  txn={liveSelected}
                  onRefund={async (amt, reason) => {
                    const r = await refund(liveSelected.id, amt, reason);
                    if (r.ok) {
                      const label = amt < liveSelected.amount ? "Partial refund" : "Full refund";
                      setToast(`${label}: ${formatZAR(amt)}`);
                      setTimeout(() => setToast(null), 3000);
                    }
                    return r;
                  }}
                />
              ) : liveSelected.status === "refunded" ? (
                <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink-soft px-4 py-2.5 text-sm font-extrabold uppercase text-flamingo-pink-deep">
                  ↩ Fully refunded
                </div>
              ) : liveSelected.status === "partial_refund" ? (
                <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl border-2 border-flamingo-dark bg-flamingo-butter px-4 py-2.5 text-sm font-extrabold uppercase text-flamingo-dark">
                  ↩ Partially refunded · {formatZAR(liveSelected.refundAmount ?? 0)}
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-flamingo-dark/40 bg-white px-4 py-2.5 text-sm text-flamingo-dark/60">
                  Pending transactions can&rsquo;t be refunded yet.
                </div>
              )}

              {/* Details — below the fold, scrollable */}
              <dl className="mt-3 divide-y-2 divide-flamingo-cream text-sm">
                <Row k="Reference" v={liveSelected.reference} />
                <Row k="Rail" v={liveSelected.rail === "payshap" ? "PayShap" : "Instant EFT"} />
                <Row k="Buyer bank" v={liveSelected.buyerBank} />
                <Row k="Time" v={new Date(liveSelected.timestamp).toLocaleString("en-ZA")} />
                {(liveSelected.status === "completed" || liveSelected.status === "partial_refund") && (
                  <>
                    <div className="flex items-center justify-between py-1.5">
                      <dt className="text-xs text-flamingo-dark/60">Fee (2.9% + R0.99)</dt>
                      <dd className="text-sm font-semibold text-flamingo-pink-deep">−{formatZAR(calcTxnFee(liveSelected.amount))}</dd>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <dt className="text-xs font-bold text-flamingo-dark">You receive</dt>
                      <dd className="text-sm font-extrabold text-flamingo-dark">{formatZAR(calcNetAmount(liveSelected.amount))}</dd>
                    </div>
                  </>
                )}
                {liveSelected.refundedAt && (
                  <Row k="Refunded at" v={new Date(liveSelected.refundedAt).toLocaleString("en-ZA")} />
                )}
                {liveSelected.refundAmount != null && (
                  <Row k="Refund amount" v={formatZAR(liveSelected.refundAmount)} />
                )}
                {liveSelected.refundReason && (
                  <Row k="Reason" v={liveSelected.refundReason} />
                )}
              </dl>

              {liveSelected.status === "partial_refund" && liveSelected.refundAmount != null && (
                <div className="mt-2 rounded-xl bg-flamingo-butter/30 px-3 py-2 text-xs text-flamingo-dark/70">
                  {formatZAR(liveSelected.refundAmount)} was refunded. Net received: {formatZAR(liveSelected.amount - liveSelected.refundAmount)}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full border-2 border-flamingo-dark bg-flamingo-mint px-4 py-2 text-sm font-extrabold text-flamingo-dark shadow-[0_6px_0_0_#1A1A2E]"
          >
            ↩ {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <TabBar />
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Refund Panel                                                       */
/* ------------------------------------------------------------------ */

type RefundMode = "idle" | "choose" | "confirm" | "success";

const REFUND_REASONS = [
  "Customer overpaid",
  "Wrong amount charged",
  "Goods returned",
  "Service not rendered",
  "Duplicate payment",
  "Customer request",
  "Other",
];

function RefundPanel({
  txn,
  onRefund,
}: {
  txn: StoredTxn;
  onRefund: (amount: number, reason: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [mode, setMode] = useState<RefundMode>("idle");
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [partialAmount, setPartialAmount] = useState("");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveReason = reason === "Other" ? customReason : reason;
  const effectiveAmount = refundType === "full" ? txn.amount : parseFloat(partialAmount) || 0;

  const canProceed =
    effectiveAmount > 0 &&
    effectiveAmount <= txn.amount &&
    effectiveReason.trim().length > 0;

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const r = await onRefund(effectiveAmount, effectiveReason.trim());
    setLoading(false);
    if (r.ok) {
      setMode("success");
    } else {
      setError(r.error ?? "Refund failed");
    }
  }

  /* Step 0: "Refund this sale" button */
  if (mode === "idle") {
    return (
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setMode("choose")}
        className="mt-3 w-full rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_0_#B42A48]"
      >
        Refund this sale
      </motion.button>
    );
  }

  /* Step 3: Success — Ozow processing times */
  if (mode === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        className="mt-5 overflow-hidden rounded-2xl border-2 border-flamingo-dark bg-flamingo-mint p-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">✓</span>
          <h4 className="display text-base font-black text-flamingo-dark">Refund submitted</h4>
        </div>
        <p className="mt-2 text-sm text-flamingo-dark">
          <strong>{formatZAR(effectiveAmount)}</strong> is being processed back to the buyer via Ozow.
        </p>

        <div className="mt-3 rounded-xl bg-white/60 p-3">
          <h5 className="text-xs font-extrabold uppercase tracking-wide text-flamingo-dark/70">
            When will the buyer get their money?
          </h5>
          <ul className="mt-2 space-y-2 text-sm text-flamingo-dark">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-flamingo-mint border border-flamingo-dark/20 text-[10px] font-bold">⚡</span>
              <div>
                <strong>PayShap refunds:</strong> Processed within <strong>60 seconds</strong>. The buyer&rsquo;s bank may take a few extra minutes to reflect it.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-flamingo-sky border border-flamingo-dark/20 text-[10px] font-bold">🏦</span>
              <div>
                <strong>EFT refunds:</strong> Ozow processes within <strong>1 business day</strong>. The buyer should see the funds within <strong>2–3 business days</strong> depending on their bank.
              </div>
            </li>
          </ul>
          <p className="mt-3 text-xs text-flamingo-dark/60">
            Refund timelines are governed by Ozow&rsquo;s settlement rules. Weekends and public holidays may add an extra day for EFT refunds.
          </p>
        </div>
      </motion.div>
    );
  }

  /* Step 1 & 2: Choose type, amount, reason → Confirm */
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-5 overflow-hidden rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink-wash p-4"
    >
      {mode === "choose" && (
        <>
          {/* Full vs Partial toggle */}
          <h4 className="display text-sm font-black text-flamingo-dark">Refund type</h4>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => { setRefundType("full"); setPartialAmount(""); }}
              className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition-colors ${
                refundType === "full"
                  ? "border-flamingo-dark bg-flamingo-pink text-white shadow-[0_3px_0_0_#B42A48]"
                  : "border-flamingo-dark/40 bg-white text-flamingo-dark/70"
              }`}
            >
              Full refund
              <div className="mt-0.5 text-xs font-semibold opacity-80">{formatZAR(txn.amount)}</div>
            </button>
            <button
              onClick={() => setRefundType("partial")}
              className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition-colors ${
                refundType === "partial"
                  ? "border-flamingo-dark bg-flamingo-pink text-white shadow-[0_3px_0_0_#B42A48]"
                  : "border-flamingo-dark/40 bg-white text-flamingo-dark/70"
              }`}
            >
              Partial refund
              <div className="mt-0.5 text-xs font-semibold opacity-80">You decide</div>
            </button>
          </div>

          {/* Partial amount input */}
          <AnimatePresence>
            {refundType === "partial" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="mt-3 block">
                  <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                    Refund amount (max {formatZAR(txn.amount)})
                  </span>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border-2 border-flamingo-dark bg-white px-3 py-2.5">
                    <span className="text-sm font-bold text-flamingo-dark/60">R</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0.01"
                      max={txn.amount}
                      value={partialAmount}
                      onChange={e => setPartialAmount(e.target.value)}
                      placeholder="0.00"
                      className="min-w-0 flex-1 bg-transparent text-lg font-bold text-flamingo-dark outline-none placeholder:text-flamingo-dark/30 tabular-nums"
                    />
                  </div>
                  {parseFloat(partialAmount) > txn.amount && (
                    <p className="mt-1 text-xs font-semibold text-flamingo-pink-deep">
                      Can&rsquo;t exceed {formatZAR(txn.amount)}
                    </p>
                  )}
                </label>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reason */}
          <div className="mt-4">
            <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
              Reason for refund
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {REFUND_REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`rounded-full border-2 px-3.5 py-2 text-xs font-bold transition-colors ${
                    reason === r
                      ? "border-flamingo-dark bg-flamingo-dark text-white"
                      : "border-flamingo-dark/30 bg-white text-flamingo-dark/70 hover:border-flamingo-dark"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <AnimatePresence>
              {reason === "Other" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <textarea
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    placeholder="Tell us why…"
                    rows={2}
                    maxLength={200}
                    className="mt-2 w-full rounded-xl border-2 border-flamingo-dark bg-white px-3 py-2 text-sm text-flamingo-dark outline-none placeholder:text-flamingo-dark/40 resize-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Proceed / Cancel */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => { setMode("idle"); setReason(""); setPartialAmount(""); setRefundType("full"); }}
              className="flex-1 rounded-xl border-2 border-flamingo-dark/40 bg-white px-3 py-3.5 text-sm font-bold text-flamingo-dark/70"
            >
              Cancel
            </button>
            <button
              onClick={() => setMode("confirm")}
              disabled={!canProceed}
              className="flex-1 rounded-xl border-2 border-flamingo-dark bg-flamingo-pink px-3 py-3.5 text-sm font-extrabold text-white shadow-[0_3px_0_0_#B42A48] disabled:opacity-40"
            >
              Review refund
            </button>
          </div>
        </>
      )}

      {mode === "confirm" && (
        <>
          <h4 className="display text-sm font-black text-flamingo-dark">Confirm refund</h4>
          <div className="mt-3 rounded-xl bg-white p-3 text-sm text-flamingo-dark">
            <div className="flex justify-between py-1">
              <span className="text-flamingo-dark/60">Type</span>
              <span className="font-bold">{refundType === "full" ? "Full refund" : "Partial refund"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-flamingo-dark/60">Amount</span>
              <span className="font-bold text-flamingo-pink-deep">{formatZAR(effectiveAmount)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-flamingo-dark/60">Reason</span>
              <span className="max-w-[60%] text-right font-bold">{effectiveReason}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-flamingo-dark/60">Rail</span>
              <span className="font-bold">{txn.rail === "payshap" ? "PayShap" : "Instant EFT"}</span>
            </div>
          </div>

          <p className="mt-3 text-xs text-flamingo-dark/70">
            {txn.rail === "payshap"
              ? "PayShap refunds are processed near-instantly via Ozow. The buyer should see funds within 60 seconds."
              : "EFT refunds are processed by Ozow within 1 business day. The buyer should see funds within 2–3 business days."}
          </p>

          {error && (
            <p className="mt-2 rounded-lg bg-flamingo-pink-soft px-3 py-2 text-sm font-semibold text-flamingo-pink-deep">
              {error}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => { setMode("choose"); setError(null); }}
              disabled={loading}
              className="flex-1 rounded-xl border-2 border-flamingo-dark/40 bg-white px-3 py-3.5 text-sm font-bold text-flamingo-dark/70"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 rounded-xl border-2 border-flamingo-dark bg-flamingo-pink px-3 py-3.5 text-sm font-extrabold text-white shadow-[0_3px_0_0_#B42A48] disabled:opacity-60"
            >
              {loading ? "Processing…" : `Refund ${formatZAR(effectiveAmount)}`}
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper components                                                  */
/* ------------------------------------------------------------------ */

function MiniStat({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <div className={`rounded-2xl border-2 border-flamingo-dark ${tint} p-3 shadow-[0_4px_0_0_#1A1A2E]`}>
      <div className="display-eyebrow text-[9px] text-flamingo-dark/70">{label}</div>
      <div className="display mt-1 text-sm font-black text-flamingo-dark tabular-nums" style={{ letterSpacing: "-0.02em" }}>
        {value}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mt-4 space-y-2">
      {[0, 1, 2].map(i => (
        <div key={i} className="h-14 animate-pulse rounded-2xl border-2 border-flamingo-dark/20 bg-white/60" />
      ))}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <dt className="text-xs text-flamingo-dark/60">{k}</dt>
      <dd className="max-w-[60%] text-right text-sm font-semibold text-flamingo-dark">{v}</dd>
    </div>
  );
}

function labelFor(status: StoredTxn["status"]): string {
  if (status === "completed") return "Paid";
  if (status === "refunded") return "Refunded";
  if (status === "partial_refund") return "Partial refund";
  return "Pending";
}
