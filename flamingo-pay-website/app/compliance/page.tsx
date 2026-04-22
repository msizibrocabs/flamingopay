"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ComplianceGate } from "./_components/ComplianceGate";
import { ComplianceNav } from "./_components/ComplianceNav";
import { FlagPill } from "./_components/FlagPill";
import { Reveal, RevealGroup, RevealItem } from "../../components/motion/Reveal";
import { AnimatedCounter } from "../../components/motion/AnimatedCounter";
import { formatZAR, timeAgo } from "../../lib/merchant";
import type { TxnFlag } from "../../lib/store";

type Stats = {
  total: number;
  open: number;
  investigating: number;
  cleared: number;
  confirmed: number;
  merchantsUnderReview: number;
  flaggedAmount: number;
};

type DisputeStats = {
  total: number;
  open: number;
  awaitingMerchant: number;
  escalated: number;
  resolved: number;
  totalRefunded: number;
};

export default function ComplianceDashboard() {
  return (
    <ComplianceGate>
      <ComplianceNav />
      <Dashboard />
    </ComplianceGate>
  );
}

type EDDStats = {
  total: number;
  opened: number;
  investigation: number;
  pendingApproval: number;
  approved: number;
  overdueReviews: number;
};

type DocSummary = {
  merchantsInQueue: number;
  totalPending: number;
  totalRejected: number;
  totalVerified: number;
};

type CoolingOffStats = {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  totalRefundValue: number;
};

/** Friendly labels for the LimitBreachReason enum from lib/store.ts. */
const REASON_LABEL: Record<string, string> = {
  merchant_suspended: "Suspended merchant",
  transaction_hold: "Compliance hold",
  kyc_tier_monthly_cap: "KYC tier cap",
  single_txn_cap: "Single-txn cap",
  txn_per_hour_cap: "Hourly velocity cap",
  daily_volume_cap: "Daily volume cap",
};

type LimitAttempts = {
  hours: number;
  total: number;
  byReason: Record<string, number>;
  topOffenders: Array<{
    merchantId: string;
    merchantName: string;
    count: number;
    lastAt: string;
    tier?: string;
  }>;
};

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [disputeStats, setDisputeStats] = useState<DisputeStats | null>(null);
  const [eddStats, setEddStats] = useState<EDDStats | null>(null);
  const [docSummary, setDocSummary] = useState<DocSummary | null>(null);
  const [coolingOff, setCoolingOff] = useState<CoolingOffStats | null>(null);
  const [limitAttempts, setLimitAttempts] = useState<LimitAttempts | null>(null);
  const [recent, setRecent] = useState<TxnFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/compliance/stats").then(r => r.json()),
      fetch("/api/compliance/flags?status=open").then(r => r.json()),
      fetch("/api/compliance/disputes").then(r => r.ok ? r.json() : { stats: null }).catch(() => ({ stats: null })),
      fetch("/api/compliance/edd?stats=true").then(r => r.ok ? r.json() : { stats: null }).catch(() => ({ stats: null })),
      fetch("/api/compliance/documents?filter=pending").then(r => r.ok ? r.json() : { summary: null }).catch(() => ({ summary: null })),
      fetch("/api/compliance/cooling-off").then(r => r.ok ? r.json() : { stats: null }).catch(() => ({ stats: null })),
      fetch("/api/compliance/limit-attempts?hours=24").then(r => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([s, f, d, e, docs, co, la]) => {
        if (!cancelled) {
          setStats(s);
          setRecent((f.flags ?? []).slice(0, 10));
          setDisputeStats(d.stats ?? null);
          setEddStats(e.stats ?? null);
          setDocSummary(docs.summary ?? null);
          setCoolingOff(co.stats ?? null);
          setLimitAttempts(la ?? null);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <Reveal>
        <div className="mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600">
            Compliance · Monitoring
          </span>
          <h1
            className="display mt-2 font-black text-flamingo-dark leading-[0.9]"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", letterSpacing: "-0.035em" }}
          >
            Overview.
          </h1>
        </div>
      </Reveal>

      <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RevealItem>
          <StatCard label="Open flags" value={stats?.open ?? 0} tone="red" highlight={(stats?.open ?? 0) > 0} />
        </RevealItem>
        <RevealItem>
          <StatCard label="Investigating" value={stats?.investigating ?? 0} tone="amber" />
        </RevealItem>
        <RevealItem>
          <StatCard label="Cleared" value={stats?.cleared ?? 0} tone="green" />
        </RevealItem>
        <RevealItem>
          <StatCard label="Confirmed fraud" value={stats?.confirmed ?? 0} tone="purple" />
        </RevealItem>
      </RevealGroup>

      <RevealGroup delay={0.1} className="mt-4 grid gap-3 sm:grid-cols-2">
        <RevealItem>
          <StatCard label="Merchants under review" value={stats?.merchantsUnderReview ?? 0} tone="amber" />
        </RevealItem>
        <RevealItem>
          <StatCard label="Flagged amount" value={stats?.flaggedAmount ?? 0} tone="red" money />
        </RevealItem>
      </RevealGroup>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2
            className="display font-black text-flamingo-dark leading-none"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", letterSpacing: "-0.03em" }}
          >
            Open flags
            {recent.length > 0 && (
              <span className="ml-2 inline-grid h-6 min-w-6 place-items-center rounded-full border-2 border-flamingo-dark bg-red-600 px-2 text-xs font-extrabold text-white">
                {recent.length}
              </span>
            )}
          </h2>
          <Link href="/compliance/flags" className="text-sm font-bold text-red-600 underline-offset-2 hover:underline">
            See all flags
          </Link>
        </div>

        {loading ? (
          <Skeleton />
        ) : recent.length === 0 ? (
          <EmptyCard title="All clear" sub="No open flags right now. The system is monitoring all incoming transactions." />
        ) : (
          <div className="overflow-hidden rounded-2xl border-2 border-flamingo-dark bg-white shadow-[0_6px_0_0_#1A1A2E]">
            {recent.map((f, i) => (
              <FlagRow key={f.id} flag={f} isLast={i === recent.length - 1} />
            ))}
          </div>
        )}
      </section>

      {/* Dispute summary */}
      {disputeStats && (disputeStats.open > 0 || disputeStats.escalated > 0) && (
        <Reveal delay={0.15}>
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <h2
                className="display font-black text-flamingo-dark leading-none"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", letterSpacing: "-0.03em" }}
              >
                Buyer disputes
                {(disputeStats.open + disputeStats.escalated) > 0 && (
                  <span className="ml-2 inline-grid h-6 min-w-6 place-items-center rounded-full border-2 border-flamingo-dark bg-orange-500 px-2 text-xs font-extrabold text-white">
                    {disputeStats.open + disputeStats.escalated}
                  </span>
                )}
              </h2>
              <Link href="/compliance/disputes" className="text-sm font-bold text-red-600 underline-offset-2 hover:underline">
                View all disputes
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Open" value={disputeStats.open} tone="red" highlight={disputeStats.open > 0} />
              <StatCard label="Awaiting merchant" value={disputeStats.awaitingMerchant} tone="amber" />
              <StatCard label="Escalated" value={disputeStats.escalated} tone="purple" highlight={disputeStats.escalated > 0} />
              <StatCard label="Total refunded" value={disputeStats.totalRefunded} tone="green" money />
            </div>
          </section>
        </Reveal>
      )}

      {/* EDD summary */}
      {eddStats && (eddStats.opened > 0 || eddStats.investigation > 0 || eddStats.pendingApproval > 0 || eddStats.overdueReviews > 0) && (
        <Reveal delay={0.18}>
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <h2
                className="display font-black text-flamingo-dark leading-none"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", letterSpacing: "-0.03em" }}
              >
                Enhanced Due Diligence
                {(eddStats.opened + eddStats.investigation + eddStats.pendingApproval) > 0 && (
                  <span className="ml-2 inline-grid h-6 min-w-6 place-items-center rounded-full border-2 border-flamingo-dark bg-red-600 px-2 text-xs font-extrabold text-white">
                    {eddStats.opened + eddStats.investigation + eddStats.pendingApproval}
                  </span>
                )}
              </h2>
              <Link href="/compliance/edd" className="text-sm font-bold text-red-600 underline-offset-2 hover:underline">
                View all EDD cases
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Open cases" value={eddStats.opened} tone="red" highlight={eddStats.opened > 0} />
              <StatCard label="Investigating" value={eddStats.investigation} tone="amber" />
              <StatCard label="Pending approval" value={eddStats.pendingApproval} tone="purple" highlight={eddStats.pendingApproval > 0} />
              <StatCard label="Overdue reviews" value={eddStats.overdueReviews} tone="red" highlight={eddStats.overdueReviews > 0} />
            </div>
          </section>
        </Reveal>
      )}

      {/* Document review summary */}
      {docSummary && docSummary.totalPending > 0 && (
        <Reveal delay={0.2}>
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <h2
                className="display font-black text-flamingo-dark leading-none"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", letterSpacing: "-0.03em" }}
              >
                Document review
                <span className="ml-2 inline-grid h-6 min-w-6 place-items-center rounded-full border-2 border-flamingo-dark bg-blue-500 px-2 text-xs font-extrabold text-white">
                  {docSummary.totalPending}
                </span>
              </h2>
              <Link href="/compliance/documents" className="text-sm font-bold text-red-600 underline-offset-2 hover:underline">
                Review documents
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Merchants in queue" value={docSummary.merchantsInQueue} tone="amber" />
              <StatCard label="Docs pending" value={docSummary.totalPending} tone="red" highlight={docSummary.totalPending > 0} />
              <StatCard label="Rejected" value={docSummary.totalRejected} tone="purple" />
              <StatCard label="Verified" value={docSummary.totalVerified} tone="green" />
            </div>
          </section>
        </Reveal>
      )}

      {/* Cooling-off cancellation requests */}
      {coolingOff && coolingOff.pending > 0 && (
        <Reveal delay={0.22}>
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <h2
                className="display font-black text-flamingo-dark leading-none"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", letterSpacing: "-0.03em" }}
              >
                Cooling-off requests
                <span className="ml-2 inline-grid h-6 min-w-6 place-items-center rounded-full border-2 border-flamingo-dark bg-blue-500 px-2 text-xs font-extrabold text-white">
                  {coolingOff.pending}
                </span>
              </h2>
              <Link href="/compliance/cooling-off" className="text-sm font-bold text-red-600 underline-offset-2 hover:underline">
                Review requests
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Pending review" value={coolingOff.pending} tone="red" highlight={coolingOff.pending > 0} />
              <StatCard label="Approved" value={coolingOff.approved} tone="green" />
              <StatCard label="Rejected" value={coolingOff.rejected} tone="purple" />
              <StatCard label="Refund value" value={coolingOff.totalRefundValue} tone="amber" money />
            </div>
          </section>
        </Reveal>
      )}

      {/* Limit breach attempts — last 24h */}
      {limitAttempts && limitAttempts.total > 0 && (
        <Reveal delay={0.24}>
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <h2
                className="display font-black text-flamingo-dark leading-none"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", letterSpacing: "-0.03em" }}
              >
                Limit breach attempts
                <span className="ml-2 inline-grid h-6 min-w-6 place-items-center rounded-full border-2 border-flamingo-dark bg-red-600 px-2 text-xs font-extrabold text-white">
                  {limitAttempts.total}
                </span>
              </h2>
              <Link href="/admin/audit?action=limit_exceeded_attempt" className="text-sm font-bold text-red-600 underline-offset-2 hover:underline">
                View audit log
              </Link>
            </div>
            <p className="mb-3 text-xs font-medium text-flamingo-dark/60">
              Transactions declined by tier/velocity caps in the last {limitAttempts.hours}h. Repeat offenders can be a structuring signal.
            </p>

            <div className="grid gap-4 lg:grid-cols-3">
              {/* Reason breakdown */}
              <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_6px_0_0_#1A1A2E] lg:col-span-1">
                <p className="display-eyebrow text-[10px] text-flamingo-pink-deep">By reason</p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {Object.entries(limitAttempts.byReason)
                    .sort((a, b) => b[1] - a[1])
                    .map(([reason, count]) => (
                      <li key={reason} className="flex items-center justify-between gap-3">
                        <span className="text-flamingo-dark/80">{REASON_LABEL[reason] ?? reason}</span>
                        <span className="rounded-full border-2 border-flamingo-dark bg-red-100 px-2 py-0.5 text-[10px] font-extrabold text-flamingo-dark tabular-nums">
                          {count}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Top offenders */}
              <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_6px_0_0_#1A1A2E] lg:col-span-2">
                <p className="display-eyebrow text-[10px] text-flamingo-pink-deep">Top offenders</p>
                {limitAttempts.topOffenders.length === 0 ? (
                  <p className="mt-2 text-sm text-flamingo-dark/60">No repeat offenders in this window.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-flamingo-dark/10">
                    {limitAttempts.topOffenders.map((o) => (
                      <li key={o.merchantId}>
                        <Link
                          href={`/admin/merchants/${o.merchantId}`}
                          className="flex items-center justify-between gap-3 py-2 transition hover:bg-red-50/50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-flamingo-dark">
                              {o.merchantName}
                              {o.tier && (
                                <span className="ml-2 rounded-full bg-flamingo-cream px-2 py-0.5 text-[9px] font-extrabold uppercase text-flamingo-dark/70">
                                  {o.tier}
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-flamingo-dark/60 font-mono">
                              {o.merchantId} · last {timeAgo(o.lastAt)}
                            </p>
                          </div>
                          <span className="rounded-full border-2 border-flamingo-dark bg-red-600 px-3 py-0.5 text-xs font-extrabold text-white tabular-nums">
                            {o.count} rejected
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </Reveal>
      )}

      <Reveal delay={0.25}>
        <section className="mt-10 rounded-3xl border-2 border-flamingo-dark bg-flamingo-butter p-5 shadow-[0_6px_0_0_#1A1A2E]">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-flamingo-dark">Active monitoring rules</h3>
          <p className="mt-2 text-xs text-flamingo-dark/70">
            Thresholds adapt to each merchant&rsquo;s business type (spaza, salon, service provider, etc.). Baseline values
            shown below; per-type overrides are listed in{" "}
            <a href="/legal/rmcp#appendix-d" className="font-extrabold underline hover:text-flamingo-pink">
              RMCP Appendix D
            </a>.
          </p>
          <div className="mt-3 space-y-2 text-sm text-flamingo-dark">
            <RuleInfo icon="💰" label="High amount" desc="Single transaction over the merchant's profile threshold (baseline R5,000; R3,000–R10,000 by business type)" />
            <RuleInfo icon="⚡" label="Velocity" desc="More than the merchant's profile limit in a 15-minute window (baseline 20 txns; 15–60 by business type)" />
            <RuleInfo icon="🌙" label="Unusual hours" desc="Transactions in the merchant's profile off-hours window (baseline 23:00–05:00; varies by business type)" />
            <RuleInfo icon="📈" label="Anomaly" desc="Single transaction 4–8× the merchant's own rolling average (multiplier by business type)" />
            <RuleInfo icon="🏦" label="CTR threshold" desc="Single transaction ≥ R24,999.99 (FICA s28 — auto-generates CTR)" />
            <RuleInfo icon="🖊️" label="Manual" desc="Compliance officer manually flags any transaction" />
          </div>
        </section>
      </Reveal>
    </main>
  );
}

function FlagRow({ flag, isLast }: { flag: TxnFlag; isLast: boolean }) {
  const reasonIcons: Record<string, string> = { high_amount: "💰", velocity: "⚡", unusual_hours: "🌙", manual: "🖊️" };
  return (
    <Link
      href={`/compliance/flags/${flag.id}`}
      className={"flex items-center gap-3 px-4 py-3 transition hover:bg-red-50 " + (!isLast ? "border-b border-flamingo-dark/10" : "")}
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-flamingo-dark bg-red-100 text-lg">
        {reasonIcons[flag.reason] ?? "🚩"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-flamingo-dark">
          {formatZAR(flag.txnSnapshot.amount)} — {flag.txnSnapshot.buyerBank}
        </p>
        <p className="truncate text-xs text-flamingo-dark/60">
          {flag.ruleLabel} · Merchant: {flag.merchantId}
        </p>
      </div>
      <FlagPill status={flag.status} />
      <span className="hidden w-20 text-right text-xs text-flamingo-dark/60 sm:inline">{timeAgo(flag.createdAt)}</span>
    </Link>
  );
}

function RuleInfo({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-lg">{icon}</span>
      <div><span className="font-extrabold">{label}:</span> <span className="text-flamingo-dark/80">{desc}</span></div>
    </div>
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

function Skeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="h-20 animate-pulse rounded-2xl border-2 border-flamingo-dark/20 bg-white/60" />
      ))}
    </div>
  );
}

function EmptyCard({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-flamingo-dark/40 bg-white/70 p-6 text-center">
      <p className="display text-lg font-extrabold text-flamingo-dark">{title}</p>
      <p className="mt-1 text-sm text-flamingo-dark/60">{sub}</p>
    </div>
  );
}
