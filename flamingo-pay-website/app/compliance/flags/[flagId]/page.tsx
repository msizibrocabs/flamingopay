"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ComplianceGate } from "../../_components/ComplianceGate";
import { ComplianceNav } from "../../_components/ComplianceNav";
import { FlagPill } from "../../_components/FlagPill";
import { Reveal } from "../../../../components/motion/Reveal";
import { formatZAR, timeAgo } from "../../../../lib/merchant";
import { currentComplianceOfficer } from "../../../../lib/compliance";
import type { TxnFlag, FlagStatus, MerchantApplication } from "../../../../lib/store";

export default function FlagDetailPage({ params }: { params: Promise<{ flagId: string }> }) {
  const { flagId } = use(params);
  return (
    <ComplianceGate>
      <ComplianceNav />
      <FlagDetail flagId={flagId} />
    </ComplianceGate>
  );
}

function FlagDetail({ flagId }: { flagId: string }) {
  const [flag, setFlag] = useState<TxnFlag | null>(null);
  const [merchant, setMerchant] = useState<MerchantApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState("");
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const fetchFlag = useCallback(async () => {
    try {
      const res = await fetch(`/api/compliance/flags/${flagId}`);
      const d = await res.json();
      if (d.flag) {
        setFlag(d.flag);
        setNote(d.flag.officerNote ?? "");
        const mRes = await fetch(`/api/merchants/${d.flag.merchantId}`);
        const mData = await mRes.json();
        if (mData.merchant) setMerchant(mData.merchant);
      }
    } catch {}
    setLoading(false);
  }, [flagId]);

  useEffect(() => { fetchFlag(); }, [fetchFlag]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function updateStatus(newStatus: FlagStatus) {
    setActionLoading(true);
    const officer = currentComplianceOfficer();
    try {
      const res = await fetch(`/api/compliance/flags/${flagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          officerNote: note.trim() || undefined,
          resolvedBy: officer?.name ?? "Compliance Officer",
        }),
      });
      const d = await res.json();
      if (d.flag) { setFlag(d.flag); showToast(`Flag updated to "${newStatus}"`); }
    } catch {}
    setActionLoading(false);
    setConfirmAction(null);
  }

  async function freezeAction() {
    if (!flag) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/compliance/freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: flag.merchantId,
          action: "freeze",
          reason: note.trim() || `Frozen due to flag: ${flag.ruleLabel}`,
        }),
      });
      const d = await res.json();
      if (d.merchant) { setMerchant(d.merchant); showToast("Merchant account frozen"); }
    } catch {}
    setActionLoading(false);
    setConfirmAction(null);
  }

  async function unfreezeAction() {
    if (!flag) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/compliance/freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId: flag.merchantId, action: "unfreeze" }),
      });
      const d = await res.json();
      if (d.merchant) { setMerchant(d.merchant); showToast("Merchant account unfrozen"); }
    } catch {}
    setActionLoading(false);
    setConfirmAction(null);
  }

  async function refundAction() {
    if (!flag) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/merchants/${flag.merchantId}/transactions/${flag.txnId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: note.trim() || `Compliance refund: ${flag.ruleLabel}` }),
      });
      const d = await res.json();
      if (d.txn) { showToast("Transaction refunded"); await fetchFlag(); }
      else if (d.error) { showToast(`Refund failed: ${d.error}`); }
    } catch {}
    setActionLoading(false);
    setConfirmAction(null);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-8">
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border-2 border-flamingo-dark/20 bg-white/60" />
          ))}
        </div>
      </main>
    );
  }

  if (!flag) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-8">
        <div className="rounded-2xl border-2 border-dashed border-flamingo-dark/40 bg-white/70 p-8 text-center">
          <p className="text-lg font-extrabold text-flamingo-dark">Flag not found</p>
          <Link href="/compliance/flags" className="mt-2 inline-block text-sm font-bold text-red-600 underline">Back to all flags</Link>
        </div>
      </main>
    );
  }

  const reasonIcons: Record<string, string> = { high_amount: "💰", velocity: "⚡", unusual_hours: "🌙", manual: "🖊️" };
  const isResolved = flag.status === "cleared" || flag.status === "confirmed";
  const isFrozen = merchant?.status === "suspended";

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2 text-sm font-bold text-flamingo-dark shadow-lg">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setConfirmAction(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border-2 border-flamingo-dark bg-white p-6 shadow-[0_8px_0_0_#1A1A2E]">
              <p className="text-lg font-extrabold text-flamingo-dark">
                {confirmAction === "freeze" && "Freeze this merchant?"}
                {confirmAction === "unfreeze" && "Unfreeze this merchant?"}
                {confirmAction === "refund" && "Refund this transaction?"}
                {confirmAction === "clear" && "Clear this flag?"}
                {confirmAction === "confirm" && "Confirm as fraud?"}
              </p>
              <p className="mt-1 text-sm text-flamingo-dark/70">
                {confirmAction === "freeze" && "The merchant will not be able to receive payments until unfrozen."}
                {confirmAction === "unfreeze" && "The merchant will be able to receive payments again."}
                {confirmAction === "refund" && `This will refund ${formatZAR(flag.txnSnapshot.amount)} to the buyer.`}
                {confirmAction === "clear" && "This marks the transaction as not suspicious."}
                {confirmAction === "confirm" && "This confirms the transaction is fraudulent."}
              </p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setConfirmAction(null)} disabled={actionLoading}
                  className="flex-1 rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2.5 text-sm font-bold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E]">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmAction === "freeze") freezeAction();
                    if (confirmAction === "unfreeze") unfreezeAction();
                    if (confirmAction === "refund") refundAction();
                    if (confirmAction === "clear") updateStatus("cleared");
                    if (confirmAction === "confirm") updateStatus("confirmed");
                  }}
                  disabled={actionLoading}
                  className={"flex-1 rounded-xl border-2 border-flamingo-dark px-4 py-2.5 text-sm font-bold text-white shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-60 " +
                    (confirmAction === "unfreeze" || confirmAction === "clear" ? "bg-green-600" : "bg-red-600")}>
                  {actionLoading ? "Processing…" : "Confirm"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <Reveal>
        <Link href="/compliance/flags"
          className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-flamingo-dark/60 hover:text-flamingo-dark">
          ← Back to flags
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{reasonIcons[flag.reason] ?? "🚩"}</span>
              <h1 className="display font-black text-flamingo-dark"
                style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", letterSpacing: "-0.03em" }}>
                {formatZAR(flag.txnSnapshot.amount)}
              </h1>
              <FlagPill status={flag.status} />
            </div>
            <p className="mt-1 text-sm text-flamingo-dark/70">{flag.ruleLabel}</p>
          </div>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* Transaction details */}
        <Reveal>
          <section className="rounded-2xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-flamingo-dark/60 mb-3">Transaction details</h3>
            <InfoRow label="Amount" value={formatZAR(flag.txnSnapshot.amount)} />
            <InfoRow label="Reference" value={flag.txnSnapshot.reference} />
            <InfoRow label="Rail" value={flag.txnSnapshot.rail.toUpperCase()} />
            <InfoRow label="Buyer bank" value={flag.txnSnapshot.buyerBank} />
            <InfoRow label="Status" value={flag.txnSnapshot.status} />
            <InfoRow label="Time" value={new Date(flag.txnSnapshot.timestamp).toLocaleString("en-ZA")} />
            <InfoRow label="Transaction ID" value={flag.txnId} mono />
          </section>
        </Reveal>

        {/* Merchant details */}
        <Reveal delay={0.05}>
          <section className="rounded-2xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-flamingo-dark/60 mb-3">Merchant</h3>
            {merchant ? (
              <>
                <InfoRow label="Business" value={merchant.businessName} />
                <InfoRow label="Owner" value={merchant.ownerName} />
                <InfoRow label="Phone" value={merchant.phone} />
                <InfoRow label="Bank" value={`${merchant.bank} •••• ${merchant.accountLast4}`} />
                <InfoRow label="Account status" value={merchant.status.toUpperCase()} highlight={merchant.status === "suspended"} />
                <InfoRow label="Lifetime txns" value={String(merchant.txnCount)} />
                <InfoRow label="Lifetime volume" value={formatZAR(merchant.grossVolume)} />
              </>
            ) : (
              <p className="text-sm text-flamingo-dark/60">Merchant: {flag.merchantId}</p>
            )}
          </section>
        </Reveal>
      </div>

      {/* Flag timeline */}
      <Reveal delay={0.1}>
        <section className="mt-4 rounded-2xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-flamingo-dark/60 mb-3">Flag timeline</h3>
          <div className="space-y-2 text-sm text-flamingo-dark">
            <TimelineItem icon="🚩" text={`Flag created — ${flag.ruleLabel}`} time={flag.createdAt} />
            {flag.officerNote && <TimelineItem icon="📝" text={`Note: ${flag.officerNote}`} time={flag.updatedAt} />}
            {flag.resolvedAt && (
              <TimelineItem
                icon={flag.status === "cleared" ? "✅" : "⛔"}
                text={`${flag.status === "cleared" ? "Cleared" : "Confirmed fraud"} by ${flag.resolvedBy ?? "officer"}`}
                time={flag.resolvedAt}
              />
            )}
          </div>
        </section>
      </Reveal>

      {/* Officer note */}
      <Reveal delay={0.15}>
        <section className="mt-4 rounded-2xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-flamingo-dark/60 mb-3">Officer note</h3>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add investigation notes here…"
            rows={3} disabled={isResolved}
            className="w-full rounded-xl border-2 border-flamingo-dark/30 bg-flamingo-cream px-3 py-2 text-sm text-flamingo-dark outline-none placeholder:text-flamingo-dark/40 disabled:opacity-60" />
          {!isResolved && (
            <button onClick={() => updateStatus("investigating")} disabled={actionLoading}
              className="mt-2 rounded-xl border-2 border-flamingo-dark bg-amber-100 px-4 py-2 text-sm font-bold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] transition hover:bg-amber-200 disabled:opacity-60">
              Save note &amp; mark investigating
            </button>
          )}
        </section>
      </Reveal>

      {/* Actions */}
      {!isResolved && (
        <Reveal delay={0.2}>
          <section className="mt-4 rounded-2xl border-2 border-flamingo-dark bg-flamingo-cream p-5 shadow-[0_6px_0_0_#1A1A2E]">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-flamingo-dark/60 mb-4">Actions</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <ActionButton label="Clear flag" desc="Not suspicious — close this flag" tone="green" onClick={() => setConfirmAction("clear")} />
              <ActionButton label="Confirm fraud" desc="Mark as confirmed fraudulent activity" tone="red" onClick={() => setConfirmAction("confirm")} />
              {!isFrozen ? (
                <ActionButton label="Freeze merchant" desc="Suspend account pending investigation" tone="amber" onClick={() => setConfirmAction("freeze")} />
              ) : (
                <ActionButton label="Unfreeze merchant" desc="Restore merchant account to approved" tone="sky" onClick={() => setConfirmAction("unfreeze")} />
              )}
              <ActionButton label="Refund transaction" desc={`Return ${formatZAR(flag.txnSnapshot.amount)} to buyer`}
                tone="purple" onClick={() => setConfirmAction("refund")} disabled={flag.txnSnapshot.status === "refunded"} />
            </div>
          </section>
        </Reveal>
      )}

      {isResolved && (
        <Reveal delay={0.2}>
          <section className="mt-4 rounded-2xl border-2 border-dashed border-flamingo-dark/30 bg-white/70 p-5 text-center">
            <p className="text-sm font-bold text-flamingo-dark/70">
              This flag has been {flag.status === "cleared" ? "cleared" : "confirmed as fraud"}.
              {flag.resolvedBy && ` Resolved by ${flag.resolvedBy}.`}
            </p>
          </section>
        </Reveal>
      )}
    </main>
  );
}

function InfoRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-flamingo-dark/5 last:border-0">
      <span className="text-xs text-flamingo-dark/60">{label}</span>
      <span className={"text-sm font-bold " + (highlight ? "text-red-600" : "text-flamingo-dark") + (mono ? " font-mono text-xs" : "")}>
        {value}
      </span>
    </div>
  );
}

function TimelineItem({ icon, text, time }: { icon: string; text: string; time: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5">{icon}</span>
      <div className="flex-1">
        <p className="text-sm text-flamingo-dark">{text}</p>
        <p className="text-[10px] text-flamingo-dark/50">{timeAgo(time)} — {new Date(time).toLocaleString("en-ZA")}</p>
      </div>
    </div>
  );
}

function ActionButton({ label, desc, tone, onClick, disabled }: {
  label: string; desc: string; tone: "green" | "red" | "amber" | "sky" | "purple"; onClick: () => void; disabled?: boolean;
}) {
  const bg = {
    green: "bg-green-50 hover:bg-green-100 border-green-300",
    red: "bg-red-50 hover:bg-red-100 border-red-300",
    amber: "bg-amber-50 hover:bg-amber-100 border-amber-300",
    sky: "bg-sky-50 hover:bg-sky-100 border-sky-300",
    purple: "bg-purple-50 hover:bg-purple-100 border-purple-300",
  }[tone];
  return (
    <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onClick} disabled={disabled}
      className={"rounded-xl border-2 p-3 text-left transition disabled:opacity-40 " + bg}>
      <p className="text-sm font-extrabold text-flamingo-dark">{label}</p>
      <p className="text-xs text-flamingo-dark/60">{desc}</p>
    </motion.button>
  );
}
