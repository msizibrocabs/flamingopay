"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedCounter } from "../../../components/motion/AnimatedCounter";
import { flamingoConfetti } from "../../../components/motion/Confetti";

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

const PRESETS = [10, 20, 50, 100, 200, 500];

const stepVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function PayPage() {
  const params = useParams();
  const merchantId = params.merchantId as string;
  const merchant = MERCHANTS[merchantId];

  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"amount" | "method" | "processing" | "done" | "manual">("amount");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const numericAmount = parseFloat(amount);
  const isValidAmount = !isNaN(numericAmount) && numericAmount >= 1 && numericAmount <= 50000;

  useEffect(() => {
    if (step === "done") {
      flamingoConfetti();
    }
  }, [step]);

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
      setTimeout(() => setStep("done"), 2200);
    }
  }
  function handleReset() {
    setAmount("");
    setStep("amount");
    setSelectedMethod(null);
  }

  if (!merchant) {
    return (
      <div className="min-h-screen bg-gradient-sunrise flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-flamingo mx-auto flex items-center justify-center text-white text-2xl font-black shadow-[0_10px_30px_-8px_rgba(255,82,119,0.55)]">F</div>
          <h1 className="display text-2xl font-black mt-4 text-flamingo-dark">Merchant not found</h1>
          <p className="mt-2 text-flamingo-dark/60 text-sm">This QR code doesn&rsquo;t match an active Flamingo merchant. Check the code and try again.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-sunrise flex flex-col">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-flamingo text-white px-5 pt-8 pb-6">
        <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-flamingo-butter/30 blur-2xl" />
        <span className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="max-w-md mx-auto relative">
          <div className="flex items-center gap-2 mb-4">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 16 }}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-black"
            >
              F
            </motion.span>
            <span className="text-sm font-bold opacity-90">Flamingo Pay</span>
          </div>
          <p className="display-eyebrow text-[10px] text-white/80">{merchant.category}</p>
          <h1
            className="display mt-2 font-black leading-[0.95]"
            style={{ fontSize: "clamp(1.75rem, 6vw, 3rem)", letterSpacing: "-0.035em" }}
          >
            {merchant.name}
          </h1>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 px-5 py-6">
        <div className="max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {step === "amount" && (
              <motion.div
                key="amount"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <p className="display-eyebrow text-[10px] text-flamingo-pink-deep mb-3">How much are you paying?</p>

                <motion.div
                  whileFocus={{ scale: 1.01 }}
                  className="bg-white rounded-2xl border-2 border-flamingo-dark p-5 shadow-[4px_4px_0_#1A1A2E]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-flamingo-dark/40 font-black" style={{ fontSize: "clamp(1.5rem, 6vw, 1.875rem)" }}>R</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={{ fontSize: "clamp(1.75rem, 8vw, 2.25rem)" }}
                      className="flex-1 font-black text-flamingo-dark bg-transparent outline-none placeholder:text-flamingo-dark/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tabular-nums"
                      autoFocus
                    />
                  </div>
                </motion.div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {PRESETS.map((val, i) => (
                    <motion.button
                      key={val}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + i * 0.03 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handlePreset(val)}
                      className={`px-4 py-2.5 rounded-full border-2 border-flamingo-dark text-sm font-bold transition
                        ${amount === val.toString()
                          ? "bg-flamingo-dark text-white"
                          : "bg-white text-flamingo-dark hover:bg-flamingo-dark/5"
                        }`}
                    >
                      R{val}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  whileHover={isValidAmount ? { y: -2 } : {}}
                  whileTap={isValidAmount ? { scale: 0.97 } : {}}
                  onClick={handleNext}
                  disabled={!isValidAmount}
                  className={`mt-6 w-full py-4 rounded-full text-lg font-black transition
                    ${isValidAmount
                      ? "bg-gradient-flamingo text-white shadow-[0_8px_20px_-6px_rgba(255,82,119,0.55)]"
                      : "bg-flamingo-dark/10 text-flamingo-dark/30 cursor-not-allowed"
                    }`}
                >
                  {isValidAmount ? `Pay R${parseFloat(amount).toFixed(2)}` : "Enter amount"}
                </motion.button>

                <p className="mt-4 text-center text-xs text-flamingo-dark/40">
                  Secured by Flamingo Pay · POPIA compliant
                </p>
              </motion.div>
            )}

            {step === "method" && (
              <motion.div
                key="method"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-flamingo-dark/70 text-sm font-medium">Choose how to pay</p>
                  <button onClick={() => setStep("amount")} className="text-flamingo-pink text-sm font-bold">
                    ← Back
                  </button>
                </div>

                <motion.div
                  layout
                  className="glass rounded-2xl px-5 py-4 mb-5 flex items-center justify-between border-2 border-flamingo-pink/30"
                >
                  <div>
                    <p className="text-xs text-flamingo-dark/60 font-medium">Paying</p>
                    <p className="display text-2xl font-black text-flamingo-dark tabular-nums">R{parseFloat(amount).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-flamingo-dark/60 font-medium">To</p>
                    <p className="text-sm font-bold text-flamingo-dark">{merchant.name}</p>
                  </div>
                </motion.div>

                <div className="space-y-3">
                  {(Object.keys(METHODS) as PaymentMethod[]).map((key, i) => {
                    const m = METHODS[key];
                    return (
                      <motion.button
                        key={key}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        whileHover={{ x: 3, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectMethod(key)}
                        className="w-full bg-white rounded-2xl border-2 border-flamingo-dark p-4 shadow-[4px_4px_0_#1A1A2E] text-left flex items-center gap-4"
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
                      </motion.button>
                    );
                  })}
                </div>

                <p className="mt-5 text-center text-xs text-flamingo-dark/40">
                  All methods are secure · Your bank handles authentication
                </p>
              </motion.div>
            )}

            {step === "processing" && (
              <motion.div
                key="processing"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="text-center py-16"
              >
                <motion.div
                  className="w-24 h-24 rounded-full bg-gradient-flamingo mx-auto flex items-center justify-center shadow-[0_14px_30px_-10px_rgba(255,82,119,0.6)]"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                >
                  <span className="text-white text-4xl">
                    {selectedMethod && METHODS[selectedMethod].icon}
                  </span>
                </motion.div>
                <h2 className="display text-2xl font-black text-flamingo-dark mt-6">Processing payment...</h2>
                <p className="mt-2 text-flamingo-dark/60 text-sm">
                  {selectedMethod === "payshap"
                    ? "Connecting to PayShap..."
                    : "Redirecting to your bank via Ozow..."}
                </p>
                <div className="mt-8 flex justify-center">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.span
                        key={i}
                        className="block h-3 w-3 rounded-full bg-flamingo-pink"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.12 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === "manual" && (
              <motion.div
                key="manual"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-flamingo-dark/70 text-sm font-medium">Bank transfer details</p>
                  <button onClick={() => setStep("method")} className="text-flamingo-pink text-sm font-bold">
                    ← Back
                  </button>
                </div>

                <div className="bg-white rounded-2xl border-2 border-flamingo-dark p-5 shadow-[4px_4px_0_#1A1A2E] space-y-4">
                  <div className="bg-flamingo-pink/10 rounded-xl px-4 py-3 text-center">
                    <p className="text-xs text-flamingo-dark/60">Amount to send</p>
                    <p className="display font-black text-flamingo-pink tabular-nums" style={{ fontSize: "clamp(1.5rem, 6vw, 1.875rem)" }}>R{parseFloat(amount).toFixed(2)}</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: "Bank", value: "First National Bank (FNB)" },
                      { label: "Account Name", value: "Flamingo Pay (Pty) Ltd" },
                      { label: "Account Number", value: "6300 XXXX XXX" },
                      { label: "Branch Code", value: "250655" },
                      { label: "Reference", value: `FP-${merchantId.toUpperCase().slice(0, 6)}-${Date.now().toString(36).toUpperCase().slice(-6)}` },
                    ].map((row, i) => (
                      <motion.div
                        key={row.label}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between py-2 border-b border-flamingo-dark/10 last:border-0"
                      >
                        <span className="text-xs text-flamingo-dark/50 font-medium">{row.label}</span>
                        <span className="text-sm font-bold text-flamingo-dark">{row.value}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    navigator.clipboard?.writeText(`Flamingo Pay (Pty) Ltd\nFNB\n250655\nRef: FP-${merchantId.toUpperCase().slice(0, 6)}`);
                  }}
                  className="mt-4 w-full py-3 rounded-full border-2 border-flamingo-dark bg-white text-flamingo-dark font-bold text-sm"
                >
                  📋 Copy details
                </motion.button>

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStep("done")}
                  className="mt-3 w-full py-4 rounded-full bg-gradient-flamingo text-white font-black text-lg shadow-[0_8px_20px_-6px_rgba(255,82,119,0.55)]"
                >
                  I&rsquo;ve sent the payment
                </motion.button>

                <p className="mt-4 text-center text-xs text-flamingo-dark/40">
                  Use the exact reference so we can match your payment to {merchant.name}
                </p>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div
                key="done"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="text-center py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 14 }}
                  className="w-24 h-24 rounded-full bg-emerald-500 mx-auto flex items-center justify-center shadow-[0_14px_30px_-10px_rgba(16,185,129,0.5)]"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 260 }}
                    className="text-white text-5xl"
                  >
                    ✓
                  </motion.span>
                </motion.div>
                <h2 className="display text-3xl font-black text-flamingo-dark mt-6">
                  {selectedMethod === "manual" ? "Payment noted!" : "Payment sent!"}
                </h2>
                <p className="mt-2 text-flamingo-dark/60">
                  {selectedMethod === "manual"
                    ? `We'll confirm with ${merchant.name} once the funds arrive.`
                    : (
                      <>
                        <AnimatedCounter to={parseFloat(amount)} duration={0.9} prefix="R" decimals={2} locale="en-ZA" /> sent to {merchant.name}
                      </>
                    )}
                </p>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="mt-8 bg-white rounded-2xl border-2 border-flamingo-dark p-5 shadow-[4px_4px_0_#1A1A2E] text-left"
                >
                  <p className="text-xs text-flamingo-dark/50 font-medium mb-3">Receipt</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-flamingo-dark/60">Amount</span>
                      <span className="text-sm font-bold tabular-nums">R{parseFloat(amount).toFixed(2)}</span>
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
                </motion.div>

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleReset}
                  className="mt-6 w-full py-3 rounded-full border-2 border-flamingo-dark bg-white text-flamingo-dark font-bold text-sm"
                >
                  Make another payment
                </motion.button>

                <div className="mt-6 flex items-center justify-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-flamingo-pink flex items-center justify-center text-white text-xs font-black">F</span>
                  <span className="text-xs text-flamingo-dark/40">Powered by Flamingo Pay</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

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
