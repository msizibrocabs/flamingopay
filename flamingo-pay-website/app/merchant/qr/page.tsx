"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { MerchantGate } from "../_components/MerchantGate";
import { TabBar } from "../_components/TabBar";
import { TopBar } from "../_components/TopBar";
import { Reveal } from "../../../components/motion/Reveal";
import { burstAt } from "../../../components/motion/Confetti";
import { currentMerchantId } from "../../../lib/merchant";
import { useMerchant } from "../../../lib/useMerchant";

export default function QrPage() {
  return (
    <MerchantGate>
      <Inner />
    </MerchantGate>
  );
}

function Inner() {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mid = currentMerchantId() ?? "demo";
  const { merchant: m } = useMerchant();
  const name = m?.businessName ?? "Your Shop";
  const url = `https://www.flamingopay.co.za/pay/${mid}`;

  // Generate QR code on canvas client-side
  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 280,
      margin: 2,
      color: {
        dark: "#1A1A2E",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    });
  }, [url]);

  async function copyLink(e?: React.MouseEvent) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (e) {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        burstAt((r.left + r.width / 2) / window.innerWidth, (r.top + r.height / 2) / window.innerHeight);
      }
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function share() {
    if (navigator.share) {
      navigator.share({
        title: `Pay ${name} with Flamingo`,
        text: `Scan or tap to pay ${name}`,
        url,
      }).catch(() => {});
    } else {
      copyLink();
    }
  }

  function downloadQR() {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `flamingo-qr-${mid}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  return (
    <main className="min-h-dvh bg-gradient-sunrise pb-28">
      <TopBar
        title="My QR"
        subtitle="Buyers scan to pay"
        action={
          <button
            onClick={share}
            aria-label="Share"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" />
            </svg>
          </button>
        }
      />

      <div className="mx-auto max-w-md px-4">
        <Reveal className="mt-5">
          <section className="relative overflow-hidden rounded-3xl border-2 border-flamingo-dark bg-white shadow-[0_10px_0_0_#1A1A2E]">
            {/* Decorative blurs */}
            <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-flamingo-pink/15 blur-2xl" />
            <span className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-flamingo-butter/30 blur-2xl" />

            {/* Header stripe */}
            <div className="bg-gradient-to-r from-flamingo-pink to-flamingo-pink-deep px-5 py-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-white/20">
                  <span className="text-sm font-extrabold text-white">F</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/90">Flamingo Pay</span>
              </div>
            </div>

            <div className="px-5 pb-5 pt-4">
              <div className="text-center">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-flamingo-pink-deep">Scan to pay</p>
                <h2 className="display mt-1 text-2xl font-extrabold text-flamingo-dark">
                  {name}
                </h2>
              </div>

              {/* QR Code */}
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 180, damping: 18 }}
                className="mt-4 flex flex-col items-center rounded-2xl border-2 border-dashed border-flamingo-dark/10 bg-white p-6"
              >
                <canvas
                  ref={canvasRef}
                  className="h-auto w-full max-w-[280px]"
                />
                <div className="mt-3 flex items-center gap-1.5 text-flamingo-dark/50">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className="text-[10px] font-semibold uppercase tracking-wide">Secure payment via PayShap & EFT</span>
                </div>
              </motion.div>

              {/* Payment link */}
              <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-2.5">
                <span className="truncate text-xs text-flamingo-dark">{url}</span>
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={copyLink}
                  className="flex-none rounded-lg bg-flamingo-pink px-3 py-1.5 text-xs font-extrabold text-white shadow-[0_3px_0_0_#B42A48]"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </motion.button>
              </div>
            </div>
          </section>
        </Reveal>

        {/* Action cards */}
        <Reveal delay={0.1} className="mt-4">
          <section className="grid grid-cols-3 gap-3">
            <ActionCard
              title="Print poster"
              subtitle="A4 print-ready"
              icon="🖨️"
              onClick={() => window.print()}
            />
            <ActionCard
              title="Download"
              subtitle="Save as PNG"
              icon="📥"
              onClick={downloadQR}
            />
            <ActionCard
              title="Share link"
              subtitle="WhatsApp / SMS"
              icon="📤"
              onClick={share}
            />
          </section>
        </Reveal>

        {/* How buyers pay */}
        <Reveal delay={0.2} className="mt-4">
          <section className="rounded-3xl border-2 border-flamingo-dark bg-flamingo-butter p-5 shadow-[0_6px_0_0_#1A1A2E]">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-flamingo-dark">How buyers pay</h3>
            <ol className="mt-2 space-y-2 text-sm text-flamingo-dark">
              {[
                "Buyer opens camera or bank app",
                "Scans your QR code",
                "Enters amount, picks PayShap or EFT",
                "Confirms in their bank app",
                "You get a notification — money is yours",
              ].map((step, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <strong>{i + 1}.</strong> {step}
                </motion.li>
              ))}
            </ol>
          </section>
        </Reveal>
      </div>

      <TabBar />
    </main>
  );
}

function ActionCard({
  title, subtitle, icon, onClick,
}: {
  title: string; subtitle: string; icon: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -3, rotate: -0.6 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="rounded-2xl border-2 border-flamingo-dark bg-white p-3 text-left shadow-[0_4px_0_0_#1A1A2E]"
    >
      <span className="text-2xl">{icon}</span>
      <div className="mt-1 text-xs font-extrabold text-flamingo-dark">{title}</div>
      <div className="text-[10px] text-flamingo-dark/60">{subtitle}</div>
    </motion.button>
  );
}
