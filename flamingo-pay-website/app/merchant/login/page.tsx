"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn } from "../../../lib/merchant";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [lockCountdown, setLockCountdown] = useState(0);

  // Countdown timer when locked out
  useEffect(() => {
    if (!lockedUntil) { setLockCountdown(0); return; }
    function tick() {
      const remaining = Math.max(0, Math.ceil((new Date(lockedUntil!).getTime() - Date.now()) / 1000));
      setLockCountdown(remaining);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttemptsLeft(null);
        setError("");
      }
    }
    tick();
    const handle = setInterval(tick, 1000);
    return () => clearInterval(handle);
  }, [lockedUntil]);

  const isLocked = lockCountdown > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!phone.trim()) {
      setError("Enter your phone number.");
      return;
    }
    if (pin.length !== 4) {
      setError("PIN must be 4 digits.");
      return;
    }
    if (isLocked) return;

    setLoading(true);
    try {
      // Normalise phone to +27 format
      const digits = phone.replace(/\D/g, "");
      let prettyPhone: string;
      if (digits.startsWith("27") && digits.length === 11) {
        // Already has country code: 27821234567
        const local = digits.slice(2);
        prettyPhone = `+27 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
      } else if (digits.startsWith("0") && digits.length === 10) {
        // Local format: 0821234567
        const local = digits.slice(1);
        prettyPhone = `+27 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
      } else if (digits.length === 9) {
        // Without leading 0: 821234567
        prettyPhone = `+27 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
      } else {
        prettyPhone = `+27 ${digits}`;
      }

      const res = await fetch("/api/auth/merchant-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: prettyPhone, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed.");
        if (data.attemptsLeft != null) setAttemptsLeft(data.attemptsLeft);
        if (data.lockedUntil) setLockedUntil(data.lockedUntil);
        setPin("");
        return;
      }

      // Success
      signIn(data.merchant.id);
      if (data.merchant.status === "approved") {
        router.push("/merchant/dashboard");
      } else {
        router.push("/merchant/pending");
      }
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const lockMin = Math.ceil(lockCountdown / 60);
  const lockSec = lockCountdown % 60;

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
                placeholder="82 123 4567"
                disabled={isLocked}
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
              disabled={isLocked}
              required
            />
          </label>

          {error && (
            <div className="mt-3 rounded-lg bg-flamingo-pink-soft px-3 py-2">
              <p className="text-sm font-semibold text-flamingo-pink-deep">
                {error}
              </p>
              {attemptsLeft != null && attemptsLeft > 0 && (
                <p className="mt-1 text-xs text-flamingo-pink-deep/80">
                  {attemptsLeft} {attemptsLeft === 1 ? "attempt" : "attempts"} remaining before your account is temporarily locked.
                </p>
              )}
            </div>
          )}

          {isLocked && (
            <div className="mt-3 rounded-lg border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                Account temporarily locked
              </p>
              <p className="mt-1 display text-2xl font-black text-flamingo-dark tabular-nums">
                {lockMin}:{lockSec.toString().padStart(2, "0")}
              </p>
              <p className="mt-1 text-xs text-flamingo-dark/60">
                Too many incorrect attempts. Please wait and try again.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isLocked}
            className="btn-pink mt-5 w-full rounded-2xl border-2 border-flamingo-dark px-4 py-3.5 text-base font-extrabold uppercase tracking-wide disabled:opacity-70"
          >
            {loading ? "Signing in…" : isLocked ? "Locked" : "Sign in"}
          </button>

          <p className="mt-4 text-center text-xs text-flamingo-dark/60">
            Enter the phone number and PIN you set during signup.
          </p>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <button
            type="button"
            className="font-semibold text-flamingo-pink-deep underline-offset-2 hover:underline"
            onClick={() => window.open("https://wa.me/27639477208?text=Hi%20Flamingo%2C%20I%20forgot%20my%20PIN%20and%20need%20help%20resetting%20it.", "_blank")}
          >
            Forgot PIN?
          </button>
          <div className="text-flamingo-dark/70">
            New to Flamingo?{" "}
            <Link href="/merchant/signup" className="font-bold text-flamingo-pink-deep underline-offset-2 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
