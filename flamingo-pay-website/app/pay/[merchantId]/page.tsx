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
  { emoji: "🦩", headline: "Your money just did the splits", sub: "Right out of your account, into theirs. Didn't even stretch first." },
  { emoji: "🔥", headline: "Hotter than a braai with no tongs", sub: "You just grabbed that payment with your bare hands. Respect." },
  { emoji: "⚡", headline: "Eskom could never", sub: "Your payment arrived in 2 seconds. Your electricity? See you in 4 hours." },
  { emoji: "💅", headline: "Money left and didn't even slam the door", sub: "Peaceful exit. No drama. Unlike your last relationship." },
  { emoji: "🚕", headline: "Your rands just caught a quantum taxi", sub: "No waiting at the rank. No arguing about change. Just poof. Gone." },
  { emoji: "👑", headline: "Someone call the Reserve Bank", sub: "There's been a devastating act of supporting local business." },
  { emoji: "🦩", headline: "You just out-flamingoed a flamingo", sub: "Standing on one leg, looking pink, absolutely unbothered." },
  { emoji: "😤", headline: "Your bank account accepted its fate", sub: "It fought briefly. Then it saw the QR code. Then it surrendered." },
  { emoji: "🎵", headline: "This payment has log drum energy", sub: "Amapiano bassline. No skips. Your bank is doing the backspin." },
  { emoji: "🧘", headline: "You have achieved financial nirvana", sub: "No card machine. No 'tap again.' No 'try inserting.' Just peace." },
  { emoji: "🏎️", headline: "Faster than your ex's rebound", sub: "The money moved on before you even blinked. Emotional damage." },
  { emoji: "🤝", headline: "Ancestors called. They're impressed.", sub: "Gogo said 'in my day we used cash.' Then she downloaded the app." },
  { emoji: "🪩", headline: "Your wallet just did the Kilimanjaro", sub: "Everybody's happy. The DJ is playing. The rands are vibing." },
  { emoji: "🧾", headline: "Screenshot this. Frame it. Hang it up.", sub: "This is proof you're a functioning adult. Don't waste this moment." },
  { emoji: "🦩", headline: "Cash is dead. You attended the funeral.", sub: "Cards sent flowers. QR codes delivered the eulogy." },
  { emoji: "💸", headline: "Your money ghosted you", sub: "No goodbye. No explanation. Just left. At least it went to a good place." },
  { emoji: "🫡", headline: "You absolute legend of a human", sub: "Some people talk about supporting local. You actually did it. With a phone." },
  { emoji: "🎯", headline: "Bullseye. First try. No notes.", sub: "If paying people was an Olympic sport, you'd be on the podium crying." },
  { emoji: "🍕", headline: "Easier than splitting a bill", sub: "And nobody had to do that awkward 'I'll get you back' thing." },
  { emoji: "🦩", headline: "One scan and the deed is done", sub: "That's it. That's the whole thing. We refuse to make this complicated." },
  { emoji: "😎", headline: "Accountant energy. CEO execution.", sub: "You just paid someone using a bird app. The future is unhinged." },
  { emoji: "🌍", headline: "One small scan for man, one giant flex for SA", sub: "Neil Armstrong walked on the moon. You paid a spaza with a QR code. Same energy." },
  { emoji: "🎤", headline: "Mic dropped. Payment cleared. Crowd roaring.", sub: "Standing ovation from your bank. Slow clap from your wallet." },
  { emoji: "🐐", headline: "Absolute GOAT behaviour detected", sub: "You chose QR over fumbling for R4.50 in coins. Society thanks you." },
  { emoji: "🦩", headline: "You're now certified flamingo", sub: "Side effects include: never wanting to use cash again." },
  { emoji: "🧃", headline: "Sipping on that cashless juice", sub: "No coins jingling in your pocket like a toddler's toy. Just elegance." },
  { emoji: "🏆", headline: "Winner winner, 7 colours dinner", sub: "You paid. They smiled. Dumpling did a little dance." },
  { emoji: "🤯", headline: "Your bank is still processing what just happened", sub: "The money arrived before the notification. That's not even legal." },
  { emoji: "🦩", headline: "Welcome to the pink side", sub: "We have QR codes, instant payments, and absolutely zero card machines." },
  { emoji: "💫", headline: "Manifestation works, apparently", sub: "You visualised paying. You scanned. Money left. The universe delivered." },
  { emoji: "🫠", headline: "That was suspiciously easy", sub: "No queue. No PIN. No 'card declined' embarrassment. What is this sorcery." },
  { emoji: "🧠", headline: "200 IQ payment right there", sub: "While people are still counting coins, you're living in 2035." },
  { emoji: "🦩", headline: "Flam. Ingo. Done.", sub: "Three syllables. One payment. Zero regrets. That's the tweet." },
  { emoji: "🫶", headline: "Your money found a loving home", sub: "It's with a local business now. It's happy. Please don't call." },
  { emoji: "🍗", headline: "Smoother than a Nando's extra mild", sub: "Except this actually had flavour. And speed. And no queue." },
  { emoji: "🧊", headline: "Ice cold execution", sub: "You walked in. Scanned. Paid. Walked out. They're still shook." },
  { emoji: "🦩", headline: "The QR code feared you", sub: "It knew what was coming. It accepted its fate. It processed. GG." },
  { emoji: "🎪", headline: "And for my next trick", sub: "I will make your money disappear... into a local business. *applause*" },
  { emoji: "🫣", headline: "Your bank account when it sees this", sub: "'Ah here we go again.' Too late. It's done. No refunds on vibes." },
  { emoji: "🦩", headline: "You just made capitalism cute", sub: "A flamingo helped you pay a human. The economy is healing." },
];

const FAIL_QUOTES: ViralQuote[] = [
  { emoji: "😭", headline: "Your payment is having a gap year", sub: "It'll find itself eventually. Just not right now. Try again." },
  { emoji: "🦩", headline: "The flamingo face-planted", sub: "Beak first into the ground. Dignity? Gone. But we're getting up." },
  { emoji: "💀", headline: "Transaction said 'I'm deceased'", sub: "We're sending thoughts and prayers. And also a retry button." },
  { emoji: "🤡", headline: "You've been clowned by technology", sub: "Somewhere, a card machine is laughing. Don't give it the satisfaction." },
  { emoji: "😤", headline: "Your bank left you on read", sub: "Seen 12:04. No reply. Classic. The audacity of these financial institutions." },
  { emoji: "🧊", headline: "Payment frozen. Blame stage 6.", sub: "Eskom didn't do this. But it's easier to blame them. Try again." },
  { emoji: "🦩", headline: "Flamingo fell off the wifi", sub: "One leg? Fine. No signal? Even flamingos have limits." },
  { emoji: "📡", headline: "Telkom woke up and chose violence", sub: "We can't prove it was them. But we can't prove it wasn't." },
  { emoji: "🙃", headline: "Cool cool cool. No payment.", sub: "This is fine. The room is on fire. But your money is safe. So there's that." },
  { emoji: "🫠", headline: "Payment melted like a Cornetto in December", sub: "Durban heat. No survivors. Try again before your battery also dies." },
  { emoji: "🤔", headline: "Your bank needs a moment", sub: "'I need to speak to my manager' energy. Give it a sec and retry." },
  { emoji: "🏚️", headline: "The internet took a lunch break", sub: "South African lunch break. So like 2 hours. But try again now." },
  { emoji: "🦩", headline: "Even pink birds have bad days", sub: "But unlike your ex, we're willing to try again. Hit retry." },
  { emoji: "🫣", headline: "Well this is embarrassing", sub: "For us, not you. You did everything right. We just... flopped." },
  { emoji: "🔌", headline: "Someone tripped over the cable", sub: "Was it loadshedding? Was it Dave from IT? The investigation continues." },
  { emoji: "🥲", headline: "Payment ghosted harder than Hinge", sub: "It was right there. We made eye contact. Then poof. Gone. Like everyone on dating apps." },
  { emoji: "🦩", headline: "Plot twist nobody asked for", sub: "In the movie of your life, this is the part where the hero retries and succeeds." },
  { emoji: "🧠", headline: "Error 404: payment not found", sub: "Your money is safe. The payment just went to get milk and never came back." },
  { emoji: "🦩", headline: "Technical difficulties feat. bad vibes", sub: "The vibes were off. Mercury is in retrograde. Also, try again." },
  { emoji: "🐌", headline: "That payment is moving at SAPO speed", sub: "It'll arrive in 3-5 business forevers. Or just retry now." },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ──────────────────────────────────────────────
   Processing quips — rotates while waiting
   ────────────────────────────────────────────── */
const PROCESSING_QUIPS = [
  "Explaining to your bank why this is a good idea...",
  "Your rands are putting on their running shoes...",
  "Whispering 'it's going to be okay' to your wallet...",
  "Loading... unlike Eskom, we actually finish things.",
  "Teaching your money to do parkour across banks...",
  "Calculating how many vetkoeks that is...",
  "Your bank is Googling 'what is a flamingo'...",
  "Negotiating with the payment gods. They drive a hard bargain.",
  "Your money just said 'goodbye cruel wallet'...",
  "Buffering at the speed of South African wifi...",
  "Drafting a motivational speech for your rands...",
  "Asking your bank nicely. Very nicely. Please.",
  "Your payment is in the uber. 3 min away. Probably.",
  "Converting your money into flamingo energy...",
  "Almost done. We're not Telkom. We promise.",
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
      <div className="min-h-dvh bg-gradient-sunrise flex items-center justify-center p-6">
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
    <div className="min-h-dvh bg-gradient-sunrise">
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
      <main className="px-5 py-6">
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
