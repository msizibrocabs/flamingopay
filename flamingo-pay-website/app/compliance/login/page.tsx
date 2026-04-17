"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { complianceSignIn, DEMO_COMPLIANCE_PASSCODE } from "../../../lib/compliance";

export default function ComplianceLoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (code !== DEMO_COMPLIANCE_PASSCODE) {
      setError("Incorrect compliance passcode.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      complianceSignIn(name.trim());
      router.push("/compliance");
    }, 400);
  }

  return (
    <main className="min-h-dvh bg-flamingo-cream">
      <div className="mx-auto flex max-w-md flex-col px-5 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-flamingo-dark bg-red-600 shadow-[0_6px_0_0_#1A1A2E]">
            <span className="display text-4xl font-extrabold text-white">C</span>
          </div>
          <h1 className="display mt-4 text-3xl font-extrabold text-flamingo-dark">
            Compliance Portal
          </h1>
          <p className="mt-1 text-sm text-flamingo-dark/70">
            Transaction monitoring &amp; fraud prevention
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]"
        >
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
              Your name
            </span>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-base font-semibold text-flamingo-dark outline-none"
              placeholder="e.g. Sipho Dlamini"
              required
            />
          </label>

          <label className="mt-4 block">
            <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
              Compliance passcode
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-base font-semibold tracking-widest text-flamingo-dark outline-none"
              placeholder="••••••••"
              required
            />
          </label>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-2xl border-2 border-flamingo-dark bg-red-600 px-4 py-3.5 text-base font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_0_#1A1A2E] transition hover:bg-red-700 active:translate-y-[2px] active:shadow-[0_2px_0_0_#1A1A2E] disabled:opacity-70"
          >
            {loading ? "Signing in…" : "Enter compliance portal"}
          </button>

          <p className="mt-4 text-center text-xs text-flamingo-dark/60">
            Demo passcode: <span className="font-mono font-bold">{DEMO_COMPLIANCE_PASSCODE}</span>
          </p>
        </form>
      </div>
    </main>
  );
}
