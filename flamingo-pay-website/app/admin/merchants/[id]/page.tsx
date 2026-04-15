"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminGate } from "../../_components/AdminGate";
import { AdminNav } from "../../_components/AdminNav";
import { StatusPill } from "../../_components/StatusPill";
import { formatZAR, timeAgo } from "../../../../lib/merchant";
import type { MerchantApplication, MerchantStatus } from "../../../../lib/store";

export default function MerchantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AdminGate>
      <AdminNav />
      <Detail id={id} />
    </AdminGate>
  );
}

function Detail({ id }: { id: string }) {
  const router = useRouter();
  const [m, setM] = useState<MerchantApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState<MerchantStatus | null>(null);
  const [error, setError] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/merchants/${id}`, { cache: "no-store" });
      if (res.status === 404) {
        setNotFound(true);
      } else {
        const d = await res.json();
        setM(d.merchant ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus(status: MerchantStatus, reasonText?: string) {
    setSaving(status);
    setError("");
    try {
      const res = await fetch(`/api/merchants/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason: reasonText }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Update failed");
      } else {
        setM(d.merchant);
        setRejectOpen(false);
        setReason("");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-8">
        <div className="h-40 animate-pulse rounded-2xl border-2 border-flamingo-dark/20 bg-white/60" />
      </main>
    );
  }
  if (notFound || !m) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-12 text-center">
        <p className="display text-2xl font-extrabold text-flamingo-dark">
          Merchant not found
        </p>
        <Link
          href="/admin/merchants"
          className="mt-4 inline-block rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2 text-sm font-bold shadow-[0_3px_0_0_#1A1A2E]"
        >
          ← Back to merchants
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-6">
      <Link
        href="/admin/merchants"
        className="inline-block text-sm font-bold text-flamingo-pink-deep underline-offset-2 hover:underline"
      >
        ← Merchants
      </Link>

      {/* Header card */}
      <section className="mt-4 rounded-3xl border-2 border-flamingo-dark bg-white p-6 shadow-[0_6px_0_0_#1A1A2E]">
        <div className="flex flex-wrap items-start gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink text-2xl font-extrabold text-white shadow-[0_3px_0_0_#1A1A2E]">
            {m.businessName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="display text-2xl font-extrabold text-flamingo-dark sm:text-3xl">
              {m.businessName}
            </h1>
            <p className="text-sm text-flamingo-dark/70">
              {m.businessType} · Applied {timeAgo(m.createdAt)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill status={m.status} />
              <code className="rounded-md bg-flamingo-cream px-2 py-0.5 text-xs font-mono text-flamingo-dark/70">
                {m.id}
              </code>
            </div>
          </div>
        </div>

        {m.status === "rejected" && m.rejectionReason && (
          <div className="mt-4 rounded-xl border-2 border-flamingo-pink bg-flamingo-pink-soft px-3 py-2 text-sm font-semibold text-flamingo-pink-deep">
            Rejected reason: {m.rejectionReason}
          </div>
        )}
      </section>

      {/* Action bar */}
      <section className="mt-4 rounded-2xl border-2 border-flamingo-dark bg-flamingo-cream p-4 shadow-[0_6px_0_0_#1A1A2E]">
        <p className="text-xs font-bold uppercase tracking-widest text-flamingo-dark/70">
          Actions
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => updateStatus("approved")}
            disabled={m.status === "approved" || saving !== null}
            className="btn-pink rounded-xl border-2 border-flamingo-dark bg-flamingo-mint px-4 py-2 text-sm font-extrabold text-flamingo-dark disabled:opacity-50"
          >
            {saving === "approved" ? "Approving…" : "✓ Approve"}
          </button>
          <button
            onClick={() => setRejectOpen(true)}
            disabled={m.status === "rejected" || saving !== null}
            className="rounded-xl border-2 border-flamingo-dark bg-flamingo-pink-soft px-4 py-2 text-sm font-extrabold text-flamingo-pink-deep shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50"
          >
            ✕ Reject
          </button>
          <button
            onClick={() => updateStatus("suspended")}
            disabled={m.status === "suspended" || saving !== null}
            className="rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2 text-sm font-extrabold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50"
          >
            ⏸ Suspend
          </button>
          {m.status !== "pending" && (
            <button
              onClick={() => updateStatus("pending")}
              disabled={saving !== null}
              className="ml-auto rounded-xl border-2 border-flamingo-dark/40 bg-white px-4 py-2 text-sm font-bold text-flamingo-dark/70 disabled:opacity-50"
            >
              Reset to pending
            </button>
          )}
        </div>
        {error && (
          <p className="mt-3 rounded-lg bg-flamingo-pink-soft px-3 py-2 text-sm font-semibold text-flamingo-pink-deep">
            {error}
          </p>
        )}

        {rejectOpen && (
          <div className="mt-4 rounded-xl border-2 border-flamingo-dark bg-white p-3">
            <label className="text-xs font-bold uppercase tracking-widest text-flamingo-dark/70">
              Reason for rejection (shown to merchant)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Phone number could not be verified (RICA mismatch)"
              className="mt-1 block w-full rounded-lg border-2 border-flamingo-dark/40 bg-flamingo-cream px-3 py-2 text-sm text-flamingo-dark outline-none"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectOpen(false);
                  setReason("");
                }}
                className="rounded-lg border-2 border-flamingo-dark/40 bg-white px-3 py-1.5 text-sm font-bold text-flamingo-dark/70"
              >
                Cancel
              </button>
              <button
                onClick={() => updateStatus("rejected", reason)}
                disabled={!reason.trim() || saving !== null}
                className="rounded-lg border-2 border-flamingo-dark bg-flamingo-pink-soft px-3 py-1.5 text-sm font-extrabold text-flamingo-pink-deep shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50"
              >
                {saving === "rejected" ? "Rejecting…" : "Confirm reject"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Details grid */}
      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <InfoCard title="Owner">
          <Row k="Name" v={m.ownerName} />
          <Row k="Phone" v={m.phone} />
        </InfoCard>
        <InfoCard title="Business">
          <Row k="Type" v={m.businessType} />
          <Row k="Address" v={m.address || "—"} />
        </InfoCard>
        <InfoCard title="Payout">
          <Row k="Bank" v={m.bank} />
          <Row k="Account" v={`•••• ${m.accountLast4}`} />
          <Row k="Type" v={m.accountType} />
        </InfoCard>
        <InfoCard title="Lifetime">
          <Row k="Transactions" v={m.txnCount.toLocaleString("en-ZA")} />
          <Row k="Volume" v={formatZAR(m.grossVolume)} />
          <Row k="Created" v={new Date(m.createdAt).toLocaleString("en-ZA")} />
          {m.approvedAt && (
            <Row k="Approved" v={new Date(m.approvedAt).toLocaleString("en-ZA")} />
          )}
          {m.rejectedAt && (
            <Row k="Rejected" v={new Date(m.rejectedAt).toLocaleString("en-ZA")} />
          )}
        </InfoCard>
      </section>

      {/* Shortcuts for approved merchants */}
      {m.status === "approved" && (
        <section className="mt-4 rounded-2xl border-2 border-flamingo-dark bg-flamingo-mint p-4 shadow-[0_6px_0_0_#1A1A2E]">
          <p className="text-sm font-extrabold text-flamingo-dark">
            This merchant can log in and access their dashboard & QR code.
          </p>
          <p className="mt-1 text-xs text-flamingo-dark/70">
            Signing in with phone {m.phone} goes to <code>/merchant/dashboard</code>.
          </p>
        </section>
      )}

      <button
        onClick={load}
        className="mt-6 text-xs font-bold text-flamingo-dark/50 underline-offset-2 hover:underline"
      >
        Refresh
      </button>
    </main>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_6px_0_0_#1A1A2E]">
      <p className="text-[11px] font-bold uppercase tracking-widest text-flamingo-pink-deep">
        {title}
      </p>
      <dl className="mt-2 space-y-1.5">{children}</dl>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs font-semibold text-flamingo-dark/60">{k}</dt>
      <dd className="text-right text-sm font-bold text-flamingo-dark">{v}</dd>
    </div>
  );
}
