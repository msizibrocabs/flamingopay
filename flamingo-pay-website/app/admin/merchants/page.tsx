"use client";

import Link from "next/link";
import { useMemo, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminGate } from "../_components/AdminGate";
import { AdminNav } from "../_components/AdminNav";
import { StatusPill } from "../_components/StatusPill";
import { timeAgo, formatZARCompact } from "../../../lib/merchant";
import type { MerchantApplication, MerchantStatus } from "../../../lib/store";

const FILTERS: { value: "all" | MerchantStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

export default function MerchantsListPage() {
  return (
    <AdminGate>
      <AdminNav />
      <Suspense fallback={null}>
        <MerchantsList />
      </Suspense>
    </AdminGate>
  );
}

function MerchantsList() {
  const searchParams = useSearchParams();
  const urlStatus = (searchParams.get("status") ?? "all") as
    | "all"
    | MerchantStatus;

  const [merchants, setMerchants] = useState<MerchantApplication[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filter, setFilter] = useState<"all" | MerchantStatus>(urlStatus);

  useEffect(() => {
    setFilter(urlStatus);
  }, [urlStatus]);

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

  const filtered = useMemo(() => {
    const list = merchants ?? [];
    const needle = q.trim().toLowerCase();
    return list.filter(m => {
      if (filter !== "all" && m.status !== filter) return false;
      if (dateFrom || dateTo) {
        const createdDate = new Date(m.createdAt).toISOString().slice(0, 10);
        if (dateFrom && createdDate < dateFrom) return false;
        if (dateTo && createdDate > dateTo) return false;
      }
      if (!needle) return true;
      return (
        m.businessName.toLowerCase().includes(needle) ||
        m.ownerName.toLowerCase().includes(needle) ||
        m.phone.toLowerCase().includes(needle) ||
        m.id.toLowerCase().includes(needle)
      );
    });
  }, [merchants, q, filter, dateFrom, dateTo]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-flamingo-pink-deep">
            Directory
          </p>
          <h1 className="display text-3xl font-extrabold text-flamingo-dark sm:text-4xl">
            Merchants
          </h1>
          <p className="mt-1 text-sm text-flamingo-dark/70">
            {loading
              ? "Loading…"
              : `${filtered.length} of ${(merchants ?? []).length} merchants`}
          </p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <input
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by name, owner, phone…"
            className="w-full rounded-xl border-2 border-flamingo-dark bg-white px-4 py-3 text-sm font-semibold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] outline-none placeholder:text-flamingo-dark/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 rounded-xl border-2 border-flamingo-dark bg-white px-3 py-2 shadow-[0_3px_0_0_#1A1A2E]">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-flamingo-dark/50">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              max={dateTo || undefined}
              className="bg-transparent text-sm font-bold text-flamingo-dark outline-none [color-scheme:light]"
            />
          </label>
          <label className="flex items-center gap-1.5 rounded-xl border-2 border-flamingo-dark bg-white px-3 py-2 shadow-[0_3px_0_0_#1A1A2E]">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-flamingo-dark/50">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="bg-transparent text-sm font-bold text-flamingo-dark outline-none [color-scheme:light]"
            />
          </label>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="text-xs font-bold text-flamingo-pink-deep hover:underline"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={
                "shrink-0 rounded-xl border-2 px-3 py-2 text-sm font-bold transition " +
                (filter === f.value
                  ? "border-flamingo-dark bg-flamingo-butter text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E]"
                  : "border-flamingo-dark/20 bg-white text-flamingo-dark/70 hover:border-flamingo-dark/40")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border-2 border-flamingo-dark bg-white shadow-[0_6px_0_0_#1A1A2E]">
        <div className="hidden grid-cols-[1fr_1fr_1fr_auto_auto] gap-3 border-b-2 border-flamingo-dark bg-flamingo-cream px-5 py-3 text-[11px] font-extrabold uppercase tracking-widest text-flamingo-dark/70 md:grid">
          <span>Business</span>
          <span>Owner / Phone</span>
          <span>Payout</span>
          <span>Status</span>
          <span>Applied</span>
        </div>

        {loading ? (
          <div className="p-6 text-center text-sm text-flamingo-dark/60">
            Loading merchants…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="display text-lg font-extrabold text-flamingo-dark">
              No merchants match
            </p>
            <p className="mt-1 text-sm text-flamingo-dark/60">
              Try clearing the search or switching filter.
            </p>
          </div>
        ) : (
          filtered.map((m, i) => (
            <Link
              key={m.id}
              href={`/admin/merchants/${m.id}`}
              className={
                "grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 transition hover:bg-flamingo-cream md:grid-cols-[1fr_1fr_1fr_auto_auto] " +
                (i !== filtered.length - 1
                  ? "border-b border-flamingo-dark/10"
                  : "")
              }
            >
              <div className="flex items-center gap-3 md:contents">
                <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-flamingo-dark bg-flamingo-pink-wash text-base font-extrabold text-flamingo-dark md:col-span-1">
                  {m.businessName.charAt(0)}
                </div>
                <div className="min-w-0 md:col-auto">
                  <p className="truncate text-sm font-bold text-flamingo-dark">
                    {m.businessName}
                  </p>
                  <p className="truncate text-xs text-flamingo-dark/60">
                    {m.businessType}
                  </p>
                </div>
              </div>
              <div className="hidden min-w-0 md:block">
                <p className="truncate text-sm font-semibold text-flamingo-dark">
                  {m.ownerName}
                </p>
                <p className="truncate text-xs text-flamingo-dark/60">{m.phone}</p>
              </div>
              <div className="hidden min-w-0 md:block">
                <p className="truncate text-sm font-semibold text-flamingo-dark">
                  {m.bank}
                </p>
                <p className="truncate text-xs text-flamingo-dark/60">
                  •••• {m.accountLast4} · {m.accountType}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 md:items-start">
                <StatusPill status={m.status} />
                {m.grossVolume > 0 && (
                  <span className="text-[11px] font-semibold text-flamingo-dark/60">
                    R {formatZARCompact(m.grossVolume).replace("R ", "")} lifetime
                  </span>
                )}
              </div>
              <span className="hidden text-right text-xs text-flamingo-dark/60 md:inline">
                {timeAgo(m.createdAt)}
              </span>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
