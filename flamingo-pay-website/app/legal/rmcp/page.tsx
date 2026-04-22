import type { Metadata } from "next";
import { LegalShell, LegalSection } from "../_components/LegalShell";
import { BUSINESS_PROFILES, getBusinessProfile } from "../../../lib/business-profiles";
import { CTR_THRESHOLD } from "../../../lib/fica";

export const metadata: Metadata = {
  title: "Risk Management Compliance Programme · Flamingo Pay",
  description:
    "Flamingo Pay's Risk Management Compliance Programme (RMCP) under FICA — transaction monitoring rules, thresholds, CTR/STR filing, and per-merchant-type risk profiles.",
};

const SECTIONS = [
  { id: "intro", label: "1. Introduction" },
  { id: "scope", label: "2. Scope" },
  { id: "governance", label: "3. Governance" },
  { id: "kyc", label: "4. Customer due diligence" },
  { id: "monitoring", label: "5. Transaction monitoring" },
  { id: "str-ctr", label: "6. STR & CTR filing" },
  { id: "records", label: "7. Record keeping" },
  { id: "training", label: "8. Staff training" },
  { id: "review", label: "9. Review cycle" },
  { id: "appendix-d", label: "Appendix D — TM rules" },
  { id: "appendix-d-profiles", label: "Appendix D.1 — Per-type profiles" },
  { id: "contact", label: "Contact" },
];

function fmtZAR(n: number): string {
  return "R " + n.toLocaleString("en-ZA");
}

function fmtHourRange(start: number, end: number): string {
  const s = String(start).padStart(2, "0");
  const e = String(end).padStart(2, "0");
  return `${s}:00–${e}:00`;
}

export default function RmcpPage() {
  const DEFAULT = getBusinessProfile("__not_a_real_type__"); // returns DEFAULT_PROFILE
  const profileEntries = Object.entries(BUSINESS_PROFILES);

  return (
    <LegalShell
      eyebrow="Risk Management Compliance Programme"
      title="RMCP."
      effectiveDate="20 April 2026"
      version="Version 1.0 — April 2026"
      sections={SECTIONS}
      docPath="/legal/rmcp-appendix-d.docx"
    >
      <LegalSection id="intro" number="1" title="Introduction">
        <p>
          Flamingo Pay (Pty) Ltd (&ldquo;Flamingo&rdquo;) maintains this Risk
          Management Compliance Programme (&ldquo;RMCP&rdquo;) under section 42
          of the Financial Intelligence Centre Act 38 of 2001 (&ldquo;FICA&rdquo;)
          and Directive 6 of 2023 issued by the Financial Intelligence Centre
          (&ldquo;FIC&rdquo;).
        </p>
        <p>
          The RMCP documents how Flamingo identifies, assesses, and mitigates
          money-laundering, terrorist-financing, and proliferation-financing
          risks across its QR payment platform for the South African informal
          economy. This page is the authoritative, versioned summary that
          examiners and banking partners should read alongside the full RMCP
          policy document.
        </p>
      </LegalSection>

      <LegalSection id="scope" number="2" title="Scope of this programme">
        <p>
          This RMCP applies to every transaction processed on the Flamingo
          platform, every merchant onboarded to the platform, and every
          Flamingo officer, employee, or agent involved in the handling of
          customer funds or personal information.
        </p>
        <p>
          Flamingo operates as a technology payment facilitator under Ozow&apos;s
          Payment Clearing House membership and does not itself hold client
          funds. However, Flamingo performs full customer due-diligence, risk
          rating, and transaction monitoring on every merchant and every
          transaction — regardless of whether the downstream settlement is via
          Ozow or another acquirer.
        </p>
      </LegalSection>

      <LegalSection id="governance" number="3" title="Governance">
        <p>
          The RMCP is approved and reviewed by the Flamingo Board. The
          Accountable Officer responsible for FICA compliance is the Managing
          Director. The Compliance Officer (Information Officer for POPIA
          purposes) reports directly to the Managing Director and has
          unrestricted access to systems, records, and staff needed to discharge
          the compliance function.
        </p>
      </LegalSection>

      <LegalSection id="kyc" number="4" title="Customer due diligence">
        <p>
          Every merchant is onboarded with identity verification (SA ID bio-IQ
          match), business verification (CIPC for registered entities, trading
          confirmation for sole proprietors), bank-account verification (AVS),
          and sanctions screening against the UN Consolidated List, the SA
          Targeted Financial Sanctions List, and politically exposed person
          (PEP) lists.
        </p>
        <p>
          Each merchant is assigned a risk rating (low / medium / high) using
          the factors in Directive 6. High-risk merchants (cash-intensive
          businesses, non-face-to-face onboarding, adverse media) undergo
          Enhanced Due Diligence including source-of-funds declaration and
          ongoing monthly review.
        </p>
      </LegalSection>

      <LegalSection id="monitoring" number="5" title="Transaction monitoring">
        <p>
          Transaction monitoring runs synchronously on every incoming
          transaction and asynchronously across each merchant&apos;s rolling
          history. Rules are parameterised per merchant type (see Appendix D
          below) because a taxi-rank spaza and a professional service provider
          have categorically different normal-behaviour envelopes; applying a
          single global threshold to both would either miss real suspicious
          activity at the service provider or flood the queue with false
          positives from the spaza.
        </p>
        <p>
          Flagged transactions are queued in the compliance dashboard, reviewed
          by a human Compliance Officer within one business day, and either
          cleared, escalated to EDD, or filed as an STR to the FIC as
          appropriate.
        </p>
      </LegalSection>

      <LegalSection id="str-ctr" number="6" title="STR &amp; CTR filing">
        <p>
          <strong>Cash Threshold Reports (s28):</strong> any single transaction
          of {fmtZAR(CTR_THRESHOLD)} or more generates a CTR automatically and is
          filed with the FIC via goAML XML upload within two business days.
        </p>
        <p>
          <strong>Suspicious Transaction Reports (s29):</strong> when the
          Compliance Officer concludes that a transaction or pattern is
          suspicious, an STR is filed with the FIC via goAML XML upload within
          fifteen working days of the suspicion arising. Tipping off is
          prohibited.
        </p>
      </LegalSection>

      <LegalSection id="records" number="7" title="Record keeping">
        <p>
          All KYC records, transaction records, risk assessments, and
          STR/CTR filings are retained for five years (1,827 days) from the date
          the business relationship ends or the transaction is concluded, per
          FICA s42.
        </p>
      </LegalSection>

      <LegalSection id="training" number="8" title="Staff training">
        <p>
          All staff complete FICA and POPIA training at onboarding and annually
          thereafter. The Compliance Officer maintains a training register and
          attendance records as part of the FICA file.
        </p>
      </LegalSection>

      <LegalSection id="review" number="9" title="Review cycle">
        <p>
          This RMCP is reviewed at least annually, or sooner if there is a
          material change in Flamingo&apos;s products, risk profile, or
          applicable law. Changes are logged in the version history at the top
          of this document and in the internal policy register.
        </p>
      </LegalSection>

      <LegalSection id="appendix-d" number="D" title="Appendix D — Transaction monitoring rules">
        <p>
          The following rules are implemented in the platform&apos;s
          rules engine (<code>lib/store.ts &gt; rulesForMerchant()</code>) and
          evaluated on every transaction. Thresholds marked &ldquo;per
          profile&rdquo; are read from{" "}
          <code>lib/business-profiles.ts</code> — the per-type values are
          tabulated in Appendix D.1.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-flamingo-dark bg-flamingo-butter text-left">
                <th className="px-3 py-2">Rule ID</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Trigger</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-flamingo-dark/20">
                <td className="px-3 py-2 font-mono">TM-01</td>
                <td className="px-3 py-2 font-semibold">High amount</td>
                <td className="px-3 py-2">
                  Single transaction ≥ merchant profile&apos;s
                  {" "}<em>highAmountThreshold</em> (baseline{" "}
                  {fmtZAR(DEFAULT.highAmountThreshold)}).
                </td>
              </tr>
              <tr className="border-b border-flamingo-dark/20">
                <td className="px-3 py-2 font-mono">TM-02</td>
                <td className="px-3 py-2 font-semibold">Velocity</td>
                <td className="px-3 py-2">
                  More than profile&apos;s <em>velocityMax</em> transactions in
                  {" "}{DEFAULT.velocityWindowMinutes}-minute sliding window
                  (baseline {DEFAULT.velocityMax} txns).
                </td>
              </tr>
              <tr className="border-b border-flamingo-dark/20">
                <td className="px-3 py-2 font-mono">TM-03</td>
                <td className="px-3 py-2 font-semibold">Anomaly</td>
                <td className="px-3 py-2">
                  Single transaction ≥ profile&apos;s{" "}
                  <em>anomalyMultiplier</em>× merchant&apos;s rolling average
                  (baseline {DEFAULT.anomalyMultiplier}×).
                </td>
              </tr>
              <tr className="border-b border-flamingo-dark/20">
                <td className="px-3 py-2 font-mono">TM-04</td>
                <td className="px-3 py-2 font-semibold">Structuring</td>
                <td className="px-3 py-2">
                  Multiple transactions just below {fmtZAR(CTR_THRESHOLD)} (CTR
                  threshold) within 24 hours. Detected by STR pattern engine.
                </td>
              </tr>
              <tr className="border-b border-flamingo-dark/20">
                <td className="px-3 py-2 font-mono">TM-05</td>
                <td className="px-3 py-2 font-semibold">CTR threshold</td>
                <td className="px-3 py-2">
                  Single transaction ≥ {fmtZAR(CTR_THRESHOLD)} — auto-generates
                  CTR (FICA s28).
                </td>
              </tr>
              <tr className="border-b border-flamingo-dark/20">
                <td className="px-3 py-2 font-mono">TM-06</td>
                <td className="px-3 py-2 font-semibold">Unusual hours</td>
                <td className="px-3 py-2">
                  Transaction timestamp falls within profile&apos;s off-hours
                  window (baseline{" "}
                  {fmtHourRange(DEFAULT.unusualHourStart, DEFAULT.unusualHourEnd)}).
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">TM-07</td>
                <td className="px-3 py-2 font-semibold">Manual</td>
                <td className="px-3 py-2">
                  Compliance Officer manually flags any transaction for review.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection id="appendix-d-profiles" number="D.1" title="Appendix D.1 — Per-merchant-type profiles">
        <p>
          Flamingo&apos;s merchant base ranges from taxi-rank spazas with
          dozens of small transactions per hour to professional service
          providers with one large invoice per week. A single global threshold
          would either miss fraud at the low-volume end or drown the compliance
          queue in false positives at the high-volume end. The table below
          shows the parameters applied to each business type; merchants not
          matching a listed type use the <strong>DEFAULT baseline</strong>.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-flamingo-dark bg-flamingo-butter text-left">
                <th className="px-2 py-2">Business type</th>
                <th className="px-2 py-2">High amount</th>
                <th className="px-2 py-2">Velocity (max / window)</th>
                <th className="px-2 py-2">Unusual hours</th>
                <th className="px-2 py-2">Anomaly ×</th>
              </tr>
            </thead>
            <tbody>
              {profileEntries.map(([type, p]) => (
                <tr key={type} className="border-b border-flamingo-dark/20">
                  <td className="px-2 py-2 font-semibold">{type}</td>
                  <td className="px-2 py-2 font-mono">{fmtZAR(p.highAmountThreshold)}</td>
                  <td className="px-2 py-2 font-mono">
                    {p.velocityMax} / {p.velocityWindowMinutes} min
                  </td>
                  <td className="px-2 py-2 font-mono">
                    {fmtHourRange(p.unusualHourStart, p.unusualHourEnd)}
                  </td>
                  <td className="px-2 py-2 font-mono">{p.anomalyMultiplier}×</td>
                </tr>
              ))}
              <tr className="border-b-2 border-flamingo-dark bg-flamingo-pink-wash">
                <td className="px-2 py-2 font-extrabold">DEFAULT (Other)</td>
                <td className="px-2 py-2 font-mono font-bold">{fmtZAR(DEFAULT.highAmountThreshold)}</td>
                <td className="px-2 py-2 font-mono font-bold">
                  {DEFAULT.velocityMax} / {DEFAULT.velocityWindowMinutes} min
                </td>
                <td className="px-2 py-2 font-mono font-bold">
                  {fmtHourRange(DEFAULT.unusualHourStart, DEFAULT.unusualHourEnd)}
                </td>
                <td className="px-2 py-2 font-mono font-bold">{DEFAULT.anomalyMultiplier}×</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-flamingo-dark/70">
          This table is rendered at request time from{" "}
          <code>lib/business-profiles.ts</code>; any change to a profile
          threshold is reflected here on the next deploy. The policy document
          and the live rules engine therefore cannot drift.
        </p>
      </LegalSection>

      <LegalSection id="contact" number="✉" title="Contact">
        <p>
          <strong>Compliance Officer</strong>
          <br />
          Flamingo Pay (Pty) Ltd
          <br />
          Reg No: 2026/276925/07
          <br />
          A23, 10th Ave, Edenburg, Rivonia, Sandton, 2091
          <br />
          Phone: <a href="tel:+27639477208" className="text-flamingo-pink-deep underline">063 947 7208</a>
          <br />
          Email:{" "}
          <a href="mailto:compliance@flamingopay.co.za" className="text-flamingo-pink-deep underline">
            compliance@flamingopay.co.za
          </a>
        </p>
      </LegalSection>
    </LegalShell>
  );
}
