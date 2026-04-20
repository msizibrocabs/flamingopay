"use client";

import { useEffect, useState } from "react";
import { AdminGate } from "../_components/AdminGate";
import { AdminNav } from "../_components/AdminNav";
import { Reveal, RevealGroup, RevealItem } from "../../../components/motion/Reveal";
import { timeAgo } from "../../../lib/merchant";

type AuditEntry = {
  id: string;
  timestamp: string;
  action: string;
  role: "merchant" | "admin" | "compliance" | "system";
  actorId: string;
  actorName: string;
  targetId?: string;
  targetType?: string;
  detail: string;
  ip?: string;
  metadata?: Record<string, unknown>;
};

const ACTION_ICONS: Record<string, string> = {
  login: "🔑",
  login_failed: "🚫",
  logout: "👋",
  merchant_created: "🆕",
  merchant_approved: "✅",
  merchant_rejected: "❌",
  merchant_suspended: "⏸",
  merchant_unsuspended: "▶️",
  merchant_deleted: "🗑️",
  merchant_profile_updated: "✏️",
  document_submitted: "📄",
  document_verified: "✓",
  document_rejected: "✕",
  document_reset: "🔄",
  transaction_created: "💳",
  transaction_refunded: "↩️",
  flag_created: "🚩",
  flag_updated: "🚩",
  flag_cleared: "🟢",
  flag_confirmed: "🔴",
  merchant_frozen: "🧊",
  merchant_unfrozen: "🔓",
  consent_given: "📝",
  account_deleted: "🗑️",
};

const ROLE_COLORS: Record<string, string> = {
  merchant: "bg-flamingo-sky text-flamingo-dark",
  admin: "bg-flamingo-pink text-white",
  compliance: "bg-red-100 text-red-800",
  system: "bg-gray-100 text-gray-700",
};

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "login", label: "Login" },
  { value: "login_failed", label: "Login failed" },
  { value: "merchant_created", label: "Merchant created" },
  { value: "merchant_approved", label: "Merchant approved" },
  { value: "merchant_rejected", label: "Merchant rejected" },
  { value: "merchant_suspended", label: "Merchant suspended" },
  { value: "document_submitted", label: "Document submitted" },
  { value: "document_verified", label: "Document verified" },
  { value: "document_rejected", label: "Document rejected" },
  { value: "transaction_created", label: "Transaction created" },
  { value: "transaction_refunded", label: "Transaction refunded" },
  { value: "flag_created", label: "Flag created" },
  { value: "flag_cleared", label: "Flag cleared" },
  { value: "flag_confirmed", label: "Flag confirmed" },
  { value: "merchant_frozen", label: "Merchant frozen" },
  { value: "consent_given", label: "Consent given" },
  { value: "account_deleted", label: "Account deleted" },
];

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "merchant", label: "Merchant" },
  { value: "admin", label: "Admin" },
  { value: "compliance", label: "Compliance" },
  { value: "system", label: "System" },
];

export default function AuditLogPage() {
  return (
    <AdminGate>
      <AdminNav />
      <AuditLog />
    </AdminGate>
  );
}

function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(100);

  const fetchEntries = () => {
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    if (role) params.set("role", role);
    params.set("limit", limit.toString());
    setLoading(true);
    fetch(`/api/admin/audit?${params}`)
      .then(r => r.json())
      .then(d => setEntries(d.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEntries(); }, [action, role, limit]);

  const filtered = search
    ? entries.filter(e =>
        e.detail.toLowerCase().includes(search.toLowerCase()) ||
        e.actorName.toLowerCase().includes(search.toLowerCase()) ||
        (e.targetId ?? "").toLowerCase().includes(search.toLowerCase()) ||
        e.action.toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <Reveal>
        <div className="mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-flamingo-pink-deep">
            Admin · FICA Compliance
          </span>
          <h1 className="display mt-2 font-black text-flamingo-dark leading-[0.9]"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", letterSpacing: "-0.035em" }}>
            Audit Log.
          </h1>
          <p className="mt-2 text-sm text-flamingo-dark/60">
            Immutable record of all actions taken across the platform. FICA requires 5-year retention.
          </p>
        </div>
      </Reveal>

      {/* Filters */}
      <Reveal delay={0.05}>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by actor, target, detail..."
            className="flex-1 rounded-xl border-2 border-flamingo-dark bg-white px-3 py-2 text-sm font-semibold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] outline-none placeholder:text-flamingo-dark/40"
          />
          <select
            value={action}
            onChange={e => setAction(e.target.value)}
            className="rounded-xl border-2 border-flamingo-dark bg-white px-3 py-2 text-sm font-bold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] outline-none"
          >
            {ACTION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="rounded-xl border-2 border-flamingo-dark bg-white px-3 py-2 text-sm font-bold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] outline-none"
          >
            {ROLE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="mb-3 text-xs font-bold text-flamingo-dark/50">
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          {search && ` matching "${search}"`}
        </p>
      </Reveal>

      {loading ? (
        <div className="py-20 text-center text-flamingo-dark/40">Loading audit log...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-flamingo-dark/20 py-16 text-center">
          <p className="text-lg font-bold text-flamingo-dark/40">No audit entries found</p>
          <p className="mt-1 text-sm text-flamingo-dark/30">
            {search ? "Try a different search term." : "Actions will appear here as they happen."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border-2 border-flamingo-dark bg-white shadow-[0_6px_0_0_#1A1A2E]">
          <div className="hidden grid-cols-[40px_140px_1fr_100px_80px_100px] gap-3 bg-flamingo-cream px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-flamingo-dark/60 sm:grid">
            <span></span>
            <span>Action</span>
            <span>Detail</span>
            <span>Actor</span>
            <span>Role</span>
            <span className="text-right">When</span>
          </div>
          <ul className="divide-y divide-flamingo-dark/10">
            {filtered.map(e => (
              <li key={e.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[40px_140px_1fr_100px_80px_100px]">
                <span className="text-lg">{ACTION_ICONS[e.action] ?? "📋"}</span>
                <span className="hidden text-xs font-extrabold text-flamingo-dark sm:block">
                  {e.action.replace(/_/g, " ")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-flamingo-dark">
                    <span className="sm:hidden text-xs font-extrabold mr-1">{e.action.replace(/_/g, " ")} ·</span>
                    {e.detail}
                  </p>
                  {e.targetId && (
                    <p className="truncate text-[10px] text-flamingo-dark/40">
                      Target: {e.targetType ?? "—"} · {e.targetId}
                    </p>
                  )}
                </div>
                <span className="hidden truncate text-xs font-bold text-flamingo-dark/70 sm:block">{e.actorName}</span>
                <span className="hidden sm:block">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${ROLE_COLORS[e.role] ?? "bg-gray-100 text-gray-600"}`}>
                    {e.role}
                  </span>
                </span>
                <span className="text-right text-xs text-flamingo-dark/50">{timeAgo(e.timestamp)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {entries.length >= limit && (
        <Reveal delay={0.15}>
          <div className="mt-4 text-center">
            <button
              onClick={() => setLimit(l => l + 100)}
              className="rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2 text-sm font-bold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E]"
            >
              Load more entries
            </button>
          </div>
        </Reveal>
      )}
    </main>
  );
}
