"use client";

import { useState } from "react";
import Link from "next/link";

type RequesterType = "buyer" | "merchant";
type RequestType = "access" | "deletion";

export default function DsarPage() {
  const [requestType, setRequestType] = useState<RequestType>("access");
  const [requesterType, setRequesterType] = useState<RequesterType>("buyer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ ref: string; deadline: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !email || !phone || !description) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/dsar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType,
          requesterType,
          fullName,
          email,
          phone,
          idNumber: idNumber || undefined,
          merchantId: requesterType === "merchant" ? merchantId || undefined : undefined,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit request.");
        return;
      }
      setResult(data.dsar);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

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
            Request your data
          </h1>
          <p className="mt-1 text-sm text-flamingo-dark/60">
            POPIA Section 23 — You have the right to know what personal data we hold about you.
          </p>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRequesterType("buyer")}
                className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition ${
                  requesterType === "buyer"
                    ? "border-flamingo-dark bg-flamingo-pink text-white shadow-[0_3px_0_0_#1A1A2E]"
                    : "border-flamingo-dark/20 text-flamingo-dark/60 hover:bg-white"
                }`}
              >
                I&apos;m a buyer
              </button>
              <button
                type="button"
                onClick={() => setRequesterType("merchant")}
                className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition ${
                  requesterType === "merchant"
                    ? "border-flamingo-dark bg-flamingo-pink text-white shadow-[0_3px_0_0_#1A1A2E]"
                    : "border-flamingo-dark/20 text-flamingo-dark/60 hover:bg-white"
                }`}
              >
                I&apos;m a merchant
              </button>
            </div>

            {/* Request type toggle */}
            <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_6px_0_0_#1A1A2E]">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                What would you like to do?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRequestType("access")}
                  className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition ${
                    requestType === "access"
                      ? "border-flamingo-dark bg-blue-600 text-white shadow-[0_3px_0_0_#1A1A2E]"
                      : "border-flamingo-dark/20 text-flamingo-dark/60 hover:bg-flamingo-cream"
                  }`}
                >
                  Get my data
                </button>
                <button
                  type="button"
                  onClick={() => setRequestType("deletion")}
                  className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition ${
                    requestType === "deletion"
                      ? "border-flamingo-dark bg-red-600 text-white shadow-[0_3px_0_0_#1A1A2E]"
                      : "border-flamingo-dark/20 text-flamingo-dark/60 hover:bg-flamingo-cream"
                  }`}
                >
                  Delete my data
                </button>
              </div>
              <p className="mt-2 text-xs text-flamingo-dark/50">
                {requestType === "access"
                  ? "POPIA Section 23 — We'll compile all personal data we hold about you into a downloadable export."
                  : "POPIA Section 24 — We'll delete or anonymize your personal data. Financial records required by FICA will be retained for the 5-year regulatory period."}
              </p>
            </div>

            {/* Form */}
            <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_6px_0_0_#1A1A2E]">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                Your details
              </p>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/50">Full name *</span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sipho Ndlovu"
                    className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-sm font-semibold text-flamingo-dark outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/50">Email address *</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.co.za"
                    className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-sm font-semibold text-flamingo-dark outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/50">Phone number *</span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 072 123 4567"
                    className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-sm font-semibold text-flamingo-dark outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/50">
                    SA ID number (last 4 digits — for verification)
                  </span>
                  <input
                    type="text"
                    maxLength={4}
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 5083"
                    className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-sm font-semibold text-flamingo-dark outline-none"
                  />
                </label>

                {requesterType === "merchant" && (
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/50">
                      Merchant ID (from your dashboard)
                    </span>
                    <input
                      type="text"
                      value={merchantId}
                      onChange={(e) => setMerchantId(e.target.value)}
                      placeholder="e.g. m_abc123"
                      className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-sm font-mono font-semibold text-flamingo-dark outline-none"
                    />
                  </label>
                )}

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/50">
                    What data are you requesting? *
                  </span>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder={
                      requestType === "deletion"
                        ? "e.g. Please delete all my personal data. I understand financial records will be retained per FICA requirements."
                        : requesterType === "buyer"
                          ? "e.g. All personal data you hold about me, including transaction history and dispute records"
                          : "e.g. All data related to my merchant account, including KYC documents, transactions, and compliance flags"
                    }
                    className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-sm text-flamingo-dark outline-none"
                  />
                </label>
              </div>
            </div>

            {/* Legal notice */}
            <div className={`rounded-xl border-2 p-4 ${
              requestType === "deletion" ? "border-red-200 bg-red-50" : "border-flamingo-dark/10 bg-white"
            }`}>
              {requestType === "access" ? (
                <p className="text-xs text-flamingo-dark/60">
                  Under POPIA Section 23, Flamingo Pay must respond to your request within{" "}
                  <span className="font-bold">30 days</span>. We may need to verify your identity before
                  processing your request. Your data will be provided as a downloadable export.
                </p>
              ) : (
                <div className="text-xs text-red-700/80 space-y-1.5">
                  <p>
                    Under POPIA Section 24, you may request deletion of your personal data. Flamingo Pay must respond within{" "}
                    <span className="font-bold">30 days</span>.
                  </p>
                  <p>
                    <span className="font-bold">Important:</span> As a financial services provider, we are required by the{" "}
                    <span className="font-bold">FICA Act (No. 38 of 2001)</span> to retain certain financial records
                    (transactions, KYC documents, compliance flags) for <span className="font-bold">5 years</span>.
                    These records will be retained but your non-essential personal information will be anonymized immediately.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !fullName || !email || !phone || !description}
              className="w-full rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink px-4 py-4 text-base font-extrabold text-white shadow-[0_4px_0_0_#1A1A2E] transition hover:bg-flamingo-pink-deep disabled:opacity-50"
            >
              {submitting ? "Submitting..." : requestType === "deletion" ? "Submit deletion request" : "Submit data request"}
            </button>

            <div className="text-center">
              <Link href="/dsar/status" className="text-sm font-semibold text-flamingo-pink hover:underline">
                Already submitted a request? Check status &rarr;
              </Link>
            </div>
          </form>
        ) : (
          /* Success */
          <div className="text-center">
            <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-green-100 text-4xl">
              &#10003;
            </div>
            <h2 className="display text-2xl font-extrabold text-flamingo-dark">Request submitted</h2>
            <p className="mt-2 text-sm text-flamingo-dark/60">Your reference number:</p>
            <p className="mt-1 rounded-xl border-2 border-flamingo-dark bg-white px-4 py-3 font-mono text-2xl font-extrabold text-flamingo-pink shadow-[0_4px_0_0_#1A1A2E]">
              {result.ref}
            </p>
            <p className="mt-4 text-sm text-flamingo-dark/60">
              We must respond by <span className="font-bold">{formatDate(result.deadline)}</span> (30 days per POPIA).
              We&apos;ll verify your identity and then {requestType === "deletion" ? "process your deletion request" : "prepare your data export"}.
            </p>
            <div className="mt-6 space-y-3">
              <Link
                href={`/dsar/status?ref=${result.ref}`}
                className="block rounded-xl border-2 border-flamingo-dark bg-flamingo-pink px-4 py-3 text-sm font-extrabold text-white shadow-[0_3px_0_0_#1A1A2E] transition hover:bg-flamingo-pink-deep"
              >
                Check request status
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
