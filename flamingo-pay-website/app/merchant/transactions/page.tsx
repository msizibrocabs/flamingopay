"use client";

import { useMemo, useState } from "react";
import { MerchantGate } from "../_components/MerchantGate";
import { TabBar } from "../_components/TabBar";
import { TopBar } from "../_components/TopBar";
import {
  formatZAR,
  makeMockTransactions,
  timeAgo,
  type Txn,
} from "../../../lib/merchant";

type Filter = "all" | "payshap" | "eft" | "refunded";

export default function TransactionsPage() {
  return (
    <MerchantGate>
      <Inner />
    </MerchantGate>
  );
}

function Inner() {
  const all = useMemo(() => makeMockTransactions(48), []);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Txn | null>(null);

  const filtered = all.filter(t => {
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

  // Group by day label
  const groups = new Map<string, Txn[]>();
  filtered.forEach(t => {
    const dayLabel = new Date(t.timestamp).toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
    if (!groups.has(dayLabel)) groups.set(dayLabel, []);
    groups.get(dayLabel)!.push(t);
  });

  const totalShown = filtered.filter(t => t.status === "completed").reduce((s, t) => s + t.amount, 0);

  return (
    <main className="min-h-dvh bg-flamingo-cream pb-28">
      <TopBar
        title="Sales"
        subtitle={`${filtered.length} transactions • ${formatZAR(totalShown)}`}
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

          {/* Filter chips */}
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

        {/* Grouped list */}
        {filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-flamingo-dark/40 bg-white p-6 text-center text-sm text-flamingo-dark/60">
            No transactions match that filter.
          </div>
        ) : (
          Array.from(groups.entries()).map(([day, list]) => {
            const dayTotal = list.filter(l => l.status === "completed").reduce((s, l) => s + l.amount, 0);
            return (
              <section key={day} className="mt-4">
                <div className="mb-1 flex items-center justify-between px-1">
                  <h2 className="text-xs font-extrabold uppercase tracking-wide text-flamingo-dark/60">
                    {day}
                  </h2>
                  <span className="text-xs font-bold text-flamingo-dark">
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
                            <span className="truncate text-sm font-extrabold text-flamingo-dark">
                              {formatZAR(t.amount)}
                            </span>
                            <span className="flex-none text-[11px] font-semibold text-flamingo-dark/60">
                              {timeAgo(t.timestamp)}
                            </span>
                          </div>
                          <div className="truncate text-xs text-flamingo-dark/60">
                            {t.buyerBank} • {t.reference}
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
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-flamingo-dark/40"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl border-t-2 border-flamingo-dark bg-white p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-flamingo-dark/20" />
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-flamingo-dark">Transaction</h3>
              <button
                aria-label="Close"
                onClick={() => setSelected(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-flamingo-cream"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 rounded-2xl bg-flamingo-pink-wash p-4 text-center">
              <div className="text-xs font-bold uppercase tracking-wide text-flamingo-pink-deep">Amount</div>
              <div className="display mt-1 text-3xl font-extrabold text-flamingo-dark">
                {formatZAR(selected.amount)}
              </div>
            </div>
            <dl className="mt-4 divide-y-2 divide-flamingo-cream text-sm">
              <Row k="Reference" v={selected.reference} />
              <Row k="Rail"      v={selected.rail === "payshap" ? "PayShap" : "Instant EFT"} />
              <Row k="Buyer bank" v={selected.buyerBank} />
              <Row k="Status"    v={selected.status} />
              <Row k="Time"      v={new Date(selected.timestamp).toLocaleString("en-ZA")} />
            </dl>
            <button
              className="btn-pink mt-5 w-full rounded-2xl border-2 border-flamingo-dark px-4 py-3 text-sm font-extrabold uppercase"
              onClick={() => {
                alert("Refund flow would go here. (Demo)");
              }}
            >
              Refund this sale
            </button>
          </div>
        </div>
      )}

      <TabBar />
    </main>
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
