import type { Metadata } from "next";
import { LegalShell, LegalSection } from "../_components/LegalShell";

export const metadata: Metadata = {
  title: "ECT Act Compliance · Flamingo Pay",
  description:
    "How Flamingo Pay complies with the Electronic Communications and Transactions Act 25 of 2002 — e-commerce disclosures, automated transactions, cooling-off, data protection, and consumer rights.",
};

const SECTIONS = [
  { id: "intro", label: "1. Introduction" },
  { id: "applicability", label: "2. Applicability" },
  { id: "website-disclosures", label: "3. Website disclosures (S43)" },
  { id: "data-messages", label: "4. Data messages (S11–S13)" },
  { id: "automated-transactions", label: "5. Automated transactions (S20)" },
  { id: "consumer-protection", label: "6. Consumer protection (S42–S48)" },
  { id: "cooling-off", label: "7. Cooling-off period (S44)" },
  { id: "payments", label: "8. Payments & receipts (S43(3))" },
  { id: "records", label: "9. Record retention (S14–S16)" },
  { id: "information-security", label: "10. Information security" },
  { id: "cryptography", label: "11. Cryptography (S29–S34)" },
  { id: "unsolicited", label: "12. Unsolicited communications (S45)" },
  { id: "complaints", label: "13. Complaints & disputes" },
  { id: "contact", label: "14. Contact" },
];

export default function EctaPage() {
  return (
    <LegalShell
      eyebrow="Electronic Communications & Transactions Act 25 of 2002"
      title="ECT Act Compliance."
      effectiveDate="20 April 2026"
      version="Version 1.0 — April 2026"
      sections={SECTIONS}
    >
      <LegalSection id="intro" number="1" title="Introduction">
        <p>
          Flamingo Pay (Pty) Ltd (&ldquo;Flamingo&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates an electronic payment
          platform that facilitates QR-based payments between merchants and
          buyers using PayShap instant payments through Ozow.
        </p>
        <p>
          As a provider of electronic transactions and services, we are subject
          to the Electronic Communications and Transactions Act 25 of 2002
          (&ldquo;ECT Act&rdquo; or &ldquo;ECTA&rdquo;). This page explains
          how we comply with our obligations under the ECT Act and sets out the
          information we are required to disclose to you.
        </p>
        <p>
          The ECT Act establishes the legal framework for electronic
          communications and transactions in South Africa, including the
          validity of electronic agreements, consumer protection in e-commerce,
          data protection requirements, and the legal recognition of data
          messages and electronic signatures.
        </p>
      </LegalSection>

      <LegalSection id="applicability" number="2" title="Applicability">
        <p>
          The ECT Act applies to Flamingo Pay because we:
        </p>
        <ul>
          <li>
            Provide an electronic platform for commercial transactions between
            merchants and buyers (Chapter VII — Consumer Protection)
          </li>
          <li>
            Facilitate automated electronic payment transactions via QR codes
            and the PayShap network (Part 2 — Automated Transactions)
          </li>
          <li>
            Generate, send, receive, and store data messages including payment
            confirmations, receipts, and transaction records (Chapter III —
            Facilitation of Electronic Transactions)
          </li>
          <li>
            Collect, process, and store personal information electronically
            (Chapter VIII — Protection of Personal Information)
          </li>
          <li>
            Operate a website that offers goods and services to persons within
            the Republic of South Africa (Section 42)
          </li>
        </ul>
        <p>
          The ECT Act works alongside POPIA, FICA, and the Consumer Protection
          Act. Where these laws overlap, we comply with all applicable
          requirements. Our{" "}
          <a href="/legal/privacy" className="text-flamingo-pink-deep underline">
            Privacy Policy
          </a>
          ,{" "}
          <a href="/legal/terms" className="text-flamingo-pink-deep underline">
            Merchant Terms
          </a>
          ,{" "}
          <a href="/legal/cpa" className="text-flamingo-pink-deep underline">
            CPA page
          </a>
          , and{" "}
          <a href="/legal/dpa" className="text-flamingo-pink-deep underline">
            Data Processing Agreements
          </a>{" "}
          provide further detail on our compliance with these related laws.
        </p>
      </LegalSection>

      <LegalSection id="website-disclosures" number="3" title="Website Disclosures (Section 43)">
        <p>
          Section 43(1) of the ECT Act requires any person offering goods or
          services for sale, hire, or exchange by way of an electronic
          transaction to make certain information readily available on their
          website. In compliance with this requirement, we disclose the
          following:
        </p>
        <div className="my-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-flamingo-dark/20">
                <th className="px-3 py-2 text-left text-xs font-extrabold uppercase tracking-wider text-flamingo-dark/70">
                  Requirement (Section 43)
                </th>
                <th className="px-3 py-2 text-left text-xs font-extrabold uppercase tracking-wider text-flamingo-dark/70">
                  Flamingo Pay Disclosure
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-flamingo-dark/10">
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Full name and legal status (S43(1)(a))</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  Flamingo Pay (Pty) Ltd — a private company incorporated under the Companies Act 71 of 2008
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Physical address (S43(1)(b))</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  A23 10th Ave, Edenburg, Rivonia, Sandton, 2091, Gauteng, South Africa
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Telephone number (S43(1)(c))</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  063 947 7208
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Website address (S43(1)(d))</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  <a href="https://www.flamingopay.co.za" className="text-flamingo-pink-deep underline">
                    www.flamingopay.co.za
                  </a>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Email address (S43(1)(e))</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  <a href="mailto:info@flamingopay.co.za" className="text-flamingo-pink-deep underline">
                    info@flamingopay.co.za
                  </a>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Registration number (S43(1)(f))</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  CIPC Registration: 2026/276925/07
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Membership of self-regulatory bodies (S43(1)(g))</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  Payments facilitated through Ozow, a PASA-regulated Payment Service Provider licensed by the South African Reserve Bank
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Codes of conduct (S43(1)(h))</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  Subject to POPIA, FICA, CPA, and the National Payment System Act. See our{" "}
                  <a href="/legal/terms" className="text-flamingo-pink-deep underline">Merchant Terms</a>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Information Officer (S43(1)(i))</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  Shawn Henderson — <a href="mailto:compliance@flamingopay.co.za" className="text-flamingo-pink-deep underline">compliance@flamingopay.co.za</a>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Description of services (S43(1)(j))</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  QR-based instant payment platform enabling informal merchants (spaza shops, street vendors, market traders) to accept bank payments via PayShap. Service fee: 2.9% + R0.99 per transaction.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Price of services (S43(2))</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  All fees are displayed inclusive of VAT. Transaction fee: 2.9% + R0.99. No monthly or setup fees. Full pricing on{" "}
                  <a href="/#pricing" className="text-flamingo-pink-deep underline">our homepage</a>.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Payment methods (S43(3))</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  PayShap instant EFT via Ozow. Buyer scans merchant QR code and pays from any participating South African bank.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Return and refund policy (S43(4))</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  See our{" "}
                  <a href="/legal/cpa#refunds" className="text-flamingo-pink-deep underline">refund policy</a>{" "}
                  and{" "}
                  <a href="/dispute" className="text-flamingo-pink-deep underline">dispute resolution process</a>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Terms and conditions (S43(5))</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  <a href="/legal/terms" className="text-flamingo-pink-deep underline">Merchant Terms of Service</a>{" "}
                  — available in full and must be accepted during registration
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Privacy policy (S43(6))</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  <a href="/legal/privacy" className="text-flamingo-pink-deep underline">Privacy Policy</a>{" "}
                  — POPIA, FICA, and ECTA compliant
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-flamingo-dark">Alternative dispute resolution (S43(7))</td>
                <td className="px-3 py-2 text-flamingo-dark/70">
                  Three-step complaints process detailed in{" "}
                  <a href="/legal/cpa#complaints" className="text-flamingo-pink-deep underline">Section 11 of our CPA page</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection id="data-messages" number="4" title="Data Messages (Sections 11–13)">
        <p>
          The ECT Act recognises the legal validity of data messages —
          information generated, sent, received, or stored by electronic means.
          Flamingo Pay generates several types of data messages in the course of
          its operations:
        </p>
        <ul>
          <li>
            <strong>Payment confirmations:</strong> When a buyer completes a
            payment, both the buyer and merchant receive electronic confirmation
            of the transaction. These data messages constitute valid proof of
            payment under Section 11.
          </li>
          <li>
            <strong>Transaction receipts:</strong> Digital receipts are generated
            for every payment, containing the transaction reference, amount,
            date, merchant name, and payment status. These are available for
            download and are legally equivalent to paper receipts (Section 12).
          </li>
          <li>
            <strong>Merchant notifications:</strong> Real-time notifications of
            incoming payments sent to merchant devices constitute data messages
            acknowledging receipt of payment.
          </li>
          <li>
            <strong>KYC and compliance communications:</strong> Identity
            verification requests, compliance notifications, and account status
            updates sent electronically to merchants.
          </li>
        </ul>
        <p>
          Under Section 13, a data message is regarded as having been received
          when the complete data message enters an information system designated
          or used by the addressee, and is capable of being retrieved. Our
          platform timestamps all data messages and maintains delivery records.
        </p>
      </LegalSection>

      <LegalSection id="automated-transactions" number="5" title="Automated Transactions (Section 20)">
        <p>
          Section 20 of the ECT Act provides that an electronic transaction is
          not without legal force and effect merely because it was conducted by
          means of a data message or because a natural person was not involved
          in the formation of the agreement.
        </p>
        <p>
          Flamingo Pay&apos;s payment process is an automated transaction:
        </p>
        <ul>
          <li>
            A buyer scans a merchant&apos;s QR code, which automatically
            generates a payment request with the correct amount and merchant
            details
          </li>
          <li>
            The buyer confirms payment through their banking app via PayShap
          </li>
          <li>
            Ozow processes the payment automatically and notifies both parties
          </li>
          <li>
            Transaction fees are automatically calculated and deducted
          </li>
          <li>
            Settlement to the merchant is processed automatically
          </li>
        </ul>
        <p>
          In accordance with Section 20(a), we ensure that the buyer has the
          opportunity to review and confirm the transaction amount before
          authorising payment. The buyer must actively confirm the payment in
          their banking app — no payment is processed without explicit buyer
          action.
        </p>
        <p>
          Under Section 20(c), if an error is made during the automated
          transaction, the buyer may use our{" "}
          <a href="/dispute" className="text-flamingo-pink-deep underline">
            dispute resolution process
          </a>{" "}
          to request correction or reversal.
        </p>
      </LegalSection>

      <LegalSection id="consumer-protection" number="6" title="Consumer Protection in E-Commerce (Sections 42–48)">
        <p>
          Chapter VII of the ECT Act provides specific consumer protection
          measures for electronic transactions. As a facilitator of electronic
          payments, Flamingo Pay complies with the following requirements:
        </p>
        <ul>
          <li>
            <strong>Fair and accurate information (Section 42):</strong> All
            information about our services, fees, and terms is presented
            accurately and is not misleading. Pricing is displayed inclusive of
            VAT at all times.
          </li>
          <li>
            <strong>Disclosure requirements (Section 43):</strong> All mandatory
            disclosures are set out in{" "}
            <a href="#website-disclosures" className="text-flamingo-pink-deep underline">
              Section 3
            </a>{" "}
            above.
          </li>
          <li>
            <strong>Right to cancel (Section 44):</strong> Covered in{" "}
            <a href="#cooling-off" className="text-flamingo-pink-deep underline">
              Section 7
            </a>{" "}
            below.
          </li>
          <li>
            <strong>Performance (Section 46):</strong> Payments are processed in
            real-time via PayShap. Settlement to merchants occurs within the
            timeframe specified in our{" "}
            <a href="/legal/terms" className="text-flamingo-pink-deep underline">
              Merchant Terms
            </a>
            .
          </li>
          <li>
            <strong>Applicability to South Africa (Section 47):</strong> Our
            platform is designed for and operates exclusively within South
            Africa. All transactions are denominated in South African Rand (ZAR)
            and processed through South African banking infrastructure.
          </li>
        </ul>
        <p>
          For comprehensive consumer protection information including the
          Consumer Protection Act 68 of 2008, see our{" "}
          <a href="/legal/cpa" className="text-flamingo-pink-deep underline">
            Consumer Protection page
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="cooling-off" number="7" title="Cooling-off Period (Section 44)">
        <p>
          Section 44 of the ECT Act grants consumers the right to cancel an
          electronic transaction without reason and without penalty within 7
          days of receiving the goods or entering into the agreement for
          services.
        </p>
        <p>
          <strong>How this applies to Flamingo Pay:</strong>
        </p>
        <ul>
          <li>
            <strong>Merchant registration:</strong> Merchants who register for a
            Flamingo Pay account may cancel their registration within 7 days of
            account creation. Where no transactions have been processed, the
            account will be closed and all personal information deleted (subject
            to FICA retention requirements for any KYC documents already
            submitted).
          </li>
          <li>
            <strong>Individual payments:</strong> The ECT Act cooling-off period
            applies to the underlying transaction between the buyer and
            merchant. As a payment facilitator, Flamingo Pay supports merchants
            in processing refunds where a buyer exercises their cooling-off
            rights through our{" "}
            <a href="/dispute" className="text-flamingo-pink-deep underline">
              dispute resolution process
            </a>
            .
          </li>
        </ul>
        <p>
          Note: Section 44(3) provides certain exemptions from the cooling-off
          right, including where the goods or services have already been
          consumed or utilised. For in-person purchases at informal merchants
          (the primary use case for Flamingo Pay), the cooling-off period under
          the CPA (Section 16) may be more applicable — see our{" "}
          <a href="/legal/cpa#cooling-off" className="text-flamingo-pink-deep underline">
            CPA cooling-off section
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="payments" number="8" title="Payments and Receipts (Section 43(3))">
        <p>
          Section 43(3) requires that we clearly disclose the manner of payment
          and provide receipts for transactions. Flamingo Pay complies as
          follows:
        </p>
        <ul>
          <li>
            <strong>Payment method:</strong> All payments are processed via
            PayShap instant EFT through Ozow. The buyer scans a QR code and
            pays directly from their bank account — Flamingo Pay does not
            collect, store, or process buyer bank account details.
          </li>
          <li>
            <strong>Transaction confirmation:</strong> Both the buyer and
            merchant receive real-time confirmation when a payment is
            successfully processed. The buyer sees an on-screen confirmation
            with the transaction reference, amount, and merchant details.
          </li>
          <li>
            <strong>Digital receipts:</strong> A digital receipt is generated
            for every transaction, including the transaction reference number,
            date and time, amount paid, merchant name, and payment status. The
            receipt is available for immediate download as a PNG image and
            auto-downloads after payment completion.
          </li>
          <li>
            <strong>Record access:</strong> Merchants can view their full
            transaction history through their dashboard. Buyers can retrieve
            transaction details using their reference number.
          </li>
        </ul>
        <p>
          All prices displayed on the platform are inclusive of VAT (where
          applicable) in accordance with Section 43(2).
        </p>
      </LegalSection>

      <LegalSection id="records" number="9" title="Record Retention (Sections 14–16)">
        <p>
          Sections 14 to 16 of the ECT Act set requirements for the retention
          of information in electronic form. We comply with these requirements
          as follows:
        </p>
        <ul>
          <li>
            <strong>Accessibility (Section 14(1)(a)):</strong> All electronic
            records are stored in a format that allows them to be accessed and
            reproduced in their original form. Transaction records, receipts,
            and account data remain accessible through our platform for the
            duration of the retention period.
          </li>
          <li>
            <strong>Integrity (Section 14(1)(b)):</strong> Records are stored in
            a manner that maintains the integrity of the original information.
            We use Upstash Redis with encryption at rest (AES-256) and in
            transit (TLS 1.2+) to ensure records are not altered after creation.
          </li>
          <li>
            <strong>Origin and destination (Section 14(1)(c)):</strong>{" "}
            Transaction records include the origin (buyer), destination
            (merchant), and timestamp of every data message, enabling
            identification of the parties and the date and time of the
            transaction.
          </li>
        </ul>
        <p>
          Our retention periods are aligned with FICA requirements: financial
          transaction records, KYC documents, and compliance flags are retained
          for 5 years. Non-financial personal information is retained only for
          as long as necessary and can be deleted upon request — see our{" "}
          <a href="/legal/privacy#retention" className="text-flamingo-pink-deep underline">
            retention policy
          </a>{" "}
          and{" "}
          <a href="/dsar" className="text-flamingo-pink-deep underline">
            DSAR process
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="information-security" number="10" title="Information Security">
        <p>
          While the ECT Act&apos;s Chapter VIII on personal information
          protection has been largely superseded by POPIA, we maintain
          comprehensive security measures that satisfy both frameworks:
        </p>
        <ul>
          <li>
            <strong>Encryption:</strong> All data is encrypted at rest (AES-256)
            and in transit (TLS 1.2+). No unencrypted personal information
            traverses the internet.
          </li>
          <li>
            <strong>Access controls:</strong> Platform access is restricted by
            role-based authentication. Compliance portal access requires
            separate credentials. API access is authenticated via secure tokens.
          </li>
          <li>
            <strong>Payment security:</strong> Flamingo Pay does not store buyer
            bank account details. All payment processing is handled by Ozow, a
            PCI-DSS compliant, SARB-licensed Payment Service Provider.
          </li>
          <li>
            <strong>KYC document security:</strong> Identity documents submitted
            for merchant verification are processed through VerifyNow/XDS and
            stored in encrypted form with restricted access.
          </li>
          <li>
            <strong>Breach notification:</strong> In the event of a security
            compromise, we will notify affected parties and the Information
            Regulator as required by POPIA Section 22, within the timeframes
            mandated by law.
          </li>
        </ul>
        <p>
          For full details on our security measures and third-party processor
          safeguards, see our{" "}
          <a href="/legal/privacy#security" className="text-flamingo-pink-deep underline">
            Privacy Policy (Security)
          </a>{" "}
          and{" "}
          <a href="/legal/dpa" className="text-flamingo-pink-deep underline">
            Data Processing Agreements
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="cryptography" number="11" title="Cryptography (Sections 29–34)">
        <p>
          Chapter V of the ECT Act establishes the framework for cryptography
          providers and the use of encryption in South Africa. As it relates to
          Flamingo Pay:
        </p>
        <ul>
          <li>
            <strong>TLS encryption:</strong> All communications between users
            and our platform are secured using TLS (Transport Layer Security)
            certificates issued by trusted certificate authorities. This ensures
            confidentiality and integrity of data in transit.
          </li>
          <li>
            <strong>Data at rest:</strong> Personal information stored in our
            database is encrypted using AES-256, a widely recognised and
            approved encryption standard.
          </li>
          <li>
            <strong>Payment encryption:</strong> Payment data flowing between
            Flamingo Pay and Ozow is encrypted end-to-end. Buyer banking
            credentials never pass through our servers.
          </li>
          <li>
            <strong>Authentication tokens:</strong> Session tokens and
            authentication credentials are generated using cryptographically
            secure random number generators and are stored as secure, HTTP-only
            cookies.
          </li>
        </ul>
        <p>
          Flamingo Pay does not itself act as a cryptography provider as defined
          in Section 29 of the ECT Act. We use standard, commercially available
          cryptographic tools and services provided by our hosting and
          infrastructure partners (Vercel, Upstash, Ozow).
        </p>
      </LegalSection>

      <LegalSection id="unsolicited" number="12" title="Unsolicited Communications (Section 45)">
        <p>
          Section 45 of the ECT Act restricts the sending of unsolicited
          commercial communications (spam). Flamingo Pay complies with this
          section as follows:
        </p>
        <ul>
          <li>
            <strong>No unsolicited marketing:</strong> We do not send unsolicited
            commercial communications. All marketing communications require
            prior opt-in consent.
          </li>
          <li>
            <strong>Transactional messages only:</strong> The communications we
            send to merchants and buyers are transactional in nature — payment
            confirmations, receipts, KYC status updates, compliance
            notifications, and dispute updates. These are not commercial
            communications under Section 45.
          </li>
          <li>
            <strong>Opt-out mechanism:</strong> Should we send any marketing
            communications in future, they will include a clear and functional
            opt-out mechanism as required by Section 45(1). Our{" "}
            <a href="/legal/privacy#marketing" className="text-flamingo-pink-deep underline">
              Privacy Policy
            </a>{" "}
            provides further detail on our direct marketing practices.
          </li>
          <li>
            <strong>Identification:</strong> All electronic communications from
            Flamingo Pay clearly identify us as the sender, in accordance with
            Section 45(3).
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="complaints" number="13" title="Complaints and Disputes">
        <p>
          In accordance with the ECT Act&apos;s consumer protection provisions
          and Section 43(7) on alternative dispute resolution, Flamingo Pay
          offers the following avenues for resolving complaints:
        </p>
        <ul>
          <li>
            <strong>Step 1 — Direct resolution:</strong> Contact us at{" "}
            <a href="mailto:complaints@flamingopay.co.za" className="text-flamingo-pink-deep underline">
              complaints@flamingopay.co.za
            </a>{" "}
            or use our{" "}
            <a href="/dispute" className="text-flamingo-pink-deep underline">
              online dispute form
            </a>
            . We aim to respond within 5 business days.
          </li>
          <li>
            <strong>Step 2 — Compliance escalation:</strong> If not resolved,
            escalate to our Compliance Officer, Siphokazi Gazi, at{" "}
            <a href="mailto:compliance@flamingopay.co.za" className="text-flamingo-pink-deep underline">
              compliance@flamingopay.co.za
            </a>
            .
          </li>
          <li>
            <strong>Step 3 — External bodies:</strong> If still unresolved, you
            may approach the following regulatory bodies:
          </li>
        </ul>
        <div className="ml-6 mt-2 space-y-2">
          <p>
            <strong>National Consumer Commission (NCC):</strong>{" "}
            <a href="https://www.thencc.gov.za" target="_blank" rel="noopener noreferrer" className="text-flamingo-pink-deep underline">
              www.thencc.gov.za
            </a>
          </p>
          <p>
            <strong>Information Regulator</strong> (for data protection
            complaints):{" "}
            <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer" className="text-flamingo-pink-deep underline">
              inforegulator.org.za
            </a>
          </p>
          <p>
            <strong>Payments Association of South Africa (PASA):</strong>{" "}
            <a href="https://www.pasa.org.za" target="_blank" rel="noopener noreferrer" className="text-flamingo-pink-deep underline">
              www.pasa.org.za
            </a>
          </p>
          <p>
            <strong>Cyber Inspectors</strong> (ECT Act Section 80 — for
            reporting cybercrime):{" "}
            <a href="mailto:cybercrime@dtps.gov.za" className="text-flamingo-pink-deep underline">
              cybercrime@dtps.gov.za
            </a>
          </p>
        </div>
        <p className="mt-3">
          For full details on our complaints process, see our{" "}
          <a href="/legal/cpa#complaints" className="text-flamingo-pink-deep underline">
            CPA complaints section
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="contact" number="14" title="Contact">
        <p>
          For questions about our ECT Act compliance, to exercise your consumer
          rights, or to report any concerns about our electronic transactions,
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
            <strong>General enquiries:</strong>{" "}
            <a
              href="mailto:info@flamingopay.co.za"
              className="text-flamingo-pink-deep underline"
            >
              info@flamingopay.co.za
            </a>
          </li>
          <li>
            <strong>Compliance &amp; complaints:</strong>{" "}
            <a
              href="mailto:compliance@flamingopay.co.za"
              className="text-flamingo-pink-deep underline"
            >
              compliance@flamingopay.co.za
            </a>
          </li>
          <li>
            <strong>Phone:</strong>{" "}
            <a href="tel:+27639477208" className="text-flamingo-pink-deep underline">
              063 947 7208
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
      </LegalSection>
    </LegalShell>
  );
}
