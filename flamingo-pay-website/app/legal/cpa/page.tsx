import type { Metadata } from "next";
import { LegalShell, LegalSection } from "../_components/LegalShell";

export const metadata: Metadata = {
  title: "Consumer Protection · Flamingo Pay",
  description:
    "Your rights under the Consumer Protection Act 68 of 2008 when using Flamingo Pay — cooling-off, refunds, plain language, receipts, complaints.",
};

const SECTIONS = [
  { id: "intro", label: "1. Introduction" },
  { id: "applicability", label: "2. Applicability" },
  { id: "plain-language", label: "3. Plain language" },
  { id: "cooling-off", label: "4. Cooling-off rights" },
  { id: "refunds", label: "5. Refunds & returns" },
  { id: "receipts", label: "6. Receipts" },
  { id: "pricing", label: "7. Pricing & fair value" },
  { id: "notice-terms", label: "8. Notice of terms" },
  { id: "right-to-info", label: "9. Right to information" },
  { id: "quality", label: "10. Quality of service" },
  { id: "complaints", label: "11. Complaints" },
  { id: "ncc", label: "12. National Consumer Commission" },
  { id: "contact", label: "13. Contact" },
];

export default function CpaPage() {
  return (
    <LegalShell
      eyebrow="Consumer Protection Act 68 of 2008"
      title="Consumer Protection."
      effectiveDate="20 April 2026"
      version="Version 1.0 — April 2026"
      sections={SECTIONS}
    >
      <LegalSection id="intro" number="1" title="Introduction">
        <p>
          Flamingo Pay (Pty) Ltd (&ldquo;Flamingo&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to upholding the
          rights of all consumers who use our payment platform in accordance
          with the Consumer Protection Act 68 of 2008 (&ldquo;CPA&rdquo;).
        </p>
        <p>
          This page sets out your rights as a consumer when using Flamingo Pay,
          whether you are a buyer making a payment through our platform or a
          merchant receiving payments. We believe in transparency, fairness, and
          treating every person with dignity — these are not just legal
          obligations, they are core to who we are.
        </p>
        <p>
          This notice should be read together with our{" "}
          <a className="text-flamingo-pink-deep underline" href="/legal/privacy">Privacy Policy</a>,{" "}
          <a className="text-flamingo-pink-deep underline" href="/legal/terms">Merchant Terms of Service</a>, and{" "}
          <a className="text-flamingo-pink-deep underline" href="/dispute">Dispute Resolution</a> process.
        </p>
      </LegalSection>

      <LegalSection id="applicability" number="2" title="Who does the CPA apply to?">
        <p>
          The CPA applies to every transaction, agreement, or interaction
          between Flamingo Pay and a natural person (or a juristic person with
          an annual turnover or asset value below the threshold determined by
          the Minister — currently R2 million per annum).
        </p>
        <p>
          In practice, this means the CPA protects:
        </p>
        <ul>
          <li>
            <strong>Buyers</strong> — any person who makes a payment through a
            Flamingo QR code or payment link.
          </li>
          <li>
            <strong>Merchants</strong> — small business owners and sole
            proprietors who use our platform to receive payments, provided their
            annual turnover is below the threshold.
          </li>
        </ul>
        <p>
          Where any provision of this notice conflicts with the CPA, the CPA
          prevails.
        </p>
      </LegalSection>

      <LegalSection id="plain-language" number="3" title="Right to plain and understandable language (Section 22)">
        <p>
          You have the right to receive all notices, documents, and
          communications from Flamingo Pay in plain and understandable language.
          We write our terms, policies, and notifications so that an ordinary
          person with average literacy and minimal experience as a consumer can
          understand them without difficulty.
        </p>
        <p>
          If any part of our terms, this notice, or any communication from us
          is unclear, you have the right to ask us to explain it. Contact us at{" "}
          <a className="text-flamingo-pink-deep underline" href="mailto:info@flamingopay.co.za">
            info@flamingopay.co.za
          </a>{" "}
          and we will provide a clear explanation in a language you understand.
        </p>
        <p>
          We are committed to providing our key documents in English and will
          endeavour to offer translations into isiZulu, Sesotho, and Afrikaans
          as our platform grows.
        </p>
      </LegalSection>

      <LegalSection id="cooling-off" number="4" title="Cooling-off period (Section 16)">
        <p>
          Under Section 16 of the CPA, if you entered into an agreement as a
          result of direct marketing (for example, if a Flamingo representative
          signed you up in person or via a phone call), you have the right to
          cancel that agreement within <strong>5 business days</strong> of the
          date it was concluded, without reason or penalty.
        </p>
        <p>
          <strong>For merchants:</strong> If you signed up for a Flamingo
          merchant account as a result of direct marketing, you may cancel
          within 5 business days by emailing{" "}
          <a className="text-flamingo-pink-deep underline" href="mailto:support@flamingopay.co.za">
            support@flamingopay.co.za
          </a>{" "}
          with the subject line &ldquo;Cooling-off cancellation&rdquo;. We will
          deactivate your account and refund any sign-up fees (Flamingo Pay
          currently charges no sign-up fees, but this right applies to any
          future changes).
        </p>
        <p>
          <strong>For buyers:</strong> PayShap and EFT payments are irrevocable
          once completed. However, if you believe a payment was made in error
          or as a result of misleading marketing, you may{" "}
          <a className="text-flamingo-pink-deep underline" href="/dispute">file a dispute</a>{" "}
          and we will investigate in accordance with PASA dispute rules.
        </p>
        <p>
          The cooling-off right does not apply to agreements initiated by
          the consumer (for example, if you visited flamingopay.co.za and
          signed up voluntarily).
        </p>
      </LegalSection>

      <LegalSection id="refunds" number="5" title="Refunds and returns (Section 20)">
        <p>
          Flamingo Pay is a payment facilitator — we process payments between
          buyers and merchants. The goods or services themselves are provided by
          the merchant, not by Flamingo. However, we take the following
          approach to refunds:
        </p>
        <p>
          <strong>Merchant service fees:</strong> If our service fails to
          perform as described (for example, a technical error causes a payment
          not to be settled to a merchant), we will refund any fees charged for
          that transaction within <strong>10 business days</strong>.
        </p>
        <p>
          <strong>Buyer payments:</strong> If a buyer is entitled to a refund
          from a merchant under the CPA (for example, defective goods under
          Section 56), the buyer should first contact the merchant directly. If
          the merchant does not resolve the matter, the buyer may{" "}
          <a className="text-flamingo-pink-deep underline" href="/dispute">file a dispute</a>{" "}
          through our platform. Flamingo will facilitate communication between
          the buyer and merchant and, where appropriate, process the refund.
        </p>
        <p>
          <strong>Refund timelines:</strong> Once a refund is approved, it will
          be processed within <strong>48 hours</strong>. The actual time for
          funds to reflect in the buyer&apos;s account depends on their bank
          (typically 1-3 business days for PayShap, 3-5 for EFT).
        </p>
      </LegalSection>

      <LegalSection id="receipts" number="6" title="Right to a receipt (Section 26)">
        <p>
          Every buyer who makes a payment through Flamingo Pay is entitled to
          a receipt. We provide this automatically:
        </p>
        <ul>
          <li>
            <strong>Digital receipt:</strong> After every successful payment,
            buyers receive an on-screen receipt showing the merchant name,
            amount paid, payment method, transaction reference, date and time.
          </li>
          <li>
            <strong>Auto-download:</strong> A branded receipt image (PNG) is
            automatically downloaded to the buyer&apos;s device for their
            records.
          </li>
          <li>
            <strong>Shareable link:</strong> Each receipt has a unique URL that
            can be bookmarked, shared, or printed.
          </li>
        </ul>
        <p>
          Merchants also receive a record of every transaction in their
          dashboard, which they can export for their accounting records.
        </p>
        <p>
          Receipts are retained for a minimum of <strong>5 years</strong> in
          compliance with FICA record-keeping requirements.
        </p>
      </LegalSection>

      <LegalSection id="pricing" number="7" title="Pricing, fees, and the right to fair value (Section 48)">
        <p>
          You have the right not to be subjected to unfair, unreasonable, or
          unjust terms or pricing. Flamingo Pay is committed to transparent,
          simple pricing:
        </p>
        <ul>
          <li>
            <strong>Transaction fee:</strong> 2.9% + R0.99 per successful
            transaction, charged to the merchant. Buyers pay nothing.
          </li>
          <li>
            <strong>No hidden fees:</strong> There are no monthly fees, setup
            fees, minimum transaction requirements, or cancellation penalties.
          </li>
          <li>
            <strong>No lock-in:</strong> Merchants can close their account at
            any time without penalty. Outstanding settlements will be paid out
            within 5 business days.
          </li>
        </ul>
        <p>
          If we change our pricing, we will give merchants at least{" "}
          <strong>30 days&apos; written notice</strong> via email and in-app
          notification before the new pricing takes effect. You have the right
          to cancel your account if you do not accept the new pricing.
        </p>
        <p>
          We will never charge a fee that was not clearly disclosed to you
          before you entered into the agreement, and we will never impose
          terms that are unfair, unreasonable, or unjust.
        </p>
      </LegalSection>

      <LegalSection id="notice-terms" number="8" title="Notice of certain terms and conditions (Section 49)">
        <p>
          Section 49 of the CPA requires us to draw your attention to any
          terms that limit our liability, assume risk on your behalf, require
          you to acknowledge facts, or impose obligations or forfeit rights.
          The following terms in our Merchant Agreement are specifically
          brought to your attention:
        </p>
        <ul>
          <li>
            <strong>Settlement timing:</strong> While we aim to settle funds
            within 24 hours, settlement may take up to 3 business days
            depending on banking processes. Flamingo is not liable for delays
            caused by third-party banking infrastructure.
          </li>
          <li>
            <strong>Transaction holds:</strong> Flamingo may place a temporary
            hold on settlements if our compliance system flags suspicious
            activity. This is required by FICA and is done to protect both
            merchants and buyers.
          </li>
          <li>
            <strong>Account suspension:</strong> We may suspend a merchant
            account if we have reasonable grounds to believe it is being used
            for illegal activity, fraud, or in breach of our terms. We will
            notify you in writing and give you an opportunity to respond.
          </li>
          <li>
            <strong>Chargeback liability:</strong> If a buyer dispute results
            in a refund, the refund amount will be debited from the
            merchant&apos;s next settlement. Merchants are responsible for
            ensuring the goods or services they provide meet CPA standards.
          </li>
        </ul>
        <p>
          These terms exist for legal and regulatory compliance. They are not
          intended to unfairly disadvantage any party. If you have concerns
          about any term, please contact us before signing up.
        </p>
      </LegalSection>

      <LegalSection id="right-to-info" number="9" title="Right to information and disclosure (Sections 22, 23, 24)">
        <p>
          You have the right to receive accurate information about our
          services before and after entering into an agreement. Flamingo Pay
          provides:
        </p>
        <ul>
          <li>
            Full fee disclosure on our website and during merchant onboarding.
          </li>
          <li>
            Real-time transaction notifications and a complete transaction
            history in the merchant dashboard.
          </li>
          <li>
            A clear explanation of how payments are processed, including the
            roles of Flamingo, Ozow (our payment gateway), and the buyer&apos;s
            bank.
          </li>
          <li>
            Access to your personal data under POPIA Section 23 via our{" "}
            <a className="text-flamingo-pink-deep underline" href="/dsar">data access request</a>{" "}
            process.
          </li>
        </ul>
        <p>
          We will never make false, misleading, or deceptive representations
          about our services, fees, or capabilities.
        </p>
      </LegalSection>

      <LegalSection id="quality" number="10" title="Right to quality service (Section 54)">
        <p>
          You are entitled to receive services that are performed in a manner
          and quality that persons are generally entitled to expect. Flamingo
          Pay commits to:
        </p>
        <ul>
          <li>
            <strong>Uptime:</strong> Maintaining platform availability of at
            least 99.5% measured monthly, excluding scheduled maintenance
            communicated in advance.
          </li>
          <li>
            <strong>Processing speed:</strong> PayShap transactions settle in
            real-time (under 10 seconds). EFT settlements are processed within
            1 business day.
          </li>
          <li>
            <strong>Support:</strong> Responding to merchant support queries
            within 4 business hours during business days (08:00 — 17:00 SAST).
          </li>
          <li>
            <strong>Security:</strong> Implementing appropriate technical and
            organisational measures to protect payment data, including
            encryption, access controls, and regular security reviews.
          </li>
        </ul>
        <p>
          If our service fails to meet these standards, you may report the
          issue through our complaint process (see Section 11 below) and,
          where applicable, request a refund of fees charged for the affected
          period.
        </p>
      </LegalSection>

      <LegalSection id="complaints" number="11" title="How to complain">
        <p>
          We take complaints seriously and aim to resolve them quickly and
          fairly. Here is how to raise a complaint:
        </p>
        <p>
          <strong>Step 1 — Contact us directly.</strong> Email{" "}
          <a className="text-flamingo-pink-deep underline" href="mailto:complaints@flamingopay.co.za">
            complaints@flamingopay.co.za
          </a>{" "}
          or call{" "}
          <a className="text-flamingo-pink-deep underline" href="tel:+27639477208">
            063 947 7208
          </a>{" "}
          with a description of the issue. We will acknowledge your complaint
          within <strong>2 business days</strong> and aim to resolve it within{" "}
          <strong>10 business days</strong>.
        </p>
        <p>
          <strong>Step 2 — Escalate internally.</strong> If you are not
          satisfied with the initial response, ask for the matter to be
          escalated to our Compliance Officer at{" "}
          <a className="text-flamingo-pink-deep underline" href="mailto:compliance@flamingopay.co.za">
            compliance@flamingopay.co.za
          </a>
          . We will review and respond within <strong>5 business days</strong>.
        </p>
        <p>
          <strong>Step 3 — External escalation.</strong> If we cannot resolve
          your complaint to your satisfaction, you have the right to escalate
          to the relevant external body (see Section 12 below).
        </p>
        <p>
          <strong>For payment disputes:</strong> Buyers can file a dispute
          directly through our{" "}
          <a className="text-flamingo-pink-deep underline" href="/dispute">dispute resolution page</a>
          . Payment disputes are handled under PASA dispute rules with a
          48-hour merchant response deadline and compliance review.
        </p>
      </LegalSection>

      <LegalSection id="ncc" number="12" title="External bodies and the National Consumer Commission">
        <p>
          If you have exhausted our internal complaint process and remain
          unsatisfied, you may approach the following external bodies:
        </p>
        <ul>
          <li>
            <strong>National Consumer Commission (NCC)</strong>
            <br />
            The NCC investigates and resolves consumer complaints under the CPA.
            <br />
            Website:{" "}
            <a className="text-flamingo-pink-deep underline" href="https://www.thencc.gov.za" target="_blank" rel="noopener noreferrer">
              www.thencc.gov.za
            </a>
            <br />
            Phone: 012 428 7000
            <br />
            Email: complaints@thencc.gov.za
          </li>
          <li>
            <strong>National Consumer Tribunal (NCT)</strong>
            <br />
            The NCT adjudicates matters referred by the NCC or by consumers.
            <br />
            Website:{" "}
            <a className="text-flamingo-pink-deep underline" href="https://www.thenct.org.za" target="_blank" rel="noopener noreferrer">
              www.thenct.org.za
            </a>
          </li>
          <li>
            <strong>Information Regulator (for data-related complaints)</strong>
            <br />
            If your complaint relates to how we handle your personal
            information, contact the Information Regulator.
            <br />
            Website:{" "}
            <a className="text-flamingo-pink-deep underline" href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer">
              inforegulator.org.za
            </a>
          </li>
          <li>
            <strong>Payment Association of South Africa (PASA)</strong>
            <br />
            For complaints specifically about payment processing or disputes.
            <br />
            Website:{" "}
            <a className="text-flamingo-pink-deep underline" href="https://www.pasa.org.za" target="_blank" rel="noopener noreferrer">
              www.pasa.org.za
            </a>
          </li>
        </ul>
        <p>
          You are not required to use our internal process before approaching
          these bodies, but we encourage you to give us the opportunity to
          resolve the matter first.
        </p>
      </LegalSection>

      <LegalSection id="contact" number="13" title="Contact us">
        <p>
          For any questions about your consumer rights or this notice:
        </p>
        <ul>
          <li>
            <strong>Flamingo Pay (Pty) Ltd</strong>
            <br />
            Registration Number: 2026/276925/07
          </li>
          <li>
            Address: A23 10th Ave, Edenburg, Rivonia, Sandton, 2091
          </li>
          <li>
            General enquiries:{" "}
            <a className="text-flamingo-pink-deep underline" href="mailto:info@flamingopay.co.za">
              info@flamingopay.co.za
            </a>
          </li>
          <li>
            Complaints:{" "}
            <a className="text-flamingo-pink-deep underline" href="mailto:complaints@flamingopay.co.za">
              complaints@flamingopay.co.za
            </a>
          </li>
          <li>
            Compliance Officer:{" "}
            <a className="text-flamingo-pink-deep underline" href="mailto:compliance@flamingopay.co.za">
              compliance@flamingopay.co.za
            </a>
          </li>
          <li>
            Phone:{" "}
            <a className="text-flamingo-pink-deep underline" href="tel:+27639477208">
              063 947 7208
            </a>
          </li>
          <li>
            Dispute resolution:{" "}
            <a className="text-flamingo-pink-deep underline" href="/dispute">
              flamingopay.co.za/dispute
            </a>
          </li>
          <li>
            Data access requests:{" "}
            <a className="text-flamingo-pink-deep underline" href="/dsar">
              flamingopay.co.za/dsar
            </a>
          </li>
        </ul>
      </LegalSection>
    </LegalShell>
  );
}
