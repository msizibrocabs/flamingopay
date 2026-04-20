"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import Link from "next/link";

/* ─── API Data ─── */
type Endpoint = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  summary: string;
  auth: "none" | "session" | "compliance" | "admin" | "merchant";
  tag: string;
  description?: string;
  params?: { name: string; in: "query" | "path" | "body"; type: string; required?: boolean; desc?: string }[];
  request?: string;
  response?: string;
};

const ENDPOINTS: Endpoint[] = [
  // ─── Auth ───
  { method: "POST", path: "/api/auth/login", summary: "Admin staff login", auth: "none", tag: "Authentication",
    description: "Authenticate admin staff with email and password. Creates a server-side session cookie.",
    request: `{
  "email": "admin@flamingopay.co.za",
  "password": "string"
}`,
    response: `{
  "authenticated": true,
  "staff": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "owner | manager | viewer"
  }
}` },
  { method: "POST", path: "/api/auth/merchant-login", summary: "Merchant login", auth: "none", tag: "Authentication",
    description: "Authenticate a merchant with phone number and PIN.",
    request: `{
  "phone": "+27721234567",
  "pin": "1234"
}`,
    response: `{
  "merchant": {
    "id": "m_abc123",
    "phone": "+27721234567",
    "businessName": "Mama's Spaza",
    "status": "approved",
    "kycTier": "basic"
  }
}` },
  { method: "POST", path: "/api/auth/logout", summary: "End session", auth: "session", tag: "Authentication",
    response: `{ "ok": true }` },
  { method: "GET", path: "/api/auth/session", summary: "Verify current session", auth: "session", tag: "Authentication",
    response: `{
  "authenticated": true,
  "staff": { "id": "string", "name": "string", "role": "string" }
}` },
  { method: "POST", path: "/api/auth/otp", summary: "Request or verify OTP", auth: "none", tag: "Authentication",
    request: `{
  "phone": "+27721234567",
  "action": "send | verify",
  "code": "123456"
}`,
    response: `{ "ok": true, "message": "OTP sent" }` },
  { method: "POST", path: "/api/auth/pin-reset", summary: "Reset merchant PIN", auth: "none", tag: "Authentication",
    request: `{ "phone": "+27721234567", "otp": "123456", "newPin": "5678" }`,
    response: `{ "ok": true }` },
  { method: "POST", path: "/api/compliance/login", summary: "Compliance officer login", auth: "none", tag: "Authentication",
    description: "Separate auth for compliance staff. Sets fp_compliance_token cookie.",
    request: `{
  "email": "compliance@flamingopay.co.za",
  "password": "string"
}`,
    response: `{
  "ok": true,
  "officer": { "id": "string", "name": "string", "email": "string" }
}` },

  // ─── Merchants ───
  { method: "POST", path: "/api/merchants", summary: "Register new merchant", auth: "none", tag: "Merchants",
    description: "Create a new merchant account. Triggers KYC verification flow.",
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
  { method: "GET", path: "/api/merchants", summary: "List all merchants", auth: "admin", tag: "Merchants",
    params: [
      { name: "status", in: "query", type: "string", desc: "Filter: pending, approved, suspended, frozen" },
      { name: "search", in: "query", type: "string", desc: "Search by name, phone, or ID" },
    ],
    response: `{
  "merchants": [
    {
      "id": "m_abc123",
      "businessName": "Mama's Spaza",
      "status": "approved",
      "ownerName": "Sipho Ndlovu",
      "createdAt": "2026-04-20T..."
    }
  ],
  "total": 200
}` },
  { method: "GET", path: "/api/merchants/{id}", summary: "Get merchant details", auth: "admin", tag: "Merchants",
    params: [{ name: "id", in: "path", type: "string", required: true, desc: "Merchant ID" }],
    response: `{
  "merchant": {
    "id": "m_abc123",
    "phone": "+27721234567",
    "businessName": "Mama's Spaza",
    "businessType": "retail",
    "ownerName": "Sipho Ndlovu",
    "status": "approved",
    "kycTier": "basic",
    "balance": 15000.50,
    "totalTransactions": 342,
    "createdAt": "2026-04-20T..."
  }
}` },
  { method: "PATCH", path: "/api/merchants/{id}/status", summary: "Update merchant status", auth: "admin", tag: "Merchants",
    request: `{ "status": "approved", "reason": "KYC verified" }`,
    response: `{ "ok": true, "merchant": { "id": "m_abc123", "status": "approved" } }` },
  { method: "PATCH", path: "/api/merchants/{id}/update", summary: "Update merchant profile", auth: "merchant", tag: "Merchants",
    request: `{ "businessName": "Mama's Spaza Shop", "address": "456 New Rd" }`,
    response: `{ "ok": true }` },
  { method: "GET", path: "/api/merchants/check-phone", summary: "Check phone availability", auth: "none", tag: "Merchants",
    params: [{ name: "phone", in: "query", type: "string", required: true, desc: "Phone number to check" }],
    response: `{ "available": true }` },

  // ─── Transactions ───
  { method: "GET", path: "/api/merchants/{id}/transactions", summary: "List merchant transactions", auth: "admin", tag: "Transactions",
    params: [
      { name: "id", in: "path", type: "string", required: true, desc: "Merchant ID" },
      { name: "from", in: "query", type: "string", desc: "Start date (ISO)" },
      { name: "to", in: "query", type: "string", desc: "End date (ISO)" },
    ],
    response: `{
  "transactions": [
    {
      "id": "txn_123",
      "reference": "FP-ABC123",
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
  { method: "POST", path: "/api/merchants/{id}/transactions/{txnId}/refund", summary: "Refund a transaction", auth: "admin", tag: "Transactions",
    request: `{ "amount": 150.00, "reason": "Customer dispute — overcharged" }`,
    response: `{ "ok": true, "refund": { "id": "ref_456", "amount": 150.00, "status": "processed" } }` },
  { method: "GET", path: "/api/merchants/{id}/export", summary: "Export transaction data (CSV)", auth: "admin", tag: "Transactions" },
  { method: "GET", path: "/api/merchants/{id}/statement", summary: "Generate merchant statement (PDF)", auth: "admin", tag: "Transactions",
    params: [
      { name: "month", in: "query", type: "string", desc: "Month (YYYY-MM)" },
    ] },
  { method: "GET", path: "/api/receipt/{txnId}", summary: "Get transaction receipt", auth: "none", tag: "Transactions",
    response: `{
  "receipt": {
    "reference": "FP-ABC123",
    "amount": 150.00,
    "merchantName": "Mama's Spaza",
    "status": "completed",
    "date": "2026-04-20T14:30:00Z"
  }
}` },

  // ─── Merchant Holds & Verification ───
  { method: "GET", path: "/api/merchants/{id}/hold", summary: "Get hold status & velocity limits", auth: "admin", tag: "Holds & Verification",
    response: `{
  "transactionHold": false,
  "holdReason": null,
  "velocityLimits": {
    "maxTxnPerHour": 20,
    "maxDailyVolume": 50000,
    "maxSingleTxn": 5000
  },
  "kycTier": "basic"
}` },
  { method: "POST", path: "/api/merchants/{id}/hold", summary: "Place or lift transaction hold", auth: "admin", tag: "Holds & Verification",
    request: `{ "action": "hold", "reason": "Under investigation" }`,
    response: `{ "ok": true, "action": "hold" }` },
  { method: "PUT", path: "/api/merchants/{id}/hold", summary: "Update velocity limits", auth: "admin", tag: "Holds & Verification",
    request: `{ "maxTxnPerHour": 10, "maxDailyVolume": 25000, "maxSingleTxn": 2500 }`,
    response: `{ "ok": true, "velocityLimits": { "maxTxnPerHour": 10, "maxDailyVolume": 25000, "maxSingleTxn": 2500 } }` },
  { method: "GET", path: "/api/merchants/{id}/verify", summary: "Get KYC verification status", auth: "none", tag: "Holds & Verification",
    response: `{
  "merchantId": "m_abc123",
  "kycTier": "basic",
  "overallStatus": "pending",
  "requiredChecks": ["id_verification", "selfie_match", "sanctions_screening"],
  "record": null
}` },
  { method: "POST", path: "/api/merchants/{id}/verify", summary: "Trigger full KYC verification", auth: "none", tag: "Holds & Verification",
    description: "Runs ID verification, selfie biometric matching, sanctions screening, and PEP checks. Auto-approves if all pass.",
    request: `{
  "idNumber": "9501015800086",
  "selfieBase64": "data:image/jpeg;base64,...",
  "cipcRegistrationNumber": "2026/276925/07",
  "dateOfBirth": "1995-01-01"
}`,
    response: `{
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

  // ─── Disputes ───
  { method: "POST", path: "/api/disputes", summary: "File a buyer dispute", auth: "none", tag: "Disputes",
    description: "Public endpoint for buyers to file disputes against transactions.",
    request: `{
  "txnRef": "FP-ABC123",
  "merchantId": "m_abc123",
  "amount": 150.00,
  "buyerPhone": "0721234567",
  "buyerEmail": "buyer@example.com",
  "reason": "wrong_amount",
  "description": "Charged R150 but should have been R100"
}`,
    response: `{
  "dispute": {
    "ref": "DSP-ABCD12",
    "status": "open",
    "createdAt": "2026-04-20T...",
    "deadline": "2026-05-20T..."
  }
}` },
  { method: "GET", path: "/api/disputes", summary: "List all disputes", auth: "compliance", tag: "Disputes",
    params: [
      { name: "status", in: "query", type: "string", desc: "open, merchant_response, escalated, refund_pending, resolved" },
      { name: "merchantId", in: "query", type: "string", desc: "Filter by merchant" },
    ] },
  { method: "GET", path: "/api/disputes/lookup", summary: "Public dispute status lookup", auth: "none", tag: "Disputes",
    params: [{ name: "ref", in: "query", type: "string", required: true, desc: "Dispute reference (DSP-XXXX)" }],
    response: `{
  "dispute": {
    "ref": "DSP-ABCD12",
    "status": "open",
    "reason": "wrong_amount",
    "amount": 150.00,
    "merchantName": "Mama's Spaza",
    "createdAt": "2026-04-20T..."
  }
}` },
  { method: "POST", path: "/api/disputes/search", summary: "Search transactions for dispute", auth: "none", tag: "Disputes",
    request: `{ "amount": 150.00, "dateFrom": "2026-04-01", "dateTo": "2026-04-20" }`,
    response: `{ "transactions": [{ "txnRef": "FP-ABC123", "amount": 150.00, "merchantName": "Mama's Spaza" }] }` },
  { method: "PATCH", path: "/api/disputes/{disputeId}", summary: "Resolve a dispute", auth: "compliance", tag: "Disputes",
    request: `{
  "decision": "refund_full",
  "resolvedBy": "Siphokazi Gazi",
  "refundAmount": 150.00
}`,
    response: `{ "dispute": { "id": "string", "status": "refund_pending" } }` },

  // ─── DSAR (POPIA) ───
  { method: "POST", path: "/api/dsar", summary: "Submit data access/deletion request", auth: "none", tag: "DSAR (POPIA)",
    description: "POPIA Section 23 (access) or Section 24 (deletion) request. 30-day response deadline.",
    request: `{
  "requestType": "access",
  "requesterType": "buyer",
  "fullName": "Sipho Ndlovu",
  "email": "sipho@example.com",
  "phone": "0721234567",
  "description": "All personal data you hold about me"
}`,
    response: `{
  "dsar": {
    "ref": "DSAR-AB12CD",
    "deadline": "2026-05-20T..."
  }
}` },
  { method: "GET", path: "/api/dsar/lookup", summary: "Public DSAR status lookup", auth: "none", tag: "DSAR (POPIA)",
    params: [{ name: "ref", in: "query", type: "string", required: true, desc: "DSAR-XXXX or DEL-XXXX" }] },
  { method: "POST", path: "/api/dsar/lookup", summary: "Mark data export as downloaded", auth: "none", tag: "DSAR (POPIA)",
    request: `{ "ref": "DSAR-AB12CD" }`,
    response: `{ "success": true }` },
  { method: "GET", path: "/api/compliance/dsar", summary: "List DSARs with stats", auth: "compliance", tag: "DSAR (POPIA)",
    params: [{ name: "status", in: "query", type: "string", desc: "new, verified, processing, ready, downloaded, rejected, closed" }] },
  { method: "PATCH", path: "/api/compliance/dsar/{dsarId}", summary: "Process a DSAR", auth: "compliance", tag: "DSAR (POPIA)",
    description: "Verify identity, generate data export, execute deletion, reject, add note, or close.",
    request: `{
  "action": "verify | process | reject | note | close",
  "officer": "Siphokazi Gazi",
  "reason": "Required for reject",
  "noteText": "Required for note"
}`,
    response: `{ "dsar": { "id": "string", "status": "verified" } }` },

  // ─── Compliance ───
  { method: "GET", path: "/api/compliance/flags", summary: "List compliance flags", auth: "compliance", tag: "Compliance",
    params: [
      { name: "status", in: "query", type: "string", desc: "open, investigating, cleared, confirmed" },
      { name: "merchantId", in: "query", type: "string", desc: "Filter by merchant" },
    ] },
  { method: "POST", path: "/api/compliance/flags", summary: "Create a compliance flag", auth: "compliance", tag: "Compliance",
    request: `{
  "merchantId": "m_abc123",
  "type": "velocity_breach",
  "severity": "high",
  "description": "15 transactions in 1 hour"
}` },
  { method: "PATCH", path: "/api/compliance/flags/{flagId}", summary: "Update a flag", auth: "compliance", tag: "Compliance",
    request: `{ "status": "investigating", "notes": "Reviewing transactions" }` },
  { method: "POST", path: "/api/compliance/flags/rescan", summary: "Rescan all transactions for flags", auth: "compliance", tag: "Compliance",
    response: `{ "success": true, "scanned": 150, "flagsCreated": 3, "merchantsAffected": 2 }` },
  { method: "POST", path: "/api/compliance/freeze", summary: "Freeze/unfreeze merchant account", auth: "admin", tag: "Compliance",
    request: `{ "merchantId": "m_abc123", "action": "freeze", "reason": "Confirmed fraud" }` },
  { method: "GET", path: "/api/compliance/stats", summary: "Compliance dashboard statistics", auth: "compliance", tag: "Compliance" },
  { method: "GET", path: "/api/compliance/disputes", summary: "Dispute dashboard with stats", auth: "compliance", tag: "Compliance" },
  { method: "GET", path: "/api/compliance/risk", summary: "Portfolio risk scores", auth: "admin", tag: "Compliance",
    response: `{
  "scores": [{ "merchantId": "m_abc123", "riskScore": 45, "riskLevel": "medium" }],
  "summary": { "totalMerchants": 200, "averageScore": 30 }
}` },
  { method: "GET", path: "/api/compliance/strs", summary: "List Suspicious Transaction Reports", auth: "admin", tag: "Compliance" },
  { method: "POST", path: "/api/compliance/strs", summary: "Create or update STR", auth: "admin", tag: "Compliance",
    request: `{
  "merchantId": "m_abc123",
  "description": "Unusual pattern detected",
  "riskLevel": "high"
}` },

  // ─── Sanctions ───
  { method: "POST", path: "/api/sanctions/screen", summary: "Screen an individual", auth: "admin", tag: "Sanctions",
    request: `{ "name": "Sipho Ndlovu", "idNumber": "9501015800086" }`,
    response: `{ "matches": [], "screened": true, "isPep": false }` },
  { method: "POST", path: "/api/sanctions/batch", summary: "Batch screen merchants", auth: "admin", tag: "Sanctions" },
  { method: "POST", path: "/api/sanctions/refresh", summary: "Refresh sanctions lists", auth: "admin", tag: "Sanctions" },
  { method: "GET", path: "/api/sanctions/flags", summary: "List sanctions flags", auth: "admin", tag: "Sanctions" },

  // ─── Webhooks ───
  { method: "POST", path: "/api/webhooks/ozow", summary: "Ozow payment notification", auth: "none", tag: "Webhooks",
    description: "Receives payment status updates from Ozow. Validated via HMAC signature." },
  { method: "POST", path: "/api/webhooks/payshap", summary: "PayShap settlement notification", auth: "none", tag: "Webhooks" },

  // ─── Admin ───
  { method: "POST", path: "/api/admin/login", summary: "Admin login", auth: "none", tag: "Admin" },
  { method: "GET", path: "/api/admin/staff", summary: "List admin staff", auth: "admin", tag: "Admin" },
  { method: "POST", path: "/api/admin/staff", summary: "Create admin staff member", auth: "admin", tag: "Admin" },
  { method: "PATCH", path: "/api/admin/staff/{id}", summary: "Update staff member", auth: "admin", tag: "Admin" },
  { method: "GET", path: "/api/admin/audit", summary: "View audit log", auth: "admin", tag: "Admin" },
  { method: "GET", path: "/api/admin/search", summary: "Global search", auth: "admin", tag: "Admin" },

  // ─── Documents ───
  { method: "POST", path: "/api/upload", summary: "Upload KYC document", auth: "none", tag: "Documents",
    description: "Upload merchant verification documents (ID, proof of address, selfie)." },
  { method: "GET", path: "/api/documents/view", summary: "View stored document", auth: "admin", tag: "Documents" },
  { method: "GET", path: "/api/merchants/{id}/documents", summary: "List merchant documents", auth: "admin", tag: "Documents" },

  // ─── Notifications ───
  { method: "POST", path: "/api/push/subscribe", summary: "Subscribe to push notifications", auth: "none", tag: "Notifications" },
  { method: "POST", path: "/api/notifications/test", summary: "Send test notification", auth: "admin", tag: "Notifications" },

  // ─── Complaints ───
  { method: "POST", path: "/api/complaints", summary: "Submit a complaint", auth: "none", tag: "Complaints" },
  { method: "GET", path: "/api/complaints", summary: "List complaints", auth: "admin", tag: "Complaints" },
  { method: "PATCH", path: "/api/complaints/{id}", summary: "Update complaint", auth: "admin", tag: "Complaints" },
  { method: "GET", path: "/api/complaints/stats", summary: "Complaint statistics", auth: "admin", tag: "Complaints" },
];

const TAGS = [...new Set(ENDPOINTS.map(e => e.tag))];

const METHOD_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  GET:    { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200" },
  POST:   { bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-200" },
  PATCH:  { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200" },
  PUT:    { bg: "bg-purple-50",   text: "text-purple-700",  border: "border-purple-200" },
  DELETE: { bg: "bg-red-50",      text: "text-red-700",     border: "border-red-200" },
};

const AUTH_LABELS: Record<string, { label: string; cls: string }> = {
  none:       { label: "Public", cls: "bg-green-100 text-green-700" },
  session:    { label: "Session", cls: "bg-blue-100 text-blue-700" },
  compliance: { label: "Compliance", cls: "bg-amber-100 text-amber-700" },
  admin:      { label: "Admin", cls: "bg-red-100 text-red-700" },
  merchant:   { label: "Merchant", cls: "bg-purple-100 text-purple-700" },
};

/* ─── Components ─── */

function MethodBadge({ method }: { method: string }) {
  const s = METHOD_STYLES[method] ?? METHOD_STYLES.GET;
  return (
    <span className={`inline-block min-w-[52px] rounded-md border px-2 py-0.5 text-center text-[11px] font-extrabold uppercase tracking-wide ${s.bg} ${s.text} ${s.border}`}>
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
  const id = `${endpoint.method}-${endpoint.path}`.replace(/[^a-zA-Z0-9]/g, "-");

  return (
    <div id={id} className="scroll-mt-20">
      <button
        onClick={onToggle}
        className={`w-full rounded-2xl border-2 border-[#1A1A2E] bg-white p-4 text-left transition-all ${
          isOpen ? "shadow-[0_6px_0_0_#1A1A2E]" : "shadow-[0_3px_0_0_#1A1A2E] hover:shadow-[0_4px_0_0_#1A1A2E]"
        }`}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <MethodBadge method={endpoint.method} />
          <code className="text-sm font-bold text-[#1A1A2E] font-mono">{endpoint.path}</code>
          <AuthBadge auth={endpoint.auth} />
          <span className="ml-auto text-xs text-[#1A1A2E]/40 transition-transform" style={{ transform: isOpen ? "rotate(180deg)" : "" }}>
            ▼
          </span>
        </div>
        <p className="mt-1.5 text-sm text-[#1A1A2E]/60">{endpoint.summary}</p>
      </button>

      {isOpen && (
        <div className="mt-1 rounded-2xl border-2 border-[#1A1A2E]/20 bg-white/80 p-5 space-y-4">
          {endpoint.description && (
            <p className="text-sm text-[#1A1A2E]/70">{endpoint.description}</p>
          )}

          {endpoint.params && endpoint.params.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#1A1A2E]/50">Parameters</p>
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
                          {p.name}{p.required && <span className="text-[#FF5277]">*</span>}
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
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#1A1A2E]/50">Request body</p>
              <CodeBlock code={endpoint.request} />
            </div>
          )}

          {endpoint.response && (
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#1A1A2E]/50">Response</p>
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
    const matchesSearch = !q || e.path.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q) || e.tag.toLowerCase().includes(q);
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
              <h1 className="display text-lg font-extrabold text-[#1A1A2E]">API Reference</h1>
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
                https://www.flamingopay.co.za/api
              </code>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#1A1A2E]/50">Resources</p>
              <a href="/api-docs.md" target="_blank" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#1A1A2E]/60 hover:bg-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Full Markdown docs
              </a>
              <a href="/openapi.json" target="_blank" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#1A1A2E]/60 hover:bg-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                OpenAPI spec (JSON)
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
              Everything you need to integrate with South Africa&apos;s QR payment platform.
              57 endpoints covering payments, merchants, compliance, KYC, disputes, and POPIA.
            </p>
          </div>

          {/* Quick start cards */}
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <QuickCard
              icon="🔑"
              title="Authentication"
              desc="Session cookies for admin/compliance. PIN-based for merchants."
              onClick={() => setActiveTag("Authentication")}
            />
            <QuickCard
              icon="💳"
              title="Transactions"
              desc="PayShap payments, refunds, receipts, and statements."
              onClick={() => setActiveTag("Transactions")}
            />
            <QuickCard
              icon="🛡️"
              title="Compliance"
              desc="Flags, sanctions screening, STRs, risk scoring."
              onClick={() => setActiveTag("Compliance")}
            />
          </div>

          {/* Auth overview */}
          <div className="mb-10 rounded-2xl border-2 border-[#1A1A2E] bg-white p-6 shadow-[0_6px_0_0_#1A1A2E]">
            <h3 className="display text-lg font-extrabold text-[#1A1A2E]">Authentication</h3>
            <p className="mt-2 text-sm text-[#1A1A2E]/60">
              Flamingo Pay uses HTTP-only session cookies for authentication. Different endpoints require different access levels:
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {Object.entries(AUTH_LABELS).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 rounded-xl border border-[#1A1A2E]/10 bg-[#FFF7F3] px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${val.cls}`}>{val.label}</span>
                  <span className="text-xs text-[#1A1A2E]/50">
                    {key === "none" && "No auth required"}
                    {key === "session" && "Any staff session"}
                    {key === "compliance" && "fp_compliance_token cookie"}
                    {key === "admin" && "flamingo_session cookie"}
                    {key === "merchant" && "Merchant PIN auth"}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#1A1A2E]/50">Quick example</p>
              <CodeBlock lang="bash" code={`# Login as admin
curl -X POST https://www.flamingopay.co.za/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "admin@flamingopay.co.za", "password": "..."}' \\
  -c cookies.txt

# Use session cookie for authenticated requests
curl https://www.flamingopay.co.za/api/merchants \\
  -b cookies.txt`} />
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
          <div className="mt-16 rounded-2xl border-2 border-[#1A1A2E] bg-[#1A1A2E] p-8 text-center shadow-[0_6px_0_0_#0B0B17]">
            <p className="display text-lg font-extrabold text-white">Need help integrating?</p>
            <p className="mt-2 text-sm text-white/60">
              Contact our developer support team for assistance with your integration.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <a
                href="mailto:info@flamingopay.co.za"
                className="rounded-xl border-2 border-white/20 bg-[#FF5277] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_2px_0_0_rgba(255,255,255,0.1)] transition hover:bg-[#D93A5C]"
              >
                Email us
              </a>
              <a
                href="/openapi.json"
                target="_blank"
                className="rounded-xl border-2 border-white/20 bg-white/10 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-white/20"
              >
                Download OpenAPI spec
              </a>
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
      <p className="mt-1 text-xs text-[#1A1A2E]/60">{desc}</p>
    </button>
  );
}
