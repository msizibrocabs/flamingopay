"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MerchantGate } from "../_components/MerchantGate";
import { TabBar } from "../_components/TabBar";
import { TopBar } from "../_components/TopBar";
import { DEMO_MERCHANT, formatZAR, timeAgo } from "../../../lib/merchant";
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
  const { loading, txns, stats, refund } = useMerchantTxns(DEMO_MERCHANT.id);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StoredTxn | null>(null);
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // keep selection fresh after refund mutation
  const liveSelected = useMemo(
    () => (selected ? txns.find(t => t.id === selected.id) ?? selected : null),
    [selected, txns],
  );

  const filtered = txns.filter(t => {
    if (filter === "payshap" && t.rail !== "payshap") return false;
    if (filter === "eft" && t.rail !== "eft") return false;
    if (filter === "refunded" && t.status !== "refunded") return false;
    if (query) {
      const q = query.toLowerCase();
      if (
        !t.reference.toLowerCase().includes(q) &&
        !t.buyerBank.toLowerCase().includes(q)
      ) return false;
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
    .filter(t => t.status === "completed")
    .reduce((s, t) => s + t.amount, 0);

  async function handleRefund() {
    if (!liveSelected) return;
    setRefunding(true);
    setRefundError(null);
    const r = await refund(liveSelected.id);
    setRefunding(false);
    if (r.ok) {
      setToast(`Refunded ${formatZAR(liveSelected.amount)}`);
      setTimeout(() => setToast(null), 2500);
    } else {
      setRefundError(r.error);
    }
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

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden">
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
            const dayTotal = list.filter(l => l.status === "completed").reduce((s, l) => s + l.amount, 0);
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
                        onClick={() => {
                          setSelected(t);
                          setRefundError(null);
                        }}
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
            className="fixed inset-0 z-50 flex items-end justify-center bg-flamingo-dark/40"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              className="w-full max-w-md rounded-t-3xl border-t-2 border-flamingo-dark bg-white p-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-flamingo-dark/20" />
              <div className="flex items-center justify-between">
                <h3 className="display text-lg font-black text-flamingo-dark" style={{ letterSpacing: "-0.02em" }}>
                  Transaction
                </h3>
                <button
                  aria-label="Close"
                  onClick={() => setSelected(null)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-flamingo-cream"
                >
                  ✕
                </button>
              </div>
              <div className={`mt-3 rounded-2xl p-4 text-center ${liveSelected.status === "refunded" ? "bg-flamingo-pink-soft" : "bg-flamingo-pink-wash"}`}>
                <div className="display-eyebrow text-[10px] text-flamingo-pink-deep">Amount</div>
                <div
                  className={`display mt-1 font-black tabular-nums ${liveSelected.status === "refunded" ? "text-flamingo-dark/50 line-through" : "text-flamingo-dark"}`}
                  style={{ fontSize: "clamp(2rem, 5vw, 2.75rem)", letterSpacing: "-0.03em" }}
                >
                  {formatZAR(liveSelected.amount)}
                </div>
              </div>
              <dl className="mt-4 divide-y-2 divide-flamingo-cream text-sm">
                <Row k="Reference" v={liveSelected.reference} />
                <Row k="Rail" v={liveSelected.rail === "payshap" ? "PayShap" : "Instant EFT"} />
                <Row k="Buyer bank" v={liveSelected.buyerBank} />
                <Row k="Status" v={labelFor(liveSelected.status)} />
                <Row k="Time" v={new Date(liveSelected.timestamp).toLocaleString("en-ZA")} />
                {liveSelected.refundedAt && (
                  <Row k="Refunded" v={new Date(liveSelected.refundedAt).toLocaleString("en-ZA")} />
                )}
              </dl>

              {refundError && (
                <p className="mt-3 rounded-lg bg-flamingo-pink-soft px-3 py-2 text-sm font-semibold text-flamingo-pink-deep">
                  {refundError}
                </p>
              )}

              {liveSelected.status === "completed" ? (
                <RefundButton onClick={handleRefund} loading={refunding} amount={liveSelected.amount} />
              ) : liveSelected.status === "refunded" ? (
                <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink-soft px-4 py-3 text-sm font-extrabold uppercase text-flamingo-pink-deep">
                  ↩ Already refunded
                </div>
              ) : (
                <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-flamingo-dark/40 bg-white px-4 py-3 text-sm text-flamingo-dark/60">
                  Pending transactions can&rsquo;t be refunded yet.
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
            className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full border-2 border-flamingo-dark bg-flamingo-mint px-4 py-2 text-sm font-extrabold text-flamingo-dark shadow-[0_6px_0_0_#1A1A2E]"
          >
            ↩ {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <TabBar />
    </main>
  );
}

function RefundButton({
  onClick,
  loading,
  amount,
}: {
  onClick: () => void;
  loading: boolean;
  amount: number;
}) {
  const [confirm, setConfirm] = useState(false);
  if (!confirm) {
    return (
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setConfirm(true)}
        className="mt-5 w-full rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_0_#B42A48]"
      >
        Refund this sale
      </motion.button>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-5 overflow-hidden rounded-2xl border-2 border-flamingo-pink bg-flamingo-pink-wash p-3"
    >
      <p className="text-sm font-semibold text-flamingo-dark">
        Refund R{amount.toFixed(2)} back to the buyer? This can&rsquo;t be undone.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setConfirm(false)}
          disabled={loading}
          className="flex-1 rounded-xl border-2 border-flamingo-dark/40 bg-white px-3 py-2 text-sm font-bold text-flamingo-dark/70"
        >
          Cancel
        </button>
        <button
          onClick={onClick}
          disabled={loading}
          className="flex-1 rounded-xl border-2 border-flamingo-dark bg-flamingo-pink px-3 py-2 text-sm font-extrabold text-white shadow-[0_3px_0_0_#B42A48] disabled:opacity-60"
        >
          {loading ? "Refunding…" : "Yes, refund"}
        </button>
      </div>
    </motion.div>
  );
}

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
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-flamingo-dark/60">{k}</dt>
      <dd className="max-w-[60%] text-right font-semibold text-flamingo-dark">{v}</dd>
    </div>
  );
}

function labelFor(status: StoredTxn["status"]): string {
  if (status === "completed") return "Paid";
  if (status === "refunded") return "Refunded";
  return "Pending";
}
