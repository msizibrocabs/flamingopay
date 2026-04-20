import type { Metadata } from "next";
import { LegalShell, LegalSection } from "../_components/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy · Flamingo Pay",
  description:
    "How Flamingo Pay collects, uses, stores, shares, and protects your personal information under POPIA, FICA, and ECTA.",
};

const SECTIONS = [
  { id: "intro", label: "1. Introduction" },
  { id: "responsible", label: "2. Responsible Party" },
  { id: "collect", label: "3. What we collect" },
  { id: "use", label: "4. How we use it" },
  { id: "sharing", label: "5. Sharing" },
  { id: "transfers", label: "6. Cross-border" },
  { id: "retention", label: "7. Retention" },
  { id: "security", label: "8. Security" },
  { id: "rights", label: "9. Your rights" },
  { id: "marketing", label: "10. Direct marketing" },
  { id: "cookies", label: "11. Cookies & analytics" },
  { id: "children", label: "12. Children" },
  { id: "breach", label: "13. Breach notification" },
  { id: "changes", label: "14. Changes" },
  { id: "contact", label: "15. Contact" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalShell
      eyebrow="POPIA · FICA · ECTA compliant"
      title="Privacy Policy."
      effectiveDate="2 April 2026"
      version="Version 1.0 — April 2026"
      sections={SECTIONS}
    >
      <LegalSection id="intro" number="1" title="Introduction">
        <p>
          Flamingo Pay (Pty) Ltd (&ldquo;Flamingo&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting the
          privacy and personal information of our merchants, their customers,
          and all users of our platform.
        </p>
        <p>
          This Privacy Policy explains how we collect, use, store, share, and
          protect your personal information in compliance with the Protection
          of Personal Information Act 4 of 2013 (POPIA), the Financial
          Intelligence Centre Act 38 of 2001 (FICA), and the Electronic
          Communications and Transactions Act 25 of 2002 (ECTA).
        </p>
        <p>
          By registering for a Flamingo merchant account or using our
          platform, you acknowledge that you have read and understood this
          Privacy Policy and consent to the processing of your personal
          information as described herein.
        </p>
      </LegalSection>

      <LegalSection
        id="responsible"
        number="2"
        title="Responsible Party and Information Officer"
      >
        <p>
          The responsible party for the processing of your personal
          information is <strong>Flamingo Pay (Pty) Ltd</strong>, Registration
          Number 2026/276925/07, A23 10th Ave, Edenburg, Rivonia, Sandton,
          2091, Gauteng, South Africa.
        </p>
        <p>
          Our designated Information Officer is <strong>Shawn Henderson</strong>
          , and our Compliance Officer is <strong>Siphokazi Gazi</strong>, reachable at{" "}
          <a
            className="text-flamingo-pink-deep underline"
            href="mailto:compliance@flamingopay.co.za"
          >
            compliance@flamingopay.co.za
          </a>
          .
        </p>
        <p>
          The Information Officer is responsible for ensuring compliance with
          POPIA, responding to data subject requests, and liaising with the
          Information Regulator.
        </p>
      </LegalSection>

      <LegalSection id="collect" number="3" title="Personal information we collect">
        <p>We collect and process the following categories of personal information:</p>
        <div className="overflow-hidden rounded-2xl border-2 border-flamingo-dark">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-flamingo-cream">
                <th className="p-3 text-left font-extrabold uppercase tracking-wider text-[10px] text-flamingo-dark/70">
                  Category
                </th>
                <th className="p-3 text-left font-extrabold uppercase tracking-wider text-[10px] text-flamingo-dark/70">
                  Examples
                </th>
                <th className="p-3 text-left font-extrabold uppercase tracking-wider text-[10px] text-flamingo-dark/70">
                  Purpose
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-flamingo-cream text-flamingo-dark/80">
              <tr>
                <td className="p-3 font-semibold">Identity</td>
                <td className="p-3">Full name, ID number, selfie photograph</td>
                <td className="p-3">FICA KYC verification, account creation</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Contact</td>
                <td className="p-3">Phone, email, physical address</td>
                <td className="p-3">Communication, support, address verification</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Financial</td>
                <td className="p-3">Bank account details, transaction history, settlement records</td>
                <td className="p-3">Payment processing, settlement, fee calculation</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Technical</td>
                <td className="p-3">Device type, OS version, IP address, app version</td>
                <td className="p-3">Platform functionality, security, troubleshooting</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Location</td>
                <td className="p-3">GPS coordinates (when permitted)</td>
                <td className="p-3">Service delivery, fraud prevention</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Usage</td>
                <td className="p-3">Login times, feature usage, transaction patterns</td>
                <td className="p-3">Service improvement, analytics, risk monitoring</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          We collect personal information directly from you (during
          registration and use of the platform), from third parties (identity
          verification services, credit bureaus, sanctions lists), and
          automatically through your use of the app and platform.
        </p>
      </LegalSection>

      <LegalSection id="use" number="4" title="How we use your personal information">
        <p>We process your personal information for these lawful purposes under POPIA:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Contract performance (Section 11(1)(b)):</strong> to
            provide the Flamingo payment service, process transactions, and
            settle funds to your bank account.
          </li>
          <li>
            <strong>Legal obligation (Section 11(1)(c)):</strong> to comply
            with FICA KYC/AML requirements, tax obligations, and regulatory
            reporting (including suspicious transaction reporting to the
            FIC).
          </li>
          <li>
            <strong>Legitimate interest (Section 11(1)(f)):</strong> to
            prevent fraud, monitor risk, improve our services, and conduct
            analytics.
          </li>
          <li>
            <strong>Consent (Section 11(1)(a)):</strong> for marketing
            communications and optional features. You may withdraw consent at
            any time.
          </li>
        </ul>
        <p>
          We will not process your personal information for purposes
          incompatible with those listed above without your additional
          consent.
        </p>
      </LegalSection>

      <LegalSection id="sharing" number="5" title="Sharing of personal information">
        <p>We may share your personal information with:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Banking and payment partners:</strong> our acquiring bank
            and PayShap/BankservAfrica, to process transactions and settle
            funds.
          </li>
          <li>
            <strong>Identity verification providers:</strong> third-party
            services used to verify your identity, address, and sanctions
            screening.
          </li>
          <li>
            <strong>Regulatory authorities:</strong> the FIC, SARS, and the
            Information Regulator, as required by law.
          </li>
          <li>
            <strong>Service providers:</strong> cloud hosting (AWS Cape Town),
            analytics, customer support tools, and communication services,
            all bound by data processing agreements.
          </li>
          <li>
            <strong>Professional advisors:</strong> auditors, legal advisors,
            and accountants, under professional confidentiality obligations.
          </li>
        </ul>
        <div className="rounded-xl border-2 border-flamingo-dark bg-flamingo-pink-wash p-4">
          <p className="font-extrabold text-flamingo-dark">
            We will never sell your personal information to third parties.
          </p>
        </div>
        <p>
          We will not share your personal information with any party not
          listed above without your explicit consent, except where required
          by law or court order.
        </p>
      </LegalSection>

      <LegalSection id="transfers" number="6" title="Cross-border transfers">
        <p>
          All personal information is stored on servers located within the
          Republic of South Africa (AWS Africa Cape Town region). We do not
          transfer personal information outside of South Africa as a matter
          of standard practice.
        </p>
        <p>
          In the unlikely event that a cross-border transfer becomes necessary
          (for example, to comply with international regulatory requirements),
          we will ensure adequate safeguards as required by Section 72 of
          POPIA — including confirming the recipient country has adequate
          data protection laws or obtaining your explicit consent.
        </p>
      </LegalSection>

      <LegalSection id="retention" number="7" title="Data retention">
        <p>We retain your personal information for the following periods:</p>
        <div className="overflow-hidden rounded-2xl border-2 border-flamingo-dark">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-flamingo-cream">
                <th className="p-3 text-left font-extrabold uppercase tracking-wider text-[10px] text-flamingo-dark/70">
                  Data
                </th>
                <th className="p-3 text-left font-extrabold uppercase tracking-wider text-[10px] text-flamingo-dark/70">
                  Period
                </th>
                <th className="p-3 text-left font-extrabold uppercase tracking-wider text-[10px] text-flamingo-dark/70">
                  Legal basis
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-flamingo-cream text-flamingo-dark/80">
              <tr>
                <td className="p-3 font-semibold">KYC/Identity records</td>
                <td className="p-3">5 years after account closure</td>
                <td className="p-3">FICA Section 22</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Transaction records</td>
                <td className="p-3">5 years after the transaction</td>
                <td className="p-3">FICA Section 22, Tax Administration Act</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Financial/tax records</td>
                <td className="p-3">5 years (or as required by SARS)</td>
                <td className="p-3">Tax Administration Act, Companies Act</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Marketing preferences</td>
                <td className="p-3">Until consent is withdrawn</td>
                <td className="p-3">POPIA Section 11(1)(a)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Technical/usage logs</td>
                <td className="p-3">12 months</td>
                <td className="p-3">Legitimate interest</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          After the applicable retention period, personal information will be
          permanently and securely deleted or de-identified so it can no
          longer be linked to you.
        </p>
      </LegalSection>

      <LegalSection id="security" number="8" title="Security measures">
        <p>
          We implement appropriate technical and organisational measures to
          protect your personal information against unauthorised access,
          loss, destruction, or alteration, including:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Encryption of data in transit (TLS 1.2+) and at rest (AES-256);</li>
          <li>Access controls and role-based permissions for all staff accessing personal information;</li>
          <li>Regular security assessments and penetration testing;</li>
          <li>Secure coding practices and code review processes;</li>
          <li>Staff training on data protection and information security;</li>
          <li>Incident response and breach notification procedures; and</li>
          <li>Physical security of server infrastructure (AWS managed).</li>
        </ul>
        <p>
          While we take all reasonable steps to protect your information, no
          system is completely secure. We cannot guarantee absolute security
          of data transmitted over the internet or stored electronically.
        </p>
      </LegalSection>

      <LegalSection id="rights" number="9" title="Your rights under POPIA">
        <p>As a data subject, you have the following rights:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Right to access (Section 23):</strong> request confirmation
            of whether we hold your personal information and request a copy.
          </li>
          <li>
            <strong>Right to correction (Section 24):</strong> request
            correction or deletion of inaccurate, irrelevant, excessive,
            out-of-date, incomplete, or misleading personal information.
          </li>
          <li>
            <strong>Right to deletion (Section 24):</strong> request deletion
            of your personal information where we no longer have a lawful
            basis for processing it, subject to legal retention requirements.
          </li>
          <li>
            <strong>Right to object (Section 11(3)):</strong> object to the
            processing of your personal information on reasonable grounds
            relating to your particular situation.
          </li>
          <li>
            <strong>Right to withdraw consent:</strong> where processing is
            based on consent, withdraw at any time. Withdrawal does not
            affect the lawfulness of processing before withdrawal.
          </li>
          <li>
            <strong>Right to complain (Section 74):</strong> lodge a complaint
            with the Information Regulator if you believe your rights have
            been infringed.
          </li>
        </ul>
        <p>
          To exercise any of these rights, contact our Information Officer at{" "}
          <a
            className="text-flamingo-pink-deep underline"
            href="mailto:compliance@flamingopay.co.za"
          >
            compliance@flamingopay.co.za
          </a>
          . We will respond within 30 days. We may charge a reasonable fee for
          access requests as permitted under POPIA, and will inform you of any
          applicable fee before processing your request.
        </p>
      </LegalSection>

      <LegalSection id="marketing" number="10" title="Direct marketing">
        <p>
          We will only send you direct marketing communications (promotions,
          product updates, partner offers) with your explicit opt-in consent.
        </p>
        <p>
          You may opt out of marketing communications at any time by: using
          the unsubscribe link in any marketing email, toggling marketing
          preferences in the Flamingo app, or contacting us at{" "}
          <a
            className="text-flamingo-pink-deep underline"
            href="mailto:support@flamingopay.co.za"
          >
            support@flamingopay.co.za
          </a>
          .
        </p>
        <p>
          Opting out of marketing does not affect transactional communications
          (payment confirmations, settlement notifications, security alerts,
          regulatory notices), which are essential to the service.
        </p>
      </LegalSection>

      <LegalSection id="cookies" number="11" title="Cookies and analytics">
        <p>
          The Flamingo web dashboard may use cookies and similar technologies
          to improve functionality, remember preferences, and analyse usage
          patterns. Analytics data is aggregated and de-identified where
          possible. You can manage cookie preferences through your browser
          settings; disabling cookies may affect the functionality of the web
          dashboard.
        </p>
      </LegalSection>

      <LegalSection id="children" number="12" title="Children’s information">
        <p>
          The Flamingo platform is not intended for use by persons under the
          age of 18. We do not knowingly collect personal information from
          children. If we become aware that we have collected personal
          information from a person under 18, we will take steps to delete
          that information promptly.
        </p>
      </LegalSection>

      <LegalSection id="breach" number="13" title="Data breach notification">
        <p>
          In the event of a data breach that compromises your personal
          information and poses a risk of harm, Flamingo will notify the
          Information Regulator as soon as reasonably possible in accordance
          with Section 22 of POPIA, notify affected data subjects with details
          of the breach and mitigation steps, and take all reasonable steps
          to contain the breach, investigate the cause, and prevent
          recurrence.
        </p>
      </LegalSection>

      <LegalSection id="changes" number="14" title="Changes to this Privacy Policy">
        <p>
          We may update this Privacy Policy from time to time to reflect
          changes in our practices, technology, legal requirements, or
          regulatory guidance. Material changes will be communicated with at
          least 30 days&rsquo; notice via email, push notification, or in-app
          notice. The latest version will always be available on the Flamingo
          website.
        </p>
      </LegalSection>

      <LegalSection id="contact" number="15" title="Contact us">
        <div className="rounded-2xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]">
          <p className="display text-base font-extrabold text-flamingo-dark">
            Flamingo Pay (Pty) Ltd
          </p>
          <p className="mt-1 text-sm text-flamingo-dark/70">
            Information Officer: Shawn Henderson · Compliance Officer: Siphokazi Gazi
          </p>
          <ul className="mt-3 space-y-1 text-sm text-flamingo-dark/80">
            <li>
              Compliance:{" "}
              <a className="text-flamingo-pink-deep underline" href="mailto:compliance@flamingopay.co.za">
                compliance@flamingopay.co.za
              </a>
            </li>
            <li>
              Support:{" "}
              <a className="text-flamingo-pink-deep underline" href="mailto:support@flamingopay.co.za">
                support@flamingopay.co.za
              </a>
            </li>
            <li>Phone: 063 947 7208</li>
          </ul>
        </div>
        <p className="text-sm">
          You may also contact the Information Regulator (South Africa)
          directly at{" "}
          <a
            className="text-flamingo-pink-deep underline"
            href="mailto:enquiries@inforegulator.org.za"
          >
            enquiries@inforegulator.org.za
          </a>{" "}
          or via{" "}
          <a
            className="text-flamingo-pink-deep underline"
            href="https://www.justice.gov.za/inforeg"
            target="_blank"
            rel="noreferrer"
          >
            www.justice.gov.za/inforeg
          </a>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
