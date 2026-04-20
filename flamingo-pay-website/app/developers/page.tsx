"use client";

import { useState, useRef } from "react";
import Link from "next/link";

/* ─── API Data ─── */
type Endpoint = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  summary: string;
  auth: "none" | "api-key" | "merchant";
  tag: string;
  description?: string;
  params?: { name: string; in: "query" | "path" | "body" | "header"; type: string; required?: boolean; desc?: string }[];
  request?: string;
  response?: string;
};

/* ═══════════════════════════════════════════════════════
   PUBLIC-FACING ENDPOINTS ONLY
   Internal admin, compliance, and sanctions routes are
   intentionally excluded from public documentation.
   ═══════════════════════════════════════════════════════ */

const ENDPOINTS: Endpoint[] = [
  // ─── Merchant Onboarding ───
  { method: "POST", path: "/api/merchants", summary: "Register a new merchant", auth: "none", tag: "Merchant Onboarding",
    description: "Create a new merchant account. After registration, the merchant must complete KYC verification before processing payments.",
    request: `{
  "phone": "+27721234567",
  "pin": "1234",
  "businessName": "Mama's Spaza",
  "businessType": "retail",
  "ownerName": "Sipho Ndlovu",
  "address": "123 Main Rd, Soweto",
  "bank": "FNB",
  "accountNumber": "62123456789",
  "branchCode": "250655",
  "idNumber": "9501015800086",
  "email": "sipho@example.com"
}`,
    response: `{
  "merchant": {
    "id": "m_abc123",
    "phone": "+27721234567",
    "businessName": "Mama's Spaza",
    "status": "pending",
    "createdAt": "2026-04-20T10:00:00Z"
  }
}` },
  { method: "GET", path: "/api/merchants/check-phone", summary: "Check if a phone number is available", auth: "none", tag: "Merchant Onboarding",
    description: "Verify whether a phone number is already registered before attempting merchant signup.",
    params: [{ name: "phone", in: "query", type: "string", required: true, desc: "Phone number to check (e.g. +27721234567)" }],
    response: `{
  "available": true
}` },
  { method: "POST", path: "/api/merchants/{id}/verify", summary: "Trigger KYC verification", auth: "merchant", tag: "Merchant Onboarding",
    description: "Runs identity verification against the Department of Home Affairs database, biometric selfie matching, and sanctions/PEP screening. Merchants that pass all checks are auto-approved.",
    params: [{ name: "id", in: "path", type: "string", required: true, desc: "Merchant ID" }],
    request: `{
  "idNumber": "9501015800086",
  "selfieBase64": "data:image/jpeg;base64,...",
  "dateOfBirth": "1995-01-01"
}`,
    response: `{
  "merchantId": "m_abc123",
  "status": "verified",
  "checks": [
    { "type": "id_verification", "status": "pass" },
    { "type": "selfie_match", "status": "pass", "details": "Score: 95%" },
    { "type": "sanctions_screening", "status": "pass" }
  ],
  "isPep": false,
  "hasSanctionsHit": false,
  "autoApproved": true
}` },
  { method: "GET", path: "/api/merchants/{id}/verify", summary: "Check KYC verification status", auth: "merchant", tag: "Merchant Onboarding",
    description: "Returns the current KYC status and which verification checks are required or completed.",
    params: [{ name: "id", in: "path", type: "string", required: true, desc: "Merchant ID" }],
    response: `{
  "merchantId": "m_abc123",
  "kycTier": "basic",
  "overallStatus": "pending",
  "requiredChecks": [
    "id_verification",
    "selfie_match",
    "sanctions_screening"
  ],
  "record": null
}` },

  // ─── Merchant Authentication ───
  { method: "POST", path: "/api/auth/merchant-login", summary: "Authenticate a merchant", auth: "none", tag: "Merchant Authentication",
    description: "Log in with phone number and 4-digit PIN. Returns the merchant profile on success.",
    request: `{
  "phone": "+27721234567",
  "pin": "1234"
}`,
    response: `{
  "merchant": {
    "id": "m_abc123",
    "phone": "+27721234567",
    "businessName": "Mama's Spaza",
    "ownerName": "Sipho Ndlovu",
    "status": "approved",
    "kycTier": "basic",
    "balance": 15000.50
  }
}` },
  { method: "POST", path: "/api/auth/otp", summary: "Request or verify an OTP", auth: "none", tag: "Merchant Authentication",
    description: "Send a one-time PIN to the merchant's phone or verify one they've entered. Used for PIN reset and sensitive operations.",
    request: `{
  "phone": "+27721234567",
  "action": "send"
}`,
    response: `{
  "ok": true,
  "message": "OTP sent to +27721234567"
}` },
  { method: "POST", path: "/api/auth/pin-reset", summary: "Reset merchant PIN", auth: "none", tag: "Merchant Authentication",
    description: "Reset a merchant's 4-digit PIN after OTP verification.",
    request: `{
  "phone": "+27721234567",
  "otp": "123456",
  "newPin": "5678"
}`,
    response: `{
  "ok": true
}` },

  // ─── Merchant Account ───
  { method: "PATCH", path: "/api/merchants/{id}/update", summary: "Update merchant profile", auth: "merchant", tag: "Merchant Account",
    description: "Update business details such as name, address, or bank account. Some changes may require re-verification.",
    params: [{ name: "id", in: "path", type: "string", required: true, desc: "Merchant ID" }],
    request: `{
  "businessName": "Mama's Spaza Shop",
  "address": "456 New Rd, Soweto"
}`,
    response: `{
  "ok": true
}` },

  // ─── Payments & Transactions ───
  { method: "GET", path: "/api/merchants/{id}/transactions", summary: "List transaction history", auth: "merchant", tag: "Payments",
    description: "Retrieve a merchant's transaction history with optional date range filtering. Returns transactions, totals, and volume.",
    params: [
      { name: "id", in: "path", type: "string", required: true, desc: "Merchant ID" },
      { name: "from", in: "query", type: "string", desc: "Start date (ISO 8601)" },
      { name: "to", in: "query", type: "string", desc: "End date (ISO 8601)" },
    ],
    response: `{
  "transactions": [
    {
      "id": "txn_abc123",
      "reference": "FP-XK9M2P",
      "amount": 150.00,
      "fee": 5.34,
      "net": 144.66,
      "status": "completed",
      "rail": "payshap",
      "buyerBank": "FNB",
      "createdAt": "2026-04-20T14:30:00Z"
    }
  ],
  "total": 342,
  "totalVolume": 125000.00
}` },
  { method: "GET", path: "/api/receipt/{txnId}", summary: "Get a transaction receipt", auth: "none", tag: "Payments",
    description: "Retrieve receipt details for a completed transaction. Used by the buyer receipt page.",
    params: [{ name: "txnId", in: "path", type: "string", required: true, desc: "Transaction ID" }],
    response: `{
  "receipt": {
    "reference": "FP-XK9M2P",
    "amount": 150.00,
    "fee": 5.34,
    "merchantName": "Mama's Spaza",
    "status": "completed",
    "rail": "payshap",
    "buyerBank": "FNB",
    "date": "2026-04-20T14:30:00Z"
  }
}` },
  { method: "GET", path: "/api/merchants/{id}/statement", summary: "Generate a monthly statement", auth: "merchant", tag: "Payments",
    description: "Generate a downloadable PDF statement for a given month, summarising all transactions, fees, and settlements.",
    params: [
      { name: "id", in: "path", type: "string", required: true, desc: "Merchant ID" },
      { name: "month", in: "query", type: "string", desc: "Month in YYYY-MM format (defaults to current month)" },
    ],
    response: `PDF file download (application/pdf)` },
  { method: "GET", path: "/api/merchants/{id}/export", summary: "Export transactions as CSV", auth: "merchant", tag: "Payments",
    description: "Download a CSV export of all transactions for record-keeping and accounting purposes.",
    params: [{ name: "id", in: "path", type: "string", required: true, desc: "Merchant ID" }],
    response: `CSV file download (text/csv)` },

  // ─── Webhooks ───
  { method: "POST", path: "/api/webhooks/ozow", summary: "Ozow payment notification", auth: "none", tag: "Webhooks",
    description: "Receives real-time payment status updates from Ozow when a buyer completes (or fails) a PayShap payment. Validated using HMAC-SHA512 signature verification. Do not call this endpoint directly — it is called by Ozow's infrastructure.",
    request: `{
  "SiteCode": "FLP-001",
  "TransactionId": "string",
  "TransactionReference": "FP-XK9M2P",
  "Amount": "150.00",
  "Status": "Complete",
  "StatusMessage": "Transaction successful",
  "Hash": "HMAC-SHA512 signature"
}`,
    response: `200 OK (empty body)` },
  { method: "POST", path: "/api/webhooks/payshap", summary: "PayShap settlement notification", auth: "none", tag: "Webhooks",
    description: "Receives settlement confirmation when funds have been transferred to the merchant's bank account. Called by the payment infrastructure — do not call directly.",
    request: `{
  "transactionId": "string",
  "merchantId": "m_abc123",
  "amount": 144.66,
  "status": "settled",
  "settledAt": "2026-04-20T15:00:00Z"
}`,
    response: `200 OK (empty body)` },

  // ─── Disputes ───
  { method: "POST", path: "/api/disputes", summary: "File a buyer dispute", auth: "none", tag: "Disputes",
    description: "Submit a dispute against a transaction. The buyer provides transaction details, the reason for the dispute, and contact information. A reference number is returned for tracking.",
    request: `{
  "txnRef": "FP-XK9M2P",
  "merchantId": "m_abc123",
  "merchantName": "Mama's Spaza",
  "amount": 150.00,
  "txnDate": "2026-04-20",
  "buyerPhone": "0721234567",
  "buyerEmail": "buyer@example.com",
  "reason": "wrong_amount",
  "description": "I was charged R150 but the item costs R100"
}`,
    response: `{
  "dispute": {
    "ref": "DSP-ABCD12",
    "status": "open",
    "createdAt": "2026-04-20T16:00:00Z",
    "deadline": "2026-05-20T16:00:00Z"
  }
}` },
  { method: "GET", path: "/api/disputes/lookup", summary: "Check dispute status", auth: "none", tag: "Disputes",
    description: "Look up the current status of a dispute using the reference number provided at filing.",
    params: [{ name: "ref", in: "query", type: "string", required: true, desc: "Dispute reference (e.g. DSP-ABCD12)" }],
    response: `{
  "dispute": {
    "ref": "DSP-ABCD12",
    "status": "open",
    "reason": "wrong_amount",
    "amount": 150.00,
    "merchantName": "Mama's Spaza",
    "txnDate": "2026-04-20",
    "createdAt": "2026-04-20T16:00:00Z",
    "updatedAt": "2026-04-20T16:00:00Z",
    "refundAmount": null,
    "resolution": null
  }
}` },
  { method: "POST", path: "/api/disputes/search", summary: "Search transactions for a dispute", auth: "none", tag: "Disputes",
    description: "Help a buyer find the transaction they want to dispute by searching on amount, date range, or merchant name.",
    request: `{
  "amount": 150.00,
  "dateFrom": "2026-04-01",
  "dateTo": "2026-04-20",
  "merchantName": "Mama"
}`,
    response: `{
  "transactions": [
    {
      "txnRef": "FP-XK9M2P",
      "amount": 150.00,
      "date": "2026-04-20T14:30:00Z",
      "merchantId": "m_abc123",
      "merchantName": "Mama's Spaza",
      "rail": "payshap"
    }
  ]
}` },

  // ─── POPIA Data Requests ───
  { method: "POST", path: "/api/dsar", summary: "Submit a data access or deletion request", auth: "none", tag: "POPIA Data Requests",
    description: "Submit a POPIA Section 23 (data access) or Section 24 (data deletion) request. Flamingo Pay must respond within 30 days. Deletion requests are subject to FICA 5-year retention for financial records.",
    request: `{
  "requestType": "access",
  "requesterType": "buyer",
  "fullName": "Sipho Ndlovu",
  "email": "sipho@example.com",
  "phone": "0721234567",
  "idNumber": "5083",
  "description": "All personal data you hold about me"
}`,
    response: `{
  "dsar": {
    "ref": "DSAR-AB12CD",
    "deadline": "2026-05-20T00:00:00Z"
  }
}` },
  { method: "GET", path: "/api/dsar/lookup", summary: "Check data request status", auth: "none", tag: "POPIA Data Requests",
    description: "Look up the status of a POPIA data access or deletion request. When the status is 'ready', the data export can be downloaded.",
    params: [{ name: "ref", in: "query", type: "string", required: true, desc: "Request reference (DSAR-XXXX or DEL-XXXX)" }],
    response: `{
  "dsar": {
    "ref": "DSAR-AB12CD",
    "requestType": "access",
    "status": "ready",
    "requesterType": "buyer",
    "fullName": "Sipho Ndlovu",
    "createdAt": "2026-04-20T...",
    "deadline": "2026-05-20T...",
    "updatedAt": "2026-04-22T...",
    "dataExport": {
      "generatedAt": "2026-04-22T...",
      "sections": [ "..." ]
    }
  }
}` },
  { method: "POST", path: "/api/dsar/lookup", summary: "Confirm data export downloaded", auth: "none", tag: "POPIA Data Requests",
    description: "Mark a data export as downloaded. Updates the DSAR status from 'ready' to 'downloaded'.",
    request: `{
  "ref": "DSAR-AB12CD"
}`,
    response: `{
  "success": true
}` },

  // ─── Documents ───
  { method: "POST", path: "/api/upload", summary: "Upload a KYC document", auth: "merchant", tag: "Documents",
    description: "Upload identity verification documents (SA ID, proof of address, selfie photo) during the merchant onboarding process. Files are stored securely and used for KYC verification.",
    request: `FormData with file field:
  - file: Binary file (JPEG, PNG, or PDF)
  - type: "id" | "proof_of_address" | "selfie"
  - merchantId: "m_abc123"`,
    response: `{
  "ok": true,
  "url": "https://storage.example.com/doc_abc123.jpg",
  "type": "id"
}` },

  // ─── Complaints ───
  { method: "POST", path: "/api/complaints", summary: "Submit a complaint", auth: "none", tag: "Complaints",
    description: "Submit a formal complaint about the Flamingo Pay service. Complaints are reviewed within 5 business days.",
    request: `{
  "name": "Sipho Ndlovu",
  "email": "sipho@example.com",
  "phone": "0721234567",
  "type": "service",
  "subject": "Payment not received by merchant",
  "description": "I paid R150 but the merchant says they didn't receive it"
}`,
    response: `{
  "complaint": {
    "id": "cmp_abc123",
    "status": "open",
    "createdAt": "2026-04-20T..."
  }
}` },

  // ─── Push Notifications ───
  { method: "POST", path: "/api/push/subscribe", summary: "Subscribe to payment notifications", auth: "merchant", tag: "Notifications",
    description: "Register a Web Push subscription endpoint to receive real-time payment notifications on the merchant's device.",
    request: `{
  "merchantId": "m_abc123",
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "string",
      "auth": "string"
    }
  }
}`,
    response: `{
  "ok": true
}` },
];

const TAGS = [...new Set(ENDPOINTS.map(e => e.tag))];

const METHOD_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  GET:    { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200" },
  POST:   { bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-200" },
  PATCH:  { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200" },
  PUT:    { bg: "bg-purple-50",   text: "text-purple-700",  border: "border-purple-200" },
  DELETE: { bg: "bg-red-50",      text: "text-red-700",     border: "border-red-200" },
};

const AUTH_LABELS: Record<string, { label: string; cls: string; desc: string }> = {
  none:     { label: "Public", cls: "bg-green-100 text-green-700", desc: "No authentication required" },
  "api-key": { label: "API Key", cls: "bg-blue-100 text-blue-700", desc: "Requires API key in header" },
  merchant: { label: "Merchant", cls: "bg-purple-100 text-purple-700", desc: "Requires merchant authentication" },
};

/* ─── Components ─── */

function MethodBadge({ method }: { method: string }) {
  const s = METHOD_STYLES[method] ?? METHOD_STYLES.GET;
  return (
    <span className={`inline-block min-w-[56px] rounded-md border px-2 py-0.5 text-center text-[11px] font-extrabold uppercase tracking-wide ${s.bg} ${s.text} ${s.border}`}>
      {method}
    </span>
  );
}

function AuthBadge({ auth }: { auth: string }) {
  const a = AUTH_LABELS[auth] ?? AUTH_LABELS.none;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${a.cls}`}>
      {a.label}
    </span>
  );
}

function CodeBlock({ code, lang = "json" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group relative rounded-xl border border-[#1A1A2E]/10 bg-[#0B0B17] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{lang}</span>
        <button onClick={copy} className="rounded-md px-2 py-1 text-[10px] font-bold text-white/40 transition hover:bg-white/10 hover:text-white/70">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-emerald-300/90 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function EndpointCard({ endpoint, isOpen, onToggle }: { endpoint: Endpoint; isOpen: boolean; onToggle: () => void }) {
  const hasDetails = !!(endpoint.description || (endpoint.params && endpoint.params.length > 0) || endpoint.request || endpoint.response);

  return (
    <div className="scroll-mt-20">
      <button
        onClick={hasDetails ? onToggle : undefined}
        className={`w-full rounded-2xl border-2 border-[#1A1A2E] bg-white p-4 text-left transition-all ${
          isOpen ? "shadow-[0_6px_0_0_#1A1A2E]" : "shadow-[0_3px_0_0_#1A1A2E] hover:shadow-[0_4px_0_0_#1A1A2E]"
        } ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <MethodBadge method={endpoint.method} />
          <code className="text-sm font-bold text-[#1A1A2E] font-mono">{endpoint.path}</code>
          <AuthBadge auth={endpoint.auth} />
          {hasDetails && (
            <span className="ml-auto text-xs text-[#1A1A2E]/30 transition-transform" style={{ transform: isOpen ? "rotate(180deg)" : "" }}>
              ▼
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-[#1A1A2E]/60">{endpoint.summary}</p>
      </button>

      {isOpen && hasDetails && (
        <div className="mt-1 rounded-2xl border-2 border-[#1A1A2E]/15 bg-white p-5 space-y-5">
          {endpoint.description && (
            <p className="text-sm leading-relaxed text-[#1A1A2E]/70">{endpoint.description}</p>
          )}

          {endpoint.params && endpoint.params.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-[#1A1A2E]/50">Parameters</p>
              <div className="overflow-x-auto rounded-xl border border-[#1A1A2E]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1A1A2E]/10 bg-[#FFF7F3]">
                      <th className="px-3 py-2 text-left text-[10px] font-extrabold uppercase tracking-wider text-[#1A1A2E]/50">Name</th>
                      <th className="px-3 py-2 text-left text-[10px] font-extrabold uppercase tracking-wider text-[#1A1A2E]/50">In</th>
                      <th className="px-3 py-2 text-left text-[10px] font-extrabold uppercase tracking-wider text-[#1A1A2E]/50">Type</th>
                      <th className="px-3 py-2 text-left text-[10px] font-extrabold uppercase tracking-wider text-[#1A1A2E]/50">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A2E]/5">
                    {endpoint.params.map((p) => (
                      <tr key={p.name}>
                        <td className="px-3 py-2 font-mono text-xs font-bold text-[#1A1A2E]">
                          {p.name}{p.required && <span className="text-[#FF5277]"> *</span>}
                        </td>
                        <td className="px-3 py-2 text-xs text-[#1A1A2E]/50">{p.in}</td>
                        <td className="px-3 py-2 font-mono text-xs text-[#1A1A2E]/50">{p.type}</td>
                        <td className="px-3 py-2 text-xs text-[#1A1A2E]/60">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {endpoint.request && (
            <div>
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-[#1A1A2E]/50">Request body</p>
              <CodeBlock code={endpoint.request} />
            </div>
          )}

          {endpoint.response && (
            <div>
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-[#1A1A2E]/50">Response</p>
              <CodeBlock code={endpoint.response} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */

export default function DevelopersPage() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [openEndpoints, setOpenEndpoints] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  function toggleEndpoint(key: string) {
    setOpenEndpoints((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filtered = ENDPOINTS.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || e.path.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q) || e.tag.toLowerCase().includes(q) || (e.description ?? "").toLowerCase().includes(q);
    const matchesTag = !activeTag || e.tag === activeTag;
    return matchesSearch && matchesTag;
  });

  const groupedByTag: Record<string, Endpoint[]> = {};
  filtered.forEach((e) => {
    if (!groupedByTag[e.tag]) groupedByTag[e.tag] = [];
    groupedByTag[e.tag].push(e);
  });

  const tagCounts: Record<string, number> = {};
  ENDPOINTS.forEach((e) => { tagCounts[e.tag] = (tagCounts[e.tag] ?? 0) + 1; });

  return (
    <div className="min-h-dvh bg-[#FFF7F3]">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-50 border-b-2 border-[#1A1A2E] bg-[#FFF7F3]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="grid h-9 w-9 place-items-center rounded-xl border-2 border-[#1A1A2E] bg-[#FF5277] shadow-[0_2px_0_0_#1A1A2E]">
                <span className="display text-lg font-extrabold text-white">F</span>
              </div>
            </Link>
            <div className="hidden sm:block">
              <h1 className="display text-lg font-extrabold text-[#1A1A2E]">Developer Docs</h1>
            </div>
            <span className="rounded-full border border-[#1A1A2E]/20 bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#1A1A2E]/50">
              v1.1.0
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search endpoints..."
                className="w-48 sm:w-64 rounded-xl border-2 border-[#1A1A2E] bg-white px-3 py-2 pl-9 text-sm font-medium text-[#1A1A2E] outline-none placeholder:text-[#1A1A2E]/30 focus:shadow-[0_2px_0_0_#1A1A2E]"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-[#1A1A2E]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-xl border-2 border-[#1A1A2E] bg-white p-2 shadow-[0_2px_0_0_#1A1A2E] lg:hidden"
            >
              <svg className="h-4 w-4 text-[#1A1A2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* ── Sidebar ── */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r-2 border-[#1A1A2E]/10 bg-[#FFF7F3] pt-16 transition-transform lg:static lg:z-auto lg:translate-x-0 lg:border-r-0 lg:pt-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          {sidebarOpen && (
            <div className="fixed inset-0 z-[-1] bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}
          <nav className="sticky top-16 h-[calc(100dvh-4rem)] overflow-y-auto p-5">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-[#FF5277]">
              API Sections
            </p>
            <button
              onClick={() => { setActiveTag(null); setSidebarOpen(false); }}
              className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                !activeTag ? "bg-[#FF5277] text-white shadow-[0_2px_0_0_#1A1A2E]" : "text-[#1A1A2E]/60 hover:bg-white"
              }`}
            >
              All endpoints
              <span className={`rounded-full px-1.5 text-[10px] font-bold ${!activeTag ? "bg-white/30 text-white" : "bg-[#1A1A2E]/10 text-[#1A1A2E]/40"}`}>
                {ENDPOINTS.length}
              </span>
            </button>
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => { setActiveTag(activeTag === tag ? null : tag); setSidebarOpen(false); }}
                className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                  activeTag === tag ? "bg-[#FF5277] text-white shadow-[0_2px_0_0_#1A1A2E]" : "text-[#1A1A2E]/60 hover:bg-white"
                }`}
              >
                {tag}
                <span className={`rounded-full px-1.5 text-[10px] font-bold ${activeTag === tag ? "bg-white/30 text-white" : "bg-[#1A1A2E]/10 text-[#1A1A2E]/40"}`}>
                  {tagCounts[tag]}
                </span>
              </button>
            ))}

            <div className="mt-6 rounded-2xl border-2 border-[#1A1A2E] bg-white p-4 shadow-[0_4px_0_0_#1A1A2E]">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#1A1A2E]/50">Base URL</p>
              <code className="mt-1 block text-xs font-bold text-[#FF5277] font-mono break-all">
                https://www.flamingopay.co.za
              </code>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#1A1A2E]/50">Quick links</p>
              <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#1A1A2E]/60 hover:bg-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Home
              </Link>
              <Link href="/merchant/signup" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#1A1A2E]/60 hover:bg-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                Merchant signup
              </Link>
              <a href="mailto:info@flamingopay.co.za" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#1A1A2E]/60 hover:bg-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Contact support
              </a>
            </div>
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main ref={mainRef} className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">
          {/* Hero */}
          <div className="mb-8">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF5277]">
              Developer Documentation
            </span>
            <h2
              className="display mt-2 font-black text-[#1A1A2E] leading-[0.9]"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.035em" }}
            >
              Flamingo Pay API.
            </h2>
            <p className="mt-3 max-w-2xl text-base text-[#1A1A2E]/60">
              Integrate QR-based instant payments into your platform. Accept PayShap payments from any South African bank, manage merchants, handle disputes, and stay POPIA-compliant.
            </p>
          </div>

          {/* Quick start cards */}
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <QuickCard
              icon="🏪"
              title="Merchant Onboarding"
              desc="Register merchants, verify identity (KYC), and start accepting payments."
              onClick={() => setActiveTag("Merchant Onboarding")}
            />
            <QuickCard
              icon="💳"
              title="Payments"
              desc="Transaction history, receipts, statements, and CSV exports."
              onClick={() => setActiveTag("Payments")}
            />
            <QuickCard
              icon="🔔"
              title="Webhooks"
              desc="Receive real-time payment and settlement notifications."
              onClick={() => setActiveTag("Webhooks")}
            />
          </div>

          {/* Auth overview */}
          <div className="mb-10 rounded-2xl border-2 border-[#1A1A2E] bg-white p-6 shadow-[0_6px_0_0_#1A1A2E]">
            <h3 className="display text-lg font-extrabold text-[#1A1A2E]">Authentication</h3>
            <p className="mt-2 text-sm text-[#1A1A2E]/60 leading-relaxed">
              Most public endpoints (dispute filing, DSAR submission, receipt lookup) require no authentication.
              Merchant-authenticated endpoints require a valid merchant login session.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {Object.entries(AUTH_LABELS).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 rounded-xl border border-[#1A1A2E]/10 bg-[#FFF7F3] px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${val.cls}`}>{val.label}</span>
                  <span className="text-xs text-[#1A1A2E]/50">{val.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-[#1A1A2E]/50">Merchant login example</p>
              <CodeBlock lang="bash" code={`curl -X POST https://www.flamingopay.co.za/api/auth/merchant-login \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "+27721234567",
    "pin": "1234"
  }'`} />
            </div>
          </div>

          {/* Status codes */}
          <div className="mb-10 rounded-2xl border-2 border-[#1A1A2E] bg-white p-6 shadow-[0_4px_0_0_#1A1A2E]">
            <h3 className="display text-lg font-extrabold text-[#1A1A2E]">Status Codes</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <StatusRow code="200" label="OK" desc="Request successful" tone="green" />
              <StatusRow code="201" label="Created" desc="Resource created successfully" tone="green" />
              <StatusRow code="400" label="Bad Request" desc="Invalid or missing parameters" tone="amber" />
              <StatusRow code="401" label="Unauthorized" desc="Authentication required or invalid" tone="red" />
              <StatusRow code="404" label="Not Found" desc="Resource does not exist" tone="red" />
              <StatusRow code="429" label="Too Many Requests" desc="Rate limit exceeded (20 req/min)" tone="red" />
            </div>
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-[#1A1A2E]/50">Error response format</p>
              <CodeBlock code={`{
  "error": "Description of what went wrong",
  "code": "VALIDATION_ERROR"
}`} />
            </div>
          </div>

          {/* Endpoint listing */}
          {Object.entries(groupedByTag).map(([tag, endpoints]) => (
            <section key={tag} className="mb-10">
              <div className="sticky top-14 z-10 -mx-4 bg-[#FFF7F3]/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
                <h3 className="display text-xl font-extrabold text-[#1A1A2E]">{tag}</h3>
                <p className="text-xs text-[#1A1A2E]/40">{endpoints.length} endpoint{endpoints.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="space-y-3">
                {endpoints.map((e) => {
                  const key = `${e.method}-${e.path}`;
                  return (
                    <EndpointCard
                      key={key}
                      endpoint={e}
                      isOpen={openEndpoints.has(key)}
                      onToggle={() => toggleEndpoint(key)}
                    />
                  );
                })}
              </div>
            </section>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-[#1A1A2E]/20 bg-white/60 p-10 text-center">
              <p className="display text-lg font-extrabold text-[#1A1A2E]">No endpoints found</p>
              <p className="mt-1 text-sm text-[#1A1A2E]/50">Try a different search term or clear the filter.</p>
              <button
                onClick={() => { setSearch(""); setActiveTag(null); }}
                className="mt-4 rounded-xl border-2 border-[#1A1A2E] bg-[#FF5277] px-4 py-2 text-sm font-bold text-white shadow-[0_2px_0_0_#1A1A2E]"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-16 rounded-2xl border-2 border-[#1A1A2E] bg-[#1A1A2E] p-8 shadow-[0_6px_0_0_#0B0B17]">
            <div className="text-center">
              <p className="display text-lg font-extrabold text-white">Need help integrating?</p>
              <p className="mt-2 text-sm text-white/60">
                Our team is here to help you build on top of Flamingo Pay.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <a
                  href="mailto:info@flamingopay.co.za"
                  className="rounded-xl border-2 border-white/20 bg-[#FF5277] px-6 py-2.5 text-sm font-extrabold text-white shadow-[0_2px_0_0_rgba(255,255,255,0.1)] transition hover:bg-[#D93A5C]"
                >
                  Contact developer support
                </a>
                <Link
                  href="/legal/terms"
                  className="rounded-xl border-2 border-white/20 bg-white/10 px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-white/20"
                >
                  Terms of service
                </Link>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-4 border-t border-white/10 pt-5 text-xs text-white/40">
              <Link href="/legal/privacy" className="hover:text-white/70">Privacy Policy</Link>
              <Link href="/legal/dpa" className="hover:text-white/70">Data Processing</Link>
              <Link href="/legal/ecta" className="hover:text-white/70">ECTA Compliance</Link>
              <Link href="/legal/cpa" className="hover:text-white/70">Consumer Protection</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function QuickCard({ icon, title, desc, onClick }: { icon: string; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border-2 border-[#1A1A2E] bg-white p-5 text-left shadow-[0_4px_0_0_#1A1A2E] transition hover:shadow-[0_2px_0_0_#1A1A2E] hover:translate-y-[2px]"
    >
      <span className="text-2xl">{icon}</span>
      <p className="mt-2 font-extrabold text-[#1A1A2E]">{title}</p>
      <p className="mt-1 text-xs text-[#1A1A2E]/60 leading-relaxed">{desc}</p>
    </button>
  );
}

function StatusRow({ code, label, desc, tone }: { code: string; label: string; desc: string; tone: "green" | "amber" | "red" }) {
  const colors = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#1A1A2E]/10 bg-[#FFF7F3] px-3 py-2">
      <span className={`rounded-md border px-2 py-0.5 text-xs font-extrabold ${colors}`}>{code}</span>
      <div>
        <p className="text-xs font-bold text-[#1A1A2E]">{label}</p>
        <p className="text-[10px] text-[#1A1A2E]/50">{desc}</p>
      </div>
    </div>
  );
}
