"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = "phone" | "otp" | "new_pin";

export default function ForgotPinPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [devOTP, setDevOTP] = useState<string | null>(null);

  function normalisePhone(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("27") && digits.length === 11) {
      const local = digits.slice(2);
      return `+27 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
    }
    if (digits.startsWith("0") && digits.length === 10) {
      const local = digits.slice(1);
      return `+27 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
    }
    if (digits.length === 9) {
      return `+27 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }
    return `+27 ${digits}`;
  }

  async function sendOTP() {
    setError("");
    const clean = phone.replace(/\s/g, "");
    if (clean.length < 9 || !/^\d+$/.test(clean)) {
      setError("Enter a valid SA phone number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalisePhone(phone),
          purpose: "pin_reset",
          action: "send",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send OTP. Try again.");
        return;
      }
      if (data.devOTP) setDevOTP(data.devOTP);
      setStep("otp");
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOTP() {
    setError("");
    if (otp.length !== 6) {
      setError("Enter the 6-digit code we sent you");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalisePhone(phone),
          purpose: "pin_reset",
          action: "verify",
          code: otp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code. Try again.");
        return;
      }
      setStep("new_pin");
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPin() {
    setError("");
    if (newPin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      setError("PINs don't match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/pin-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalisePhone(phone),
          newPin,
          otpCode: otp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not reset PIN. Try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === "phone") sendOTP();
    else if (step === "otp") verifyOTP();
    else if (step === "new_pin") resetPin();
  }

  const titles: Record<Step, { title: string; sub: string }> = {
    phone: {
      title: "Reset your PIN",
      sub: "Enter the phone number you signed up with",
    },
    otp: {
      title: "Check your SMS",
      sub: "We sent a 6-digit code to your phone",
    },
    new_pin: {
      title: "Set a new PIN",
      sub: "Choose a 4-digit PIN you'll remember",
    },
  };

  if (success) {
    return (
      <main className="min-h-dvh bg-flamingo-cream">
        <div className="mx-auto flex max-w-md flex-col items-center px-5 py-16 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-flamingo-dark bg-green-400 shadow-[0_6px_0_0_#1A1A2E]">
            <span className="text-4xl">✓</span>
          </div>
          <h1 className="display mt-6 text-3xl font-extrabold text-flamingo-dark">
            PIN reset!
          </h1>
          <p className="mt-2 text-sm text-flamingo-dark/70">
            Your new PIN is ready. Sign in with it now.
          </p>
          <Link
            href="/merchant/login"
            className="btn-pink mt-8 rounded-2xl border-2 border-flamingo-dark px-8 py-3.5 text-base font-extrabold uppercase tracking-wide"
          >
            Sign in →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-flamingo-cream">
      <div className="mx-auto flex max-w-md flex-col px-5 py-8">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink shadow-[0_6px_0_0_#1A1A2E]">
            <span className="display text-4xl font-extrabold text-white">F</span>
          </div>
          <h1 className="display mt-4 text-3xl font-extrabold text-flamingo-dark">
            {titles[step].title}
          </h1>
          <p className="mt-1 text-sm text-flamingo-dark/70">
            {titles[step].sub}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]"
        >
          {/* Step 1: Phone */}
          {step === "phone" && (
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
                  placeholder="82 123 4567"
                  className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-flamingo-dark outline-none placeholder:text-flamingo-dark/40"
                  required
                />
              </div>
            </label>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                  6-digit verification code
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="• • • • • •"
                  className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-2xl font-bold tracking-[0.5em] text-flamingo-dark outline-none placeholder:tracking-normal placeholder:text-flamingo-dark/40 placeholder:text-base"
                  required
                />
              </label>
              {devOTP && (
                <p className="text-[11px] text-flamingo-dark/60">
                  Dev mode — your code is: <span className="font-bold">{devOTP}</span>
                </p>
              )}
              <button
                type="button"
                onClick={() => { setOtp(""); sendOTP(); }}
                className="text-xs font-semibold text-flamingo-pink-deep underline-offset-2 hover:underline"
              >
                Didn&apos;t get the SMS? Send again
              </button>
            </div>
          )}

          {/* Step 3: New PIN */}
          {step === "new_pin" && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                  New 4-digit PIN
                </span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="• • • •"
                  className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-2xl font-bold tracking-[0.6em] text-flamingo-dark outline-none placeholder:tracking-normal placeholder:text-flamingo-dark/40 placeholder:text-base"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                  Confirm PIN
                </span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="• • • •"
                  className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-2xl font-bold tracking-[0.6em] text-flamingo-dark outline-none placeholder:tracking-normal placeholder:text-flamingo-dark/40 placeholder:text-base"
                  required
                />
              </label>
            </div>
          )}

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
            {loading
              ? "Please wait…"
              : step === "phone"
                ? "Send me a code →"
                : step === "otp"
                  ? "Verify code →"
                  : "Reset my PIN"}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <Link
            href="/merchant/login"
            className="font-semibold text-flamingo-pink-deep underline-offset-2 hover:underline"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
