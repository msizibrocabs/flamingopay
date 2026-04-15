"use client";

import Image from "next/image";
import { useState } from "react";
import { MerchantGate } from "../_components/MerchantGate";
import { TabBar } from "../_components/TabBar";
import { TopBar } from "../_components/TopBar";
import { DEMO_MERCHANT } from "../../../lib/merchant";

export default function QrPage() {
  return (
    <MerchantGate>
      <Inner />
    </MerchantGate>
  );
}

function Inner() {
  const [copied, setCopied] = useState(false);
  const url = `https://flamingopay.co.za/pay/${DEMO_MERCHANT.id}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function share() {
    if (navigator.share) {
      navigator.share({
        title: `Pay ${DEMO_MERCHANT.name} with Flamingo`,
        text: `Scan or tap to pay ${DEMO_MERCHANT.name}`,
        url,
      }).catch(() => {});
    } else {
      copyLink();
    }
  }

  return (
    <main className="min-h-dvh bg-flamingo-cream pb-28">
      <TopBar
        title="My QR"
        subtitle="Buyers scan to pay"
        action={
          <button
            onClick={share}
            aria-label="Share"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" />
            </svg>
          </button>
        }
      />

      <div className="mx-auto max-w-md px-4">
        <section className="mt-5 rounded-3xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]">
          <div className="text-center">
            <p className="text-xs font-extrabold uppercase tracking-wider text-flamingo-pink-deep">Scan to pay</p>
            <h2 className="display mt-1 text-2xl font-extrabold text-flamingo-dark">
              {DEMO_MERCHANT.name}
            </h2>
          </div>

          <div className="mt-4 grid place-items-center rounded-3xl bg-flamingo-cream p-4">
            {/* Pre-generated branded QR from /public */}
            <Image
              src={`/qr-${DEMO_MERCHANT.id}.png`}
              alt={`Flamingo Pay QR for ${DEMO_MERCHANT.name}`}
              width={340}
              height={420}
              className="h-auto w-full max-w-xs"
              priority
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-2.5">
            <span className="truncate text-xs text-flamingo-dark">{url}</span>
            <button
              onClick={copyLink}
              className="flex-none rounded-lg bg-flamingo-pink px-3 py-1.5 text-xs font-extrabold text-white"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <ActionCard
            title="Print poster"
            subtitle="A4 print-ready"
            icon="🖨️"
            onClick={() => window.open(`/qr-${DEMO_MERCHANT.id}.png`, "_blank")}
          />
          <ActionCard
            title="Share link"
            subtitle="WhatsApp / SMS"
            icon="📤"
            onClick={share}
          />
        </section>

        <section className="mt-4 rounded-3xl border-2 border-flamingo-dark bg-flamingo-butter p-5 shadow-[0_6px_0_0_#1A1A2E]">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-flamingo-dark">How buyers pay</h3>
          <ol className="mt-2 space-y-2 text-sm text-flamingo-dark">
            <li><strong>1.</strong> Buyer opens camera or bank app</li>
            <li><strong>2.</strong> Scans your QR code</li>
            <li><strong>3.</strong> Enters amount, picks PayShap or EFT</li>
            <li><strong>4.</strong> Confirms in their bank app</li>
            <li><strong>5.</strong> You get a notification — money is yours</li>
          </ol>
        </section>
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
    <button
      onClick={onClick}
      className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 text-left shadow-[0_4px_0_0_#1A1A2E] active:translate-y-0.5 active:shadow-[0_2px_0_0_#1A1A2E]"
    >
      <span className="text-2xl">{icon}</span>
      <div className="mt-1 text-sm font-extrabold text-flamingo-dark">{title}</div>
      <div className="text-xs text-flamingo-dark/60">{subtitle}</div>
    </button>
  );
}
