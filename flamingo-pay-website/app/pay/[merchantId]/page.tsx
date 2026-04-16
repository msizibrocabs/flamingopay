"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedCounter } from "../../../components/motion/AnimatedCounter";
import { flamingoConfetti } from "../../../components/motion/Confetti";

/* ──────────────────────────────────────────────
   Merchant type fetched from API
   ────────────────────────────────────────────── */
type MerchantInfo = { name: string; category: string };

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

/* ──────────────────────────────────────────────
   Viral witty screens — random each transaction
   ────────────────────────────────────────────── */
type ViralQuote = { emoji: string; headline: string; sub: string };

const SUCCESS_QUOTES: ViralQuote[] = [
  { emoji: "🦩", headline: "Money moves like a flamingo", sub: "Graceful. Pink. Unstoppable." },
  { emoji: "🔥", headline: "Transaction hotter than a braai on Heritage Day", sub: "Somebody call the fire department." },
  { emoji: "⚡", headline: "Faster than Eskom switching off your lights", sub: "At least something in SA works instantly." },
  { emoji: "💅", headline: "Paid with main character energy", sub: "Your bank balance left the chat, but you look good doing it." },
  { emoji: "🚀", headline: "Payment went through faster than a taxi on the N1", sub: "No stops. No drama. Just vibes." },
  { emoji: "👑", headline: "Big spender alert", sub: "Somebody tell the Reserve Bank we found the economy." },
  { emoji: "🦩", headline: "You just flamingo'd that payment", sub: "Stand on one leg if you agree this was too easy." },
  { emoji: "😤", headline: "Wallet said 'I'll allow it'", sub: "Your money left peacefully. No complaints filed." },
  { emoji: "🎵", headline: "Money moved smoother than an Amapiano bassline", sub: "Log drum energy. No skips." },
  { emoji: "🧘", headline: "Inner peace achieved", sub: "No card machine. No awkward tap. Just a clean QR scan and done." },
  { emoji: "🏎️", headline: "Gone in 0.3 seconds", sub: "Your payment was faster than your ex moving on." },
  { emoji: "🤝", headline: "Deal sealed. Ancestors approved.", sub: "Even gogo would be proud of how easy that was." },
  { emoji: "🪩", headline: "Payment went through like a Friday night", sub: "Smooth, effortless, and everyone's happy." },
  { emoji: "🧾", headline: "Receipt secured. Screenshot this.", sub: "Proof you support local. Put it on your story." },
  { emoji: "🦩", headline: "Pink money hits different", sub: "Cash is boring. Cards are mid. QR is elite." },
  { emoji: "💸", headline: "Money teleported successfully", sub: "Scientists can't explain it. Flamingo can." },
  { emoji: "🫡", headline: "Salute to you, legend", sub: "Supporting local business like it's a personality trait." },
  { emoji: "🎯", headline: "Bullseye. Nailed it.", sub: "Scan. Pay. Done. Why is everything else in life so complicated?" },
  { emoji: "🍕", headline: "Easier than ordering pizza", sub: "And you didn't even have to argue about toppings." },
  { emoji: "🦩", headline: "One scan to rule them all", sub: "No card machine needed. Just vibes and a camera." },
  { emoji: "😎", headline: "Paid like a boss", sub: "Your accountant would be proud. If you had one." },
  { emoji: "🌍", headline: "One small tap for you, one giant leap for local business", sub: "Neil Armstrong wishes he was this smooth." },
  { emoji: "🎤", headline: "Drop the mic. Payment complete.", sub: "This is what peak performance looks like." },
  { emoji: "🐐", headline: "GOAT behaviour", sub: "Paying with QR instead of fumbling for cash? Elite move." },
  { emoji: "🦩", headline: "Flamingo mode: activated", sub: "You're officially too cool for card machines." },
  { emoji: "🧃", headline: "Sippin' on that cashless lifestyle", sub: "No coins. No notes. No problems." },
  { emoji: "🏆", headline: "Winner winner, chicken dinner", sub: "You paid. They smiled. Everyone wins." },
  { emoji: "🤯", headline: "Your bank didn't even see it coming", sub: "By the time they blinked, the money was already there." },
  { emoji: "🦩", headline: "Built different. Paid different.", sub: "Welcome to the pink side of money." },
  { emoji: "💫", headline: "Manifested that transaction", sub: "You visualised it. You scanned it. You conquered it." },
];

const FAIL_QUOTES: ViralQuote[] = [
  { emoji: "😭", headline: "Payment said 'not today, fam'", sub: "Even your money needs a mental health day sometimes." },
  { emoji: "🦩", headline: "Flamingo tripped", sub: "Even the most graceful bird stumbles. Try again, legend." },
  { emoji: "💀", headline: "Transaction flatlined", sub: "We're performing CPR on your payment. Stand by." },
  { emoji: "🤡", headline: "Plot twist: payment failed", sub: "The universe is testing you. Don't let it win." },
  { emoji: "😤", headline: "Bank said 'let me think about it'", sub: "Your bank is acting like your crush. Playing hard to get." },
  { emoji: "🧊", headline: "Payment frozen like loadshedding stage 6", sub: "We'll thaw this out. Give it another go." },
  { emoji: "🦩", headline: "Flamingo fell off the branch", sub: "Getting back up now. One more try?" },
  { emoji: "📡", headline: "Signal lost somewhere between you and the money", sub: "Probably Telkom's fault. It usually is." },
  { emoji: "🙃", headline: "This is fine. Everything is fine.", sub: "Your payment didn't go through but at least you still have your money?" },
  { emoji: "🫠", headline: "Payment melted", sub: "Like ice cream on a Durban December day. Try again before it all disappears." },
  { emoji: "🤔", headline: "Your bank is overthinking it", sub: "It's giving 'I need to speak to my manager' energy." },
  { emoji: "🏚️", headline: "Connection went on lunch break", sub: "South African timing. It'll be back... eventually." },
  { emoji: "🦩", headline: "Even flamingos have off days", sub: "Shake it off. Scan again. We believe in you." },
  { emoji: "🫣", headline: "Awkward... that didn't work", sub: "But hey, at least nobody saw. Oh wait, you're reading this." },
  { emoji: "🔌", headline: "Something got unplugged", sub: "No, it wasn't loadshedding this time. Probably." },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ──────────────────────────────────────────────
   Processing quips — rotates while waiting
   ────────────────────────────────────────────── */
const PROCESSING_QUIPS = [
  "Convincing your bank this is legit...",
  "Sending money at the speed of light...",
  "Whispering sweet nothings to the server...",
  "Teaching your rands to fly...",
  "Bribing the payment gods...",
  "Almost there... probably...",
  "Your money is putting on its shoes...",
  "Loading... unlike Eskom, we'll actually finish.",
  "Calculating how many kotas that is...",
  "Making your bank jealous of how easy this is...",
];

const stepVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function PayPage() {
  const params = useParams();
  const merchantId = params.merchantId as string;
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [merchantLoading, setMerchantLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"amount" | "method" | "processing" | "done" | "failed" | "manual">("amount");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processingQuip, setProcessingQuip] = useState(0);
  const [txnRef, setTxnRef] = useState<string | null>(null);

  const numericAmount = parseFloat(amount);
  const isValidAmount = !isNaN(numericAmount) && numericAmount >= 1 && numericAmount <= 50000;

  // Fetch merchant from API on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/merchants/${merchantId}`, { cache: "no-store" });
        if (!res.ok) { setMerchantLoading(false); return; }
        const data = await res.json();
        if (data.merchant) {
          setMerchant({
            name: data.merchant.businessName,
            category: data.merchant.businessType,
          });
        }
      } catch { /* merchant not found */ }
      setMerchantLoading(false);
    })();
  }, [merchantId]);

  // Pick a fresh random quote when step changes to done or failed
  const viralQuote = useMemo(
    () => step === "done" ? pickRandom(SUCCESS_QUOTES) : step === "failed" ? pickRandom(FAIL_QUOTES) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step],
  );

  useEffect(() => {
    if (step === "done") flamingoConfetti();
  }, [step]);

  // Rotate processing quips
  useEffect(() => {
    if (step !== "processing") return;
    setProcessingQuip(Math.floor(Math.random() * PROCESSING_QUIPS.length));
    const interval = setInterval(() => {
      setProcessingQuip(q => (q + 1) % PROCESSING_QUIPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [step]);

  /** Record the transaction on the server so it shows on merchant dashboard + admin */
  async function recordTransaction(rail: "payshap" | "eft") {
    try {
      const banks = ["Capitec", "FNB", "Standard Bank", "Nedbank", "ABSA", "TymeBank", "Discovery Bank"];
      const res = await fetch(`/api/merchants/${merchantId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          rail,
          buyerBank: banks[Math.floor(Math.random() * banks.length)],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTxnRef(data.transaction?.reference ?? null);
      }
    } catch { /* best-effort */ }
  }

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
      // ~12% chance of "failure" for demo variety
      const willFail = Math.random() < 0.12;
      const rail = method === "payshap" ? "payshap" as const : "eft" as const;
      setTimeout(async () => {
        if (!willFail) {
          await recordTransaction(rail);
          setStep("done");
        } else {
          setStep("failed");
        }
      }, 2200);
    }
  }
  function handleReset() {
    setAmount("");
    setStep("amount");
    setSelectedMethod(null);
    setTxnRef(null);
  }
  function handleRetry() {
    if (!selectedMethod) return;
    setStep("processing");
    const rail = selectedMethod === "payshap" ? "payshap" as const : "eft" as const;
    // Retry always succeeds
    setTimeout(async () => {
      await recordTransaction(rail);
      setStep("done");
    }, 2200);
  }

  if (merchantLoading) {
    return (
      <div className="min-h-screen bg-gradient-sunrise flex items-center justify-center">
        <span className="inline-block h-4 w-4 animate-ping rounded-full bg-flamingo-pink" />
      </div>
    );
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
                <AnimatePresence mode="wait">
                  <motion.p
                    key={processingQuip}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mt-2 text-flamingo-dark/60 text-sm h-5"
                  >
                    {PROCESSING_QUIPS[processingQuip]}
                  </motion.p>
                </AnimatePresence>
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
                  Copy details
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

            {/* ═══════════════════════════════════════
               SUCCESS SCREEN — viral witty content
               ═══════════════════════════════════════ */}
            {step === "done" && viralQuote && (
              <motion.div
                key="done"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="text-center py-8"
              >
                {/* Big emoji hero */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12 }}
                  className="text-7xl mx-auto"
                >
                  {viralQuote.emoji}
                </motion.div>

                {/* Witty headline */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="display font-black text-flamingo-dark mt-4 px-2"
                  style={{ fontSize: "clamp(1.4rem, 5.5vw, 1.875rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
                >
                  {viralQuote.headline}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 text-flamingo-dark/60 text-sm px-4"
                >
                  {viralQuote.sub}
                </motion.p>

                {/* Amount badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-flamingo-dark bg-flamingo-mint px-5 py-2.5 shadow-[0_4px_0_0_#1A1A2E]"
                >
                  <span className="text-sm font-bold text-flamingo-dark/60">
                    {selectedMethod === "manual" ? "Sent" : "Paid"}
                  </span>
                  <span className="display text-xl font-black text-flamingo-dark tabular-nums">
                    {selectedMethod !== "manual" ? (
                      <AnimatedCounter to={parseFloat(amount)} duration={0.9} prefix="R" decimals={2} locale="en-ZA" />
                    ) : (
                      `R${parseFloat(amount).toFixed(2)}`
                    )}
                  </span>
                </motion.div>

                {/* Receipt card */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-5 bg-white rounded-2xl border-2 border-flamingo-dark p-4 shadow-[4px_4px_0_#1A1A2E] text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-flamingo-dark/50 font-medium">Receipt</span>
                    <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
                      {selectedMethod === "manual" ? "PENDING" : "COMPLETE"}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-flamingo-dark/60">To</span>
                      <span className="font-bold">{merchant.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-flamingo-dark/60">Amount</span>
                      <span className="font-bold tabular-nums">R{parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-flamingo-dark/60">Via</span>
                      <span className="font-bold">{selectedMethod && METHODS[selectedMethod].label}</span>
                    </div>
                    {txnRef && (
                      <div className="flex justify-between">
                        <span className="text-flamingo-dark/60">Ref</span>
                        <span className="font-bold font-mono text-xs">{txnRef}</span>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Share prompt */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-4 text-xs text-flamingo-dark/50 font-medium"
                >
                  Screenshot this. Flex on your friends. You deserve it.
                </motion.p>

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleReset}
                  className="mt-4 w-full py-3.5 rounded-full border-2 border-flamingo-dark bg-white text-flamingo-dark font-bold text-sm"
                >
                  Make another payment
                </motion.button>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-flamingo-pink flex items-center justify-center text-white text-xs font-black">F</span>
                  <span className="text-xs text-flamingo-dark/40">Powered by Flamingo Pay</span>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════
               FAILURE SCREEN — witty but reassuring
               ═══════════════════════════════════════ */}
            {step === "failed" && viralQuote && (
              <motion.div
                key="failed"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="text-center py-10"
              >
                {/* Shake emoji */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, -5, 5, -5, 0] }}
                  transition={{ type: "spring", stiffness: 200, damping: 14 }}
                  className="text-7xl mx-auto"
                >
                  {viralQuote.emoji}
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="display font-black text-flamingo-dark mt-4 px-2"
                  style={{ fontSize: "clamp(1.4rem, 5.5vw, 1.875rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
                >
                  {viralQuote.headline}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 text-flamingo-dark/60 text-sm px-4"
                >
                  {viralQuote.sub}
                </motion.p>

                {/* Failed amount */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-flamingo-dark bg-flamingo-pink-soft px-5 py-2.5 shadow-[0_4px_0_0_#1A1A2E]"
                >
                  <span className="text-sm font-bold text-flamingo-pink-deep">Failed</span>
                  <span className="display text-xl font-black text-flamingo-dark tabular-nums line-through opacity-60">
                    R{parseFloat(amount).toFixed(2)}
                  </span>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 text-xs text-flamingo-dark/50 font-medium"
                >
                  No money was deducted. Your balance is safe.
                </motion.p>

                {/* Retry + Change method */}
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRetry}
                  className="mt-5 w-full py-4 rounded-full bg-gradient-flamingo text-white font-black text-lg shadow-[0_8px_20px_-6px_rgba(255,82,119,0.55)]"
                >
                  Try again
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStep("method")}
                  className="mt-3 w-full py-3.5 rounded-full border-2 border-flamingo-dark bg-white text-flamingo-dark font-bold text-sm"
                >
                  Choose a different method
                </motion.button>

                <div className="mt-5 flex items-center justify-center gap-2">
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
