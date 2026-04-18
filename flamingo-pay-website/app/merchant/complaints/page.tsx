"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MerchantGate } from "../_components/MerchantGate";
import { TabBar } from "../_components/TabBar";
import Link from "next/link";

type Complaint = {
  id: string;
  merchantId: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  level: number;
  outcome: string;
  outcomeNote?: string;
  handler?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  slaDeadline?: string;
  slaBreach: boolean;
  events: { timestamp: string; action: string; actor: string; note?: string }[];
};

const CATEGORIES = [
  { value: "payment_dispute", label: "Payment Dispute" },
  { value: "fees_charges", label: "Fees & Charges" },
  { value: "service_quality", label: "Service Quality" },
  { value: "data_privacy", label: "Data & Privacy (POPIA)" },
  { value: "sanctions_fica", label: "Sanctions / FICA" },
  { value: "fraud_security", label: "Fraud & Security" },
  { value: "staff_conduct", label: "Staff Conduct" },
  { value: "other", label: "Other" },
];

const STATUS_LABELS: Record<string, string> = {
  received: "Received",
  acknowledged: "Acknowledged",
  investigating: "Investigating",
  resolved: "Resolved",
  escalated: "Escalated",
  closed: "Closed",
};

const STATUS_COLORS: Record<string, string> = {
  received: "bg-flamingo-butter text-flamingo-dark",
  acknowledged: "bg-blue-100 text-blue-700",
  investigating: "bg-orange-100 text-orange-700",
  resolved: "bg-green-100 text-green-700",
  escalated: "bg-red-100 text-red-700",
  closed: "bg-flamingo-dark/10 text-flamingo-dark/70",
};

export default function MerchantComplaintsPage() {
  return (
    <MerchantGate>
      <Inner />
      <TabBar />
    </MerchantGate>
  );
}

function Inner() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [category, setCategory] = useState("payment_dispute");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function fetchComplaints() {
    try {
      const res = await fetch("/api/complaints");
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints ?? []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { fetchComplaints(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, description }),
      });
      if (res.ok) {
        setSubmitted(true);
        setSubject("");
        setDescription("");
        setCategory("payment_dispute");
        await fetchComplaints();
        setTimeout(() => {
          setSubmitted(false);
          setShowForm(false);
        }, 2500);
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  return (
    <main className="min-h-dvh bg-flamingo-cream pb-24">
      <div className="mx-auto max-w-lg px-5 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/merchant/profile"
            className="grid h-8 w-8 place-items-center rounded-xl border-2 border-flamingo-dark bg-white text-flamingo-dark"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="display text-xl font-extrabold text-flamingo-dark">
            My Complaints
          </h1>
        </div>
        <p className="text-xs text-flamingo-dark/50 mb-6">
          Lodge and track formal complaints — FSCA, PASA & POPIA compliant
        </p>

        {/* New complaint button */}
        {!showForm && (
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ y: 1 }}
            onClick={() => setShowForm(true)}
            className="mb-6 w-full rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink px-5 py-3.5 text-sm font-bold text-white shadow-[0_4px_0_0_#1A1A2E] transition active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E]"
          >
            Lodge a Complaint
          </motion.button>
        )}

        {/* Complaint form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              {submitted ? (
                <div className="rounded-2xl border-2 border-green-400 bg-green-50 p-6 text-center">
                  <p className="text-lg font-bold text-green-700">Complaint Submitted</p>
                  <p className="mt-2 text-sm text-green-600">
                    You will receive a written acknowledgement within 1 business day.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-2xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_4px_0_0_#1A1A2E]"
                >
                  <h2 className="display text-base font-extrabold text-flamingo-dark mb-4">
                    New Complaint
                  </h2>

                  <label className="block mb-3">
                    <span className="text-xs font-bold text-flamingo-dark/60">Category</span>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark/20 bg-flamingo-cream px-3 py-2.5 text-sm font-semibold text-flamingo-dark focus:border-flamingo-dark focus:outline-none"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block mb-3">
                    <span className="text-xs font-bold text-flamingo-dark/60">Subject</span>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="Brief description of your complaint"
                      className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark/20 bg-flamingo-cream px-3 py-2.5 text-sm font-semibold text-flamingo-dark placeholder:text-flamingo-dark/40 focus:border-flamingo-dark focus:outline-none"
                      required
                    />
                  </label>

                  <label className="block mb-4">
                    <span className="text-xs font-bold text-flamingo-dark/60">Details</span>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Describe the issue in detail — include dates, amounts, and transaction references where possible"
                      rows={4}
                      className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark/20 bg-flamingo-cream px-3 py-2.5 text-sm text-flamingo-dark placeholder:text-flamingo-dark/40 focus:border-flamingo-dark focus:outline-none"
                      required
                    />
                  </label>

                  <div className="flex gap-2">
                    <motion.button
                      type="submit"
                      disabled={submitting || !subject.trim() || !description.trim()}
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 1 }}
                      className="flex-1 rounded-xl border-2 border-flamingo-dark bg-flamingo-pink px-4 py-2.5 text-sm font-bold text-white shadow-[0_3px_0_0_#1A1A2E] transition disabled:opacity-50 active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E]"
                    >
                      {submitting ? "Submitting…" : "Submit Complaint"}
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => setShowForm(false)}
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 1 }}
                      className="rounded-xl border-2 border-flamingo-dark bg-white px-4 py-2.5 text-sm font-bold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E] transition active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E]"
                    >
                      Cancel
                    </motion.button>
                  </div>

                  <p className="mt-3 text-[10px] text-flamingo-dark/40">
                    Under the FSCA Conduct Standard, we will acknowledge your complaint within
                    1 business day and provide a resolution within 15 business days.
                  </p>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Complaints list */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-flamingo-pink border-t-transparent" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-flamingo-dark/20 py-12 text-center">
            <p className="text-sm font-semibold text-flamingo-dark/50">
              No complaints yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map(c => {
              const isExpanded = expandedId === c.id;
              return (
                <motion.div
                  key={c.id}
                  layout
                  className={
                    "rounded-2xl border-2 bg-white overflow-hidden shadow-[0_3px_0_0_#1A1A2E] " +
                    (c.slaBreach ? "border-red-400" : "border-flamingo-dark")
                  }
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${STATUS_COLORS[c.status] || ""}`}>
                          {STATUS_LABELS[c.status] || c.status}
                        </span>
                        {c.slaBreach && (
                          <span className="rounded-lg bg-red-100 px-2 py-0.5 text-[10px] font-extrabold text-red-600">
                            SLA BREACH
                          </span>
                        )}
                        <span className="text-[10px] text-flamingo-dark/40 font-mono ml-auto">
                          {c.id}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-flamingo-dark truncate">
                        {c.subject}
                      </p>
                      <p className="text-xs text-flamingo-dark/50 mt-0.5">
                        {CATEGORIES.find(cat => cat.value === c.category)?.label} · {new Date(c.createdAt).toLocaleDateString("en-ZA")}
                      </p>
                    </div>
                    <svg
                      className={`h-4 w-4 shrink-0 text-flamingo-dark/40 transition ${isExpanded ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t-2 border-flamingo-dark/10"
                      >
                        <div className="p-4 space-y-3">
                          <div className="rounded-xl bg-flamingo-cream p-3">
                            <p className="text-xs font-bold text-flamingo-dark/50 mb-1">Description</p>
                            <p className="text-sm text-flamingo-dark">{c.description}</p>
                          </div>

                          {c.handler && (
                            <p className="text-xs text-flamingo-dark/60">
                              <span className="font-bold">Assigned to:</span> {c.handler}
                            </p>
                          )}

                          {c.outcome !== "pending" && (
                            <div className={`rounded-xl p-3 ${c.outcome === "upheld" ? "bg-green-50" : c.outcome === "partially_upheld" ? "bg-yellow-50" : "bg-red-50"}`}>
                              <p className="text-xs font-bold text-flamingo-dark/60">Outcome</p>
                              <p className="text-sm font-bold text-flamingo-dark capitalize mt-0.5">
                                {c.outcome.replace("_", " ")}
                              </p>
                              {c.outcomeNote && (
                                <p className="text-xs text-flamingo-dark/70 mt-1">{c.outcomeNote}</p>
                              )}
                            </div>
                          )}

                          {/* Timeline */}
                          <div>
                            <p className="text-xs font-bold text-flamingo-dark/50 mb-2">Timeline</p>
                            <div className="space-y-1.5">
                              {c.events.map((ev, i) => (
                                <div key={i} className="flex gap-2 text-xs">
                                  <span className="shrink-0 text-flamingo-dark/40 tabular-nums">
                                    {new Date(ev.timestamp).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" })}
                                  </span>
                                  <span className="font-semibold text-flamingo-dark">{ev.action}</span>
                                  {ev.note && <span className="text-flamingo-dark/50">— {ev.note}</span>}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* SLA info */}
                          {c.slaDeadline && !["resolved", "closed"].includes(c.status) && (
                            <p className={`text-xs font-bold ${c.slaBreach ? "text-red-600" : "text-flamingo-dark/50"}`}>
                              SLA deadline: {new Date(c.slaDeadline).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
                              {c.slaBreach && " — BREACHED"}
                            </p>
                          )}

                          <p className="text-[10px] text-flamingo-dark/40 pt-1">
                            If you are not satisfied with the outcome, you may escalate to the FSCA (www.fsca.co.za),
                            the FAIS Ombud, or the Information Regulator (for POPIA matters).
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Info footer */}
        <div className="mt-8 rounded-2xl border-2 border-dashed border-flamingo-dark/15 bg-white p-4">
          <h3 className="text-xs font-bold text-flamingo-dark/60 mb-2">Your rights</h3>
          <p className="text-[11px] text-flamingo-dark/50 leading-relaxed">
            Under the FSCA Conduct Standard, you have the right to lodge a complaint and receive a
            written acknowledgement within 1 business day, a resolution within 15 business days,
            and to escalate to external bodies if unsatisfied. For POPIA data requests, we respond
            within 30 calendar days.
          </p>
        </div>
      </div>
    </main>
  );
}
