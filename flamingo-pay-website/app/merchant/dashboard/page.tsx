"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { MerchantGate } from "../_components/MerchantGate";
import { TabBar } from "../_components/TabBar";
import { TopBar } from "../_components/TopBar";
import { Reveal, RevealGroup, RevealItem } from "../../../components/motion/Reveal";
import { AnimatedCounter } from "../../../components/motion/AnimatedCounter";
import { flamingoConfetti } from "../../../components/motion/Confetti";
import {
  currentMerchantId,
  formatZAR,
  formatZARCompact,
  timeAgo,
  todayTotals,
  weekTotals,
} from "../../../lib/merchant";
import { useMerchantTxns } from "../../../lib/useMerchantTxns";
import { useMerchant } from "../../../lib/useMerchant";
import { useI18n } from "../../../lib/i18n";
import { PushPrompt } from "../../../components/PushPrompt";

export default function DashboardPage() {
  return (
    <MerchantGate>
      <Suspense fallback={null}>
        <Inner />
      </Suspense>
    </MerchantGate>
  );
}

function Inner() {
  const { t } = useI18n();
  const search = useSearchParams();
  const mid = currentMerchantId();
  const { merchant: m } = useMerchant();
  const { txns } = useMerchantTxns(mid);
  const today = useMemo(() => todayTotals(txns), [txns]);
  const week = useMemo(() => weekTotals(txns), [txns]);
  const recent = txns.slice(0, 5);
  const [showBalance, setShowBalance] = useState(true);

  const maxDay = Math.max(...week.map(d => d.total), 1);
  const weekTotal = week.reduce((s, d) => s + d.total, 0);

  const merchantName = m?.businessName ?? "Your Shop";
  const ownerFirst = m?.ownerName?.split(" ")[0] ?? "Boss";
  const feeRate = 0.029;
  const isVerified = m?.status === "approved";

  // Welcome burst when a merchant lands here fresh from approval
  useEffect(() => {
    if (search?.get("welcome") === "1") {
      const handle = setTimeout(flamingoConfetti, 350);
      return () => clearTimeout(handle);
    }
  }, [search]);

  return (
    <main className="min-h-dvh bg-gradient-sunrise pb-28">
      <TopBar
        title={`${t("dash_hi")}, ${ownerFirst} 👋`}
        subtitle={merchantName}
        action={
          <button
            aria-label={showBalance ? "Hide balance" : "Show balance"}
            onClick={() => setShowBalance(v => !v)}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
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
        {/* Push notification prompt */}
        <div className="mt-4">
          <PushPrompt merchantId={mid} />
        </div>

        {/* Today's earnings hero */}
        <Reveal className="mt-4">
          <section className="relative overflow-hidden rounded-3xl border-2 border-flamingo-dark bg-gradient-flamingo p-5 text-white shadow-[0_10px_0_0_#1A1A2E]">
            {/* Decorative pulse ring */}
            <span className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
            <span className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-flamingo-butter/30 blur-2xl" />

            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-white/90">
              <span>{t("today_earnings")}</span>
              <span>{new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</span>
            </div>
            <div className="mt-2 display font-black leading-[0.92] tabular-nums" style={{ fontSize: "clamp(2rem, 8vw, 2.8rem)", letterSpacing: "-0.035em" }}>
              {showBalance ? (
                <AnimatedCounter
                  to={today.total}
                  duration={1.1}
                  prefix="R "
                  decimals={2}
                  locale="en-ZA"
                />
              ) : (
                "R ••••••"
              )}
            </div>
            <div className="mt-2 text-sm text-white/90">
              {today.count} {today.count === 1 ? t("transaction_singular") : t("transactions_plural")} • {t("avg")} {formatZARCompact(today.total / Math.max(1, today.count))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/merchant/qr"
                  className="flex items-center justify-center gap-2 rounded-2xl border-2 border-flamingo-dark bg-white px-3 py-3 text-sm font-extrabold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E]"
                >
                  <span>📱</span> {t("show_my_qr")}
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/merchant/settlements"
                  className="flex items-center justify-center gap-2 rounded-2xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-sm font-extrabold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E]"
                >
                  <span>💸</span> {t("payouts")}
                </Link>
              </motion.div>
            </div>
          </section>
        </Reveal>

        {/* Weekly bar chart */}
        <Reveal delay={0.1} className="mt-4">
          <section className="glass rounded-3xl border-2 border-flamingo-dark p-5 shadow-[0_6px_0_0_#1A1A2E]">
            <div className="flex items-center justify-between">
              <h2 className="display-eyebrow text-[10px] text-flamingo-dark/70">
                {t("last_7_days")}
              </h2>
              <div className="text-right">
                <div className="display-eyebrow text-[9px] text-flamingo-dark/60">{t("total")}</div>
                <div className="display text-lg font-black text-flamingo-dark tabular-nums" style={{ letterSpacing: "-0.02em" }}>
                  {showBalance ? formatZARCompact(weekTotal) : "•••"}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-end gap-2">
              {week.map((d, i) => (
                <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-24 w-full items-end">
                    <motion.div
                      className="w-full rounded-t-md bg-gradient-to-t from-flamingo-pink-deep to-flamingo-pink"
                      initial={{ height: 0 }}
                      whileInView={{
                        height: `${(d.total / maxDay) * 100}%`,
                      }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ delay: i * 0.06, duration: 0.7, ease: "easeOut" }}
                      style={{ minHeight: d.total > 0 ? 4 : 0 }}
                      title={formatZAR(d.total)}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-flamingo-dark/60">{d.label}</span>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* Quick stats */}
        <RevealGroup delay={0.15} className="mt-4 grid grid-cols-2 gap-3">
          <RevealItem>
            <MiniCard label={t("fee_rate")} value={`${(feeRate * 100).toFixed(1)}% + R0.99`} tint="bg-flamingo-butter" />
          </RevealItem>
          <RevealItem>
            <MiniCard label={t("verified")} value={isVerified ? t("verified_yes") : t("verified_pending")} tint="bg-flamingo-mint" />
          </RevealItem>
        </RevealGroup>

        {/* KYC tier — monthly limit usage */}
        {mid && (
          <Reveal delay={0.2} className="mt-4">
            <TierLimitCard merchantId={mid} />
          </Reveal>
        )}

        {/* Recent transactions */}
        <Reveal delay={0.25} className="mt-5">
          <section>
            <div className="flex items-center justify-between">
              <h2 className="display-eyebrow text-[10px] text-flamingo-dark/70">
                {t("recent_sales")}
              </h2>
              <Link href="/merchant/transactions" className="text-xs font-bold text-flamingo-pink-deep">
                {t("see_all")} →
              </Link>
            </div>

            <ul className="mt-2 divide-y-2 divide-flamingo-cream rounded-2xl border-2 border-flamingo-dark bg-white shadow-[0_6px_0_0_#1A1A2E]">
              {recent.map((tx, i) => (
                <motion.li
                  key={tx.id}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  <Link
                    href={`/merchant/transactions#${tx.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-flamingo-pink-wash"
                  >
                    <div
                      className={`grid h-10 w-10 flex-none place-items-center rounded-full border-2 border-flamingo-dark text-sm font-extrabold ${
                        tx.rail === "payshap" ? "bg-flamingo-mint" : "bg-flamingo-sky"
                      }`}
                    >
                      {tx.rail === "payshap" ? "PS" : "EFT"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-extrabold text-flamingo-dark">
                        {showBalance ? formatZAR(tx.amount) : "R •••"}
                      </div>
                      <div className="truncate text-xs text-flamingo-dark/60">
                        {tx.buyerBank} • {timeAgo(tx.timestamp)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusPill status={tx.status} />
                      {tx.status === "completed" && tx.coolingOffExpiresAt && new Date(tx.coolingOffExpiresAt) > new Date() && (
                        <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-extrabold text-blue-700">
                          {tx.coolingOffStatus === "requested" ? "CANCEL REQ" : "COOLING OFF"}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </section>
        </Reveal>
      </div>

      <TabBar />
    </main>
  );
}

function MiniCard({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <motion.div
      whileHover={{ y: -3, rotate: -0.4 }}
      className={`rounded-2xl border-2 border-flamingo-dark ${tint} p-3 shadow-[0_4px_0_0_#1A1A2E]`}
    >
      <div className="display-eyebrow text-[9px] text-flamingo-dark/70">{label}</div>
      <div className="display mt-1 text-lg font-black text-flamingo-dark tabular-nums" style={{ letterSpacing: "-0.02em" }}>{value}</div>
    </motion.div>
  );
}

/**
 * KYC-tier monthly-limit usage widget.
 *
 * Shows rolling 30-day volume vs. the tier cap with a progress bar and
 * a remaining-headroom summary. When usage crosses 90% we flip the bar
 * to a warning colour and prompt an upgrade — the goal is for the
 * merchant to see the cap coming before their first transaction is
 * rejected at /pay.
 */
function TierLimitCard({ merchantId }: { merchantId: string }) {
  type Usage = {
    tier: "simplified" | "standard" | "enhanced";
    month: { cap: number | null; used: number; remaining: number | null; pct: number };
    day: { cap: number; used: number; remaining: number; pct: number };
    singleTxnCap: number;
  };
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!merchantId) return;
    (async () => {
      try {
        const res = await fetch(`/api/merchants/${merchantId}/limits/usage`, { cache: "no-store" });
        if (res.ok) setUsage(await res.json());
      } catch { /* best-effort */ }
      setLoaded(true);
    })();
  }, [merchantId]);

  if (!loaded) {
    return (
      <div className="h-28 rounded-3xl border-2 border-flamingo-dark bg-white/60 shadow-[0_6px_0_0_#1A1A2E] animate-pulse" />
    );
  }
  if (!usage) return null;

  const TIER_LABEL: Record<Usage["tier"], string> = {
    simplified: "Simplified",
    standard: "Standard",
    enhanced: "Enhanced",
  };
  const isWarning = usage.month.pct >= 90 && usage.month.cap !== null;
  const isCritical = usage.month.pct >= 100 && usage.month.cap !== null;

  const barColor = isCritical
    ? "bg-red-500"
    : isWarning
      ? "bg-amber-500"
      : "bg-gradient-to-r from-flamingo-pink-deep to-flamingo-pink";

  return (
    <section className="rounded-3xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="display-eyebrow text-[10px] text-flamingo-dark/70">KYC Tier</div>
          <div className="display mt-1 text-lg font-black text-flamingo-dark" style={{ letterSpacing: "-0.02em" }}>
            {TIER_LABEL[usage.tier]}
          </div>
        </div>
        <div className="text-right">
          <div className="display-eyebrow text-[9px] text-flamingo-dark/60">This month</div>
          <div className="display mt-1 text-sm font-black text-flamingo-dark tabular-nums" style={{ letterSpacing: "-0.02em" }}>
            {formatZAR(usage.month.used)}
            {usage.month.cap !== null && (
              <span className="text-flamingo-dark/50 font-bold"> / {formatZARCompact(usage.month.cap)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar — only for tiers with a hard cap */}
      {usage.month.cap !== null ? (
        <>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full border border-flamingo-dark/20 bg-flamingo-cream">
            <motion.div
              className={`h-full ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, usage.month.pct)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="font-bold text-flamingo-dark/70">{usage.month.pct}% used</span>
            <span className="font-bold text-flamingo-dark/70 tabular-nums">
              {usage.month.remaining !== null ? formatZAR(usage.month.remaining) : ""} remaining
            </span>
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-xl bg-flamingo-mint/60 px-3 py-2 text-xs font-bold text-flamingo-dark">
          Enhanced tier · no monthly cap
        </div>
      )}

      {/* Warning banner at 90% / breach banner at 100% */}
      {isCritical ? (
        <div className="mt-3 rounded-xl border-2 border-red-500/40 bg-red-50 p-3 text-xs text-red-800">
          <p className="font-extrabold">Monthly limit reached</p>
          <p className="mt-0.5 text-red-800/80">
            New payments will be declined until your 30-day volume drops below the cap, or you upgrade your KYC tier.
          </p>
          <Link href="/merchant/profile" className="mt-1 inline-block font-extrabold text-red-700 underline">
            Upgrade KYC →
          </Link>
        </div>
      ) : isWarning ? (
        <div className="mt-3 rounded-xl border-2 border-amber-400/60 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-extrabold">Heads up — you&rsquo;re at {usage.month.pct}% of your monthly limit</p>
          <p className="mt-0.5 text-amber-900/80">
            Upgrade your KYC tier now so payments keep clearing when you hit the cap.
          </p>
          <Link href="/merchant/profile" className="mt-1 inline-block font-extrabold text-amber-900 underline">
            Upgrade KYC →
          </Link>
        </div>
      ) : null}

      {/* Secondary line — daily headroom */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-flamingo-dark/60">
        <span className="font-bold">
          Today: <span className="text-flamingo-dark">{formatZAR(usage.day.used)}</span> of {formatZARCompact(usage.day.cap)}/day
        </span>
        <span className="font-bold">Single txn max {formatZARCompact(usage.singleTxnCap)}</span>
      </div>
    </section>
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
