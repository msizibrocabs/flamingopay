"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MerchantGate } from "../_components/MerchantGate";
import { TabBar } from "../_components/TabBar";
import { TopBar } from "../_components/TopBar";
import { currentMerchantId } from "../../../lib/merchant";

type Mode = "month" | "custom";

export default function StatementsPage() {
  return (
    <MerchantGate>
      <Inner />
    </MerchantGate>
  );
}

function Inner() {
  const merchantId = currentMerchantId();
  const [mode, setMode] = useState<Mode>("month");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    // Default to previous month
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  // Build available months (last 12 months)
  const months: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 1; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
    months.push({ value, label });
  }

  async function handleDownload() {
    setError("");
    setDownloading(true);

    try {
      let url: string;
      if (mode === "month") {
        url = `/api/merchants/${merchantId}/statement?month=${selectedMonth}`;
      } else {
        if (!dateFrom || !dateTo) {
          setError("Please select both a start and end date.");
          setDownloading(false);
          return;
        }
        if (dateFrom > dateTo) {
          setError("Start date must be before end date.");
          setDownloading(false);
          return;
        }
        url = `/api/merchants/${merchantId}/statement?from=${dateFrom}&to=${dateTo}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to generate statement.");
        return;
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      // Extract filename from content-disposition header
      const cd = res.headers.get("content-disposition");
      const match = cd?.match(/filename="?([^"]+)"?/);
      a.download = match?.[1] || "flamingo-statement.pdf";
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-flamingo-cream pb-28">
      <TopBar title="Statements" subtitle="Download monthly or custom-range statements" />

      <div className="mx-auto max-w-md px-4 pt-4">
        {/* Intro card */}
        <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_6px_0_0_#1A1A2E]">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 flex-none place-items-center rounded-xl border-2 border-flamingo-dark bg-flamingo-pink shadow-[0_3px_0_0_#1A1A2E]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" strokeLinejoin="round" />
                <path d="M14 2v6h6" strokeLinejoin="round" />
                <path d="M16 13H8M16 17H8M10 9H8" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 className="display text-base font-extrabold text-flamingo-dark">
                Merchant Statement
              </h2>
              <p className="text-xs text-flamingo-dark/60">
                Official PDF with your logo, transactions, fees & net payout
              </p>
            </div>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setMode("month")}
            className={`flex-1 rounded-2xl border-2 border-flamingo-dark px-4 py-3 text-sm font-extrabold transition ${
              mode === "month"
                ? "bg-flamingo-pink text-white shadow-[0_4px_0_0_#B42A48]"
                : "bg-white text-flamingo-dark shadow-[0_4px_0_0_#1A1A2E]"
            }`}
          >
            By month
          </button>
          <button
            onClick={() => setMode("custom")}
            className={`flex-1 rounded-2xl border-2 border-flamingo-dark px-4 py-3 text-sm font-extrabold transition ${
              mode === "custom"
                ? "bg-flamingo-pink text-white shadow-[0_4px_0_0_#B42A48]"
                : "bg-white text-flamingo-dark shadow-[0_4px_0_0_#1A1A2E]"
            }`}
          >
            Custom dates
          </button>
        </div>

        {/* Month picker */}
        {mode === "month" && (
          <div className="mt-4 rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_6px_0_0_#1A1A2E]">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                Select month
              </span>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="mt-2 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-4 py-3 text-sm font-bold text-flamingo-dark"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-2 text-[10px] text-flamingo-dark/50">
              Statement covers the full calendar month (1st to last day).
            </p>
          </div>
        )}

        {/* Custom date range */}
        {mode === "custom" && (
          <div className="mt-4 rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_6px_0_0_#1A1A2E]">
            <div className="flex gap-3">
              <label className="flex-1">
                <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                  From
                </span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  max={dateTo || undefined}
                  className="mt-2 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-sm font-bold text-flamingo-dark [color-scheme:light]"
                />
              </label>
              <label className="flex-1">
                <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                  To
                </span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  min={dateFrom || undefined}
                  className="mt-2 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-sm font-bold text-flamingo-dark [color-scheme:light]"
                />
              </label>
            </div>
            <p className="mt-2 text-[10px] text-flamingo-dark/50">
              Pick any date range for a custom statement.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mt-3 rounded-lg bg-flamingo-pink-soft px-3 py-2 text-sm font-semibold text-flamingo-pink-deep">
            {error}
          </p>
        )}

        {/* Download button */}
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleDownload}
          disabled={downloading}
          className="btn-pink mt-5 w-full rounded-2xl border-2 border-flamingo-dark px-4 py-4 text-base font-extrabold uppercase tracking-wide disabled:opacity-70"
        >
          {downloading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-3 w-3 animate-ping rounded-full bg-white" />
              Generating PDF…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
              </svg>
              Download Statement PDF
            </span>
          )}
        </motion.button>

        {/* What's included */}
        <div className="mt-5 rounded-2xl border-2 border-dashed border-flamingo-dark/20 bg-white p-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-flamingo-dark/60">
            What&apos;s on the statement
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-flamingo-dark/70">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-flamingo-mint text-[10px] font-bold">F</span>
              <span>Flamingo Pay logo, company registration & SARB reference</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-flamingo-butter text-[10px] font-bold">M</span>
              <span>Your business name, owner, phone & merchant ID</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-flamingo-sky text-[10px] font-bold">B</span>
              <span>Bank details — name, account (masked), account type</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-flamingo-pink-soft text-[10px] font-bold">T</span>
              <span>Full transaction table with date, rail, bank, amount, fees & net</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-flamingo-cream text-[10px] font-bold border border-flamingo-dark/20">$</span>
              <span>Summary: gross sales, total fees, refunds & net payout</span>
            </li>
          </ul>
        </div>
      </div>

      <TabBar />
    </main>
  );
}
