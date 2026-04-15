"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "../../../lib/merchant";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("082 555 0142");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pin.length !== 4) {
      setError("PIN must be 4 digits.");
      return;
    }
    setLoading(true);
    // Fake latency
    setTimeout(() => {
      signIn();
      router.push("/merchant/dashboard");
    }, 500);
  }

  return (
    <main className="min-h-dvh bg-flamingo-cream">
      <div className="mx-auto flex max-w-md flex-col px-5 py-8">
        {/* Logo + brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink shadow-[0_6px_0_0_#1A1A2E]">
            <span className="display text-4xl font-extrabold text-white">F</span>
          </div>
          <h1 className="display mt-4 text-3xl font-extrabold text-flamingo-dark">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-flamingo-dark/70">
            Sign in to your Flamingo merchant account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]"
        >
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
              Phone number
            </span>
            <div className="mt-1 flex items-center gap-2 rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3">
              <span className="text-sm font-bold text-flamingo-dark">+27</span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-flamingo-dark outline-none placeholder:text-flamingo-dark/40"
                placeholder="82 555 0142"
                required
              />
            </div>
          </label>

          <label className="mt-4 block">
            <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
              4-digit PIN
            </span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              pattern="\d{4}"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-2xl font-bold tracking-[0.6em] text-flamingo-dark outline-none placeholder:tracking-normal placeholder:text-flamingo-dark/40 placeholder:text-base"
              placeholder="• • • •"
              required
            />
          </label>

          {error && (
            <p className="mt-3 rounded-lg bg-flamingo-pink-soft px-3 py-2 text-sm font-semibold text-flamingo-pink-deep">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-pink mt-5 w-full rounded-2xl border-2 border-flamingo-dark px-4 py-3.5 text-base font-extrabold uppercase tracking-wide disabled:opacity-70"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="mt-4 text-center text-xs text-flamingo-dark/60">
            Demo mode — any 4-digit PIN signs you in
          </p>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <button
            type="button"
            className="font-semibold text-flamingo-pink-deep underline-offset-2 hover:underline"
          >
            Forgot PIN?
          </button>
          <div className="text-flamingo-dark/70">
            New to Flamingo?{" "}
            <Link href="/#merchants" className="font-bold text-flamingo-pink-deep underline-offset-2 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
