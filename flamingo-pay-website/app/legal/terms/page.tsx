import type { Metadata } from "next";
import { LegalShell, LegalSection } from "../_components/LegalShell";

export const metadata: Metadata = {
  title: "Merchant Terms · Flamingo Pay",
  description:
    "The Merchant Terms and Conditions that govern your use of the Flamingo Pay platform, QR codes, and payment facilitation services.",
};

const SECTIONS = [
  { id: "definitions", label: "1. Definitions" },
  { id: "eligibility", label: "2. Eligibility" },
  { id: "kyc", label: "3. KYC & FICA" },
  { id: "service", label: "4. The service" },
  { id: "fees", label: "5. Fees" },
  { id: "obligations", label: "6. Your obligations" },
  { id: "prohibited", label: "7. Prohibited activities" },
  { id: "refunds", label: "8. Refunds & disputes" },
  { id: "termination", label: "9. Suspension & termination" },
  { id: "ip", label: "10. Intellectual property" },
  { id: "liability", label: "11. Liability" },
  { id: "popia", label: "12. Data protection" },
  { id: "ecta", label: "13. Electronic communications" },
  { id: "confidentiality", label: "14. Confidentiality" },
  { id: "force", label: "15. Force majeure" },
  { id: "amendments", label: "16. Amendments" },
  { id: "law", label: "17. Governing law" },
  { id: "general", label: "18. General" },
];

export default function MerchantTermsPage() {
  return (
    <LegalShell
      eyebrow="Terms of service · Merchant agreement"
      title="Merchant Terms."
      effectiveDate="2 April 2026"
      version="Version 1.0 — April 2026"
      sections={SECTIONS}
    >
      <div className="rounded-2xl border-2 border-flamingo-dark bg-flamingo-butter p-4 text-sm font-semibold text-flamingo-dark">
        <strong>Important.</strong> By registering for a Flamingo merchant
        account, scanning or displaying a Flamingo QR code, or accepting
        payments through the Flamingo platform, you agree to be bound by
        these Terms and Conditions. Please read them carefully.
      </div>

      <LegalSection id="definitions" number="1" title="Definitions and interpretation">
        <p>In these Terms, unless the context indicates otherwise:</p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <strong>&ldquo;Company&rdquo; / &ldquo;Flamingo&rdquo;</strong>{" "}
            means Flamingo Pay (Pty) Ltd, a company registered in the
            Republic of South Africa.
          </li>
          <li>
            <strong>&ldquo;Merchant&rdquo; / &ldquo;you&rdquo;</strong> means
            the natural person or entity that registers for and uses a
            Flamingo merchant account.
          </li>
          <li>
            <strong>&ldquo;Customer&rdquo;</strong> means any person who
            makes a payment to a Merchant through the Flamingo platform.
          </li>
          <li>
            <strong>&ldquo;Platform&rdquo;</strong> means the Flamingo mobile
            application, web dashboard, APIs, QR codes, and all related
            technology and services.
          </li>
          <li>
            <strong>&ldquo;QR Code&rdquo;</strong> means the unique Quick
            Response code assigned to the Merchant by Flamingo for the
            purpose of receiving payments.
          </li>
          <li>
            <strong>&ldquo;PayShap&rdquo;</strong> means BankservAfrica&rsquo;s
            real-time bank-to-bank payment rail.
          </li>
          <li>
            <strong>&ldquo;Transaction&rdquo;</strong> means any payment
            processed through the Platform from a Customer to a Merchant.
          </li>
          <li>
            <strong>&ldquo;Transaction Fee&rdquo;</strong> means the fee
            charged by Flamingo on each Transaction, as set out in Clause 5.
          </li>
          <li>
            <strong>&ldquo;Settlement&rdquo;</strong> means the transfer of
            Transaction funds to the Merchant&rsquo;s designated bank account.
          </li>
          <li>
            <strong>&ldquo;FICA&rdquo;</strong> — Financial Intelligence
            Centre Act 38 of 2001. <strong>&ldquo;POPIA&rdquo;</strong> —
            Protection of Personal Information Act 4 of 2013.{" "}
            <strong>&ldquo;ECTA&rdquo;</strong> — Electronic Communications
            and Transactions Act 25 of 2002.{" "}
            <strong>&ldquo;CPA&rdquo;</strong> — Consumer Protection Act 68
            of 2008.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="eligibility" number="2" title="Eligibility and registration">
        <p>To register as a Flamingo Merchant, you must:</p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Be at least 18 years of age;</li>
          <li>
            Be a South African citizen, permanent resident, or holder of a
            valid work permit;
          </li>
          <li>
            Operate a legitimate business or trading activity within the
            Republic of South Africa;
          </li>
          <li>
            Have access to a smartphone capable of running the Flamingo
            application;
          </li>
          <li>
            Hold a bank account with a South African bank in your name or
            your business&rsquo;s name; and
          </li>
          <li>
            Complete the Flamingo KYC verification process as required under
            FICA.
          </li>
        </ul>
        <p>
          Registration requires your full legal name, South African ID
          number, a clear selfie photograph, proof of residential address
          (not older than 3 months), and your bank account details for
          Settlement purposes. Flamingo reserves the right to decline any
          application without providing reasons, and to request additional
          documentation at any time for compliance purposes.
        </p>
        <p>
          You warrant that all information provided during registration and
          at any time thereafter is true, accurate, complete, and not
          misleading, and you must notify Flamingo within 7 days of any
          change. Each Merchant account is personal and non-transferable —
          you may not allow any third party to use your account, QR code, or
          login credentials.
        </p>
      </LegalSection>

      <LegalSection id="kyc" number="3" title="KYC, FICA compliance and verification">
        <p>
          Flamingo is a reporting institution under FICA and is required to
          verify the identity of all Merchants. By registering, you consent
          to Flamingo conducting identity verification, address verification,
          and ongoing screening against sanctions and politically exposed
          persons (PEP) lists.
        </p>
        <p>Flamingo may apply risk-based KYC procedures:</p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <strong>Simplified due diligence:</strong> for Merchants with
            expected monthly volumes below R5,000 — name, RICA-registered
            phone (verified by SMS OTP at signup), a photo of the Merchant,
            and a sworn affidavit from a commissioner of oaths confirming
            trading identity. A SA ID number is optional at this tier.
            Applied under FICA Directive 6 for simplified CDD on low-value
            accounts serving informal traders.
          </li>
          <li>
            <strong>Standard due diligence:</strong> for expected monthly
            volumes between R5,000 and R100,000 — SA ID, selfie, proof of
            address, bank confirmation letter, and business registration or
            affidavit. VerifyNow checks SAID, AML/PEP/sanctions, biometric
            liveness, and bank account verification (AVS).
          </li>
          <li>
            <strong>Enhanced due diligence:</strong> for volumes exceeding
            R100,000/month or Merchants flagged by risk systems — all
            Standard documents plus a source-of-funds declaration, face
            match, and (for registered businesses) CIPC company and
            director searches. May include site visits.
          </li>
        </ul>
        <p>
          Flamingo may at any time request updated or additional KYC
          documentation. Failure to provide requested documentation within
          14 days may result in account suspension or termination.
        </p>
        <p>
          Flamingo is required to report suspicious or unusual Transactions
          to the Financial Intelligence Centre via the goAML system. Flamingo
          is prohibited by law from informing you that such a report has been
          made (tipping-off prohibition under Section 29 of FICA).
        </p>
      </LegalSection>

      <LegalSection id="service" number="4" title="The Flamingo service">
        <p>
          Flamingo provides a QR code-based payment acceptance service that
          enables Merchants to receive digital payments from Customers via
          the PayShap real-time payment rail and such other payment methods
          as Flamingo may support from time to time.
        </p>
        <p>
          Upon successful registration, Flamingo will issue you a unique QR
          code which you may display at your place of business in printed or
          digital form. When a Customer scans your QR code and initiates a
          payment, Flamingo processes the Transaction, deducts the
          applicable Transaction Fee, and settles the remaining amount to
          your designated bank account.
        </p>
        <p>
          <strong>Settlement timing.</strong> Flamingo aims to settle funds
          in real time via PayShap. However, Settlement may be delayed by up
          to 24 hours due to banking system processing, risk reviews, or
          technical issues. Flamingo shall not be liable for delays caused
          by third-party payment infrastructure.
        </p>
        <p>
          Flamingo does not guarantee uninterrupted availability of the
          Platform. You acknowledge that Flamingo acts as a payment
          facilitator and is not a bank — Flamingo does not hold deposits,
          does not offer credit, and does not provide financial advice.
        </p>
      </LegalSection>

      <LegalSection id="fees" number="5" title="Fees and charges">
        <p>Flamingo charges the following Transaction Fee on each successful Transaction:</p>
        <div className="overflow-hidden rounded-2xl border-2 border-flamingo-dark">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-flamingo-cream">
                <th className="p-3 text-left font-extrabold uppercase tracking-wider text-[10px] text-flamingo-dark/70">Component</th>
                <th className="p-3 text-left font-extrabold uppercase tracking-wider text-[10px] text-flamingo-dark/70">Rate</th>
                <th className="p-3 text-left font-extrabold uppercase tracking-wider text-[10px] text-flamingo-dark/70">Example (R75 payment)</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-flamingo-cream text-flamingo-dark/80">
              <tr>
                <td className="p-3 font-semibold">Percentage fee</td>
                <td className="p-3">2.9% of Transaction value</td>
                <td className="p-3 tabular-nums">R2.18</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Fixed fee</td>
                <td className="p-3">R0.99 per Transaction</td>
                <td className="p-3 tabular-nums">R0.99</td>
              </tr>
              <tr className="bg-flamingo-pink-wash">
                <td className="p-3 font-extrabold">Total fee</td>
                <td className="p-3 font-extrabold">2.9% + R0.99</td>
                <td className="p-3 font-extrabold tabular-nums">R3.17 (Merchant receives R71.83)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Transaction Fees are automatically deducted before Settlement. You
          receive the net amount (Transaction value minus Transaction Fee) in
          your bank account. Flamingo reserves the right to amend its fee
          structure with 30 days&rsquo; written notice via email, push
          notification, or in-app notification; continued use after the
          notice period constitutes acceptance of the amended fees.
        </p>
        <p>
          There are no monthly subscription fees, setup fees, or minimum
          Transaction requirements — you only pay when you receive a payment.
          All fees are inclusive of VAT where Flamingo is registered for
          VAT; tax invoices will be available through the Flamingo dashboard.
        </p>
      </LegalSection>

      <LegalSection id="obligations" number="6" title="Merchant obligations">
        <p>You agree to:</p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            Use the Flamingo Platform only for lawful commercial purposes
            relating to the sale of legitimate goods and/or services;
          </li>
          <li>
            Display your Flamingo QR code only at your registered place of
            business or as otherwise agreed with Flamingo;
          </li>
          <li>Not alter, duplicate, or tamper with your QR code in any way;</li>
          <li>
            Not process Transactions for goods or services that are illegal,
            prohibited, or restricted under South African law;
          </li>
          <li>
            Not use the Platform for money laundering, terrorist financing,
            fraud, or any other illicit financial activity;
          </li>
          <li>
            Not process fictitious, split, or inflated Transactions to
            manipulate volumes or circumvent risk controls;
          </li>
          <li>
            Maintain accurate records of all Transactions and make them
            available to Flamingo upon reasonable request;
          </li>
          <li>
            Respond to Customer complaints and refund requests in a timely
            and professional manner;
          </li>
          <li>
            Comply with all applicable South African laws, including FICA,
            POPIA, the CPA, and any applicable municipal by-laws; and
          </li>
          <li>
            Not use the Flamingo name, logo, or branding in any manner not
            expressly authorised by Flamingo.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="prohibited" number="7" title="Prohibited activities">
        <p>You may not use the Flamingo Platform to accept payment for:</p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Illegal drugs, controlled substances, or drug paraphernalia;</li>
          <li>Weapons, ammunition, or explosives;</li>
          <li>Counterfeit goods, stolen property, or goods infringing intellectual property rights;</li>
          <li>Gambling or lottery services (unless duly licenced);</li>
          <li>Pyramid schemes, Ponzi schemes, or multi-level marketing scams;</li>
          <li>Adult content, escort services, or any form of exploitation;</li>
          <li>Sanctioned goods or transactions with sanctioned persons or entities;</li>
          <li>Any goods or services that would bring Flamingo into disrepute; or</li>
          <li>
            Any activity that violates the Prevention of Organised Crime Act
            121 of 1998 (POCA) or the Financial Intelligence Centre Act 38
            of 2001.
          </li>
        </ul>
        <p>
          Flamingo reserves the right to immediately suspend or terminate
          your account and withhold funds if any prohibited activity is
          detected or reasonably suspected.
        </p>
      </LegalSection>

      <LegalSection id="refunds" number="8" title="Refunds, disputes, and chargebacks">
        <p>
          Merchants are responsible for their own refund policies and must
          communicate these clearly to Customers. If a Customer disputes a
          Transaction, Flamingo will notify the Merchant and may temporarily
          hold the disputed amount pending resolution.
        </p>
        <p>
          The Merchant shall cooperate with Flamingo in investigating any
          disputed Transaction and provide relevant documentation (receipts,
          proof of delivery, communication with Customer) within 5 business
          days of notification.
        </p>
        <p>Flamingo reserves the right to reverse a Transaction and debit the Merchant&rsquo;s account if:</p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>The Transaction is found to be fraudulent or unauthorised;</li>
          <li>The Transaction was processed in error (duplicate, incorrect amount);</li>
          <li>A valid chargeback or reversal is initiated by the Customer&rsquo;s bank; or</li>
          <li>The Transaction is found to involve prohibited activities.</li>
        </ul>
        <p>Flamingo shall not be liable for losses arising from chargebacks or reversed Transactions.</p>
      </LegalSection>

      <LegalSection id="termination" number="9" title="Suspension and termination">
        <p>
          <strong>Suspension by Flamingo.</strong> Flamingo may suspend your
          account immediately and without prior notice if it reasonably
          suspects fraud, money laundering, or prohibited activity; you
          breach any material term of this agreement; you fail to provide
          requested KYC documentation within the required timeframe; your
          Transaction patterns trigger Flamingo&rsquo;s risk monitoring
          systems; Flamingo is directed to do so by a regulatory authority,
          court order, or law enforcement; or Flamingo determines, in its
          reasonable discretion, that continued operation poses a risk to
          Flamingo, its banking partners, or the integrity of the Platform.
        </p>
        <p>
          <strong>Termination by Flamingo.</strong> Flamingo may terminate
          your account with 14 days&rsquo; written notice for any reason, or
          immediately without notice in cases of fraud, illegality, or
          material breach.
        </p>
        <p>
          <strong>Termination by Merchant.</strong> You may terminate your
          account at any time by providing 14 days&rsquo; written notice via
          email or in-app request.
        </p>
        <p>
          Upon termination, Flamingo will settle any outstanding funds (less
          applicable fees and any amounts subject to dispute or
          investigation) within 30 business days, provided no hold or
          investigation is pending. Clauses 8, 10, 11, 12, and 14 survive
          termination.
        </p>
      </LegalSection>

      <LegalSection id="ip" number="10" title="Intellectual property">
        <p>
          All intellectual property rights in the Flamingo Platform —
          including the software, trademarks, logos, QR code technology,
          merchant dashboard, APIs, and documentation — are and remain the
          exclusive property of Flamingo. Flamingo grants you a limited,
          non-exclusive, non-transferable, revocable license to use the
          Platform and display the Flamingo QR code solely for the purpose
          of accepting payments in the ordinary course of your business.
        </p>
        <p>
          You may not reverse-engineer, decompile, copy, modify, or create
          derivative works from any part of the Platform. Upon termination,
          you must immediately cease using all Flamingo branding and destroy
          or return any printed QR codes or marketing materials.
        </p>
      </LegalSection>

      <LegalSection id="liability" number="11" title="Limitation of liability">
        <p>To the maximum extent permitted by South African law (including the CPA and ECTA):</p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            Flamingo shall not be liable for any indirect, consequential,
            special, or incidental damages, including loss of profits, loss
            of business, loss of goodwill, or loss of data arising from or
            in connection with the use of the Platform;
          </li>
          <li>
            Flamingo&rsquo;s total aggregate liability under this agreement
            shall not exceed the total Transaction Fees paid by the Merchant
            to Flamingo in the 3 months immediately preceding the event
            giving rise to the claim;
          </li>
          <li>
            Flamingo shall not be liable for any loss or damage caused by
            downtime, errors, or interruptions in the Platform, banking
            infrastructure, or PayShap system; and
          </li>
          <li>
            Flamingo shall not be liable for any loss arising from the
            Merchant&rsquo;s failure to secure their account credentials,
            device, or QR code.
          </li>
        </ul>
        <p>
          Nothing in this clause limits liability for fraud, gross
          negligence, or willful misconduct by Flamingo, or any liability
          that cannot be excluded under South African law.
        </p>
      </LegalSection>

      <LegalSection id="popia" number="12" title="Data protection and POPIA">
        <p>
          Flamingo processes personal information in accordance with POPIA.
          By registering, you consent to the collection, use, storage, and
          processing of your personal information as described in our{" "}
          <a className="text-flamingo-pink-deep underline" href="/legal/privacy">
            Privacy Policy
          </a>
          . Flamingo will not sell your personal information to third
          parties. All data is stored on servers within the Republic of
          South Africa. You have the right to request access to, correction
          of, or deletion of your personal information held by Flamingo,
          subject to legal and regulatory retention requirements.
        </p>
      </LegalSection>

      <LegalSection id="ecta" number="13" title="Electronic communications (ECTA)">
        <p>
          This agreement is concluded electronically in accordance with ECTA.
          By accepting these Terms electronically through registration on the
          Platform, you agree that your electronic acceptance has the same
          legal effect as a handwritten signature. Flamingo may communicate
          with you electronically via push notifications, in-app messages,
          email, or SMS, and such communications shall be deemed received on
          the date of transmission.
        </p>
      </LegalSection>

      <LegalSection id="confidentiality" number="14" title="Confidentiality">
        <p>
          Each Party shall treat as confidential all information received
          from the other Party that is not publicly available, including
          business plans, financial information, technical specifications,
          merchant data, and customer information. This obligation survives
          termination of this agreement indefinitely.
        </p>
      </LegalSection>

      <LegalSection id="force" number="15" title="Force majeure">
        <p>
          Neither Party shall be liable for any failure or delay in
          performing its obligations under this agreement to the extent that
          such failure or delay results from circumstances beyond its
          reasonable control, including natural disasters, power outages,
          internet or telecommunications failures, banking system failures,
          government actions, civil unrest, pandemic, or any other event
          constituting force majeure under South African law. The affected
          Party shall notify the other Party as soon as reasonably
          practicable and use reasonable efforts to mitigate the effects.
        </p>
      </LegalSection>

      <LegalSection id="amendments" number="16" title="Amendments">
        <p>
          Flamingo may amend these Terms from time to time. Material changes
          will be communicated to Merchants with at least 30 days&rsquo;
          notice via email, push notification, or in-app notice. Continued
          use of the Platform after the effective date of the amended Terms
          constitutes acceptance. If you do not agree to the amended Terms,
          you may terminate your account in accordance with Clause 9. The
          latest version of these Terms will always be available on the
          Flamingo website.
        </p>
      </LegalSection>

      <LegalSection id="law" number="17" title="Governing law and dispute resolution">
        <p>
          This agreement is governed by the laws of the Republic of South
          Africa. Any dispute arising from or in connection with this
          agreement shall first be referred to internal escalation within
          Flamingo&rsquo;s support team. If not resolved within 14 days, the
          dispute shall be referred to mediation to be conducted in Gauteng
          province. If mediation fails within 30 days, either Party may
          refer the matter to arbitration in accordance with the Arbitration
          Act 42 of 1965, to be conducted in Johannesburg.
        </p>
        <p>
          Nothing in this clause prevents either Party from seeking urgent
          interim relief from a court of competent jurisdiction. The
          Merchant retains all rights under the Consumer Protection Act 68
          of 2008, including the right to approach the National Consumer
          Commission or relevant ombud.
        </p>
      </LegalSection>

      <LegalSection id="general" number="18" title="General">
        <p>
          If any provision of these Terms is found to be invalid or
          unenforceable, the remaining provisions shall continue in full
          force and effect. Flamingo&rsquo;s failure to enforce any right
          under these Terms does not constitute a waiver of that right.
          These Terms constitute the entire agreement between you and
          Flamingo regarding the use of the Platform and supersede all prior
          agreements, representations, and understandings. You may not
          assign or transfer your rights or obligations under these Terms
          without Flamingo&rsquo;s prior written consent. Flamingo may
          assign its rights and obligations under these Terms to any
          successor entity or acquiring company.
        </p>
        <div className="mt-6 rounded-2xl border-2 border-flamingo-dark bg-white p-5 shadow-[0_6px_0_0_#1A1A2E]">
          <p className="display text-base font-extrabold text-flamingo-dark">
            Flamingo Pay (Pty) Ltd
          </p>
          <ul className="mt-3 space-y-1 text-sm text-flamingo-dark/80">
            <li>
              Support:{" "}
              <a className="text-flamingo-pink-deep underline" href="mailto:support@flamingopay.co.za">
                support@flamingopay.co.za
              </a>
            </li>
            <li>
              Information Officer:{" "}
              <a className="text-flamingo-pink-deep underline" href="mailto:compliance@flamingopay.co.za">
                compliance@flamingopay.co.za
              </a>
            </li>
          </ul>
        </div>
      </LegalSection>
    </LegalShell>
  );
}
