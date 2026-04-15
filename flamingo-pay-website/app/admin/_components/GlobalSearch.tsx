"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MerchantApplication, StoredTxn } from "../../../lib/store";
import { formatZAR, timeAgo } from "../../../lib/merchant";

type Hit =
  | { kind: "merchant"; merchant: MerchantApplication }
  | { kind: "transaction"; txn: StoredTxn; merchant: MerchantApplication };

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounced fetch
  useEffect(() => {
    const needle = q.trim();
    if (!needle) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/search?q=${encodeURIComponent(needle)}&limit=20`,
          { cache: "no-store" },
        );
        if (!res.ok) {
          setHits([]);
          return;
        }
        const d = await res.json();
        setHits((d.hits ?? []) as Hit[]);
        setFocusedIdx(0);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 160);
    return () => clearTimeout(handle);
  }, [q]);

  // Click-outside to close
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Keyboard shortcut: ⌘K / Ctrl+K to focus
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function hrefFor(hit: Hit): string {
    if (hit.kind === "merchant") return `/admin/merchants/${hit.merchant.id}`;
    return `/admin/merchants/${hit.merchant.id}#${hit.txn.id}`;
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx(i => Math.min(hits.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx(i => Math.max(0, i - 1));
    } else if (e.key === "Enter" && hits[focusedIdx]) {
      e.preventDefault();
      router.push(hrefFor(hits[focusedIdx]));
      setOpen(false);
      setQ("");
    }
  }

  const hasQuery = q.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <label className="flex items-center gap-2 rounded-xl border-2 border-flamingo-dark bg-white px-3 py-2 shadow-[0_3px_0_0_#1A1A2E]">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          className="shrink-0 text-flamingo-dark/60"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search merchants or txn reference…"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-flamingo-dark outline-none placeholder:text-flamingo-dark/40"
        />
        <kbd className="hidden rounded-md border border-flamingo-dark/20 bg-flamingo-cream px-1.5 py-0.5 text-[10px] font-bold text-flamingo-dark/60 sm:inline">
          ⌘K
        </kbd>
      </label>

      <AnimatePresence>
        {open && hasQuery && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border-2 border-flamingo-dark bg-white shadow-[0_8px_0_0_#1A1A2E]"
          >
            {loading && hits.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-flamingo-dark/60">
                Searching…
              </div>
            ) : hits.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="display text-sm font-extrabold text-flamingo-dark">
                  No matches
                </p>
                <p className="mt-1 text-xs text-flamingo-dark/60">
                  Try a business name, owner, phone, or a{" "}
                  <span className="font-mono">FP-xxxxxx</span> reference.
                </p>
              </div>
            ) : (
              <ResultList
                hits={hits}
                focusedIdx={focusedIdx}
                setFocusedIdx={setFocusedIdx}
                onPick={() => {
                  setOpen(false);
                  setQ("");
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultList({
  hits,
  focusedIdx,
  setFocusedIdx,
  onPick,
}: {
  hits: Hit[];
  focusedIdx: number;
  setFocusedIdx: (n: number) => void;
  onPick: () => void;
}) {
  const merchantHits = hits.filter(h => h.kind === "merchant");
  const txnHits = hits.filter(h => h.kind === "transaction");

  // Build a flat index so keyboard focus stays aligned with the visible order.
  const ordered = [...merchantHits, ...txnHits];

  return (
    <div className="py-1">
      {merchantHits.length > 0 && (
        <>
          <SectionHeader label="Merchants" count={merchantHits.length} />
          <ul>
            {merchantHits.map((h, i) => {
              const flatIdx = i;
              return (
                <MerchantRow
                  key={h.merchant.id}
                  hit={h}
                  focused={flatIdx === focusedIdx}
                  onHover={() => setFocusedIdx(flatIdx)}
                  onPick={onPick}
                />
              );
            })}
          </ul>
        </>
      )}
      {txnHits.length > 0 && (
        <>
          <SectionHeader label="Transactions" count={txnHits.length} />
          <ul>
            {txnHits.map((h, i) => {
              const flatIdx = merchantHits.length + i;
              return (
                <TxnRow
                  key={`${h.merchant.id}-${h.txn.id}`}
                  hit={h}
                  focused={flatIdx === focusedIdx}
                  onHover={() => setFocusedIdx(flatIdx)}
                  onPick={onPick}
                />
              );
            })}
          </ul>
        </>
      )}
      {ordered.length === 0 && null}
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="mt-1 flex items-center justify-between border-b border-flamingo-dark/10 bg-flamingo-cream/60 px-4 py-1.5">
      <span className="display-eyebrow text-[10px] text-flamingo-dark/70">
        {label}
      </span>
      <span className="text-[10px] font-bold text-flamingo-dark/50">{count}</span>
    </div>
  );
}

function MerchantRow({
  hit,
  focused,
  onHover,
  onPick,
}: {
  hit: Extract<Hit, { kind: "merchant" }>;
  focused: boolean;
  onHover: () => void;
  onPick: () => void;
}) {
  const m = hit.merchant;
  return (
    <li>
      <Link
        href={`/admin/merchants/${m.id}`}
        onMouseEnter={onHover}
        onClick={onPick}
        className={
          "flex items-center gap-3 px-4 py-2.5 text-left transition " +
          (focused ? "bg-flamingo-cream" : "hover:bg-flamingo-cream/60")
        }
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-flamingo-dark bg-flamingo-pink-wash text-sm font-extrabold text-flamingo-dark">
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
        <span
          className={
            "rounded-full border border-flamingo-dark/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide " +
            statusTint(m.status)
          }
        >
          {m.status}
        </span>
      </Link>
    </li>
  );
}

function TxnRow({
  hit,
  focused,
  onHover,
  onPick,
}: {
  hit: Extract<Hit, { kind: "transaction" }>;
  focused: boolean;
  onHover: () => void;
  onPick: () => void;
}) {
  const { txn, merchant } = hit;
  return (
    <li>
      <Link
        href={`/admin/merchants/${merchant.id}#${txn.id}`}
        onMouseEnter={onHover}
        onClick={onPick}
        className={
          "flex items-center gap-3 px-4 py-2.5 text-left transition " +
          (focused ? "bg-flamingo-cream" : "hover:bg-flamingo-cream/60")
        }
      >
        <div
          className={
            "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-flamingo-dark text-[10px] font-extrabold " +
            (txn.rail === "payshap" ? "bg-flamingo-mint" : "bg-flamingo-sky")
          }
        >
          {txn.rail === "payshap" ? "PS" : "EFT"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={
                "truncate text-sm font-extrabold tabular-nums " +
                (txn.status === "refunded"
                  ? "text-flamingo-dark/40 line-through"
                  : "text-flamingo-dark")
              }
            >
              {formatZAR(txn.amount)}
            </span>
            <span className="flex-none text-[11px] font-semibold text-flamingo-dark/60">
              {timeAgo(txn.timestamp)}
            </span>
          </div>
          <p className="truncate text-xs text-flamingo-dark/60">
            <span className="font-mono">{txn.reference}</span> ·{" "}
            {merchant.businessName}
          </p>
        </div>
      </Link>
    </li>
  );
}

function statusTint(status: MerchantApplication["status"]): string {
  switch (status) {
    case "approved":
      return "bg-flamingo-mint text-flamingo-dark";
    case "pending":
      return "bg-flamingo-butter text-flamingo-dark";
    case "rejected":
      return "bg-flamingo-pink-soft text-flamingo-pink-deep";
    case "suspended":
      return "bg-flamingo-dark/10 text-flamingo-dark/70";
  }
}
