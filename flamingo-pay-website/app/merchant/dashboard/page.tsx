"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MerchantGate } from "../_components/MerchantGate";
import { TabBar } from "../_components/TabBar";
import { TopBar } from "../_components/TopBar";
import {
  DEMO_MERCHANT,
  formatZAR,
  formatZARCompact,
  makeMockTransactions,
  timeAgo,
  todayTotals,
  weekTotals,
} from "../../../lib/merchant";
import { useI18n } from "../../../lib/i18n";

export default function DashboardPage() {
  return (
    <MerchantGate>
      <Inner />
    </MerchantGate>
  );
}

function Inner() {
  const { t } = useI18n();
  const txns = useMemo(() => makeMockTransactions(48), []);
  const today = useMemo(() => todayTotals(txns), [txns]);
  const week = useMemo(() => weekTotals(txns), [txns]);
  const recent = txns.slice(0, 5);
  const [showBalance, setShowBalance] = useState(true);

  const maxDay = Math.max(...week.map(d => d.total), 1);
  const weekTotal = week.reduce((s, d) => s + d.total, 0);

  return (
    <main className="min-h-dvh bg-flamingo-cream pb-28">
      <TopBar
        title={`${t("dash_hi")}, ${DEMO_MERCHANT.owner.split(" ")[0]} 👋`}
        subtitle={DEMO_MERCHANT.name}
        action={
          <button
            aria-label={showBalance ? "Hide balance" : "Show balance"}
            onClick={() => setShowBalance(v => !v)}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white"
          >
            {showBalance ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="m3 3 18 18M10.6 6.1A9.9 9.9 0 0 1 12 6c6.5 0 10 6 10 6a17.4 17.4 0 0 1-3.1 3.8M6.2 6.2A17.7 17.7 0 0 0 2 12s3.5 6 10 6a10 10 0 0 0 4.3-1M9.5 9.5a3 3 0 0 0 4.2 4.2" />
              </svg>
            )}
          </button>
        }
      />

      <div className="mx-auto max-w-md px-4">
        {/* Today's earnings hero */}
        <section className="mt-4 rounded-3xl border-2 border-flamingo-dark bg-flamingo-pink p-5 text-white shadow-[0_6px_0_0_#1A1A2E]">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-white/85">
            <span>{t("today_earnings")}</span>
            <span>{new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</span>
          </div>
          <div className="mt-1 display text-[2.6rem] font-extrabold leading-none">
            {showBalance ? formatZAR(today.total) : "R ••••••"}
          </div>
          <div className="mt-2 text-sm text-white/85">
            {today.count} {today.count === 1 ? t("transaction_singular") : t("transactions_plural")} • {t("avg")} {formatZARCompact(today.total / Math.max(1, today.count))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/merchant/qr"
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-flamingo-dark bg-white px-3 py-3 text-sm font-extrabold text-flamingo-dark"
            >
              <span>📱</span> {t("show_my_qr")}
            </Link>
            <Link
              href="/merchant/settlements"
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-sm font-extrabold text-flamingo-dark"
            >
              <span>💸</span> {t("payouts")}
            </Link>
          </div>
        </section>

        {/* Weekly bar chart */}
        <section className="mt-4 rounded-3xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-flamingo-dark/70">
              {t("last_7_days")}
            </h2>
            <div className="text-right">
              <div className="text-xs font-bold text-flamingo-dark/60">{t("total")}</div>
              <div className="text-base font-extrabold text-flamingo-dark">
                {showBalance ? formatZARCompact(weekTotal) : "•••"}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-end gap-2">
            {week.map(d => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-24 w-full items-end">
                  <div
                    className="w-full rounded-t-md bg-flamingo-pink"
                    style={{ height: `${(d.total / maxDay) * 100}%`, minHeight: d.total > 0 ? 4 : 0 }}
                    title={formatZAR(d.total)}
                  />
                </div>
                <span className="text-[10px] font-semibold text-flamingo-dark/60">{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Quick stats */}
        <section className="mt-4 grid grid-cols-2 gap-3">
          <MiniCard label={t("fee_rate")} value={`${(DEMO_MERCHANT.feeRate * 100).toFixed(1)}%`} tint="bg-flamingo-butter" />
          <MiniCard label={t("verified")} value={DEMO_MERCHANT.verified ? t("verified_yes") : t("verified_pending")} tint="bg-flamingo-mint" />
        </section>

        {/* Recent transactions */}
        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-flamingo-dark/70">
              {t("recent_sales")}
            </h2>
            <Link href="/merchant/transactions" className="text-xs font-bold text-flamingo-pink-deep">
              {t("see_all")} →
            </Link>
          </div>

          <ul className="mt-2 divide-y-2 divide-flamingo-cream rounded-2xl border-2 border-flamingo-dark bg-white shadow-[0_6px_0_0_#1A1A2E]">
            {recent.map(t => (
              <li key={t.id}>
                <Link
                  href={`/merchant/transactions#${t.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-flamingo-pink-wash"
                >
                  <div
                    className={`grid h-10 w-10 flex-none place-items-center rounded-full border-2 border-flamingo-dark text-sm font-extrabold ${
                      t.rail === "payshap" ? "bg-flamingo-mint" : "bg-flamingo-sky"
                    }`}
                  >
                    {t.rail === "payshap" ? "PS" : "EFT"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-extrabold text-flamingo-dark">
                      {showBalance ? formatZAR(t.amount) : "R •••"}
                    </div>
                    <div className="truncate text-xs text-flamingo-dark/60">
                      {t.buyerBank} • {timeAgo(t.timestamp)}
                    </div>
                  </div>
                  <StatusPill status={t.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <TabBar />
    </main>
  );
}

function MiniCard({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <div className={`rounded-2xl border-2 border-flamingo-dark ${tint} p-3 shadow-[0_4px_0_0_#1A1A2E]`}>
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-flamingo-dark/70">{label}</div>
      <div className="mt-0.5 text-lg font-extrabold text-flamingo-dark">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const { t } = useI18n();
  const styles: Record<string, string> = {
    completed: "bg-flamingo-mint text-flamingo-dark",
    pending:   "bg-flamingo-butter text-flamingo-dark",
    refunded:  "bg-flamingo-pink-soft text-flamingo-pink-deep",
  };
  const labelKey: Record<string, string> = {
    completed: "status_paid",
    pending:   "status_pending",
    refunded:  "status_refunded",
  };
  return (
    <span className={`rounded-full border-2 border-flamingo-dark px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${styles[status] || ""}`}>
      {labelKey[status] ? t(labelKey[status]) : status}
    </span>
  );
}
