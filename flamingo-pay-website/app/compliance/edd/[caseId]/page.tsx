"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ComplianceGate } from "../../_components/ComplianceGate";
import { ComplianceNav } from "../../_components/ComplianceNav";
import { Reveal } from "../../../../components/motion/Reveal";
import { timeAgo } from "../../../../lib/merchant";
import { currentComplianceOfficer } from "../../../../lib/compliance";

// ─── Types ───────────────────────────────────────────────────

type EDDCheck = {
  type: string;
  label: string;
  required: boolean;
  status: "pending" | "in_progress" | "completed" | "waived";
  completedBy?: string;
  completedAt?: string;
  findings?: string;
  documentRef?: string;
};

type EDDTimelineEntry = {
  timestamp: string;
  action: string;
  actor: string;
  detail?: string;
};

type EDDCase = {
  id: string;
  merchantId: string;
  merchantName: string;
  ownerName: string;
  trigger: string;
  triggerDetail: string;
  status: string;
  riskLevel: "high" | "critical";
  checks: EDDCheck[];
  timeline: EDDTimelineEntry[];
  assignedTo?: string;
  assignedAt?: string;
  decidedBy?: string;
  decidedAt?: string;
  decisionNote?: string;
  conditions?: string[];
  nextReviewDate?: string;
  reviewFrequencyDays: number;
  createdAt: string;
  updatedAt: string;
};

// ─── Constants ───────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  opened: "bg-red-100 text-red-800 border-red-300",
  investigation: "bg-amber-100 text-amber-800 border-amber-300",
  pending_approval: "bg-blue-100 text-blue-800 border-blue-300",
  approved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-purple-100 text-purple-800 border-purple-300",
  closed: "bg-gray-100 text-gray-600 border-gray-300",
};

const STATUS_LABELS: Record<string, string> = {
  opened: "Open",
  investigation: "Investigating",
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  closed: "Closed",
};

const TRIGGER_LABELS: Record<string, string> = {
  pep_identified: "PEP Identified",
  sanctions_near_match: "Sanctions Near-Match",
  volume_deviation: "Volume Deviation",
  high_risk_business: "High-Risk Business",
  adverse_media: "Adverse Media",
  str_filed: "STR Filed",
  manual_referral: "Manual Referral",
};

const TRIGGER_ICONS: Record<string, string> = {
  pep_identified: "👤",
  sanctions_near_match: "🛡️",
  volume_deviation: "📈",
  high_risk_business: "⚠️",
  adverse_media: "📰",
  str_filed: "🚨",
  manual_referral: "🖊️",
};

const CHECK_ICONS: Record<string, string> = {
  pending: "⬜",
  in_progress: "🔄",
  completed: "✅",
  waived: "⏭️",
};

const TIMELINE_ICONS: Record<string, string> = {
  case_opened: "📂",
  assigned: "👤",
  check_completed: "✅",
  check_waived: "⏭️",
  ready_for_approval: "📋",
  decision_approved: "✅",
  decision_rejected: "❌",
  note_added: "📝",
  case_closed: "🔒",
};

// ─── Page ────────────────────────────────────────────────────

export default function EDDCaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  return (
    <ComplianceGate>
      <ComplianceNav />
      <EDDCaseDetail caseId={caseId} />
    </ComplianceGate>
  );
}

function EDDCaseDetail({ caseId }: { caseId: string }) {
  const [eddCase, setEddCase] = useState<EDDCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState("");

  // Check completion form
  const [activeCheck, setActiveCheck] = useState<string | null>(null);
  const [findings, setFindings] = useState("");

  // Decision form
  const [showDecision, setShowDecision] = useState(false);
  const [decisionType, setDecisionType] = useState<"approved" | "rejected">("approved");
  const [decisionNote, setDecisionNote] = useState("");
  const [conditions, setConditions] = useState("");

  // Note form
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");

  // Close form
  const [showClose, setShowClose] = useState(false);
  const [closeReason, setCloseReason] = useState("");

  const fetchCase = useCallback(async () => {
    try {
      const res = await fetch(`/api/compliance/edd/${caseId}`);
      const d = await res.json();
      if (d.case) setEddCase(d.case);
    } catch {}
    setLoading(false);
  }, [caseId]);

  useEffect(() => { fetchCase(); }, [fetchCase]);

  function showToastMsg(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function patchCase(body: Record<string, unknown>) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/compliance/edd/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.case) {
        setEddCase(d.case);
        return true;
      }
      showToastMsg(d.error ?? "Action failed");
      return false;
    } catch {
      showToastMsg("Network error");
      return false;
    } finally {
      setActionLoading(false);
    }
  }

  const officer = typeof window !== "undefined" ? currentComplianceOfficer()?.name ?? "Compliance Officer" : "Compliance Officer";

  async function handleAssign() {
    const ok = await patchCase({ action: "assign", officerName: officer });
    if (ok) showToastMsg("Case assigned to you");
  }

  async function handleCompleteCheck() {
    if (!activeCheck || !findings.trim()) return;
    const ok = await patchCase({
      action: "complete_check",
      checkType: activeCheck,
      completedBy: officer,
      findings: findings.trim(),
    });
    if (ok) {
      showToastMsg("Check completed");
      setActiveCheck(null);
      setFindings("");
    }
  }

  async function handleWaiveCheck(checkType: string) {
    const justification = prompt("Justification for waiving this check:");
    if (!justification) return;
    const ok = await patchCase({
      action: "waive_check",
      checkType,
      waivedBy: officer,
      justification,
    });
    if (ok) showToastMsg("Check waived");
  }

  async function handleDecision() {
    if (!decisionNote.trim()) return;
    const conditionsList = conditions.trim()
      ? conditions.split("\n").map(c => c.trim()).filter(Boolean)
      : undefined;
    const ok = await patchCase({
      action: "decide",
      decision: decisionType,
      decidedBy: officer,
      note: decisionNote.trim(),
      conditions: conditionsList,
    });
    if (ok) {
      showToastMsg(`Case ${decisionType}`);
      setShowDecision(false);
      setDecisionNote("");
      setConditions("");
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    const ok = await patchCase({ action: "add_note", actor: officer, note: noteText.trim() });
    if (ok) {
      showToastMsg("Note added");
      setShowNote(false);
      setNoteText("");
    }
  }

  async function handleClose() {
    if (!closeReason.trim()) return;
    const ok = await patchCase({ action: "close", closedBy: officer, reason: closeReason.trim() });
    if (ok) {
      showToastMsg("Case closed");
      setShowClose(false);
      setCloseReason("");
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-flamingo-dark/40">Loading case...</div>;
  }

  if (!eddCase) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-8">
        <p className="text-flamingo-dark/60">EDD case not found.</p>
        <Link href="/compliance/edd" className="mt-2 inline-block text-sm font-bold text-red-600 underline">
          Back to EDD cases
        </Link>
      </main>
    );
  }

  const completedChecks = eddCase.checks.filter(c => c.status === "completed" || c.status === "waived").length;
  const totalChecks = eddCase.checks.length;
  const requiredChecks = eddCase.checks.filter(c => c.required);
  const allRequiredDone = requiredChecks.every(c => c.status === "completed" || c.status === "waived");
  const isActive = !["approved", "rejected", "closed"].includes(eddCase.status);
  const canDecide = (eddCase.status === "pending_approval" || eddCase.status === "investigation") && allRequiredDone;

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2 text-sm font-bold shadow-[0_4px_0_0_#1A1A2E]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb */}
      <Reveal>
        <Link href="/compliance/edd" className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-red-600 hover:underline">
          ← Back to EDD Cases
        </Link>
      </Reveal>

      {/* Header Card */}
      <Reveal delay={0.05}>
        <div className="mb-6 rounded-2xl border-2 border-flamingo-dark bg-white p-6 shadow-[0_4px_0_0_#1A1A2E]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{TRIGGER_ICONS[eddCase.trigger] ?? "📋"}</span>
                <h1 className="display text-xl font-black text-flamingo-dark">{eddCase.merchantName}</h1>
              </div>
              <p className="text-sm text-flamingo-dark/60">Owner: {eddCase.ownerName}</p>
              <p className="text-sm text-flamingo-dark/60">Merchant ID: <code className="rounded bg-flamingo-cream px-1 text-xs">{eddCase.merchantId}</code></p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-extrabold uppercase ${eddCase.riskLevel === "critical" ? "bg-red-600 text-white" : "bg-amber-500 text-white"}`}>
                {eddCase.riskLevel} risk
              </span>
              <span className={`inline-block rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${STATUS_COLORS[eddCase.status] ?? ""}`}>
                {STATUS_LABELS[eddCase.status] ?? eddCase.status}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-flamingo-cream p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-flamingo-dark/50 mb-1">Trigger</p>
            <p className="text-sm font-semibold text-flamingo-dark">{TRIGGER_LABELS[eddCase.trigger] ?? eddCase.trigger}</p>
            <p className="text-xs text-flamingo-dark/60 mt-0.5">{eddCase.triggerDetail}</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-flamingo-dark/50">
            <span>Opened: {new Date(eddCase.createdAt).toLocaleDateString("en-ZA")}</span>
            {eddCase.assignedTo && <span>Assigned: {eddCase.assignedTo}</span>}
            {eddCase.nextReviewDate && (
              <span className={eddCase.nextReviewDate < new Date().toISOString().split("T")[0] ? "text-red-600 font-bold" : ""}>
                Next review: {eddCase.nextReviewDate}
              </span>
            )}
            <span>Review cycle: every {eddCase.reviewFrequencyDays} days</span>
          </div>

          {/* Decision result */}
          {eddCase.decidedBy && (
            <div className={`mt-3 rounded-xl p-3 ${eddCase.status === "approved" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              <p className="text-xs font-extrabold uppercase tracking-widest text-flamingo-dark/50 mb-1">
                Decision — {eddCase.status === "approved" ? "Approved" : "Rejected"}
              </p>
              <p className="text-sm text-flamingo-dark">{eddCase.decisionNote}</p>
              <p className="text-xs text-flamingo-dark/50 mt-1">By {eddCase.decidedBy} on {new Date(eddCase.decidedAt!).toLocaleDateString("en-ZA")}</p>
              {eddCase.conditions && eddCase.conditions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-bold text-flamingo-dark/70">Conditions:</p>
                  <ul className="mt-1 space-y-0.5">
                    {eddCase.conditions.map((c, i) => (
                      <li key={i} className="text-xs text-flamingo-dark/60">• {c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {isActive && (
            <div className="mt-4 flex flex-wrap gap-2">
              {eddCase.status === "opened" && !eddCase.assignedTo && (
                <button onClick={handleAssign} disabled={actionLoading}
                  className="rounded-xl border-2 border-flamingo-dark bg-amber-400 px-4 py-2 text-sm font-bold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] transition hover:bg-amber-300 active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E] disabled:opacity-50">
                  Assign to me
                </button>
              )}
              {canDecide && (
                <button onClick={() => { setShowDecision(true); setDecisionType("approved"); }} disabled={actionLoading}
                  className="rounded-xl border-2 border-flamingo-dark bg-green-500 px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_0_#1A1A2E] transition hover:bg-green-400 active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E] disabled:opacity-50">
                  Approve
                </button>
              )}
              {canDecide && (
                <button onClick={() => { setShowDecision(true); setDecisionType("rejected"); }} disabled={actionLoading}
                  className="rounded-xl border-2 border-flamingo-dark bg-red-500 px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_0_#1A1A2E] transition hover:bg-red-400 active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E] disabled:opacity-50">
                  Reject
                </button>
              )}
              <button onClick={() => setShowNote(true)} disabled={actionLoading}
                className="rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2 text-sm font-bold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] transition hover:bg-flamingo-cream active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E] disabled:opacity-50">
                Add note
              </button>
              <button onClick={() => setShowClose(true)} disabled={actionLoading}
                className="rounded-xl border-2 border-flamingo-dark/30 bg-white px-4 py-2 text-sm font-bold text-flamingo-dark/50 transition hover:bg-gray-50 disabled:opacity-50">
                Close case
              </button>
            </div>
          )}
        </div>
      </Reveal>

      {/* Decision Modal */}
      <AnimatePresence>
        {showDecision && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border-2 border-flamingo-dark bg-white p-6 shadow-[0_8px_0_0_#1A1A2E]">
              <h2 className="display text-lg font-black text-flamingo-dark mb-3">
                {decisionType === "approved" ? "✅ Approve Merchant" : "❌ Reject Merchant"}
              </h2>
              <p className="text-xs text-flamingo-dark/60 mb-4">
                This decision requires senior management authority. {decisionType === "approved" ? "The merchant will be allowed to proceed with enhanced monitoring." : "The merchant account will be frozen/closed."}
              </p>
              <textarea
                value={decisionNote}
                onChange={e => setDecisionNote(e.target.value)}
                placeholder="Decision rationale (required)..."
                rows={3}
                className="w-full rounded-xl border-2 border-flamingo-dark/20 bg-flamingo-cream px-3 py-2 text-sm focus:border-flamingo-dark focus:outline-none"
              />
              {decisionType === "approved" && (
                <textarea
                  value={conditions}
                  onChange={e => setConditions(e.target.value)}
                  placeholder="Conditions (one per line, optional)..."
                  rows={2}
                  className="mt-2 w-full rounded-xl border-2 border-flamingo-dark/20 bg-flamingo-cream px-3 py-2 text-sm focus:border-flamingo-dark focus:outline-none"
                />
              )}
              <div className="mt-4 flex gap-2 justify-end">
                <button onClick={() => setShowDecision(false)}
                  className="rounded-xl border-2 border-flamingo-dark/20 px-4 py-2 text-sm font-bold text-flamingo-dark/60">
                  Cancel
                </button>
                <button onClick={handleDecision} disabled={actionLoading || !decisionNote.trim()}
                  className={`rounded-xl border-2 border-flamingo-dark px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50 ${decisionType === "approved" ? "bg-green-500" : "bg-red-500"}`}>
                  {actionLoading ? "Submitting..." : decisionType === "approved" ? "Confirm Approval" : "Confirm Rejection"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note Modal */}
      <AnimatePresence>
        {showNote && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border-2 border-flamingo-dark bg-white p-6 shadow-[0_8px_0_0_#1A1A2E]">
              <h2 className="display text-lg font-black text-flamingo-dark mb-3">📝 Add Note</h2>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Note..."
                rows={3}
                className="w-full rounded-xl border-2 border-flamingo-dark/20 bg-flamingo-cream px-3 py-2 text-sm focus:border-flamingo-dark focus:outline-none"
              />
              <div className="mt-4 flex gap-2 justify-end">
                <button onClick={() => setShowNote(false)}
                  className="rounded-xl border-2 border-flamingo-dark/20 px-4 py-2 text-sm font-bold text-flamingo-dark/60">Cancel</button>
                <button onClick={handleAddNote} disabled={actionLoading || !noteText.trim()}
                  className="rounded-xl border-2 border-flamingo-dark bg-flamingo-dark px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50">
                  {actionLoading ? "Saving..." : "Save Note"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close Modal */}
      <AnimatePresence>
        {showClose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border-2 border-flamingo-dark bg-white p-6 shadow-[0_8px_0_0_#1A1A2E]">
              <h2 className="display text-lg font-black text-flamingo-dark mb-3">🔒 Close Case</h2>
              <p className="text-xs text-flamingo-dark/60 mb-3">Close this EDD case (e.g., false positive, merchant left voluntarily).</p>
              <textarea
                value={closeReason}
                onChange={e => setCloseReason(e.target.value)}
                placeholder="Reason for closing..."
                rows={2}
                className="w-full rounded-xl border-2 border-flamingo-dark/20 bg-flamingo-cream px-3 py-2 text-sm focus:border-flamingo-dark focus:outline-none"
              />
              <div className="mt-4 flex gap-2 justify-end">
                <button onClick={() => setShowClose(false)}
                  className="rounded-xl border-2 border-flamingo-dark/20 px-4 py-2 text-sm font-bold text-flamingo-dark/60">Cancel</button>
                <button onClick={handleClose} disabled={actionLoading || !closeReason.trim()}
                  className="rounded-xl border-2 border-flamingo-dark bg-gray-600 px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_0_#1A1A2E] disabled:opacity-50">
                  {actionLoading ? "Closing..." : "Close Case"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDD Checks */}
      <Reveal delay={0.1}>
        <div className="mb-6">
          <h2 className="display text-lg font-black text-flamingo-dark mb-1">
            Required Checks
          </h2>
          <p className="text-xs text-flamingo-dark/50 mb-4">
            {completedChecks}/{totalChecks} completed — {allRequiredDone ? "all required checks done ✅" : "required checks outstanding"}
          </p>

          <div className="space-y-2">
            {eddCase.checks.map(check => (
              <div key={check.type} className="rounded-xl border-2 border-flamingo-dark/10 bg-white overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg shrink-0">{CHECK_ICONS[check.status]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${check.status === "completed" ? "text-green-700 line-through" : check.status === "waived" ? "text-gray-400 line-through" : "text-flamingo-dark"}`}>
                        {check.label}
                      </span>
                      {check.required && (
                        <span className="text-[9px] font-extrabold uppercase text-red-500">Required</span>
                      )}
                    </div>
                    {check.completedBy && (
                      <p className="text-xs text-flamingo-dark/50">
                        {check.status === "waived" ? "Waived" : "Completed"} by {check.completedBy} · {check.completedAt ? timeAgo(check.completedAt) : ""}
                      </p>
                    )}
                    {check.findings && (
                      <p className="text-xs text-flamingo-dark/60 mt-1 bg-flamingo-cream rounded-lg px-2 py-1">
                        {check.findings}
                      </p>
                    )}
                  </div>

                  {/* Action buttons for pending checks */}
                  {check.status === "pending" && isActive && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => { setActiveCheck(check.type); setFindings(""); }}
                        className="rounded-lg border-2 border-flamingo-dark bg-green-500 px-3 py-1 text-xs font-bold text-white shadow-[0_2px_0_0_#1A1A2E] transition hover:bg-green-400 active:translate-y-[1px]"
                      >
                        Complete
                      </button>
                      {!check.required && (
                        <button
                          onClick={() => handleWaiveCheck(check.type)}
                          className="rounded-lg border-2 border-flamingo-dark/20 px-3 py-1 text-xs font-bold text-flamingo-dark/50 transition hover:bg-gray-50"
                        >
                          Waive
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Inline findings form */}
                <AnimatePresence>
                  {activeCheck === check.type && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t-2 border-flamingo-dark/10 bg-flamingo-cream overflow-hidden"
                    >
                      <div className="p-4">
                        <textarea
                          value={findings}
                          onChange={e => setFindings(e.target.value)}
                          placeholder="Findings and observations..."
                          rows={3}
                          className="w-full rounded-xl border-2 border-flamingo-dark/20 bg-white px-3 py-2 text-sm focus:border-flamingo-dark focus:outline-none"
                          autoFocus
                        />
                        <div className="mt-2 flex gap-2 justify-end">
                          <button onClick={() => setActiveCheck(null)}
                            className="rounded-lg border-2 border-flamingo-dark/20 px-3 py-1 text-xs font-bold text-flamingo-dark/60">
                            Cancel
                          </button>
                          <button
                            onClick={handleCompleteCheck}
                            disabled={actionLoading || !findings.trim()}
                            className="rounded-lg border-2 border-flamingo-dark bg-green-500 px-4 py-1 text-xs font-bold text-white shadow-[0_2px_0_0_#1A1A2E] disabled:opacity-50"
                          >
                            {actionLoading ? "Saving..." : "Save findings"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Timeline */}
      <Reveal delay={0.15}>
        <h2 className="display text-lg font-black text-flamingo-dark mb-4">
          Audit Timeline
        </h2>
        <div className="space-y-0">
          {eddCase.timeline.slice().reverse().map((entry, i) => (
            <div key={i} className="flex gap-3 pb-4">
              <div className="flex flex-col items-center">
                <span className="text-base">{TIMELINE_ICONS[entry.action] ?? "📌"}</span>
                {i < eddCase.timeline.length - 1 && <div className="w-0.5 flex-1 bg-flamingo-dark/10 mt-1" />}
              </div>
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-flamingo-dark">{entry.actor}</span>
                  <span className="text-[10px] text-flamingo-dark/40">{timeAgo(entry.timestamp)}</span>
                </div>
                {entry.detail && (
                  <p className="text-xs text-flamingo-dark/60 mt-0.5">{entry.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </main>
  );
}
