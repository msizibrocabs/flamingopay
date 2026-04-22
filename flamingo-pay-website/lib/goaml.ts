/**
 * Flamingo Pay — goAML XML Exporter
 *
 * Generates goAML 4.0-shaped XML for FIC STR (Suspicious Transaction Report)
 * and CTR (Currency Transaction Report) filings.
 *
 * goAML is the UNODC-developed reporting standard that the SA Financial
 * Intelligence Centre (FIC) uses for its online portal at
 * https://www.fic.gov.za/goaml. FIC does NOT expose a machine-to-machine
 * submission API — reports are either keyed in manually or uploaded as a
 * single XML file conforming to the goAML schema.
 *
 * This module produces an XML draft that the compliance officer can:
 *   1. Review (some fields are placeholders sourced from env vars),
 *   2. Adjust if needed (identity number, contact details, narrative),
 *   3. Upload to goAML — the portal validates against the XSD and returns
 *      a FIC reference number which is then recorded back on the STR.
 *
 * Env vars consumed (all optional — placeholders used if unset):
 *   FIC_RENTITY_ID             — Flamingo Pay's FIC registered-entity number
 *   FIC_RENTITY_BRANCH         — Branch name (e.g. "HEAD OFFICE")
 *   FIC_REPORTING_PERSON_FIRST — First name of the filing compliance officer
 *   FIC_REPORTING_PERSON_LAST  — Last name
 *   FIC_REPORTING_PERSON_TITLE — Title (Mr / Ms / Mrs / Dr)
 *   FIC_REPORTING_PERSON_ID    — SA ID number (13 digits)
 *   FIC_REPORTING_PERSON_PHONE — Phone without country code (e.g. "0821234567")
 *   FIC_REPORTING_PERSON_EMAIL — Email address
 *   FIC_REPORTING_PERSON_OCCUPATION — Occupation / role (default "Compliance Officer")
 *   FIC_ENTITY_ADDRESS         — Registered physical address line
 *   FIC_ENTITY_CITY            — City (default "Johannesburg")
 *   FIC_ENTITY_POSTCODE        — Postal code
 *
 * The produced XML is valid for casual desk review. It may still need
 * field-level edits before goAML's XSD validator accepts it on upload —
 * hence the "DRAFT" comment block at the top of every file.
 */

import "server-only";
import type { SuspiciousTransactionReport, CurrencyTransactionReport } from "./fica";
import type { MerchantApplication, StoredTxn } from "./store";

// ─── Helpers ─────────────────────────────────────────────────

function xmlEscape(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** goAML dateTime — YYYY-MM-DDTHH:mm:ss (no timezone designator). */
function goAmlDateTime(iso: string | Date | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 19);
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 19);
  // Emit in SAST (UTC+2) since FIC reports are SA-domestic.
  const sast = new Date(d.getTime() + 2 * 3600_000);
  return sast.toISOString().slice(0, 19);
}

function env(key: string, fallback = ""): string {
  return (process.env[key] ?? fallback).trim();
}

function reportingPersonBlock(): string {
  const first = env("FIC_REPORTING_PERSON_FIRST", "Compliance");
  const last = env("FIC_REPORTING_PERSON_LAST", "Officer");
  const title = env("FIC_REPORTING_PERSON_TITLE", "Mr");
  const idNumber = env("FIC_REPORTING_PERSON_ID", "0000000000000");
  const phone = env("FIC_REPORTING_PERSON_PHONE", "0000000000");
  const email = env("FIC_REPORTING_PERSON_EMAIL", "compliance@flamingopay.co.za");
  const occupation = env("FIC_REPORTING_PERSON_OCCUPATION", "Compliance Officer");

  return `    <reporting_person>
      <title>${xmlEscape(title)}</title>
      <first_name>${xmlEscape(first)}</first_name>
      <last_name>${xmlEscape(last)}</last_name>
      <id_number>${xmlEscape(idNumber)}</id_number>
      <phones>
        <phone>
          <tph_contact_type>1</tph_contact_type>
          <tph_communication_type>L</tph_communication_type>
          <tph_country_prefix>27</tph_country_prefix>
          <tph_number>${xmlEscape(phone)}</tph_number>
        </phone>
      </phones>
      <email>${xmlEscape(email)}</email>
      <occupation>${xmlEscape(occupation)}</occupation>
    </reporting_person>`;
}

function merchantAddressBlock(m: MerchantApplication): string {
  const city = env("FIC_ENTITY_CITY", "Johannesburg");
  const postcode = env("FIC_ENTITY_POSTCODE", "0000");
  return `        <address>
          <address_type>1</address_type>
          <address>${xmlEscape(m.address)}</address>
          <city>${xmlEscape(city)}</city>
          <zip>${xmlEscape(postcode)}</zip>
          <country_code>ZA</country_code>
        </address>`;
}

/**
 * Translate our internal rail onto a human-readable transmission mode that
 * goAML will accept as free-text and that a reviewer will recognise.
 */
function transmodeCode(rail: string): string {
  if (rail === "payshap") return "PAYSHAP";
  if (rail === "eft") return "EFT";
  return rail.toUpperCase();
}

/** goAML from_funds_code / to_funds_code — "T" = electronic transfer. */
function fundsCodeFor(_rail: string): string {
  return "T";
}

// ─── STR (Suspicious Transaction Report) ─────────────────────

function strTransactionBlock(
  str: SuspiciousTransactionReport,
  txn: StoredTxn,
  merchant: MerchantApplication,
  idx: number,
): string {
  const amount = txn.amount.toFixed(2);
  const fromFunds = fundsCodeFor(txn.rail);
  const toFunds = fundsCodeFor(txn.rail);
  const counterpartyBank = xmlEscape(txn.buyerBank ?? "Unknown bank");

  // Buyer side (external): t_from. Merchant side (our client): t_to_my_client.
  return `  <transaction>
    <transactionnumber>${xmlEscape(txn.reference ?? txn.id)}</transactionnumber>
    <internal_ref_number>${xmlEscape(`${str.id}-${String(idx + 1).padStart(3, "0")}`)}</internal_ref_number>
    <transaction_location>ZA</transaction_location>
    <date_transaction>${goAmlDateTime(txn.timestamp)}</date_transaction>
    <transmode_code>${xmlEscape(transmodeCode(txn.rail))}</transmode_code>
    <amount_local>${amount}</amount_local>
    <t_from>
      <from_funds_code>${fromFunds}</from_funds_code>
      <from_foreign_currency>
        <foreign_currency_code>ZAR</foreign_currency_code>
        <foreign_amount>${amount}</foreign_amount>
        <foreign_exchange_rate>1</foreign_exchange_rate>
      </from_foreign_currency>
      <from_country>ZA</from_country>
      <!-- Counterparty (buyer) — identity unknown at Flamingo Pay, bank known. -->
      <from_entity>
        <name>Unknown buyer via ${counterpartyBank}</name>
        <incorporation_country_code>ZA</incorporation_country_code>
      </from_entity>
    </t_from>
    <t_to_my_client>
      <to_funds_code>${toFunds}</to_funds_code>
      <to_country>ZA</to_country>
      <to_account>
        <institution_name>${xmlEscape(merchant.bank)}</institution_name>
        <swift>N/A</swift>
        <account>XXXXXXXX${xmlEscape(merchant.accountLast4)}</account>
        <currency_code>ZAR</currency_code>
        <account_name>${xmlEscape(merchant.businessName)}</account_name>
        <t_entity>
          <name>${xmlEscape(merchant.businessName)}</name>
          <incorporation_country_code>ZA</incorporation_country_code>
          ${merchant.cipcRegistrationNumber ? `<incorporation_number>${xmlEscape(merchant.cipcRegistrationNumber)}</incorporation_number>` : ""}
          <business>${xmlEscape(merchant.businessType)}</business>
          <phones>
            <phone>
              <tph_contact_type>1</tph_contact_type>
              <tph_communication_type>M</tph_communication_type>
              <tph_country_prefix>27</tph_country_prefix>
              <tph_number>${xmlEscape((merchant.phone ?? "").replace(/^\+?27/, "").replace(/\s+/g, ""))}</tph_number>
            </phone>
          </phones>
${merchantAddressBlock(merchant)}
        </t_entity>
      </to_account>
    </t_to_my_client>
  </transaction>`;
}

/**
 * Build a goAML 4.0-shaped STR XML document.
 *
 * Returns a complete XML string (UTF-8, with declaration).
 */
export function buildGoAmlStrXml(
  str: SuspiciousTransactionReport,
  merchant: MerchantApplication,
  transactions: StoredTxn[],
): string {
  const rentityId = env("FIC_RENTITY_ID", "0000000");
  const rentityBranch = env("FIC_RENTITY_BRANCH", "HEAD OFFICE");
  const submissionDate = goAmlDateTime(new Date());

  const reason = xmlEscape(str.description);
  const action = xmlEscape(
    `Compliance investigation complete. Risk level: ${str.riskLevel ?? "not set"}. ` +
      `Reviewed by ${str.reviewedBy ?? "compliance team"}. ` +
      (str.notes ? `Notes: ${str.notes}` : "See transaction manifest for details."),
  );

  const txnBlocks = transactions
    .map((t, i) => strTransactionBlock(str, t, merchant, i))
    .join("\n");

  const draftHeader = `<!--
  =============================================================
  DRAFT goAML STR — GENERATED BY FLAMINGO PAY COMPLIANCE PORTAL
  =============================================================
  STR ID        : ${str.id}
  Merchant      : ${merchant.businessName} (${merchant.id})
  Generated at  : ${new Date().toISOString()}

  BEFORE UPLOADING TO goAML:
    1. Review rentity_id / rentity_branch — must match your FIC registration.
    2. Review <reporting_person> — name, ID, phone, email, occupation.
    3. Sanity-check the narrative in <reason> and <action>.
    4. Validate against the FIC goAML 4.0 XSD (goAML portal does this on upload).
  =============================================================
-->`;

  return `<?xml version="1.0" encoding="UTF-8"?>
${draftHeader}
<report xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="goAMLXML_4.0.0.xsd">
  <rentity_id>${xmlEscape(rentityId)}</rentity_id>
  <rentity_branch>${xmlEscape(rentityBranch)}</rentity_branch>
  <submission_code>E</submission_code>
  <report_code>STR</report_code>
  <entity_reference>${xmlEscape(str.id)}</entity_reference>
  <submission_date>${submissionDate}</submission_date>
  <currency_code_local>ZAR</currency_code_local>
${reportingPersonBlock()}
  <location>
    <address_type>1</address_type>
    <address>${xmlEscape(env("FIC_ENTITY_ADDRESS", "1 Flamingo Lane"))}</address>
    <city>${xmlEscape(env("FIC_ENTITY_CITY", "Johannesburg"))}</city>
    <zip>${xmlEscape(env("FIC_ENTITY_POSTCODE", "0000"))}</zip>
    <country_code>ZA</country_code>
  </location>
  <reason>${reason}</reason>
  <action>${action}</action>
${txnBlocks}
</report>
`;
}

/**
 * Build a goAML 4.0-shaped CTR XML document.
 *
 * CTRs are single-transaction reports, so the structure is leaner than STRs.
 */
export function buildGoAmlCtrXml(
  ctr: CurrencyTransactionReport,
  merchant: MerchantApplication,
  txn: StoredTxn,
): string {
  const rentityId = env("FIC_RENTITY_ID", "0000000");
  const rentityBranch = env("FIC_RENTITY_BRANCH", "HEAD OFFICE");
  const submissionDate = goAmlDateTime(new Date());
  const amount = txn.amount.toFixed(2);

  const draftHeader = `<!--
  =============================================================
  DRAFT goAML CTR — GENERATED BY FLAMINGO PAY COMPLIANCE PORTAL
  =============================================================
  CTR ID        : ${ctr.id}
  Merchant      : ${merchant.businessName} (${merchant.id})
  Amount        : ZAR ${amount}
  Generated at  : ${new Date().toISOString()}

  Review rentity_id and <reporting_person> before uploading.
  =============================================================
-->`;

  const fromFunds = fundsCodeFor(txn.rail);
  const toFunds = fundsCodeFor(txn.rail);
  const counterpartyBank = xmlEscape(txn.buyerBank ?? "Unknown bank");

  return `<?xml version="1.0" encoding="UTF-8"?>
${draftHeader}
<report xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="goAMLXML_4.0.0.xsd">
  <rentity_id>${xmlEscape(rentityId)}</rentity_id>
  <rentity_branch>${xmlEscape(rentityBranch)}</rentity_branch>
  <submission_code>E</submission_code>
  <report_code>CTR</report_code>
  <entity_reference>${xmlEscape(ctr.id)}</entity_reference>
  <submission_date>${submissionDate}</submission_date>
  <currency_code_local>ZAR</currency_code_local>
${reportingPersonBlock()}
  <location>
    <address_type>1</address_type>
    <address>${xmlEscape(env("FIC_ENTITY_ADDRESS", "1 Flamingo Lane"))}</address>
    <city>${xmlEscape(env("FIC_ENTITY_CITY", "Johannesburg"))}</city>
    <zip>${xmlEscape(env("FIC_ENTITY_POSTCODE", "0000"))}</zip>
    <country_code>ZA</country_code>
  </location>
  <transaction>
    <transactionnumber>${xmlEscape(txn.reference ?? txn.id)}</transactionnumber>
    <internal_ref_number>${xmlEscape(ctr.id)}</internal_ref_number>
    <transaction_location>ZA</transaction_location>
    <date_transaction>${goAmlDateTime(txn.timestamp)}</date_transaction>
    <transmode_code>${xmlEscape(transmodeCode(txn.rail))}</transmode_code>
    <amount_local>${amount}</amount_local>
    <t_from>
      <from_funds_code>${fromFunds}</from_funds_code>
      <from_country>ZA</from_country>
      <from_entity>
        <name>Unknown buyer via ${counterpartyBank}</name>
        <incorporation_country_code>ZA</incorporation_country_code>
      </from_entity>
    </t_from>
    <t_to_my_client>
      <to_funds_code>${toFunds}</to_funds_code>
      <to_country>ZA</to_country>
      <to_account>
        <institution_name>${xmlEscape(merchant.bank)}</institution_name>
        <swift>N/A</swift>
        <account>XXXXXXXX${xmlEscape(merchant.accountLast4)}</account>
        <currency_code>ZAR</currency_code>
        <account_name>${xmlEscape(merchant.businessName)}</account_name>
        <t_entity>
          <name>${xmlEscape(merchant.businessName)}</name>
          <incorporation_country_code>ZA</incorporation_country_code>
          ${merchant.cipcRegistrationNumber ? `<incorporation_number>${xmlEscape(merchant.cipcRegistrationNumber)}</incorporation_number>` : ""}
          <business>${xmlEscape(merchant.businessType)}</business>
${merchantAddressBlock(merchant)}
        </t_entity>
      </to_account>
    </t_to_my_client>
  </transaction>
</report>
`;
}
