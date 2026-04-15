"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { currentMerchantId, signOut } from "../../../lib/merchant";
import type { MerchantApplication } from "../../../lib/store";

export default function PendingPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<MerchantApplication | null>(null);
  const [ready, setReady] = useState(false);

  // Poll merchant status every 5 seconds — when admin flips it to approved
  // we auto-advance to the dashboard.
  useEffect(() => {
    const id = currentMerchantId();
    if (!id) {
      router.replace("/merchant/login");
      return;
    }

    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch(`/api/merchants/${id}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setMerchant(data.merchant);
        setReady(true);
        if (data.merchant?.status === "approved") {
          router.push("/merchant/dashboard?welcome=1");
        }
      } catch {
        /* ignore */
      }
    }

    tick();
    const handle = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [router]);

  function handleSignOut() {
    signOut();
    router.replace("/merchant/login");
  }

  if (!ready || !merchant) {
    return (
      <div className="grid min-h-dvh place-items-center bg-flamingo-cream">
        <div className="flex items-center gap-2 text-flamingo-dark/70">
          <span className="inline-block h-3 w-3 animate-ping rounded-full bg-flamingo-pink" />
          Checking your application…
        </div>
      </div>
    );
  }

  const isRejected = merchant.status === "rejected";
  const isSuspended = merchant.status === "suspended";

  return (
    <main className="min-h-dvh bg-flamingo-cream">
      <div className="mx-auto flex max-w-md flex-col px-5 py-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className={
              "grid h-20 w-20 place-items-center rounded-2xl border-2 border-flamingo-dark shadow-[0_6px_0_0_#1A1A2E] " +
              (isRejected
                ? "bg-flamingo-pink-soft"
                : isSuspended
                  ? "bg-flamingo-dark"
                  : "bg-flamingo-butter")
            }
          >
            <span className="display text-4xl font-extrabold text-flamingo-dark">
              {isRejected ? "✕" : isSuspended ? "⏸" : "⏳"}
            </span>
          </div>
          <h1 className="display mt-4 text-3xl font-extrabold text-flamingo-dark">
            {isRejected
              ? "Application needs attention"
              : isSuspended
                ? "Account suspended"
                : "We're reviewing your application"}
          </h1>
          <p className="mt-2 text-sm text-flamingo-dark/70">
            {isRejected
              ? "Our team couldn't approve your application as-is."
              : isSuspended
                ? "Your account has been temporarily paused. Please contact support."
                : "Most merchants are approved within a few hours on a business day. We'll WhatsApp you the moment your QR is live."}
          </p>
        </div>

        <section className="rounded-3xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]">
          <p className="text-xs font-bold uppercase tracking-widest text-flamingo-pink-deep">
            Your application
          </p>
          <h2 className="display mt-1 text-xl font-extrabold text-flamingo-dark">
            {merchant.businessName}
          </h2>
          <p className="text-sm text-flamingo-dark/70">
            {merchant.ownerName} · {merchant.phone}
          </p>

          <dl className="mt-4 space-y-2 text-sm">
            <Row k="Business type" v={merchant.businessType} />
            <Row k="Payout" v={`${merchant.bank} •••• ${merchant.accountLast4}`} />
            <Row
              k="Submitted"
              v={new Date(merchant.createdAt).toLocaleString("en-ZA")}
            />
          </dl>

          {isRejected && merchant.rejectionReason && (
            <div className="mt-4 rounded-xl border-2 border-flamingo-pink bg-flamingo-pink-soft px-3 py-2 text-sm font-semibold text-flamingo-pink-deep">
              <strong className="block">Reason:</strong>
              {merchant.rejectionReason}
            </div>
          )}

          {!isRejected && !isSuspended && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-flamingo-cream px-3 py-2 text-xs text-flamingo-dark/70">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-flamingo-pink" />
              Checking status automatically every 5 seconds…
            </div>
          )}
        </section>

        <section className="mt-4 rounded-2xl border-2 border-flamingo-dark bg-flamingo-mint p-4 shadow-[0_6px_0_0_#1A1A2E]">
          <p className="text-sm font-extrabold text-flamingo-dark">
            What happens next?
          </p>
          <ol className="mt-2 space-y-1 text-xs text-flamingo-dark/80">
            <li>
              1. Flamingo verifies your phone against the RICA database.
            </li>
            <li>
              2. Your bank details are sanity-checked with PayShap.
            </li>
            <li>
              3. As soon as you&apos;re approved, your QR code is live and this
              page flips to the dashboard.
            </li>
          </ol>
        </section>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <a
            href="https://wa.me/27639477208"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-flamingo-pink-deep underline-offset-2 hover:underline"
          >
            💬 Message us on WhatsApp
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-flamingo-dark/60 underline-offset-2 hover:underline"
          >
            Sign out
          </button>
          {isRejected && (
            <Link
              href="/merchant/signup"
              className="mt-2 rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2 font-bold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E]"
            >
              Start a new application
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs font-semibold text-flamingo-dark/60">{k}</dt>
      <dd className="text-right font-semibold text-flamingo-dark">{v}</dd>
    </div>
  );
}
