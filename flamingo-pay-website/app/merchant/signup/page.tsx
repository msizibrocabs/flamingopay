"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { signIn } from "../../../lib/merchant";
import type { DocumentKind, KycTier } from "../../../lib/store";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const TOTAL_STEPS = 6;

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

const VOLUME_OPTIONS: { label: string; sublabel: string; value: number; tier: KycTier }[] = [
  { label: "Less than R5 000", sublabel: "A few sales a day", value: 5_000, tier: "simplified" },
  { label: "R5 000 – R15 000", sublabel: "Steady side hustle", value: 15_000, tier: "simplified" },
  { label: "R15 000 – R25 000", sublabel: "Busy informal trader", value: 25_000, tier: "simplified" },
  { label: "R25 000 – R50 000", sublabel: "Growing shop", value: 50_000, tier: "standard" },
  { label: "R50 000 – R100 000", sublabel: "Established business", value: 100_000, tier: "standard" },
  { label: "More than R100 000", sublabel: "High-volume operation", value: 150_000, tier: "enhanced" },
];

const DOC_LABELS: Record<DocumentKind, string> = {
  id: "SA ID document",
  selfie: "Selfie verification",
  affidavit: "Sworn affidavit",
  company_reg: "CIPC company registration",
  proof_of_address: "Proof of address (utility bill)",
  bank_letter: "Bank confirmation letter",
  source_of_funds: "Source of funds declaration",
};

const DOC_ICONS: Record<DocumentKind, string> = {
  id: "🪪",
  selfie: "🤳",
  affidavit: "📜",
  company_reg: "🏢",
  proof_of_address: "📮",
  bank_letter: "🏦",
  source_of_funds: "💼",
};

const DOC_HINTS: Record<DocumentKind, string> = {
  id: "Photo of your green SA ID book or smart card (front & back)",
  selfie: "Clear selfie holding your ID next to your face",
  affidavit: "Sworn affidavit from a commissioner of oaths",
  company_reg: "CIPC registration certificate (COR 14.3 or COR 39)",
  proof_of_address: "Utility bill, bank statement, or lease — less than 3 months old",
  bank_letter: "Bank confirmation letter showing account holder name & number",
  source_of_funds: "Written declaration of where your business income comes from",
};

function docsForTier(tier: KycTier, businessType: string): DocumentKind[] {
  const docs: DocumentKind[] = ["id", "selfie", "proof_of_address"];
  if (tier === "simplified") return docs;
  docs.push("bank_letter");
  const isCompany = /pty|ltd|cc|company|bakery|studio|boutique|transport/i.test(businessType);
  docs.push(isCompany ? "company_reg" : "affidavit");
  if (tier === "standard") return docs;
  docs.push("source_of_funds");
  return docs;
}

const TIER_LABELS: Record<KycTier, string> = {
  simplified: "Simplified",
  standard: "Standard",
  enhanced: "Enhanced",
};

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Step 1 — phone
  const [phone, setPhone] = useState("");

  // Step 2 — OTP + PIN
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [devOTP, setDevOTP] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

  // Step 3 — business info
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");

  // Step 4 — expected volume
  const [volumeIdx, setVolumeIdx] = useState<number | null>(null);

  // Step 5 — document uploads
  const [uploads, setUploads] = useState<Record<string, { file: File; uploading: boolean; done: boolean; error?: string; url?: string }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocKind, setActiveDocKind] = useState<DocumentKind | null>(null);

  // Step 6 — bank details
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState<"cheque" | "savings">("cheque");
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /** Normalise phone to +27 xx xxx xxxx format for the API. */
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

  // Derived
  const selectedVolume = volumeIdx != null ? VOLUME_OPTIONS[volumeIdx] : null;
  const tier: KycTier = selectedVolume?.tier ?? "simplified";
  const requiredDocs = useMemo(
    () => docsForTier(tier, businessType),
    [tier, businessType],
  );
  const allDocsUploaded = requiredDocs.every(k => uploads[k]?.done);

  const progress = useMemo(() => (step / TOTAL_STEPS) * 100, [step]);

  function validateStep(): string | null {
    if (step === 1) {
      const clean = phone.replace(/\s/g, "");
      if (clean.length < 9 || !/^\d+$/.test(clean)) return "Enter a valid SA phone number";
    }
    if (step === 2) {
      if (otp.length !== 6) return "Enter the 6-digit code we sent you";
      if (pin.length !== 4) return "Your PIN must be 4 digits";
      if (pin !== pinConfirm) return "PINs don't match";
    }
    if (step === 3) {
      if (!businessName.trim()) return "What's your shop called?";
      if (!ownerName.trim()) return "We need your full name";
      if (!businessType) return "Pick a category";
    }
    if (step === 4) {
      if (volumeIdx == null) return "Select your expected monthly volume";
    }
    if (step === 5) {
      if (!allDocsUploaded) return "Please upload all required documents";
    }
    if (step === 6) {
      if (!bank) return "Pick your bank";
      if (accountNumber.length < 7 || !/^\d+$/.test(accountNumber)) return "Enter a valid account number";
      if (!termsAgreed) return "Please agree to the merchant terms to continue";
    }
    return null;
  }

  async function next() {
    setError("");
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }

    // Step 1 → 2: Check for duplicate phone, then send OTP
    if (step === 1) {
      setSubmitting(true);
      try {
        const prettyPhone = normalisePhone(phone);

        // Check duplicate
        const checkRes = await fetch(`/api/merchants/check-phone?phone=${encodeURIComponent(prettyPhone)}`);
        const checkData = await checkRes.json();
        if (checkData.exists) {
          setError("A merchant with this phone is already registered. Try signing in instead.");
          setSubmitting(false);
          return;
        }

        // Send OTP via SMS
        const otpRes = await fetch("/api/auth/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: prettyPhone, purpose: "signup", action: "send" }),
        });
        const otpData = await otpRes.json();
        if (!otpRes.ok) {
          setError(otpData.error || "Could not send verification code. Try again.");
          setSubmitting(false);
          return;
        }
        if (otpData.devOTP) setDevOTP(otpData.devOTP);
        setOtpVerified(false);
      } catch {
        // If OTP send fails, let them continue — we'll retry
        setError("Could not send SMS. Check your number and try again.");
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      setStep(2);
      return;
    }

    // Step 2 → 3: Verify OTP first, then advance
    if (step === 2) {
      setSubmitting(true);
      try {
        const prettyPhone = normalisePhone(phone);
        const verifyRes = await fetch("/api/auth/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: prettyPhone, purpose: "signup", action: "verify", code: otp }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          setError(verifyData.error || "Invalid code. Try again.");
          setSubmitting(false);
          return;
        }
        setOtpVerified(true);
      } catch {
        setError("Network error. Check your connection.");
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      setStep(3);
      return;
    }

    if (step < TOTAL_STEPS) {
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

  // ---------- File upload ----------

  function triggerUpload(kind: DocumentKind) {
    setActiveDocKind(kind);
    // Small delay to let state settle, then click the hidden input
    setTimeout(() => fileInputRef.current?.click(), 50);
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeDocKind) return;

    const kind = activeDocKind;
    setUploads(prev => ({ ...prev, [kind]: { file, uploading: true, done: false } }));

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("merchantId", "signup-pending"); // placeholder, will be linked after creation
      form.append("kind", kind);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploads(prev => ({ ...prev, [kind]: { file, uploading: false, done: true, url: data.url } }));
    } catch (err) {
      setUploads(prev => ({
        ...prev,
        [kind]: { file, uploading: false, done: false, error: (err as Error).message },
      }));
    }
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  // ---------- Submit ----------

  async function submit() {
    setSubmitting(true);
    setError("");
    const prettyPhone = normalisePhone(phone);

    try {
      const res = await fetch("/api/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: prettyPhone,
          businessName: businessName.trim(),
          businessType,
          ownerName: ownerName.trim(),
          address: address.trim(),
          bank,
          accountNumber,
          accountType,
          pin,
          expectedMonthlyVolume: selectedVolume?.value ?? 5_000,
          uploadedDocs: Object.entries(uploads)
            .filter(([, v]) => v.done && v.url)
            .map(([kind, v]) => ({ kind, fileName: v.file.name, blobUrl: v.url })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Something went wrong. Please try again.";
        // If duplicate phone, send user back to step 1
        if (msg.toLowerCase().includes("already registered")) {
          setStep(1);
        }
        setError(msg);
        setSubmitting(false);
        return;
      }
      signIn(data.merchant.id);
      router.push("/merchant/pending");
    } catch (e) {
      setError((e as Error).message || "Network error");
      setSubmitting(false);
    }
  }

  const STEP_HEADERS: Record<Step, { title: string; sub: string }> = {
    1: { title: "Let's turn your phone into a till", sub: "Takes about 3 minutes. Free forever." },
    2: { title: "Verify & set your PIN", sub: "We sent a 6-digit code to your phone via SMS" },
    3: { title: "Tell us about your shop", sub: "This shows up on your QR and receipts" },
    4: { title: "How much do you expect per month?", sub: "This determines which documents we need from you" },
    5: { title: "Upload your documents", sub: `${TIER_LABELS[tier]} KYC — ${requiredDocs.length} document${requiredDocs.length > 1 ? "s" : ""} required` },
    6: { title: "Where should we send your money?", sub: "We settle your sales every morning at 09:00" },
  };

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
              Step {step} of {TOTAL_STEPS}
            </div>
          </div>
        </div>

        {/* Logo + header */}
        <div className="mt-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink shadow-[0_4px_0_0_#1A1A2E]">
            <span className="display text-3xl font-extrabold text-white">F</span>
          </div>
          <h1 className="display mt-4 text-3xl font-extrabold text-flamingo-dark">
            {STEP_HEADERS[step].title}
          </h1>
          <p className="mt-1 text-sm text-flamingo-dark/70">
            {STEP_HEADERS[step].sub}
          </p>
        </div>

        {/* Hidden file input for document uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={handleFileSelected}
        />

        {/* Card with the step form */}
        <form
          onSubmit={e => { e.preventDefault(); next(); }}
          className="mt-6 rounded-3xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]"
        >
          {/* Step 1 — Phone */}
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

          {/* Step 2 — OTP + PIN */}
          {step === 2 && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                  6-digit SMS verification code
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
                {devOTP && (
                  <p className="mt-1 text-[11px] text-flamingo-dark/60">
                    Dev mode — your code is: <span className="font-bold">{devOTP}</span>
                  </p>
                )}
              </label>
              <button
                type="button"
                onClick={async () => {
                  setOtp("");
                  setError("");
                  setSubmitting(true);
                  try {
                    const res = await fetch("/api/auth/otp", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ phone: normalisePhone(phone), purpose: "signup", action: "send" }),
                    });
                    const data = await res.json();
                    if (!res.ok) setError(data.error || "Could not resend. Try again.");
                    else if (data.devOTP) setDevOTP(data.devOTP);
                  } catch { setError("Network error."); }
                  setSubmitting(false);
                }}
                className="text-xs font-semibold text-flamingo-pink-deep underline-offset-2 hover:underline"
              >
                Didn&apos;t get the SMS? Send again
              </button>

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

          {/* Step 3 — Business info */}
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

          {/* Step 4 — Expected monthly volume */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
                Expected monthly sales volume
              </p>
              {VOLUME_OPTIONS.map((opt, i) => {
                const active = volumeIdx === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setVolumeIdx(i)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${
                      active
                        ? "border-flamingo-dark bg-flamingo-pink text-white shadow-[0_3px_0_0_#1A1A2E]"
                        : "border-flamingo-dark/30 bg-flamingo-cream text-flamingo-dark hover:border-flamingo-dark"
                    }`}
                  >
                    <div className={`grid h-5 w-5 flex-none place-items-center rounded-full border-2 ${
                      active ? "border-white" : "border-flamingo-dark/40"
                    }`}>
                      {active && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold">{opt.label}</p>
                      <p className={`text-xs ${active ? "text-white/80" : "text-flamingo-dark/60"}`}>{opt.sublabel}</p>
                    </div>
                  </button>
                );
              })}

              {selectedVolume && (
                <div className={`mt-2 rounded-xl border-2 p-3 ${
                  tier === "simplified"
                    ? "border-green-300 bg-green-50"
                    : tier === "standard"
                      ? "border-amber-300 bg-amber-50"
                      : "border-red-300 bg-red-50"
                }`}>
                  <p className="text-xs font-extrabold text-flamingo-dark">
                    {TIER_LABELS[tier]} due diligence
                  </p>
                  <p className="mt-0.5 text-[11px] text-flamingo-dark/70">
                    {tier === "simplified"
                      ? "Only 3 documents needed — ID, selfie, and proof of address."
                      : tier === "standard"
                        ? "5 documents needed — includes bank letter and business registration."
                        : "6 documents needed — includes source of funds declaration."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5 — Document uploads */}
          {step === 5 && (
            <div className="space-y-3">
              {requiredDocs.map(kind => {
                const upload = uploads[kind];
                const isDone = upload?.done;
                const isUploading = upload?.uploading;
                const hasError = upload?.error;

                return (
                  <div
                    key={kind}
                    className={`rounded-xl border-2 p-3 transition ${
                      isDone
                        ? "border-green-400 bg-green-50"
                        : hasError
                          ? "border-red-400 bg-red-50"
                          : "border-flamingo-dark/30 bg-flamingo-cream"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{DOC_ICONS[kind]}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-flamingo-dark">{DOC_LABELS[kind]}</p>
                        <p className="text-[11px] text-flamingo-dark/60">{DOC_HINTS[kind]}</p>

                        {isDone && upload.file && (
                          <p className="mt-1 text-[11px] font-bold text-green-700">
                            Uploaded: {upload.file.name}
                          </p>
                        )}
                        {hasError && (
                          <p className="mt-1 text-[11px] font-bold text-red-600">{hasError}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => triggerUpload(kind)}
                        className={`flex-none rounded-lg border-2 border-flamingo-dark px-3 py-1.5 text-xs font-extrabold transition ${
                          isDone
                            ? "bg-green-100 text-green-800"
                            : isUploading
                              ? "bg-flamingo-cream text-flamingo-dark/50"
                              : "bg-flamingo-pink text-white shadow-[0_2px_0_0_#B42A48]"
                        }`}
                      >
                        {isUploading ? "Uploading…" : isDone ? "Replace" : "Upload"}
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="rounded-xl border-2 border-dashed border-flamingo-dark/20 p-3 text-center">
                <p className="text-[11px] text-flamingo-dark/50">
                  Accepted: JPEG, PNG, WebP, PDF — max 5 MB per file
                </p>
              </div>
            </div>
          )}

          {/* Step 6 — Bank details */}
          {step === 6 && (
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
                  <a href="/legal/terms" target="_blank" className="font-bold text-flamingo-pink-deep underline-offset-2 hover:underline">
                    merchant terms
                  </a>{" "}
                  and{" "}
                  <a href="/legal/privacy" target="_blank" className="font-bold text-flamingo-pink-deep underline-offset-2 hover:underline">
                    privacy policy
                  </a>
                  . Fees are 2.9% + R0.99 per transaction with no monthly charges.
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
              : step === TOTAL_STEPS
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
