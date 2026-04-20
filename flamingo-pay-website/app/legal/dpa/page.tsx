import type { Metadata } from "next";
import { LegalShell, LegalSection } from "../_components/LegalShell";

export const metadata: Metadata = {
  title: "Data Processing Agreements · Flamingo Pay",
  description:
    "How Flamingo Pay manages third-party data processors under POPIA — Ozow, Upstash, Vercel, VerifyNow/XDS, Sentry, and our contractual safeguards.",
};

const SECTIONS = [
  { id: "intro", label: "1. Introduction" },
  { id: "popia-framework", label: "2. POPIA framework" },
  { id: "processors-overview", label: "3. Processors overview" },
  { id: "ozow", label: "4. Ozow (Payments)" },
  { id: "upstash", label: "5. Upstash (Data storage)" },
  { id: "vercel", label: "6. Vercel (Hosting)" },
  { id: "verifynow", label: "7. VerifyNow / XDS (KYC)" },
  { id: "sentry", label: "8. Sentry (Error monitoring)" },
  { id: "cross-border", label: "9. Cross-border transfers" },
  { id: "safeguards", label: "10. Contractual safeguards" },
  { id: "future-processors", label: "11. Adding new processors" },
  { id: "your-rights", label: "12. Your rights" },
  { id: "dpa-template", label: "13. DPA template" },
  { id: "contact", label: "14. Contact" },
];

export default function DpaPage() {
  return (
    <LegalShell
      eyebrow="POPIA · Data Processing Agreements"
      title="Data Processing Agreements."
      effectiveDate="20 April 2026"
      version="Version 1.0 — April 2026"
      sections={SECTIONS}
    >
      <LegalSection id="intro" number="1" title="Introduction">
        <p>
          Flamingo Pay (Pty) Ltd (&ldquo;Flamingo&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;, &ldquo;our&rdquo;) processes personal information
          on behalf of our merchants and their customers. In the course of
          providing our QR-based payment platform, we engage third-party service
          providers (&ldquo;operators&rdquo; or &ldquo;processors&rdquo;) who
          may access, store, or process personal information on our behalf.
        </p>
        <p>
          Under the Protection of Personal Information Act 4 of 2013
          (&ldquo;POPIA&rdquo;), we are required to ensure that all operators
          processing personal information on our behalf are bound by appropriate
          data processing agreements (&ldquo;DPAs&rdquo;) that guarantee the
          security and confidentiality of personal information.
        </p>
        <p>
          This page provides transparency about who our third-party processors
          are, what data they process, what safeguards are in place, and how we
          manage cross-border data transfers.
        </p>
      </LegalSection>

      <LegalSection id="popia-framework" number="2" title="POPIA Framework for Operators">
        <p>
          POPIA Section 21 requires that when a responsible party (Flamingo)
          engages an operator (third-party processor) to process personal
          information, the operator must:
        </p>
        <ul>
          <li>
            Process personal information only with the knowledge or
            authorisation of the responsible party (Section 21(1))
          </li>
          <li>
            Treat all personal information as confidential and not disclose it
            unless required by law or in the course of properly performing their
            duties (Section 21(1))
          </li>
          <li>
            Be bound by a written contract that establishes the conditions for
            processing, including security measures (Section 21(2))
          </li>
          <li>
            Comply with the security safeguards established by the responsible
            party (Section 19)
          </li>
        </ul>
        <p>
          Additionally, POPIA Section 72 governs the trans-border flow of
          personal information, requiring adequate levels of protection when
          data is transferred outside South Africa.
        </p>
      </LegalSection>

      <LegalSection id="processors-overview" number="3" title="Processors Overview">
        <p>
          The following table summarises the third-party processors engaged by
          Flamingo Pay, the personal information they process, and where the
          data is stored:
        </p>
        <div className="my-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-flamingo-dark/20">
                <th className="px-3 py-2 text-left text-xs font-extrabold uppercase tracking-wider text-flamingo-dark/70">
                  Processor
                </th>
                <th className="px-3 py-2 text-left text-xs font-extrabold uppercase tracking-wider text-flamingo-dark/70">
                  Purpose
                </th>
                <th className="px-3 py-2 text-left text-xs font-extrabold uppercase tracking-wider text-flamingo-dark/70">
                  Data processed
                </th>
                <th className="px-3 py-2 text-left text-xs font-extrabold uppercase tracking-wider text-flamingo-dark/70">
                  Data location
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-flamingo-dark/10">
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Ozow</td>
                <td className="px-3 py-2 text-flamingo-dark/70">Payment processing (PayShap)</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  Buyer bank details, transaction amounts, payment references
                </td>
                <td className="px-3 py-2 text-flamingo-dark/70">South Africa</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Upstash</td>
                <td className="px-3 py-2 text-flamingo-dark/70">Redis data storage</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  Merchant profiles, KYC records, transaction logs, dispute records
                </td>
                <td className="px-3 py-2 text-flamingo-dark/70">AWS eu-west-1 (Ireland)</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Vercel</td>
                <td className="px-3 py-2 text-flamingo-dark/70">Web hosting &amp; CDN</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  IP addresses, request logs, cookies
                </td>
                <td className="px-3 py-2 text-flamingo-dark/70">Global edge network</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">VerifyNow / XDS</td>
                <td className="px-3 py-2 text-flamingo-dark/70">KYC identity verification</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  Full name, SA ID number, selfie photos, address
                </td>
                <td className="px-3 py-2 text-flamingo-dark/70">South Africa</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Sentry</td>
                <td className="px-3 py-2 text-flamingo-dark/70">Error monitoring &amp; debugging</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  IP addresses, browser info, error stack traces (PII scrubbed)
                </td>
                <td className="px-3 py-2 text-flamingo-dark/70">USA (us-west)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection id="ozow" number="4" title="Ozow — Payment Processing">
        <p>
          <strong>Entity:</strong> Ozow (Pty) Ltd, a registered Payment Service
          Provider regulated by the South African Reserve Bank and the Payments
          Association of South Africa (PASA).
        </p>
        <p>
          <strong>What they do:</strong> Ozow processes all PayShap instant
          payments on our platform. When a buyer scans a merchant&apos;s QR code
          and pays, Ozow facilitates the bank-to-bank transfer via PayShap
          rails.
        </p>
        <p>
          <strong>Personal information processed:</strong>
        </p>
        <ul>
          <li>Buyer bank account details and bank selection</li>
          <li>Transaction amounts and payment references</li>
          <li>Payment status and settlement information</li>
          <li>Buyer IP address (for fraud detection)</li>
        </ul>
        <p>
          <strong>Data location:</strong> South Africa — Ozow is a South
          African company and stores all payment data within South African
          borders.
        </p>
        <p>
          <strong>Safeguards:</strong> Ozow is PCI-DSS compliant, licensed by
          SARB, and subject to POPIA. Flamingo Pay never receives or stores
          buyer bank account details — these remain solely within Ozow&apos;s
          infrastructure.
        </p>
        <p>
          <strong>Retention:</strong> Payment records are retained for 5 years
          as required by FICA Section 22.
        </p>
      </LegalSection>

      <LegalSection id="upstash" number="5" title="Upstash — Data Storage">
        <p>
          <strong>Entity:</strong> Upstash, Inc., a serverless data platform
          providing managed Redis databases.
        </p>
        <p>
          <strong>What they do:</strong> Upstash provides the primary data
          storage layer for the Flamingo Pay platform. All merchant profiles,
          KYC records, transaction logs, compliance flags, dispute records, and
          DSAR records are stored in Upstash Redis.
        </p>
        <p>
          <strong>Personal information processed:</strong>
        </p>
        <ul>
          <li>Merchant personal details (name, email, phone, SA ID number)</li>
          <li>KYC verification documents and statuses</li>
          <li>Transaction records and payment histories</li>
          <li>Compliance flags and account restrictions</li>
          <li>Dispute records and resolution histories</li>
          <li>Data subject access request records</li>
        </ul>
        <p>
          <strong>Data location:</strong> AWS eu-west-1 (Ireland, EU). This
          constitutes a cross-border transfer of personal information — see{" "}
          <a href="#cross-border" className="text-flamingo-pink-deep underline">
            Section 9
          </a>{" "}
          for details on how this is managed under POPIA Section 72.
        </p>
        <p>
          <strong>Safeguards:</strong> Data is encrypted at rest (AES-256) and
          in transit (TLS 1.2+). Upstash operates under SOC 2 Type II
          compliance. Access is restricted to API key authentication only.
        </p>
        <p>
          <strong>Retention:</strong> Data is retained according to our{" "}
          <a href="/legal/privacy#retention" className="text-flamingo-pink-deep underline">
            retention policy
          </a>
          . Financial records are retained for 5 years per FICA; non-financial
          personal information is deleted upon account closure or DSAR deletion
          request.
        </p>
      </LegalSection>

      <LegalSection id="vercel" number="6" title="Vercel — Web Hosting">
        <p>
          <strong>Entity:</strong> Vercel Inc., a cloud platform for frontend
          deployment and serverless functions.
        </p>
        <p>
          <strong>What they do:</strong> Vercel hosts the Flamingo Pay website
          and API endpoints. All web requests pass through Vercel&apos;s
          infrastructure including their global edge network and serverless
          function execution.
        </p>
        <p>
          <strong>Personal information processed:</strong>
        </p>
        <ul>
          <li>IP addresses of all visitors and API consumers</li>
          <li>HTTP request headers (browser, device, referrer)</li>
          <li>Session cookies and authentication tokens</li>
          <li>Server-side function execution logs (auto-deleted after 30 days)</li>
        </ul>
        <p>
          <strong>Data location:</strong> Global edge network with primary
          compute in the USA. This constitutes a cross-border transfer — see{" "}
          <a href="#cross-border" className="text-flamingo-pink-deep underline">
            Section 9
          </a>.
        </p>
        <p>
          <strong>Safeguards:</strong> Vercel is SOC 2 Type II certified, all
          traffic is encrypted via TLS, and function logs are automatically
          purged after 30 days. No persistent personal information is stored
          on Vercel beyond session tokens and transient logs.
        </p>
      </LegalSection>

      <LegalSection id="verifynow" number="7" title="VerifyNow / XDS — KYC Verification">
        <p>
          <strong>Entity:</strong> XDS (Pty) Ltd, trading as VerifyNow, a South
          African credit bureau and identity verification provider regulated by
          the National Credit Regulator.
        </p>
        <p>
          <strong>What they do:</strong> VerifyNow provides Know Your Customer
          (KYC) identity verification for merchant onboarding. When a merchant
          registers, their identity documents are verified against the
          Department of Home Affairs database.
        </p>
        <p>
          <strong>Personal information processed:</strong>
        </p>
        <ul>
          <li>Full legal name</li>
          <li>South African ID number</li>
          <li>Selfie photographs (for biometric matching)</li>
          <li>Physical address</li>
          <li>Verification status and results</li>
        </ul>
        <p>
          <strong>Data location:</strong> South Africa — VerifyNow is a South
          African company that stores and processes all identity data within
          South African borders.
        </p>
        <p>
          <strong>Safeguards:</strong> XDS is a registered credit bureau under
          the National Credit Act and is subject to the NCR&apos;s data
          protection requirements, POPIA, and FICA. All data transmissions use
          TLS encryption and API key authentication.
        </p>
        <p>
          <strong>Retention:</strong> KYC records are retained for 5 years as
          required by FICA Section 22. Selfie images are deleted once
          verification is complete and only the verification result is retained.
        </p>
      </LegalSection>

      <LegalSection id="sentry" number="8" title="Sentry — Error Monitoring">
        <p>
          <strong>Entity:</strong> Functional Software, Inc., trading as Sentry,
          an application monitoring and error tracking platform.
        </p>
        <p>
          <strong>What they do:</strong> Sentry captures application errors and
          performance data to help us identify and fix bugs. Sentry is
          configured to scrub personally identifiable information before
          transmission.
        </p>
        <p>
          <strong>Personal information processed:</strong>
        </p>
        <ul>
          <li>IP addresses (anonymised by default)</li>
          <li>Browser and device information (user agent strings)</li>
          <li>Error stack traces and breadcrumbs</li>
          <li>Page URLs visited at the time of an error</li>
        </ul>
        <p>
          <strong>Data minimisation:</strong> Sentry is configured with PII
          scrubbing enabled. We use Sentry&apos;s{" "}
          <code className="rounded bg-flamingo-cream px-1.5 py-0.5 text-xs font-bold">
            beforeSend
          </code>{" "}
          hook to strip names, email addresses, phone numbers, ID numbers, and
          financial data from error reports before they are transmitted.
        </p>
        <p>
          <strong>Data location:</strong> USA (us-west region). Because PII is
          scrubbed before transmission, the cross-border risk is minimal.
        </p>
        <p>
          <strong>Retention:</strong> Error events are automatically deleted
          after 90 days.
        </p>
      </LegalSection>

      <LegalSection id="cross-border" number="9" title="Cross-border Data Transfers">
        <p>
          POPIA Section 72 permits the transfer of personal information outside
          South Africa only if one or more of the following conditions are met:
        </p>
        <ul>
          <li>
            The recipient is subject to a law, binding corporate rules, or
            binding agreement that provides an adequate level of protection
            (Section 72(1)(a))
          </li>
          <li>
            The data subject consents to the transfer (Section 72(1)(b))
          </li>
          <li>
            The transfer is necessary for the performance of a contract between
            the data subject and the responsible party (Section 72(1)(c))
          </li>
          <li>
            The transfer is for the benefit of the data subject and it is not
            reasonably practicable to obtain consent (Section 72(1)(d))
          </li>
        </ul>
        <p>
          Flamingo Pay relies on the following bases for cross-border transfers:
        </p>
        <p>
          <strong>Upstash (Ireland/EU):</strong> The European Union provides an
          adequate level of data protection under GDPR, which the Information
          Regulator has recognised as meeting the POPIA adequacy standard.
          Additionally, our DPA with Upstash includes Standard Contractual
          Clauses and data processing terms that meet POPIA Section 21
          requirements.
        </p>
        <p>
          <strong>Vercel (USA):</strong> Our DPA with Vercel includes binding
          contractual commitments to process data in accordance with POPIA
          requirements. Vercel is SOC 2 Type II certified. The transfer is also
          necessary for the performance of the contract — without web hosting,
          the platform cannot operate.
        </p>
        <p>
          <strong>Sentry (USA):</strong> PII is scrubbed before transmission to
          Sentry, meaning no personal information as defined by POPIA is
          transferred. Only anonymised technical data crosses borders.
        </p>
        <p>
          <strong>Ozow &amp; VerifyNow (South Africa):</strong> No cross-border
          transfer — both processors store and process data exclusively within
          South Africa.
        </p>
      </LegalSection>

      <LegalSection id="safeguards" number="10" title="Contractual Safeguards">
        <p>
          All DPAs entered into by Flamingo Pay include the following minimum
          contractual obligations as required by POPIA Section 21:
        </p>
        <ul>
          <li>
            <strong>Purpose limitation:</strong> The operator may only process
            personal information for the specific purposes set out in the
            agreement and may not use it for any other purpose.
          </li>
          <li>
            <strong>Confidentiality:</strong> The operator must treat all
            personal information as confidential and ensure that its employees
            and subcontractors are bound by confidentiality obligations.
          </li>
          <li>
            <strong>Security measures:</strong> The operator must implement
            appropriate technical and organisational measures to protect personal
            information against loss, damage, unauthorised access, or unlawful
            processing (POPIA Section 19).
          </li>
          <li>
            <strong>Breach notification:</strong> The operator must notify
            Flamingo Pay within 72 hours of becoming aware of any data breach
            affecting personal information, enabling us to meet our own
            notification obligations under POPIA Section 22.
          </li>
          <li>
            <strong>Sub-processing:</strong> The operator may not engage
            sub-processors without prior written consent from Flamingo Pay, and
            must ensure sub-processors are bound by equivalent obligations.
          </li>
          <li>
            <strong>Data return and deletion:</strong> Upon termination of the
            agreement, the operator must return or securely delete all personal
            information unless retention is required by law.
          </li>
          <li>
            <strong>Audit rights:</strong> Flamingo Pay retains the right to
            audit the operator&apos;s compliance with the DPA and POPIA.
          </li>
          <li>
            <strong>DSAR cooperation:</strong> The operator must assist Flamingo
            Pay in responding to data subject access and deletion requests
            within the 30-day POPIA deadline.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="future-processors" number="11" title="Adding New Processors">
        <p>
          Before engaging any new third-party processor, Flamingo Pay conducts a
          Data Protection Impact Assessment (DPIA) that evaluates:
        </p>
        <ul>
          <li>The nature and volume of personal information to be processed</li>
          <li>
            The processor&apos;s security certifications and compliance history
          </li>
          <li>
            Whether cross-border transfers are involved and the adequacy of
            protection in the destination country
          </li>
          <li>
            Whether a suitable DPA can be negotiated that meets POPIA Section 21
            requirements
          </li>
        </ul>
        <p>
          This page will be updated whenever a new processor is engaged. We will
          notify existing merchants of material changes to our processor list
          via email.
        </p>
        <p>
          <strong>Planned future processors:</strong>
        </p>
        <ul>
          <li>
            <strong>Peach Payments</strong> — Additional payment gateway
            (South Africa-based, SARB regulated). Will handle card payments
            when introduced.
          </li>
          <li>
            <strong>SendGrid / Postmark</strong> — Transactional email
            delivery. DPA and data minimisation review in progress.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="your-rights" number="12" title="Your Rights">
        <p>
          Under POPIA, you have the right to know who has access to your
          personal information and how it is being processed. Specifically, you
          may:
        </p>
        <ul>
          <li>
            Request a copy of all personal information we hold about you,
            including data shared with our processors —{" "}
            <a href="/dsar" className="text-flamingo-pink-deep underline">
              submit a DSAR
            </a>
          </li>
          <li>
            Request the deletion of your personal information (subject to FICA
            retention requirements) —{" "}
            <a href="/dsar" className="text-flamingo-pink-deep underline">
              submit a deletion request
            </a>
          </li>
          <li>
            Object to the processing of your personal information by any
            specific processor
          </li>
          <li>
            Request details of the safeguards in place for any cross-border
            transfer of your data
          </li>
          <li>
            Lodge a complaint with the{" "}
            <a
              href="https://inforegulator.org.za"
              target="_blank"
              rel="noopener noreferrer"
              className="text-flamingo-pink-deep underline"
            >
              Information Regulator
            </a>{" "}
            if you believe your data is being processed unlawfully
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="dpa-template" number="13" title="DPA Template">
        <p>
          Flamingo Pay uses a standard Data Processing Agreement template for
          all third-party processors. This template is based on POPIA
          requirements and includes all safeguards listed in{" "}
          <a href="#safeguards" className="text-flamingo-pink-deep underline">
            Section 10
          </a>{" "}
          above.
        </p>
        <p>
          If you are a third-party service provider seeking to integrate with
          Flamingo Pay, or a merchant wishing to review our DPA template, you
          may download a copy below:
        </p>
        <div className="my-4 flex justify-center">
          <a
            href="/legal/Flamingo-Pay-DPA-Template.docx"
            download
            className="inline-flex items-center gap-2 rounded-2xl border-2 border-flamingo-dark bg-flamingo-pink px-6 py-3 text-sm font-extrabold text-white shadow-[0_4px_0_0_#1A1A2E] transition hover:bg-flamingo-pink-deep"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download DPA Template (.docx)
          </a>
        </div>
        <p>
          For any questions about our data processing agreements, contact our
          Information Officer at{" "}
          <a
            href="mailto:compliance@flamingopay.co.za"
            className="text-flamingo-pink-deep underline"
          >
            compliance@flamingopay.co.za
          </a>.
        </p>
      </LegalSection>

      <LegalSection id="contact" number="14" title="Contact">
        <p>
          For questions about our data processing arrangements, to request a
          copy of any specific DPA, or to exercise your rights under POPIA,
          contact:
        </p>
        <ul>
          <li>
            <strong>Information Officer:</strong> Shawn Henderson
          </li>
          <li>
            <strong>Compliance Officer:</strong> Siphokazi Gazi
          </li>
          <li>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:compliance@flamingopay.co.za"
              className="text-flamingo-pink-deep underline"
            >
              compliance@flamingopay.co.za
            </a>
          </li>
          <li>
            <strong>Registered address:</strong> A23 10th Ave, Edenburg,
            Rivonia, Sandton, 2091, Gauteng, South Africa
          </li>
          <li>
            <strong>CIPC Registration:</strong> 2026/276925/07
          </li>
        </ul>
        <p>
          You may also contact the{" "}
          <a
            href="https://inforegulator.org.za"
            target="_blank"
            rel="noopener noreferrer"
            className="text-flamingo-pink-deep underline"
          >
            Information Regulator
          </a>{" "}
          directly at{" "}
          <a
            href="mailto:complaints.IR@justice.gov.za"
            className="text-flamingo-pink-deep underline"
          >
            complaints.IR@justice.gov.za
          </a>{" "}
          if you have concerns about how your data is being processed by any of
          our third-party processors.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
