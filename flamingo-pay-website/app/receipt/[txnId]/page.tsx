"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

type ReceiptData = {
  txn: {
    id: string;
    amount: number;
    rail: string;
    buyerBank: string;
    timestamp: string;
    status: string;
    reference: string;
  };
  merchantName: string;
  merchantId: string;
};

export default function ReceiptPage({
  params,
}: {
  params: Promise<{ txnId: string }>;
}) {
  const { txnId } = use(params);
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/receipt/${txnId}`)
      .then(r => {
        if (!r.ok) throw new Error("Receipt not found");
        return r.json();
      })
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [txnId]);

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-flamingo-cream">
        <div className="flex items-center gap-2 text-flamingo-dark/70">
          <span className="inline-block h-3 w-3 animate-ping rounded-full bg-flamingo-pink" />
          Loading receipt…
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="grid min-h-dvh place-items-center bg-flamingo-cream p-6">
        <div className="max-w-sm rounded-2xl border-2 border-flamingo-dark bg-white p-6 text-center shadow-[0_6px_0_0_#1A1A2E]">
          <div className="text-3xl">🧾</div>
          <h1 className="display mt-2 text-xl font-extrabold text-flamingo-dark">
            Receipt not found
          </h1>
          <p className="mt-1 text-sm text-flamingo-dark/60">
            This transaction doesn&apos;t exist or has expired.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-bold text-flamingo-pink-deep underline-offset-2 hover:underline">
            Go to Flamingo Pay
          </Link>
        </div>
      </main>
    );
  }

  const t = data.txn;
  const date = new Date(t.timestamp);

  return (
    <main className="min-h-dvh bg-flamingo-cream p-6">
      <div className="mx-auto max-w-sm">
        <div className="rounded-3xl border-2 border-flamingo-dark bg-white p-6 shadow-[0_6px_0_0_#1A1A2E]">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border-2 border-flamingo-dark bg-flamingo-pink shadow-[0_3px_0_0_#1A1A2E]">
              <span className="display text-xl font-extrabold text-white">F</span>
            </div>
            <p className="mt-3 text-[10px] font-extrabold uppercase tracking-widest text-flamingo-pink-deep">
              Payment receipt
            </p>
            <h1 className="display mt-1 text-3xl font-extrabold text-flamingo-dark">
              R {t.amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
            </h1>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border-2 border-flamingo-dark bg-flamingo-mint px-3 py-1 text-xs font-extrabold text-flamingo-dark">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {t.status === "completed" ? "Paid" : t.status}
            </div>
          </div>

          {/* Details */}
          <div className="mt-6 space-y-3">
            <DetailRow label="Paid to" value={data.merchantName} />
            <DetailRow label="Reference" value={t.reference} />
            <DetailRow label="Payment method" value={t.rail === "payshap" ? "PayShap (instant)" : "Instant EFT"} />
            <DetailRow label="Your bank" value={t.buyerBank} />
            <DetailRow label="Date" value={date.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })} />
            <DetailRow label="Time" value={date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })} />
            <DetailRow label="Transaction ID" value={t.id} mono />
          </div>

          {/* Dashed divider */}
          <div className="my-5 border-t-2 border-dashed border-flamingo-dark/20" />

          <p className="text-center text-[11px] text-flamingo-dark/50">
            This is your digital receipt from Flamingo Pay.
            <br />Keep it for your records.
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2.5 text-xs font-extrabold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E]"
          >
            Print
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: `Flamingo receipt — ${t.reference}`, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="flex-1 rounded-xl border-2 border-flamingo-dark bg-flamingo-pink px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_3px_0_0_#B42A48]"
          >
            Share
          </button>
        </div>

        <p className="mt-6 text-center text-[11px] text-flamingo-dark/40">
          Powered by Flamingo Pay • www.flamingopay.co.za
        </p>
      </div>
    </main>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-flamingo-dark/50">{label}</span>
      <span className={`max-w-[60%] text-right text-sm font-semibold text-flamingo-dark ${mono ? "font-mono text-xs break-all" : ""}`}>{value}</span>
    </div>
  );
}
