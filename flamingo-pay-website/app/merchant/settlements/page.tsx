"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MerchantGate } from "../_components/MerchantGate";
import { TabBar } from "../_components/TabBar";
import { TopBar } from "../_components/TopBar";
import {
  currentMerchantId,
  formatZAR,
  formatZARCompact,
  makeMockSettlements,
  timeAgo,
  type Settlement,
} from "../../../lib/merchant";
import { useMerchantTxns } from "../../../lib/useMerchantTxns";
import { useMerchant } from "../../../lib/useMerchant";

export default function SettlementsPage() {
  return (
    <MerchantGate>
      <Inner />
    </MerchantGate>
  );
}

function Inner() {
  const mid = currentMerchantId();
  const { merchant: m } = useMerchant();
  const { txns: rawTxns } = useMerchantTxns(mid);
  const txns = useMemo(() => rawTxns.map(t => ({
    ...t,
    status: (t.status === "partial_refund" ? "completed" : t.status) as "completed" | "pending" | "refunded",
  })), [rawTxns]);
  const settlements = useMemo(() => makeMockSettlements(txns), [txns]);

  const bankName = m?.bank ?? "Your bank";
  const accountMasked = m?.accountLast4 ? `•••• ${m.accountLast4}` : "••••";

  const pending = settlements.filter(s => s.status === "pending");
  const settled = settlements.filter(s => s.status === "settled");

  const pendingNet = pending.reduce((s, x) => s + x.net, 0);
  const settledNet = settled.reduce((s, x) => s + x.net, 0);
  const totalFees = settlements.reduce((s, x) => s + x.fee, 0);

  const nextPayout = new Date();
  nextPayout.setDate(nextPayout.getDate() + 1);
  nextPayout.setHours(9, 0, 0, 0);

  const [expanded, setExpanded] = useState<string | null>(null);

  function toggle(id: string) {
    setExpanded(prev => (prev === id ? null : id));
  }

  return (
    <main className="min-h-dvh bg-flamingo-cream pb-28">
      <TopBar title="Payouts" subtitle="Money landing in your bank" />

      <div className="mx-auto max-w-md px-4">
        {/* Next payout hero */}
        <section className="mt-4 rounded-3xl border-2 border-flamingo-dark bg-flamingo-pink p-5 text-white shadow-[0_6px_0_0_#1A1A2E]">
          <div className="text-xs font-bold uppercase tracking-wide text-white/85">
            Arriving next
          </div>
          <div className="mt-1 display font-extrabold leading-none" style={{ fontSize: "clamp(1.6rem, 7vw, 2.2rem)" }}>
            {formatZAR(pendingNet)}
          </div>
          <div className="mt-2 text-sm text-white/85">
            {pending.length} {pending.length === 1 ? "day" : "days"} of sales •{" "}
            {nextPayout.toLocaleDateString("en-ZA", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}{" "}
            at 09:00
          </div>
          <div className="mt-4 rounded-2xl border-2 border-flamingo-dark bg-white/10 px-3 py-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white/90">To</span>
              <span className="font-extrabold">
                {bankName} {accountMasked}
              </span>
            </div>
          </div>
        </section>

        {/* Totals row */}
        <section className="mt-4 grid grid-cols-2 gap-3">
          <StatCard
            label="Paid out"
            value={formatZARCompact(settledNet)}
            sub={`${settled.length} payouts`}
            tint="bg-flamingo-mint"
          />
          <StatCard
            label="Payout fees"
            value={formatZARCompact(totalFees)}
            sub="R3 per payout"
            tint="bg-flamingo-butter"
          />
        </section>

        {/* Pending list */}
        {pending.length > 0 && (
          <section className="mt-5">
            <SectionHeader title="Pending" count={pending.length} />
            <div className="mt-2 divide-y-2 divide-flamingo-cream rounded-2xl border-2 border-flamingo-dark bg-white shadow-[0_6px_0_0_#1A1A2E]">
              {pending.map(s => (
                <SettlementRow key={s.id} s={s} isExpanded={expanded === s.id} onToggle={() => toggle(s.id)} />
              ))}
            </div>
          </section>
        )}

        {/* Settled list */}
        {settled.length > 0 && (
          <section className="mt-5">
            <SectionHeader title="Paid out" count={settled.length} />
            <div className="mt-2 divide-y-2 divide-flamingo-cream rounded-2xl border-2 border-flamingo-dark bg-white shadow-[0_6px_0_0_#1A1A2E]">
              {settled.map(s => (
                <SettlementRow key={s.id} s={s} isExpanded={expanded === s.id} onToggle={() => toggle(s.id)} />
              ))}
            </div>
          </section>
        )}

        {/* Info card */}
        <section className="mt-5 rounded-3xl border-2 border-flamingo-dark bg-flamingo-sky p-5 shadow-[0_6px_0_0_#1A1A2E]">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-flamingo-dark">
            How payouts work
          </h3>
          <p className="mt-2 text-sm text-flamingo-dark/80">
            Every morning at 09:00 we settle yesterday&apos;s sales into your{" "}
            {bankName} account {accountMasked}.
            Ozow charges a flat <strong>R3 per payout</strong> — no percentage fees, no hidden charges.
          </p>
        </section>
      </div>

      <TabBar />
    </main>
  );
}

/* ------------------------------------------------------------------ */

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-xs font-extrabold uppercase tracking-wide text-flamingo-dark/60">
        {title}
      </h2>
      <span className="text-xs font-bold text-flamingo-dark/60">{count}</span>
    </div>
  );
}

function SettlementRow({
  s,
  isExpanded,
  onToggle,
}: {
  s: Settlement;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const date = new Date(s.date);
  const label = date.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-flamingo-cream/50"
      >
        <div
          className={`grid h-10 w-10 flex-none place-items-center rounded-full border-2 border-flamingo-dark text-sm font-extrabold ${
            s.status === "settled" ? "bg-flamingo-mint" : "bg-flamingo-butter"
          }`}
        >
          {s.status === "settled" ? "✓" : "⏳"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-extrabold text-flamingo-dark">
              {formatZAR(s.net)}
            </span>
            <span className="flex-none text-[11px] font-semibold text-flamingo-dark/60">
              {label}
            </span>
          </div>
          <div className="truncate text-xs text-flamingo-dark/60">
            {s.txnCount} sales • payout fee {formatZAR(s.fee)}
          </div>
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-none text-flamingo-dark/40 text-sm"
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t-2 border-flamingo-cream bg-flamingo-cream/30 px-4 py-3">
              {/* Summary row */}
              <div className="flex items-center justify-between text-xs text-flamingo-dark/70 mb-2">
                <span>Gross sales</span>
                <span className="font-bold">{formatZAR(s.amount)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-flamingo-dark/70 mb-2">
                <span>Payout fee (Ozow)</span>
                <span className="font-bold text-flamingo-pink-deep">−{formatZAR(s.fee)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-flamingo-dark border-t border-flamingo-dark/10 pt-2 mb-3">
                <span className="font-extrabold">Net payout</span>
                <span className="font-extrabold">{formatZAR(s.net)}</span>
              </div>

              {/* Transaction list */}
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-flamingo-dark/50 mb-1.5">
                Transactions
              </div>
              <ul className="space-y-1">
                {s.transactions.map(tx => (
                  <li
                    key={tx.id}
                    className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 border border-flamingo-dark/10"
                  >
                    <span
                      className={`grid h-7 w-7 flex-none place-items-center rounded-full border border-flamingo-dark/20 text-[9px] font-extrabold ${
                        tx.rail === "payshap" ? "bg-flamingo-mint" : "bg-flamingo-sky"
                      }`}
                    >
                      {tx.rail === "payshap" ? "PS" : "EFT"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-xs font-bold text-flamingo-dark tabular-nums">
                          {formatZAR(tx.amount)}
                        </span>
                        <span className="text-[10px] text-flamingo-dark/50">
                          {timeAgo(tx.timestamp)}
                        </span>
                      </div>
                      <div className="text-[10px] text-flamingo-dark/50 truncate">
                        {tx.buyerBank} • {tx.reference}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tint,
}: {
  label: string;
  value: string;
  sub: string;
  tint: string;
}) {
  return (
    <div
      className={`rounded-2xl border-2 border-flamingo-dark ${tint} p-3 shadow-[0_4px_0_0_#1A1A2E]`}
    >
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-flamingo-dark/70">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-extrabold text-flamingo-dark">{value}</div>
      <div className="text-[11px] font-semibold text-flamingo-dark/60">{sub}</div>
    </div>
  );
}
