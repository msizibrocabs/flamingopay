"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminGate } from "./_components/AdminGate";
import { AdminNav } from "./_components/AdminNav";
import { StatusPill } from "./_components/StatusPill";
import { formatZARCompact, timeAgo } from "../../lib/merchant";
import type { MerchantApplication } from "../../lib/store";

type Stats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  lifetimeVolume: number;
  lifetimeTxns: number;
};

export default function AdminOverviewPage() {
  return (
    <AdminGate>
      <AdminNav />
      <Overview />
    </AdminGate>
  );
}

function Overview() {
  const [merchants, setMerchants] = useState<MerchantApplication[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/merchants")
      .then(r => r.json())
      .then(d => {
        if (!cancelled) setMerchants(d.merchants ?? []);
      })
      .catch(() => {
        if (!cancelled) setMerchants([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const list = merchants ?? [];
  const stats: Stats = {
    total: list.length,
    pending: list.filter(m => m.status === "pending").length,
    approved: list.filter(m => m.status === "approved").length,
    rejected: list.filter(m => m.status === "rejected").length,
    suspended: list.filter(m => m.status === "suspended").length,
    lifetimeVolume: list.reduce((s, m) => s + m.grossVolume, 0),
    lifetimeTxns: list.reduce((s, m) => s + m.txnCount, 0),
  };

  const pending = list.filter(m => m.status === "pending");
  const recent = [...list]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-flamingo-pink-deep">
            Operations
          </p>
          <h1 className="display text-3xl font-extrabold text-flamingo-dark sm:text-4xl">
            Overview
          </h1>
        </div>
        <Link
          href="/admin/merchants"
          className="rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2 text-sm font-bold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] hover:bg-flamingo-cream"
        >
          All merchants →
        </Link>
      </div>

      {/* Stats grid */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Merchants" value={stats.total} tone="cream" />
        <StatCard label="Pending review" value={stats.pending} tone="pink" highlight={stats.pending > 0} />
        <StatCard label="Approved" value={stats.approved} tone="mint" />
        <StatCard label="Rejected" value={stats.rejected} tone="butter" />
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Lifetime volume"
          value={"R " + formatZARCompact(stats.lifetimeVolume).replace("R ", "")}
          tone="sky"
        />
        <StatCard label="Lifetime txns" value={stats.lifetimeTxns.toLocaleString("en-ZA")} tone="sky" />
      </section>

      {/* Pending queue */}
      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="display text-xl font-extrabold text-flamingo-dark">
            Needs review
            {pending.length > 0 && (
              <span className="ml-2 inline-grid h-6 min-w-6 place-items-center rounded-full border-2 border-flamingo-dark bg-flamingo-pink px-2 text-xs font-extrabold text-white">
                {pending.length}
              </span>
            )}
          </h2>
          <Link
            href="/admin/merchants?status=pending"
            className="text-sm font-bold text-flamingo-pink-deep underline-offset-2 hover:underline"
          >
            See all
          </Link>
        </div>

        {loading ? (
          <Skeleton />
        ) : pending.length === 0 ? (
          <EmptyCard
            title="Queue is clear 🎉"
            sub="No new merchant applications waiting for review."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {pending.map(m => (
              <MerchantCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </section>

      {/* Recent */}
      <section className="mt-8">
        <h2 className="display mb-3 text-xl font-extrabold text-flamingo-dark">
          Recent activity
        </h2>
        {loading ? (
          <Skeleton />
        ) : (
          <div className="overflow-hidden rounded-2xl border-2 border-flamingo-dark bg-white shadow-[0_6px_0_0_#1A1A2E]">
            {recent.map((m, i) => (
              <Link
                key={m.id}
                href={`/admin/merchants/${m.id}`}
                className={
                  "flex items-center gap-3 px-4 py-3 transition hover:bg-flamingo-cream " +
                  (i !== recent.length - 1 ? "border-b border-flamingo-dark/10" : "")
                }
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-flamingo-dark bg-flamingo-butter text-lg font-extrabold text-flamingo-dark">
                  {m.businessName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-flamingo-dark">
                    {m.businessName}
                  </p>
                  <p className="truncate text-xs text-flamingo-dark/60">
                    {m.ownerName} · {m.phone}
                  </p>
                </div>
                <StatusPill status={m.status} />
                <span className="hidden w-24 text-right text-xs text-flamingo-dark/60 sm:inline">
                  {timeAgo(m.createdAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
  highlight,
}: {
  label: string;
  value: string | number;
  tone: "cream" | "pink" | "mint" | "butter" | "sky";
  highlight?: boolean;
}) {
  const bg = {
    cream: "bg-white",
    pink: "bg-flamingo-pink-wash",
    mint: "bg-flamingo-mint",
    butter: "bg-flamingo-butter",
    sky: "bg-flamingo-sky",
  }[tone];
  return (
    <div
      className={
        "rounded-2xl border-2 border-flamingo-dark p-4 shadow-[0_6px_0_0_#1A1A2E] " +
        bg +
        (highlight ? " ring-4 ring-flamingo-pink/30" : "")
      }
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-flamingo-dark/70">
        {label}
      </p>
      <p className="display mt-1 text-2xl font-extrabold text-flamingo-dark sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

function MerchantCard({ m }: { m: MerchantApplication }) {
  return (
    <Link
      href={`/admin/merchants/${m.id}`}
      className="block rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_6px_0_0_#1A1A2E] transition hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-flamingo-dark bg-flamingo-pink text-lg font-extrabold text-white">
          {m.businessName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-extrabold text-flamingo-dark">
            {m.businessName}
          </p>
          <p className="truncate text-xs text-flamingo-dark/60">
            {m.ownerName} · {m.phone}
          </p>
          <p className="mt-1 text-xs text-flamingo-dark/70">
            {m.businessType} · {m.bank} •••• {m.accountLast4}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <StatusPill status={m.status} />
            <span className="text-xs text-flamingo-dark/50">
              {timeAgo(m.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-2xl border-2 border-flamingo-dark/20 bg-white/60"
        />
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
