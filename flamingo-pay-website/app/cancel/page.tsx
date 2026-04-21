"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

type LookupResult = {
  found: boolean;
  transaction?: {
    reference: string;
    amount: number;
    date: string;
    status: string;
    rail: string;
    buyerBank: string;
    merchantName: string;
  };
  coolingOff?: {
    eligible: boolean;
    withinWindow: boolean;
    remaining: string;
    expiresAt: string;
    alreadyRequested: boolean;
    requestStatus: string | null;
  };
  error?: string;
};

type Step = "lookup" | "confirm" | "submitted";

export default function CancelPage() {
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<Step>("lookup");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!ref.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cooling-off/lookup?ref=${encodeURIComponent(ref.trim())}`);
      const data = await res.json();
      if (!data.found) {
        setError("Transaction not found. Please check your reference number and try again.");
        setResult(null);
      } else {
        setResult(data);
        setError(null);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cooling-off/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: result?.transaction?.reference,
          email: email || undefined,
          phone: phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit cancellation request.");
      } else {
        setRequestId(data.requestId);
        setStep("submitted");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const formatZAR = (n: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);

  return (
    <main className="min-h-dvh bg-flamingo-cream">
      {/* Header */}
      <header className="border-b-2 border-flamingo-dark bg-white">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-flamingo-dark">
            <span className="text-2xl">🦩</span>
            <span>Flamingo Pay</span>
          </Link>
          <span className="rounded-full border-2 border-flamingo-dark bg-flamingo-butter px-3 py-1 text-xs font-bold uppercase tracking-wide">
            Buyer Portal
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Hero */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-flamingo-dark">
            Transaction Cancellation
          </h1>
          <p className="mt-2 text-sm text-flamingo-dark/70">
            Under the ECT Act Section 44 and Consumer Protection Act, you have the right
            to cancel an online transaction within <strong>7 days</strong> of the purchase
            for a full refund — no questions asked.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Lookup */}
          {step === "lookup" && (
            <motion.div
              key="lookup"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <form onSubmit={handleLookup} className="space-y-4">
                <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_4px_0_0_#1A1A2E]">
                  <label className="block text-sm font-bold text-flamingo-dark">
                    Transaction Reference
                  </label>
                  <p className="mt-0.5 text-xs text-flamingo-dark/60">
                    Enter the reference number from your receipt (e.g. FP-123456)
                  </p>
                  <input
                    type="text"
                    value={ref}
                    onChange={e => setRef(e.target.value.toUpperCase())}
                    placeholder="FP-XXXXXX"
                    className="mt-2 w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-4 py-3 text-lg font-bold tracking-wider text-flamingo-dark placeholder:text-flamingo-dark/30 focus:outline-none focus:ring-2 focus:ring-flamingo-pink"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !ref.trim()}
                  className="w-full rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink px-6 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_0_#1A1A2E] transition-all hover:brightness-110 active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                >
                  {loading ? "Looking up…" : "Look Up Transaction"}
                </button>
              </form>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-sm text-red-700"
                >
                  {error}
                </motion.div>
              )}

              {/* Result */}
              {result?.found && result.transaction && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-4"
                >
                  {/* Transaction details */}
                  <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_4px_0_0_#1A1A2E]">
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-flamingo-dark/60">
                      Transaction Found
                    </h3>
                    <div className="mt-3 space-y-2">
                      <Row label="Reference" value={result.transaction.reference} />
                      <Row label="Amount" value={formatZAR(result.transaction.amount)} bold />
                      <Row label="Merchant" value={result.transaction.merchantName} />
                      <Row label="Bank" value={result.transaction.buyerBank} />
                      <Row label="Payment" value={result.transaction.rail === "payshap" ? "PayShap" : "EFT"} />
                      <Row
                        label="Date"
                        value={new Date(result.transaction.date).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      />
                    </div>
                  </div>

                  {/* Cooling-off status */}
                  {result.coolingOff && (
                    <div
                      className={`rounded-2xl border-2 p-5 shadow-[0_4px_0_0_#1A1A2E] ${
                        result.coolingOff.eligible
                          ? "border-green-600 bg-green-50"
                          : "border-flamingo-dark bg-gray-50"
                      }`}
                    >
                      {result.coolingOff.eligible ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">✅</span>
                            <h3 className="font-extrabold text-green-800">Eligible for Cancellation</h3>
                          </div>
                          <p className="mt-1 text-sm text-green-700">
                            This transaction is within the 7-day cooling-off period.
                            <br />
                            <strong>{result.coolingOff.remaining}</strong> until the window closes.
                          </p>
                          <button
                            onClick={() => setStep("confirm")}
                            className="mt-4 w-full rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_0_#1A1A2E] hover:brightness-110 active:translate-y-[2px] active:shadow-none"
                          >
                            Request Cancellation
                          </button>
                        </>
                      ) : result.coolingOff.alreadyRequested ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📋</span>
                            <h3 className="font-extrabold text-flamingo-dark">Request Already Submitted</h3>
                          </div>
                          <p className="mt-1 text-sm text-flamingo-dark/70">
                            A cancellation request for this transaction is{" "}
                            <strong>{result.coolingOff.requestStatus}</strong>.
                            {result.coolingOff.requestStatus === "pending"
                              ? " You'll receive your refund once it's processed."
                              : ""}
                          </p>
                        </>
                      ) : !result.coolingOff.withinWindow ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">⏰</span>
                            <h3 className="font-extrabold text-flamingo-dark">Cooling-Off Period Expired</h3>
                          </div>
                          <p className="mt-1 text-sm text-flamingo-dark/70">
                            The 7-day cooling-off period ended on{" "}
                            <strong>
                              {new Date(result.coolingOff.expiresAt).toLocaleDateString("en-ZA", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </strong>
                            . You may still contact the merchant directly for a refund.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">ℹ️</span>
                            <h3 className="font-extrabold text-flamingo-dark">Not Eligible</h3>
                          </div>
                          <p className="mt-1 text-sm text-flamingo-dark/70">
                            This transaction (status: <strong>{result.transaction.status}</strong>) is not
                            eligible for cooling-off cancellation.
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 2: Confirm */}
          {step === "confirm" && result?.transaction && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_4px_0_0_#1A1A2E]">
                <h3 className="font-extrabold text-flamingo-dark">Confirm Cancellation</h3>
                <p className="mt-1 text-sm text-flamingo-dark/70">
                  You are about to cancel this transaction and request a full refund
                  of <strong>{formatZAR(result.transaction.amount)}</strong> from{" "}
                  <strong>{result.transaction.merchantName}</strong>.
                </p>

                <div className="mt-4 rounded-xl border-2 border-flamingo-dark/20 bg-flamingo-cream p-4 text-sm">
                  <p className="font-bold text-flamingo-dark">Your rights under ECT Act s44:</p>
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-flamingo-dark/70">
                    <li>You may cancel within 7 days of the transaction</li>
                    <li>No penalty or reason required</li>
                    <li>Full refund within 30 days of cancellation</li>
                    <li>Goods must be returned unused (if applicable)</li>
                  </ul>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-flamingo-dark/60">
                      Email (for confirmation)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="mt-1 w-full rounded-xl border-2 border-flamingo-dark/30 bg-white px-3 py-2.5 text-sm text-flamingo-dark placeholder:text-flamingo-dark/30 focus:border-flamingo-pink focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-flamingo-dark/60">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+27..."
                      className="mt-1 w-full rounded-xl border-2 border-flamingo-dark/30 bg-white px-3 py-2.5 text-sm text-flamingo-dark placeholder:text-flamingo-dark/30 focus:border-flamingo-pink focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep("lookup"); setError(null); }}
                  className="flex-1 rounded-2xl border-2 border-flamingo-dark bg-white px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-flamingo-dark shadow-[0_4px_0_0_#1A1A2E] hover:bg-flamingo-cream active:translate-y-[2px] active:shadow-none"
                >
                  Back
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 rounded-2xl border-2 border-flamingo-dark bg-red-600 px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_0_#1A1A2E] hover:bg-red-700 active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                >
                  {loading ? "Submitting…" : "Cancel Transaction"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Submitted */}
          {step === "submitted" && (
            <motion.div
              key="submitted"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="rounded-2xl border-2 border-green-600 bg-green-50 p-6 text-center shadow-[0_4px_0_0_#166534]">
                <div className="text-4xl">✅</div>
                <h3 className="mt-3 text-lg font-extrabold text-green-800">
                  Cancellation Request Submitted
                </h3>
                <p className="mt-2 text-sm text-green-700">
                  Your request has been received and will be processed shortly.
                  The merchant will be notified and your refund of{" "}
                  <strong>{result?.transaction ? formatZAR(result.transaction.amount) : ""}</strong>{" "}
                  will be processed within 7 business days.
                </p>
                {requestId && (
                  <p className="mt-3 text-xs text-green-600">
                    Reference: <span className="font-mono font-bold">{requestId}</span>
                  </p>
                )}
              </div>

              <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_4px_0_0_#1A1A2E]">
                <h4 className="text-sm font-bold text-flamingo-dark">What happens next?</h4>
                <ol className="mt-2 list-decimal pl-5 space-y-1 text-sm text-flamingo-dark/70">
                  <li>Our compliance team reviews your request</li>
                  <li>The merchant is notified of the cancellation</li>
                  <li>Your refund is processed to your original payment method</li>
                  <li>You receive confirmation once the refund is complete</li>
                </ol>
              </div>

              <Link
                href="/"
                className="block w-full rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink px-6 py-3.5 text-center text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_0_#1A1A2E] hover:brightness-110 active:translate-y-[2px] active:shadow-none"
              >
                Back to Home
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legal footer */}
        <div className="mt-12 border-t-2 border-flamingo-dark/10 pt-6 text-center text-xs text-flamingo-dark/50">
          <p>
            Protected by the{" "}
            <Link href="/legal/ecta" className="underline">
              Electronic Communications and Transactions Act
            </Link>{" "}
            (Section 44) and the{" "}
            <Link href="/legal/cpa" className="underline">
              Consumer Protection Act
            </Link>{" "}
            (Section 16).
          </p>
          <p className="mt-1">
            Questions?{" "}
            <a href="mailto:support@flamingopay.co.za" className="underline">
              support@flamingopay.co.za
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-flamingo-dark/60">{label}</span>
      <span className={`text-flamingo-dark ${bold ? "text-base font-extrabold" : "font-bold"}`}>
        {value}
      </span>
    </div>
  );
}
