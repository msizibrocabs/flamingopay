"use client";

import { useState } from "react";
import Link from "next/link";

type Step = "find" | "select" | "form" | "done";
type FindMethod = "reference" | "search";

type TxnResult = {
  txnId: string;
  txnRef: string;
  amount: number;
  date: string;
  merchantId: string;
  merchantName: string;
  rail: string;
  buyerBank: string;
};

const REASONS = [
  { value: "wrong_amount", label: "Wrong amount charged", desc: "The merchant entered the wrong amount and I paid too much or too little." },
  { value: "goods_not_received", label: "Goods or services not received", desc: "I paid but the merchant didn't give me my goods or provide the service." },
  { value: "duplicate_charge", label: "Duplicate charge", desc: "I was charged twice for the same purchase." },
  { value: "unauthorized", label: "Unauthorized transaction", desc: "I didn't make this payment — someone else used my details." },
  { value: "payment_error", label: "Payment to wrong merchant", desc: "I accidentally paid the wrong merchant." },
  { value: "other", label: "Other", desc: "Something else went wrong." },
];

export default function DisputePage() {
  const [step, setStep] = useState<Step>("find");
  const [findMethod, setFindMethod] = useState<FindMethod>("reference");

  // Find by reference
  const [txnRef, setTxnRef] = useState("");

  // Find by search
  const [searchAmount, setSearchAmount] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchMerchant, setSearchMerchant] = useState("");

  // Transaction results
  const [results, setResults] = useState<TxnResult[]>([]);
  const [selectedTxn, setSelectedTxn] = useState<TxnResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Dispute form
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [disputeRef, setDisputeRef] = useState("");
  const [submitError, setSubmitError] = useState("");

  async function handleFindByRef() {
    if (!txnRef.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const res = await fetch(`/api/receipt/${txnRef.trim()}`);
      if (!res.ok) {
        setSearchError("Transaction not found. Check your reference and try again.");
        return;
      }
      const data = await res.json();
      const txn = data.txn;
      setSelectedTxn({
        txnId: txn.id,
        txnRef: txn.reference,
        amount: txn.amount,
        date: txn.timestamp,
        merchantId: data.merchantId,
        merchantName: data.merchantName,
        rail: txn.rail,
        buyerBank: txn.buyerBank,
      });
      setStep("form");
    } catch {
      setSearchError("Something went wrong. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  async function handleSearch() {
    if (!searchAmount && !searchDate) {
      setSearchError("Please enter at least an amount or date.");
      return;
    }
    setSearching(true);
    setSearchError("");
    try {
      const res = await fetch("/api/disputes/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: searchAmount ? Number(searchAmount) : undefined,
          dateFrom: searchDate ? `${searchDate}T00:00:00.000Z` : undefined,
          dateTo: searchDate ? `${searchDate}T23:59:59.999Z` : undefined,
          merchantName: searchMerchant || undefined,
        }),
      });
      const data = await res.json();
      if (data.transactions?.length > 0) {
        setResults(data.transactions);
        setStep("select");
      } else {
        setSearchError("No matching transactions found. Try adjusting your search.");
      }
    } catch {
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  function selectTransaction(txn: TxnResult) {
    setSelectedTxn(txn);
    setStep("form");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTxn || !reason || !description) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txnId: selectedTxn.txnId,
          txnRef: selectedTxn.txnRef,
          merchantId: selectedTxn.merchantId,
          merchantName: selectedTxn.merchantName,
          amount: selectedTxn.amount,
          txnDate: selectedTxn.date,
          buyerPhone: buyerPhone || undefined,
          buyerEmail: buyerEmail || undefined,
          reason,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Failed to submit dispute.");
        return;
      }
      setDisputeRef(data.dispute.ref);
      setStep("done");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const formatZAR = (n: number) => `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
  const formatDate = (s: string) => new Date(s).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

  return (
    <main className="min-h-dvh bg-flamingo-cream">
      <div className="mx-auto max-w-lg px-5 py-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink shadow-[0_4px_0_0_#1A1A2E]">
              <span className="display text-2xl font-extrabold text-white">F</span>
            </div>
          </Link>
          <h1 className="display mt-3 text-2xl font-extrabold text-flamingo-dark">
            Report a problem
          </h1>
          <p className="mt-1 text-sm text-flamingo-dark/60">
            Had an issue with a payment? We&apos;ll help sort it out.
          </p>
        </div>

        {/* Step: Find transaction */}
        {step === "find" && (
          <div className="space-y-4">
            {/* Method toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => { setFindMethod("reference"); setSearchError(""); }}
                className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition ${
                  findMethod === "reference"
                    ? "border-flamingo-dark bg-flamingo-pink text-white shadow-[0_3px_0_0_#1A1A2E]"
                    : "border-flamingo-dark/20 text-flamingo-dark/60 hover:bg-white"
                }`}
              >
                I have my reference
              </button>
              <button
                onClick={() => { setFindMethod("search"); setSearchError(""); }}
                className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition ${
                  findMethod === "search"
                    ? "border-flamingo-dark bg-flamingo-pink text-white shadow-[0_3px_0_0_#1A1A2E]"
                    : "border-flamingo-dark/20 text-flamingo-dark/60 hover:bg-white"
                }`}
              >
                I lost my reference
              </button>
            </div>

            {findMethod === "reference" ? (
              <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_6px_0_0_#1A1A2E]">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                    Transaction reference
                  </span>
                  <input
                    type="text"
                    value={txnRef}
                    onChange={e => setTxnRef(e.target.value)}
                    placeholder="e.g. FP-12345 or transaction ID"
                    className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-base font-semibold text-flamingo-dark outline-none"
                  />
                </label>
                <p className="mt-2 text-xs text-flamingo-dark/50">
                  Find this on your payment receipt or bank statement.
                </p>
                <button
                  onClick={handleFindByRef}
                  disabled={searching || !txnRef.trim()}
                  className="mt-3 w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-pink px-4 py-3 text-sm font-extrabold text-white shadow-[0_3px_0_0_#1A1A2E] transition hover:bg-flamingo-pink-deep disabled:opacity-50"
                >
                  {searching ? "Looking up..." : "Find transaction"}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_6px_0_0_#1A1A2E]">
                <p className="mb-3 text-xs font-semibold text-flamingo-dark/60">
                  Enter what you remember and we&apos;ll find matching transactions.
                </p>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">Amount paid</span>
                  <input
                    type="number"
                    value={searchAmount}
                    onChange={e => setSearchAmount(e.target.value)}
                    placeholder="e.g. 45.00"
                    className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-base font-semibold text-flamingo-dark outline-none"
                  />
                </label>
                <label className="mt-3 block">
                  <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">Date of payment</span>
                  <input
                    type="date"
                    value={searchDate}
                    onChange={e => setSearchDate(e.target.value)}
                    className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-base font-semibold text-flamingo-dark outline-none"
                  />
                </label>
                <label className="mt-3 block">
                  <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">Merchant / shop name (optional)</span>
                  <input
                    type="text"
                    value={searchMerchant}
                    onChange={e => setSearchMerchant(e.target.value)}
                    placeholder="e.g. Thandi's Spaza"
                    className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-base font-semibold text-flamingo-dark outline-none"
                  />
                </label>
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="mt-4 w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-pink px-4 py-3 text-sm font-extrabold text-white shadow-[0_3px_0_0_#1A1A2E] transition hover:bg-flamingo-pink-deep disabled:opacity-50"
                >
                  {searching ? "Searching..." : "Search transactions"}
                </button>
              </div>
            )}

            {searchError && (
              <p className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{searchError}</p>
            )}

            <div className="text-center">
              <Link href="/dispute/check" className="text-sm font-semibold text-flamingo-pink hover:underline">
                Already filed a dispute? Check status &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Step: Select from search results */}
        {step === "select" && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-flamingo-dark/70">Select the transaction you want to dispute:</p>
            {results.map(txn => (
              <button
                key={txn.txnId}
                onClick={() => selectTransaction(txn)}
                className="w-full rounded-2xl border-2 border-flamingo-dark bg-white p-4 text-left transition hover:bg-red-50 shadow-[0_4px_0_0_#1A1A2E]"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-extrabold text-flamingo-dark">{formatZAR(txn.amount)}</span>
                  <span className="text-xs font-semibold text-flamingo-dark/50">{formatDate(txn.date)}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-flamingo-dark/70">{txn.merchantName}</p>
                <p className="text-xs text-flamingo-dark/50">Ref: {txn.txnRef} · {txn.buyerBank} · {txn.rail === "payshap" ? "PayShap" : "EFT"}</p>
              </button>
            ))}
            <button onClick={() => { setStep("find"); setResults([]); }} className="text-sm font-semibold text-flamingo-dark/50 hover:underline">
              &larr; Back to search
            </button>
          </div>
        )}

        {/* Step: Dispute form */}
        {step === "form" && selectedTxn && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Transaction summary */}
            <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_4px_0_0_#1A1A2E]">
              <p className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/50">Disputing</p>
              <p className="mt-1 text-xl font-extrabold text-flamingo-dark">{formatZAR(selectedTxn.amount)}</p>
              <p className="text-sm text-flamingo-dark/70">{selectedTxn.merchantName} · {formatDate(selectedTxn.date)}</p>
              <p className="text-xs text-flamingo-dark/50">Ref: {selectedTxn.txnRef}</p>
            </div>

            {/* Reason */}
            <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_6px_0_0_#1A1A2E]">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">What went wrong?</p>
              <div className="space-y-2">
                {REASONS.map(r => (
                  <label key={r.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition ${
                    reason === r.value ? "border-flamingo-pink bg-red-50" : "border-flamingo-dark/10 hover:border-flamingo-dark/30"
                  }`}>
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="mt-0.5 accent-flamingo-pink"
                    />
                    <div>
                      <p className="text-sm font-bold text-flamingo-dark">{r.label}</p>
                      <p className="text-xs text-flamingo-dark/50">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">Tell us more</span>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  required
                  placeholder="Describe what happened..."
                  className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-sm text-flamingo-dark outline-none"
                />
              </label>

              <p className="mt-4 mb-2 text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">Your contact details (so we can update you)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="tel"
                  value={buyerPhone}
                  onChange={e => setBuyerPhone(e.target.value)}
                  placeholder="Phone number"
                  className="rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-sm font-semibold text-flamingo-dark outline-none"
                />
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={e => setBuyerEmail(e.target.value)}
                  placeholder="Email (optional)"
                  className="rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-sm font-semibold text-flamingo-dark outline-none"
                />
              </div>
            </div>

            {submitError && (
              <p className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !reason || !description}
              className="w-full rounded-2xl border-2 border-flamingo-dark bg-red-600 px-4 py-4 text-base font-extrabold text-white shadow-[0_4px_0_0_#1A1A2E] transition hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit dispute"}
            </button>

            <button type="button" onClick={() => setStep("find")} className="block w-full text-center text-sm font-semibold text-flamingo-dark/50 hover:underline">
              &larr; Start over
            </button>
          </form>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="text-center">
            <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-green-100 text-4xl">
              &#10003;
            </div>
            <h2 className="display text-2xl font-extrabold text-flamingo-dark">Dispute submitted</h2>
            <p className="mt-2 text-sm text-flamingo-dark/60">
              Your reference number:
            </p>
            <p className="mt-1 rounded-xl border-2 border-flamingo-dark bg-white px-4 py-3 font-mono text-2xl font-extrabold text-flamingo-pink shadow-[0_4px_0_0_#1A1A2E]">
              {disputeRef}
            </p>
            <p className="mt-4 text-sm text-flamingo-dark/60">
              Save this reference number. The merchant has 48 hours to respond. We&apos;ll notify you via the contact details you provided.
            </p>
            <div className="mt-6 space-y-3">
              <Link
                href={`/dispute/check?ref=${disputeRef}`}
                className="block rounded-xl border-2 border-flamingo-dark bg-flamingo-pink px-4 py-3 text-sm font-extrabold text-white shadow-[0_3px_0_0_#1A1A2E] transition hover:bg-flamingo-pink-deep"
              >
                Check dispute status
              </Link>
              <Link href="/" className="block text-sm font-semibold text-flamingo-dark/50 hover:underline">
                Back to home
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
