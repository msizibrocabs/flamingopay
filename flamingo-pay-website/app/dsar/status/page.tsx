"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type DeletionItem = { category: string; description: string; action: string };
type RetainedItem = { category: string; description: string; reason: string; retainUntil: string };

type DsarInfo = {
  ref: string;
  requestType?: string;
  status: string;
  requesterType: string;
  fullName: string;
  createdAt: string;
  deadline: string;
  updatedAt: string;
  dataExport?: {
    generatedAt: string;
    generatedBy: string;
    sections: Array<{
      title: string;
      description: string;
      data: unknown;
    }>;
  };
  deletionReport?: {
    performedAt: string;
    performedBy: string;
    deleted: DeletionItem[];
    retained: RetainedItem[];
    scheduledDeletionDate?: string;
  };
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  new: { label: "Submitted — awaiting verification", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: "📩" },
  verified: { label: "Identity verified — processing", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: "✅" },
  processing: { label: "Gathering your data", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: "🔄" },
  ready: { label: "Data export ready for download", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: "📦" },
  downloaded: { label: "Downloaded", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: "✅" },
  rejected: { label: "Request rejected", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: "❌" },
  closed: { label: "Closed", color: "text-gray-700", bg: "bg-gray-50 border-gray-200", icon: "📁" },
};

export default function DsarStatusPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-flamingo-cream">
          <div className="flex items-center gap-2 text-flamingo-dark/70">
            <span className="inline-block h-3 w-3 animate-ping rounded-full bg-flamingo-pink" />
            Loading...
          </div>
        </main>
      }
    >
      <DsarStatusInner />
    </Suspense>
  );
}

function DsarStatusInner() {
  const searchParams = useSearchParams();
  const prefilled = searchParams.get("ref") ?? "";

  const [ref, setRef] = useState(prefilled);
  const [dsar, setDsar] = useState<DsarInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
  const formatDateTime = (s: string) =>
    new Date(s).toLocaleString("en-ZA", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  async function lookup() {
    const trimmed = ref.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setDsar(null);
    try {
      const res = await fetch(`/api/dsar/lookup?ref=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Request not found.");
        return;
      }
      setDsar(data.dsar);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (prefilled) lookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDownload() {
    if (!dsar?.dataExport) return;
    setDownloading(true);
    try {
      // Build JSON export
      const exportData = {
        title: "Flamingo Pay — Personal Data Export",
        reference: dsar.ref,
        requestedBy: dsar.fullName,
        generatedAt: dsar.dataExport.generatedAt,
        popiaSection: "Section 23 — Right of access to personal information",
        responsibleParty: {
          name: "Flamingo Pay (Pty) Ltd",
          regNo: "2026/276925/07",
          informationOfficer: "compliance@flamingopay.co.za",
        },
        data: dsar.dataExport.sections,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FlaminGO-Data-Export-${dsar.ref}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Mark as downloaded
      await fetch("/api/dsar/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: dsar.ref }),
      });

      // Refresh status
      await lookup();
    } catch {
      // Best effort
    } finally {
      setDownloading(false);
    }
  }

  const status = dsar ? STATUS_MAP[dsar.status] ?? STATUS_MAP.new : null;
  const isOverdue = dsar ? new Date(dsar.deadline) < new Date() && !["ready", "downloaded", "closed", "rejected"].includes(dsar.status) : false;

  return (
    <main className="min-h-dvh bg-flamingo-cream">
      <div className="mx-auto max-w-lg px-5 py-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink shadow-[0_4px_0_0_#1A1A2E]">
              <span className="display text-2xl font-extrabold text-white">F</span>
            </div>
          </Link>
          <h1 className="display mt-3 text-2xl font-extrabold text-flamingo-dark">
            Data request status
          </h1>
          <p className="mt-1 text-sm text-flamingo-dark/60">
            Check the status of your POPIA data access request.
          </p>
        </div>

        {/* Lookup */}
        <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_6px_0_0_#1A1A2E]">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
              Request reference
            </span>
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup()}
              placeholder="e.g. DSAR-AB12CD or DEL-AB12CD"
              className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-3 text-center font-mono text-lg font-extrabold uppercase tracking-widest text-flamingo-dark outline-none"
            />
          </label>
          <button
            onClick={lookup}
            disabled={loading || !ref.trim()}
            className="mt-3 w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-pink px-4 py-3 text-sm font-extrabold text-white shadow-[0_3px_0_0_#1A1A2E] transition hover:bg-flamingo-pink-deep disabled:opacity-50"
          >
            {loading ? "Looking up..." : "Check status"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {dsar && status && (
          <div className="mt-5 space-y-4">
            {/* Status banner */}
            <div className={`rounded-2xl border-2 ${status.bg} p-4`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{status.icon}</span>
                <div>
                  <p className={`text-base font-extrabold ${status.color}`}>{status.label}</p>
                  <p className="text-xs text-flamingo-dark/50">
                    Last updated: {formatDateTime(dsar.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Overdue warning */}
            {isOverdue && (
              <div className="rounded-xl border-2 border-red-300 bg-red-50 p-3 text-center">
                <p className="text-sm font-bold text-red-700">
                  This request has exceeded the 30-day POPIA deadline.
                </p>
                <p className="mt-1 text-xs text-red-600/70">
                  Contact <a href="mailto:compliance@flamingopay.co.za" className="underline">compliance@flamingopay.co.za</a> or the{" "}
                  <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer" className="underline">
                    Information Regulator
                  </a>.
                </p>
              </div>
            )}

            {/* Details */}
            <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_4px_0_0_#1A1A2E]">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-flamingo-dark/50">
                Request details
              </p>
              <div className="space-y-2.5">
                <Row label="Reference" value={dsar.ref} mono />
                <Row label="Request" value={(dsar.requestType ?? "access") === "deletion" ? "Data deletion" : "Data access"} />
                <Row label="Name" value={dsar.fullName} />
                <Row label="Requester" value={dsar.requesterType === "buyer" ? "Buyer" : "Merchant"} />
                <Row label="Submitted" value={formatDateTime(dsar.createdAt)} />
                <Row label="Deadline" value={formatDate(dsar.deadline)} />
              </div>
            </div>

            {/* Download button */}
            {dsar.status === "ready" && dsar.dataExport && (
              <div className="rounded-2xl border-2 border-green-400 bg-green-50 p-4 text-center">
                <p className="text-sm font-bold text-green-700">Your data export is ready.</p>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="mt-3 w-full rounded-xl border-2 border-flamingo-dark bg-green-600 px-4 py-3 text-sm font-extrabold text-white shadow-[0_3px_0_0_#1A1A2E] transition hover:bg-green-700 disabled:opacity-50"
                >
                  {downloading ? "Preparing download..." : "Download your data (JSON)"}
                </button>
                <p className="mt-2 text-xs text-green-700/60">
                  Contains all personal data Flamingo Pay holds about you.
                </p>
              </div>
            )}

            {/* Deletion report */}
            {dsar.status === "ready" && dsar.deletionReport && (
              <div className="space-y-3">
                <div className="rounded-2xl border-2 border-green-400 bg-green-50 p-4 text-center">
                  <p className="text-sm font-bold text-green-700">Your deletion request has been processed.</p>
                  <p className="mt-1 text-xs text-green-700/60">
                    Completed on {formatDateTime(dsar.deletionReport.performedAt)}
                  </p>
                </div>

                {/* Deleted items */}
                {dsar.deletionReport.deleted.length > 0 && (
                  <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_4px_0_0_#1A1A2E]">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-green-700">
                      Data deleted / anonymized
                    </p>
                    <div className="space-y-2">
                      {dsar.deletionReport.deleted.map((item, i) => (
                        <div key={i} className="rounded-lg border border-green-200 bg-green-50 p-3">
                          <p className="text-sm font-bold text-green-800">{item.category}</p>
                          <p className="text-xs text-green-700/70">{item.description}</p>
                          <span className="mt-1 inline-block rounded-full bg-green-200 px-2 py-0.5 text-[10px] font-bold text-green-800 uppercase">
                            {item.action}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Retained items */}
                {dsar.deletionReport.retained.length > 0 && (
                  <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_4px_0_0_#1A1A2E]">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-amber-700">
                      Data retained for legal compliance
                    </p>
                    <div className="space-y-2">
                      {dsar.deletionReport.retained.map((item, i) => (
                        <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <p className="text-sm font-bold text-amber-800">{item.category}</p>
                          <p className="text-xs text-amber-700/70">{item.description}</p>
                          <p className="mt-1 text-xs text-amber-600/60">
                            <span className="font-bold">Legal basis:</span> {item.reason}
                          </p>
                          <p className="text-xs text-amber-600/60">
                            <span className="font-bold">Scheduled deletion:</span> {formatDate(item.retainUntil)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dsar.deletionReport.scheduledDeletionDate && (
                  <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-3 text-center">
                    <p className="text-xs text-amber-700">
                      Remaining data will be automatically deleted on{" "}
                      <span className="font-bold">{formatDate(dsar.deletionReport.scheduledDeletionDate)}</span>{" "}
                      when the FICA retention period expires.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Already downloaded */}
            {dsar.status === "downloaded" && (
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 text-center">
                <p className="text-sm font-bold text-green-700">Data has been downloaded.</p>
                <p className="mt-1 text-xs text-green-700/60">
                  If you need another copy, contact compliance@flamingopay.co.za.
                </p>
              </div>
            )}

            {/* Help */}
            <div className="rounded-xl border-2 border-flamingo-dark/10 bg-white p-4 text-center">
              <p className="text-xs text-flamingo-dark/50">
                Questions? Contact our Information Officer at{" "}
                <a href="mailto:compliance@flamingopay.co.za" className="font-semibold text-flamingo-pink hover:underline">
                  compliance@flamingopay.co.za
                </a>
                {" "}or the{" "}
                <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer" className="font-semibold text-flamingo-pink hover:underline">
                  Information Regulator
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Bottom nav */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <Link href="/dsar" className="text-sm font-semibold text-flamingo-pink hover:underline">
            Submit a new request
          </Link>
          <Link href="/" className="text-sm font-semibold text-flamingo-dark/40 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-flamingo-dark/50">{label}</span>
      <span className={`max-w-[60%] text-right text-sm font-semibold text-flamingo-dark ${mono ? "font-mono text-xs break-all" : ""}`}>
        {value}
      </span>
    </div>
  );
}
