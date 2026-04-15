"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { signIn } from "../../../lib/merchant";

type Step = 1 | 2 | 3 | 4;

const BUSINESS_TYPES = [
  "Spaza / General Dealer",
  "Tuckshop",
  "Street vendor",
  "Fruit & veg",
  "Butchery",
  "Takeaway / Food",
  "Hair salon / Barber",
  "Car wash",
  "Service provider",
  "Other",
];

const BANKS = [
  "Capitec",
  "FNB",
  "Standard Bank",
  "Nedbank",
  "ABSA",
  "TymeBank",
  "Discovery Bank",
  "African Bank",
  "Bank Zero",
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [phone, setPhone] = useState("");

  // Step 2
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

  // Step 3
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");

  // Step 4
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState<"cheque" | "savings">("cheque");
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const progress = useMemo(() => (step / 4) * 100, [step]);

  function validateStep(): string | null {
    if (step === 1) {
      const clean = phone.replace(/\s/g, "");
      if (clean.length < 9 || !/^\d+$/.test(clean)) return "Enter a valid SA phone number";
    }
    if (step === 2) {
      if (otp.length !== 4) return "Enter the 4-digit code we sent you";
      if (pin.length !== 4) return "Your PIN must be 4 digits";
      if (pin !== pinConfirm) return "PINs don't match";
    }
    if (step === 3) {
      if (!businessName.trim()) return "What's your shop called?";
      if (!ownerName.trim()) return "We need your full name";
      if (!businessType) return "Pick a category";
    }
    if (step === 4) {
      if (!bank) return "Pick your bank";
      if (accountNumber.length < 7 || !/^\d+$/.test(accountNumber)) return "Enter a valid account number";
      if (!termsAgreed) return "Please agree to the merchant terms to continue";
    }
    return null;
  }

  function next() {
    setError("");
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    if (step < 4) {
      setStep((step + 1) as Step);
      return;
    }
    submit();
  }

  function back() {
    setError("");
    if (step > 1) setStep((step - 1) as Step);
    else router.push("/#merchants");
  }

  function submit() {
    setSubmitting(true);
    // Demo: fake the account creation and drop them into the dashboard
    setTimeout(() => {
      signIn();
      router.push("/merchant/dashboard");
    }, 1100);
  }

  return (
    <main className="min-h-dvh bg-flamingo-cream">
      <div className="mx-auto flex max-w-md flex-col px-5 py-6">
        {/* Top: back + progress */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Back"
            onClick={back}
            className="grid h-10 w-10 flex-none place-items-center rounded-full border-2 border-flamingo-dark bg-white shadow-[0_3px_0_0_#1A1A2E]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div className="flex-1">
            <div className="h-2 w-full overflow-hidden rounded-full border-2 border-flamingo-dark bg-white">
              <div
                className="h-full bg-flamingo-pink transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-flamingo-dark/60">
              Step {step} of 4
            </div>
          </div>
        </div>

        {/* Logo + header */}
        <div className="mt-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink shadow-[0_4px_0_0_#1A1A2E]">
            <span className="display text-3xl font-extrabold text-white">F</span>
          </div>
          <h1 className="display mt-4 text-3xl font-extrabold text-flamingo-dark">
            {step === 1 && "Let's turn your phone into a till"}
            {step === 2 && "Verify & set your PIN"}
            {step === 3 && "Tell us about your shop"}
            {step === 4 && "Where should we send your money?"}
          </h1>
          <p className="mt-1 text-sm text-flamingo-dark/70">
            {step === 1 && "Takes about 3 minutes. Free forever."}
            {step === 2 && "We sent you an SMS with a 4-digit code"}
            {step === 3 && "This shows up on your QR and receipts"}
            {step === 4 && "We settle your sales every morning at 09:00"}
          </p>
        </div>

        {/* Card with the step form */}
        <form
          onSubmit={e => { e.preventDefault(); next(); }}
          className="mt-6 rounded-3xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]"
        >
          {step === 1 && (
            <div className="space-y-4">
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
                    placeholder="82 555 0142"
                    className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-flamingo-dark outline-none placeholder:text-flamingo-dark/40"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-flamingo-dark/60">
                  Must be the phone your buyers will pay you on. We&apos;ll send you an SMS to verify.
                </p>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                  SMS verification code
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={4}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="• • • •"
                  className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-2xl font-bold tracking-[0.6em] text-flamingo-dark outline-none placeholder:tracking-normal placeholder:text-flamingo-dark/40 placeholder:text-base"
                  required
                />
                <p className="mt-1 text-[11px] text-flamingo-dark/60">
                  Demo: any 4 digits will accept
                </p>
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                  Create a 4-digit PIN
                </span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
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
                  value={pinConfirm}
                  onChange={e => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="• • • •"
                  className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-2xl font-bold tracking-[0.6em] text-flamingo-dark outline-none placeholder:tracking-normal placeholder:text-flamingo-dark/40 placeholder:text-base"
                  required
                />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                  Shop / business name
                </span>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="Thandi's Spaza"
                  className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-base font-semibold text-flamingo-dark outline-none placeholder:text-flamingo-dark/40"
                  required
                />
              </label>

              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                  Category
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {BUSINESS_TYPES.map(type => {
                    const active = type === businessType;
                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setBusinessType(type)}
                        className={`rounded-full border-2 border-flamingo-dark px-3.5 py-1.5 text-xs font-extrabold ${
                          active ? "bg-flamingo-pink text-white" : "bg-white text-flamingo-dark"
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                  Your full name
                </span>
                <input
                  type="text"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder="Thandi Nkosi"
                  autoComplete="name"
                  className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-base font-semibold text-flamingo-dark outline-none placeholder:text-flamingo-dark/40"
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                  Address <span className="normal-case text-flamingo-dark/50">(optional)</span>
                </span>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="12 Protea Street, Diepsloot"
                  className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-base font-semibold text-flamingo-dark outline-none placeholder:text-flamingo-dark/40"
                />
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                  Your bank
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {BANKS.map(b => {
                    const active = b === bank;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBank(b)}
                        className={`rounded-xl border-2 border-flamingo-dark px-3 py-2.5 text-xs font-extrabold ${
                          active ? "bg-flamingo-pink text-white" : "bg-white text-flamingo-dark"
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                  Account number
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 13))}
                  placeholder="10-digit account number"
                  className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-base font-semibold tracking-wider text-flamingo-dark outline-none placeholder:text-flamingo-dark/40 placeholder:text-sm placeholder:tracking-normal"
                  required
                />
              </label>

              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                  Account type
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["cheque", "savings"] as const).map(t => {
                    const active = t === accountType;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAccountType(t)}
                        className={`rounded-xl border-2 border-flamingo-dark px-3 py-2.5 text-xs font-extrabold capitalize ${
                          active ? "bg-flamingo-pink text-white" : "bg-white text-flamingo-dark"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-xl border-2 border-flamingo-dark bg-flamingo-cream p-3">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={e => setTermsAgreed(e.target.checked)}
                  className="mt-0.5 h-5 w-5 flex-none accent-flamingo-pink"
                />
                <span className="text-xs text-flamingo-dark">
                  I agree to the Flamingo{" "}
                  <a href="#" className="font-bold text-flamingo-pink-deep underline-offset-2 hover:underline">
                    merchant terms
                  </a>{" "}
                  and{" "}
                  <a href="#" className="font-bold text-flamingo-pink-deep underline-offset-2 hover:underline">
                    privacy policy
                  </a>
                  . Fees are 2.5% all-in with no monthly charges.
                </span>
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
            disabled={submitting}
            className="btn-pink mt-5 w-full rounded-2xl border-2 border-flamingo-dark px-4 py-3.5 text-base font-extrabold uppercase tracking-wide disabled:opacity-70"
          >
            {submitting
              ? "Creating your account…"
              : step === 4
                ? "Create my Flamingo account"
                : "Continue →"}
          </button>

          {step === 1 && (
            <p className="mt-4 text-center text-xs text-flamingo-dark/60">
              Already on Flamingo?{" "}
              <Link href="/merchant/login" className="font-bold text-flamingo-pink-deep underline-offset-2 hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-[11px] text-flamingo-dark/50">
          Free. No card machine. No monthly fee. Powered by PayShap & Instant EFT.
        </p>
      </div>
    </main>
  );
}
