"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { ComplianceGate } from "../../_components/ComplianceGate";
import { ComplianceNav } from "../../_components/ComplianceNav";
import { Reveal } from "../../../../components/motion/Reveal";
import { formatZAR, timeAgo } from "../../../../lib/merchant";
import { currentComplianceOfficer } from "../../../../lib/compliance";
import {
  STR_STATUS_LABELS,
  STR_STATUS_COLORS,
  RISK_LEVEL_COLORS,
} from "../../../../lib/compliance-ui";

type STR = {
  id: string;
  merchantId: string;
  merchantName: string;
  reason: string;
  description: string;
  relatedTxnIds: string[];
  totalAmount: number;
  status: "draft" | "pending_review" | "filed" | "dismissed";
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  filedWithFIC: boolean;
  filedAt?: string;
  ficReference?: string;
  riskLevel?: "low" | "medium" | "high" | "critical";
  notes?: string;
};

type Txn = {
  id: string;
  amount: number;
  rail: "payshap" | "eft";
  buyerBank: string;
  timestamp: string;
  status: "completed" | "pending" | "refunded" | "partial_refund";
  reference: string;
};

type MerchantSummary = {
  id: string;
  businessName: string;
  businessType: string;
  ownerName: string;
  phone: string;
  bank: string;
  accountLast4: string;
  address: string;
  status: string;
};

type FetchResult = {
  str: STR;
  transactions: Txn[];
  merchant: MerchantSummary | null;
  missingTxnIds: string[];
};

// Shared with compliance-ui.ts so every FICA surface stays in sync.
const STATUS_COLORS = STR_STATUS_COLORS;
const STATUS_LABELS = STR_STATUS_LABELS;
const RISK_COLORS = RISK_LEVEL_COLORS;

const REASON_LABELS: Record<string, string> = {
  structuring: "Structuring",
  velocity_spike: "Velocity Spike",
  unusual_hours: "Unusual Hours",
  round_amounts: "Round Amounts",
  rapid_fire: "Rapid-Fire",
  refund_abuse: "Refund Abuse",
  manual: "Manual",
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-ZA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function STRDetailPage() {
  return (
    <ComplianceGate>
      <ComplianceNav />
      <STRDetail />
    </ComplianceGate>
  );
}

function STRDetail() {
  const { strId } = useParams<{ strId: string }>();

  const [data, setData] = useState<FetchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [fileModal, setFileModal] = useState(false);
  const [ficRef, setFicRef] = useState("");
  const [dismissModal, setDismissModal] = useState(false);
  const [dismissReason, setDismissReason] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function fetchData() {
    if (!strId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/compliance/strs/${strId}`, { credentials: "same-origin" });
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("fetch failed");
      const d: FetchResult = await res.json();
      setData(d);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strId]);

  async function updateSTR(updates: Record<string, unknown>) {
    if (!data) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/compliance/strs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ strId: data.str.id, ...updates }),
      });
      if (res.ok) {
        showToast("STR updated");
        await fetchData();
      } else {
        showToast("Failed to update");
      }
    } catch {
      showToast("Failed to update");
    }
    setActionLoading(false);
  }

  async function confirmFileWithFIC() {
    if (!data) return;
    await updateSTR({
      status: "filed",
      ficReference: ficRef.trim() || undefined,
      notes: `Filed with FIC by ${currentComplianceOfficer()?.name ?? "officer"}`,
    });
    setFileModal(false);
    setFicRef("");
  }

  async function confirmDismiss() {
    if (!data || !dismissReason.trim()) return;
    await updateSTR({ status: "dismissed", notes: `Dismissed: ${dismissReason}` });
    setDismissModal(false);
    setDismissReason("");
  }

  function copyText(text: string, key: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(""), 1800);
    });
  }

  // Build goAML-friendly tab-separated manifest (Reference, Timestamp, Amount ZAR, Rail, Counterparty Bank, Status)
  const manifestTsv = useMemo(() => {
    if (!data) return "";
    const header = ["Reference", "Timestamp", "Amount (ZAR)", "Rail", "Counterparty Bank", "Status"].join("\t");
    const rows = data.transactions.map(t =>
      [t.reference, t.timestamp, t.amount.toFixed(2), t.rail, t.buyerBank, t.status].join("\t"),
    );
    return [header, ...rows].join("\n");
  }, [data]);

  const manifestCsv = useMemo(() => {
    if (!data) return "";
    const esc = (s: string) => (s.includes(",") || s.includes("\"") ? `"${s.replace(/"/g, '""')}"` : s);
    const header = ["Reference", "Timestamp", "Amount_ZAR", "Rail", "Counterparty_Bank", "Status"].join(",");
    const rows = data.transactions.map(t =>
      [t.reference, t.timestamp, t.amount.toFixed(2), t.rail, t.buyerBank, t.status].map(v => esc(String(v))).join(","),
    );
    return [header, ...rows].join("\n");
  }, [data]);

  function downloadCsv() {
    if (!data) return;
    const blob = new Blob([manifestCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.str.id}_manifest.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <main className="mx-auto max-w-5xl px-5 py-8 text-sm text-flamingo-dark/40">Loading STR…</main>;
  }

  if (notFound || !data) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-16 text-center">
        <p className="display text-3xl font-black text-flamingo-dark">STR not found</p>
        <p className="mt-2 text-sm text-flamingo-dark/60">
          It may have been deleted or the link is wrong.
        </p>
        <Link href="/compliance/strs" className="mt-4 inline-block text-sm font-bold text-red-600 underline">
          ← Back to STR list
        </Link>
      </main>
    );
  }

  const { str, transactions, merchant, missingTxnIds } = data;
  const canEdit = str.status !== "filed" && str.status !== "dismissed";

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      {toast && (
        <div className="fixed top-4 left-1/2 z-[60] -translate-x-1/2 rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2 text-sm font-bold shadow-[0_4px_0_0_#1A1A2E]">
          {toast}
        </div>
      )}

      <Reveal>
        <Link href="/compliance/strs" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-flamingo-dark/50 hover:text-flamingo-dark">
          ← Back to STRs
        </Link>
        <div className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-red-600">
          COMPLIANCE · FICA SECTION 29 · {str.id}
        </div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="display font-black text-flamingo-dark leading-none" style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", letterSpacing: "-0.03em" }}>
            {str.merchantName}
          </h1>
          <div className="flex items-center gap-2">
            {str.riskLevel && (
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase ${RISK_COLORS[str.riskLevel]}`}>
                {str.riskLevel} risk
              </span>
            )}
            <span className={`rounded-full border-2 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ${STATUS_COLORS[str.status]}`}>
              {STATUS_LABELS[str.status]}
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm text-flamingo-dark/70">{str.description}</p>
      </Reveal>

      {/* Meta grid */}
      <Reveal delay={0.05}>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetaCard label="Reason" value={REASON_LABELS[str.reason] ?? str.reason} />
          <MetaCard label="Total amount" value={formatZAR(str.totalAmount)} tone="amber" />
          <MetaCard label="Transactions" value={String(str.relatedTxnIds.length)} />
          <MetaCard label="Opened" value={timeAgo(str.createdAt)} />
        </div>
      </Reveal>

      {/* Merchant summary (FIC wants reporting-entity + subject-of-report details) */}
      {merchant && (
        <Reveal delay={0.1}>
          <section className="mt-8 rounded-3xl border-2 border-flamingo-dark bg-flamingo-cream p-5 shadow-[0_4px_0_0_#1A1A2E]">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-flamingo-dark/60">Subject of report</h2>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <Field label="Business" value={merchant.businessName} />
              <Field label="Type" value={merchant.businessType} />
              <Field label="Owner" value={merchant.ownerName} />
              <Field label="Phone" value={merchant.phone} />
              <Field label="Bank" value={`${merchant.bank} ••${merchant.accountLast4}`} />
              <Field label="Merchant ID" value={merchant.id} />
              <Field label="Address" value={merchant.address} colSpan />
            </div>
          </section>
        </Reveal>
      )}

      {/* Filing status / FIC metadata */}
      {(str.filedWithFIC || str.reviewedBy || str.ficReference) && (
        <Reveal delay={0.12}>
          <section className="mt-6 rounded-2xl border-2 border-green-300 bg-green-50 px-4 py-3 text-sm">
            <p className="text-xs font-extrabold uppercase tracking-widest text-green-800">Filing record</p>
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[13px] text-green-900 sm:grid-cols-3">
              {str.reviewedBy && <Field label="Reviewed by" value={str.reviewedBy} dark />}
              {str.reviewedAt && <Field label="Reviewed at" value={formatTimestamp(str.reviewedAt)} dark />}
              {str.filedAt && <Field label="Filed at" value={formatTimestamp(str.filedAt)} dark />}
              {str.ficReference && <Field label="FIC reference" value={str.ficReference} dark />}
              {str.notes && <Field label="Notes" value={str.notes} colSpan dark />}
            </div>
          </section>
        </Reveal>
      )}

      {/* Missing-txn warning */}
      {missingTxnIds.length > 0 && (
        <Reveal delay={0.14}>
          <section className="mt-6 rounded-2xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-extrabold">⚠️ {missingTxnIds.length} referenced transaction{missingTxnIds.length === 1 ? "" : "s"} no longer in the merchant ledger</p>
            <p className="mt-1 text-xs text-amber-800/80 break-all">IDs: {missingTxnIds.join(", ")}</p>
          </section>
        </Reveal>
      )}

      {/* Transaction manifest */}
      <Reveal delay={0.16}>
        <section className="mt-8">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="display text-xl font-black text-flamingo-dark" style={{ letterSpacing: "-0.02em" }}>
                Transaction manifest
              </h2>
              <p className="mt-1 text-xs text-flamingo-dark/60">
                The {transactions.length} transaction{transactions.length === 1 ? "" : "s"} covered by this STR — use these when filing on the FIC goAML portal.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  copyText(manifestTsv, "tsv");
                  showToast("Manifest copied — paste into goAML or a spreadsheet");
                }}
                className="rounded-lg border-2 border-flamingo-dark bg-white px-3 py-1.5 text-xs font-extrabold text-flamingo-dark shadow-[0_2px_0_0_#1A1A2E]"
              >
                {copiedKey === "tsv" ? "Copied ✓" : "Copy all as table"}
              </button>
              <button
                onClick={downloadCsv}
                className="rounded-lg border-2 border-flamingo-dark bg-white px-3 py-1.5 text-xs font-extrabold text-flamingo-dark shadow-[0_2px_0_0_#1A1A2E]"
              >
                Download CSV
              </button>
              <a
                href={`/api/compliance/strs/${str.id}/goaml`}
                className="rounded-lg border-2 border-flamingo-dark bg-red-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-[0_2px_0_0_#1A1A2E] hover:bg-red-700"
                title="Download a goAML 4.0 XML draft to upload to the FIC goAML portal"
              >
                Download goAML XML
              </a>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-flamingo-dark/20 py-10 text-center text-sm text-flamingo-dark/40">
              No hydrated transactions — check the missing IDs warning above.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border-2 border-flamingo-dark bg-white shadow-[0_4px_0_0_#1A1A2E]">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-flamingo-cream text-[10px] font-extrabold uppercase tracking-widest text-flamingo-dark/60">
                  <tr>
                    <th className="px-3 py-2.5">#</th>
                    <th className="px-3 py-2.5">Reference</th>
                    <th className="px-3 py-2.5">Timestamp</th>
                    <th className="px-3 py-2.5 text-right">Amount</th>
                    <th className="px-3 py-2.5">Rail</th>
                    <th className="px-3 py-2.5">Counterparty bank</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-flamingo-dark/10 text-flamingo-dark/80">
                  {transactions.map((t, i) => (
                    <tr key={t.id} className="hover:bg-flamingo-cream/50">
                      <td className="px-3 py-2 font-mono text-flamingo-dark/40">{i + 1}</td>
                      <td className="px-3 py-2 font-mono font-extrabold text-flamingo-dark">{t.reference}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatTimestamp(t.timestamp)}</td>
                      <td className="px-3 py-2 text-right font-extrabold text-flamingo-dark">{formatZAR(t.amount)}</td>
                      <td className="px-3 py-2 uppercase">{t.rail}</td>
                      <td className="px-3 py-2">{t.buyerBank}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            t.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : t.status === "refunded" || t.status === "partial_refund"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => {
                            copyText(t.reference, `ref-${t.id}`);
                            showToast(`Copied ${t.reference}`);
                          }}
                          className="rounded-md border border-flamingo-dark/20 px-2 py-0.5 text-[10px] font-bold text-flamingo-dark/60 hover:border-flamingo-dark hover:text-flamingo-dark"
                        >
                          {copiedKey === `ref-${t.id}` ? "✓" : "Copy ref"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-flamingo-cream/60 text-[11px] font-extrabold text-flamingo-dark">
                  <tr>
                    <td className="px-3 py-2.5" colSpan={3}>
                      Total — {transactions.length} txn{transactions.length === 1 ? "" : "s"}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {formatZAR(transactions.reduce((s, t) => s + t.amount, 0))}
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      </Reveal>

      {/* Actions */}
      {canEdit && (
        <Reveal delay={0.2}>
          <section className="mt-8 flex flex-wrap gap-2">
            {str.status === "draft" && (
              <button
                onClick={() => updateSTR({ status: "pending_review" })}
                disabled={actionLoading}
                className="rounded-lg border-2 border-flamingo-dark bg-amber-400 px-4 py-2 text-sm font-extrabold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50"
              >
                Escalate to review
              </button>
            )}
            <button
              onClick={() => setFileModal(true)}
              disabled={actionLoading || transactions.length === 0}
              className="rounded-lg border-2 border-flamingo-dark bg-green-500 px-4 py-2 text-sm font-extrabold text-white shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50"
            >
              File with FIC
            </button>
            <button
              onClick={() => setDismissModal(true)}
              disabled={actionLoading}
              className="rounded-lg border-2 border-flamingo-dark/20 bg-white px-4 py-2 text-sm font-bold text-flamingo-dark/60 disabled:opacity-50"
            >
              Dismiss
            </button>
          </section>
        </Reveal>
      )}

      {/* File with FIC modal — full manifest */}
      {fileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-flamingo-dark/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-flamingo-dark bg-white p-6 shadow-[0_8px_0_0_#1A1A2E]">
            <h3 className="display text-xl font-black text-flamingo-dark">File STR with FIC</h3>
            <p className="mt-1 text-sm text-flamingo-dark/60">
              Filing for <strong>{str.merchantName}</strong> — {REASON_LABELS[str.reason] ?? str.reason} ·{" "}
              {formatZAR(str.totalAmount)} · {transactions.length} txn{transactions.length === 1 ? "" : "s"}
            </p>

            <div className="mt-4 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-xs font-extrabold uppercase tracking-widest text-blue-800">How to file</p>
              <ol className="mt-2 space-y-1 text-xs text-blue-900">
                <li>
                  1. Log in to the{" "}
                  <a
                    href="https://www.fic.gov.za/goaml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold underline underline-offset-2"
                  >
                    FIC goAML portal
                  </a>
                  .
                </li>
                <li>
                  2. Either <strong>upload the goAML XML</strong> (faster — one click) or start a new STR and paste each transaction from the manifest below.
                </li>
                <li>3. Copy the FIC acknowledgement reference back here to close the filing record.</li>
              </ol>
            </div>

            {/* Manifest inside modal */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-extrabold uppercase tracking-widest text-flamingo-dark/60">
                  Transaction manifest ({transactions.length})
                </p>
                <div className="flex gap-1.5">
                  <a
                    href={`/api/compliance/strs/${str.id}/goaml`}
                    className="rounded-md border-2 border-flamingo-dark bg-red-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-[0_2px_0_0_#1A1A2E] hover:bg-red-700"
                    title="Download a goAML 4.0 XML draft to upload to the FIC portal"
                  >
                    Download goAML XML
                  </a>
                  <button
                    onClick={() => {
                      copyText(manifestTsv, "modal-tsv");
                      showToast("Copied — paste into goAML or a spreadsheet");
                    }}
                    className="rounded-md border-2 border-flamingo-dark bg-white px-2.5 py-1 text-[11px] font-extrabold text-flamingo-dark shadow-[0_2px_0_0_#1A1A2E]"
                  >
                    {copiedKey === "modal-tsv" ? "Copied ✓" : "Copy all"}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border-2 border-flamingo-dark/20">
                <table className="min-w-full text-left text-[11px]">
                  <thead className="bg-flamingo-cream text-[10px] font-extrabold uppercase tracking-wide text-flamingo-dark/60">
                    <tr>
                      <th className="px-2 py-1.5">Reference</th>
                      <th className="px-2 py-1.5">Timestamp</th>
                      <th className="px-2 py-1.5 text-right">Amount</th>
                      <th className="px-2 py-1.5">Rail</th>
                      <th className="px-2 py-1.5">Bank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-flamingo-dark/10">
                    {transactions.map(t => (
                      <tr key={t.id}>
                        <td className="px-2 py-1.5 font-mono font-extrabold text-flamingo-dark">{t.reference}</td>
                        <td className="px-2 py-1.5 whitespace-nowrap">{formatTimestamp(t.timestamp)}</td>
                        <td className="px-2 py-1.5 text-right font-extrabold">{formatZAR(t.amount)}</td>
                        <td className="px-2 py-1.5 uppercase">{t.rail}</td>
                        <td className="px-2 py-1.5">{t.buyerBank}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-extrabold uppercase tracking-widest text-flamingo-dark/60">
                FIC reference number (optional — you can add this later)
              </span>
              <input
                type="text"
                value={ficRef}
                onChange={e => setFicRef(e.target.value)}
                placeholder="e.g. FIC-2026-00123"
                className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-white px-3 py-2 text-sm font-semibold text-flamingo-dark outline-none placeholder:text-flamingo-dark/30"
                autoFocus
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setFileModal(false)}
                disabled={actionLoading}
                className="rounded-lg border-2 border-flamingo-dark/30 bg-white px-4 py-2 text-sm font-bold text-flamingo-dark/70"
              >
                Cancel
              </button>
              <button
                onClick={confirmFileWithFIC}
                disabled={actionLoading}
                className="rounded-lg border-2 border-flamingo-dark bg-green-500 px-4 py-2 text-sm font-extrabold text-white shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50"
              >
                {actionLoading ? "Filing…" : "Confirm filing"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dismiss modal */}
      {dismissModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-flamingo-dark/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-flamingo-dark bg-white p-6 shadow-[0_8px_0_0_#1A1A2E]">
            <h3 className="display text-lg font-extrabold text-flamingo-dark">Dismiss STR</h3>
            <p className="mt-1 text-sm text-flamingo-dark/60">
              Dismissing <strong>{str.id}</strong> — record reason for the audit trail.
            </p>
            <textarea
              value={dismissReason}
              onChange={e => setDismissReason(e.target.value)}
              placeholder="e.g. Confirmed legitimate merchant activity after review"
              rows={3}
              className="mt-3 block w-full rounded-xl border-2 border-flamingo-dark bg-white px-3 py-2 text-sm text-flamingo-dark outline-none placeholder:text-flamingo-dark/30"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDismissModal(false)}
                disabled={actionLoading}
                className="rounded-lg border-2 border-flamingo-dark/30 bg-white px-4 py-2 text-sm font-bold text-flamingo-dark/70"
              >
                Cancel
              </button>
              <button
                onClick={confirmDismiss}
                disabled={actionLoading || !dismissReason.trim()}
                className="rounded-lg border-2 border-flamingo-dark bg-purple-500 px-4 py-2 text-sm font-extrabold text-white shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50"
              >
                Confirm dismiss
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

function MetaCard({ label, value, tone }: { label: string; value: string; tone?: "amber" }) {
  return (
    <div
      className={`rounded-2xl border-2 p-4 ${
        tone === "amber" ? "border-amber-300 bg-amber-50" : "border-flamingo-dark/10 bg-white"
      }`}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-flamingo-dark/50">{label}</p>
      <p className={`mt-1 font-extrabold ${tone === "amber" ? "text-amber-700" : "text-flamingo-dark"}`}>{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  colSpan,
  dark,
}: {
  label: string;
  value: string;
  colSpan?: boolean;
  dark?: boolean;
}) {
  return (
    <div className={colSpan ? "col-span-2 sm:col-span-3" : ""}>
      <p className={`text-[10px] font-extrabold uppercase tracking-widest ${dark ? "text-green-800/70" : "text-flamingo-dark/50"}`}>{label}</p>
      <p className={`text-sm font-semibold ${dark ? "text-green-900" : "text-flamingo-dark"}`}>{value}</p>
    </div>
  );
}
