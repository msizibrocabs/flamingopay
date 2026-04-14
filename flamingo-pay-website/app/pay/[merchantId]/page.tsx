"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

/* ──────────────────────────────────────────────
   Mock merchant database — will be replaced
   with real API lookup later
   ────────────────────────────────────────────── */
const MERCHANTS: Record<string, { name: string; category: string }> = {
  "thandis-spaza": { name: "Thandi's Spaza", category: "Grocery" },
  "bra-mike-braai": { name: "Bra Mike's Braai Stand", category: "Food" },
  "mama-joy-fruit": { name: "Mama Joy's Fruit & Veg", category: "Fresh Produce" },
  demo: { name: "Flamingo Demo Shop", category: "Demo" },
};

/* ──────────────────────────────────────────────
   Payment method configs
   ────────────────────────────────────────────── */
type PaymentMethod = "payshap" | "ozow" | "manual";

interface MethodInfo {
  label: string;
  subtitle: string;
  icon: string;
  speed: string;
  speedColor: string;
}

const METHODS: Record<PaymentMethod, MethodInfo> = {
  payshap: {
    label: "PayShap",
    subtitle: "Capitec · FNB · Nedbank · Absa",
    icon: "⚡",
    speed: "Instant",
    speedColor: "bg-emerald-500",
  },
  ozow: {
    label: "Instant EFT",
    subtitle: "All major banks via Ozow",
    icon: "🏦",
    speed: "~30 seconds",
    speedColor: "bg-blue-500",
  },
  manual: {
    label: "Bank Transfer",
    subtitle: "Any bank account",
    icon: "📋",
    speed: "1–2 minutes",
    speedColor: "bg-amber-500",
  },
};

/* ──────────────────────────────────────────────
   Quick amount presets
   ────────────────────────────────────────────── */
const PRESETS = [10, 20, 50, 100, 200, 500];

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */
export default function PayPage() {
  const params = useParams();
  const merchantId = params.merchantId as string;
  const merchant = MERCHANTS[merchantId];

  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"amount" | "method" | "processing" | "done" | "manual">("amount");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const numericAmount = parseFloat(amount);
  const isValidAmount = !isNaN(numericAmount) && numericAmount >= 1 && numericAmount <= 50000;

  /* ── Handlers ── */
  function handlePreset(val: number) {
    setAmount(val.toString());
  }

  function handleNext() {
    if (isValidAmount) setStep("method");
  }

  function handleSelectMethod(method: PaymentMethod) {
    setSelectedMethod(method);
    if (method === "manual") {
      setStep("manual");
    } else {
      setStep("processing");
      // Simulate processing — in production this hits Ozow API or PayShap deep link
      setTimeout(() => setStep("done"), 2200);
    }
  }

  function handleReset() {
    setAmount("");
    setStep("amount");
    setSelectedMethod(null);
  }

  /* ── Not found ── */
  if (!merchant) {
    return (
      <div className="min-h-screen bg-flamingo-cream flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-flamingo-pink mx-auto flex items-center justify-center text-white text-2xl font-black">F</div>
          <h1 className="display text-2xl font-black mt-4 text-flamingo-dark">Merchant not found</h1>
          <p className="mt-2 text-flamingo-dark/60 text-sm">This QR code doesn&rsquo;t match an active Flamingo merchant. Check the code and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-flamingo-cream flex flex-col">
      {/* ── Header ── */}
      <header className="bg-flamingo-pink text-white px-5 pt-8 pb-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-black">F</span>
            <span className="text-sm font-bold opacity-90">Flamingo Pay</span>
          </div>
          <p className="text-white/80 text-xs font-medium uppercase tracking-wider">{merchant.category}</p>
          <h1 className="display text-3xl font-black mt-1">{merchant.name}</h1>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="flex-1 px-5 py-6">
        <div className="max-w-md mx-auto">

          {/* ════════════════════════════════
             STEP 1 — Enter amount
             ════════════════════════════════ */}
          {step === "amount" && (
            <div>
              <p className="text-flamingo-dark/70 text-sm font-medium mb-3">How much are you paying?</p>

              {/* Amount input */}
              <div className="bg-white rounded-2xl border-2 border-flamingo-dark p-5 shadow-[4px_4px_0_#1A1A2E]">
                <div className="flex items-center gap-2">
                  <span className="text-flamingo-dark/40 text-3xl font-black">R</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 text-4xl font-black text-flamingo-dark bg-transparent outline-none placeholder:text-flamingo-dark/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick amounts */}
              <div className="mt-4 flex flex-wrap gap-2">
                {PRESETS.map((val) => (
                  <button
                    key={val}
                    onClick={() => handlePreset(val)}
                    className={`px-4 py-2 rounded-full border-2 border-flamingo-dark text-sm font-bold transition
                      ${amount === val.toString()
                        ? "bg-flamingo-dark text-white"
                        : "bg-white text-flamingo-dark hover:bg-flamingo-dark/5"
                      }`}
                  >
                    R{val}
                  </button>
                ))}
              </div>

              {/* Pay button */}
              <button
                onClick={handleNext}
                disabled={!isValidAmount}
                className={`mt-6 w-full py-4 rounded-full text-lg font-black transition
                  ${isValidAmount
                    ? "bg-flamingo-pink text-white shadow-[0_6px_0_0_#B42A48] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#B42A48] active:translate-y-[6px] active:shadow-none"
                    : "bg-flamingo-dark/10 text-flamingo-dark/30 cursor-not-allowed"
                  }`}
              >
                {isValidAmount ? `Pay R${parseFloat(amount).toFixed(2)}` : "Enter amount"}
              </button>

              <p className="mt-4 text-center text-xs text-flamingo-dark/40">
                Secured by Flamingo Pay · POPIA compliant
              </p>
            </div>
          )}

          {/* ════════════════════════════════
             STEP 2 — Choose payment method
             ════════════════════════════════ */}
          {step === "method" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-flamingo-dark/70 text-sm font-medium">Choose how to pay</p>
                <button onClick={() => setStep("amount")} className="text-flamingo-pink text-sm font-bold">
                  ← Back
                </button>
              </div>

              {/* Amount summary */}
              <div className="bg-flamingo-pink/10 rounded-2xl px-5 py-4 mb-5 flex items-center justify-between border-2 border-flamingo-pink/30">
                <div>
                  <p className="text-xs text-flamingo-dark/60 font-medium">Paying</p>
                  <p className="display text-2xl font-black text-flamingo-dark">R{parseFloat(amount).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-flamingo-dark/60 font-medium">To</p>
                  <p className="text-sm font-bold text-flamingo-dark">{merchant.name}</p>
                </div>
              </div>

              {/* Payment options */}
              <div className="space-y-3">
                {(Object.keys(METHODS) as PaymentMethod[]).map((key) => {
                  const m = METHODS[key];
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectMethod(key)}
                      className="w-full bg-white rounded-2xl border-2 border-flamingo-dark p-4 shadow-[4px_4px_0_#1A1A2E] hover:shadow-[2px_2px_0_#1A1A2E] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-left flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-xl bg-flamingo-cream flex items-center justify-center text-2xl">
                        {m.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-flamingo-dark">{m.label}</p>
                          <span className={`${m.speedColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                            {m.speed}
                          </span>
                        </div>
                        <p className="text-xs text-flamingo-dark/50 mt-0.5">{m.subtitle}</p>
                      </div>
                      <span className="text-flamingo-dark/30 text-lg">→</span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-5 text-center text-xs text-flamingo-dark/40">
                All methods are secure · Your bank handles authentication
              </p>
            </div>
          )}

          {/* ════════════════════════════════
             STEP 3a — Processing animation
             ════════════════════════════════ */}
          {step === "processing" && (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-flamingo-pink mx-auto flex items-center justify-center animate-pulse">
                <span className="text-white text-3xl">
                  {selectedMethod && METHODS[selectedMethod].icon}
                </span>
              </div>
              <h2 className="display text-2xl font-black text-flamingo-dark mt-6">Processing payment...</h2>
              <p className="mt-2 text-flamingo-dark/60 text-sm">
                {selectedMethod === "payshap"
                  ? "Connecting to PayShap..."
                  : "Redirecting to your bank via Ozow..."}
              </p>
              <div className="mt-8 flex justify-center">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 bg-flamingo-pink rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-3 h-3 bg-flamingo-pink rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-3 h-3 bg-flamingo-pink rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════
             STEP 3b — Manual bank transfer
             ════════════════════════════════ */}
          {step === "manual" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-flamingo-dark/70 text-sm font-medium">Bank transfer details</p>
                <button onClick={() => setStep("method")} className="text-flamingo-pink text-sm font-bold">
                  ← Back
                </button>
              </div>

              <div className="bg-white rounded-2xl border-2 border-flamingo-dark p-5 shadow-[4px_4px_0_#1A1A2E] space-y-4">
                <div className="bg-flamingo-pink/10 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-flamingo-dark/60">Amount to send</p>
                  <p className="display text-3xl font-black text-flamingo-pink">R{parseFloat(amount).toFixed(2)}</p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Bank", value: "First National Bank (FNB)" },
                    { label: "Account Name", value: "Flamingo Pay (Pty) Ltd" },
                    { label: "Account Number", value: "6300 XXXX XXX" },
                    { label: "Branch Code", value: "250655" },
                    { label: "Reference", value: `FP-${merchantId.toUpperCase().slice(0, 6)}-${Date.now().toString(36).toUpperCase().slice(-6)}` },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-flamingo-dark/10 last:border-0">
                      <span className="text-xs text-flamingo-dark/50 font-medium">{row.label}</span>
                      <span className="text-sm font-bold text-flamingo-dark">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`Flamingo Pay (Pty) Ltd\nFNB\n250655\nRef: FP-${merchantId.toUpperCase().slice(0, 6)}`);
                }}
                className="mt-4 w-full py-3 rounded-full border-2 border-flamingo-dark bg-white text-flamingo-dark font-bold text-sm hover:bg-flamingo-dark/5 transition"
              >
                📋 Copy details
              </button>

              <button
                onClick={() => setStep("done")}
                className="mt-3 w-full py-4 rounded-full bg-flamingo-pink text-white font-black text-lg shadow-[0_6px_0_0_#B42A48] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#B42A48] active:translate-y-[6px] active:shadow-none transition"
              >
                I&rsquo;ve sent the payment
              </button>

              <p className="mt-4 text-center text-xs text-flamingo-dark/40">
                Use the exact reference so we can match your payment to {merchant.name}
              </p>
            </div>
          )}

          {/* ════════════════════════════════
             STEP 4 — Success
             ════════════════════════════════ */}
          {step === "done" && (
            <div className="text-center py-12">
              <div className="w-24 h-24 rounded-full bg-emerald-500 mx-auto flex items-center justify-center">
                <span className="text-white text-5xl">✓</span>
              </div>
              <h2 className="display text-3xl font-black text-flamingo-dark mt-6">
                {selectedMethod === "manual" ? "Payment noted!" : "Payment sent!"}
              </h2>
              <p className="mt-2 text-flamingo-dark/60">
                {selectedMethod === "manual"
                  ? `We'll confirm with ${merchant.name} once the funds arrive.`
                  : `R${parseFloat(amount).toFixed(2)} sent to ${merchant.name}`}
              </p>

              <div className="mt-8 bg-white rounded-2xl border-2 border-flamingo-dark p-5 shadow-[4px_4px_0_#1A1A2E] text-left">
                <p className="text-xs text-flamingo-dark/50 font-medium mb-3">Receipt</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-flamingo-dark/60">Amount</span>
                    <span className="text-sm font-bold">R{parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-flamingo-dark/60">To</span>
                    <span className="text-sm font-bold">{merchant.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-flamingo-dark/60">Method</span>
                    <span className="text-sm font-bold">{selectedMethod && METHODS[selectedMethod].label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-flamingo-dark/60">Status</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {selectedMethod === "manual" ? "Pending confirmation" : "Completed"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="mt-6 w-full py-3 rounded-full border-2 border-flamingo-dark bg-white text-flamingo-dark font-bold text-sm hover:bg-flamingo-dark/5 transition"
              >
                Make another payment
              </button>

              <div className="mt-6 flex items-center justify-center gap-2">
                <span className="w-6 h-6 rounded-full bg-flamingo-pink flex items-center justify-center text-white text-xs font-black">F</span>
                <span className="text-xs text-flamingo-dark/40">Powered by Flamingo Pay</span>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── Footer ── */}
      {(step === "amount" || step === "method") && (
        <footer className="px-5 py-4 border-t border-flamingo-dark/10">
          <div className="max-w-md mx-auto flex items-center justify-center gap-2">
            <span className="w-5 h-5 rounded-full bg-flamingo-pink flex items-center justify-center text-white text-[8px] font-black">F</span>
            <span className="text-xs text-flamingo-dark/40">Powered by Flamingo Pay · Reg No: 2026/276925/07</span>
          </div>
        </footer>
      )}
    </div>
  );
}
