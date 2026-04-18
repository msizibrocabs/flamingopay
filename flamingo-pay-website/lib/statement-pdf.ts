/**
 * Flamingo Pay — Merchant Statement PDF Generator
 *
 * Generates professional monthly statements with:
 * - Flamingo logo & branding
 * - Merchant details & bank info
 * - Transaction table with rail, reference, bank, amount, fee, net
 * - Summary totals (gross, fees, refunds, net payout)
 * - Statement number, period, generation date
 * - Footer with company registration & SARB reference
 */

import "server-only";
import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";
import type { MerchantApplication, StoredTxn } from "./store";
import { FLAMINGO_FEE_RATE, FLAMINGO_FEE_FIXED } from "./store";

// ─── Brand colours ──────────────────────────────────────────
const PINK = [228, 62, 91] as const;       // #E43E5B
const DARK = [26, 26, 46] as const;        // #1A1A2E
const CREAM = [255, 248, 243] as const;    // #FFF8F3
const MINT = [200, 240, 220] as const;     // approx flamingo-mint
const BUTTER = [255, 237, 179] as const;   // approx flamingo-butter
const GREY60 = [120, 120, 140] as const;
const WHITE = [255, 255, 255] as const;

type RGB = readonly [number, number, number];

// ─── Helper: load logo as base64 data URL ───────────────────
let logoDataUrl: string | null = null;

function getLogoDataUrl(): string | null {
  if (logoDataUrl) return logoDataUrl;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo-primary.png");
    const buffer = fs.readFileSync(logoPath);
    logoDataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
    return logoDataUrl;
  } catch {
    return null;
  }
}

// ─── Types ──────────────────────────────────────────────────
export type StatementInput = {
  merchant: MerchantApplication;
  transactions: StoredTxn[];
  periodLabel: string;        // e.g. "March 2026" or "1 Mar – 15 Mar 2026"
  periodFrom: string;         // ISO date
  periodTo: string;           // ISO date
  statementNumber: string;    // e.g. "FP-2026-03-thandis-spaza"
};

export type StatementSummary = {
  totalTransactions: number;
  completedCount: number;
  refundedCount: number;
  grossAmount: number;
  totalFees: number;
  totalRefunds: number;
  netPayout: number;
};

// ─── Calculate summary ──────────────────────────────────────
export function calculateSummary(txns: StoredTxn[]): StatementSummary {
  let grossAmount = 0;
  let totalFees = 0;
  let totalRefunds = 0;
  let completedCount = 0;
  let refundedCount = 0;

  for (const t of txns) {
    if (t.status === "completed" || t.status === "partial_refund") {
      grossAmount += t.amount;
      totalFees += t.amount * FLAMINGO_FEE_RATE + FLAMINGO_FEE_FIXED;
      completedCount++;
    }
    if (t.status === "refunded") {
      refundedCount++;
      totalRefunds += t.amount;
    }
    if (t.status === "partial_refund" && t.refundAmount) {
      totalRefunds += t.refundAmount;
    }
  }

  return {
    totalTransactions: txns.length,
    completedCount,
    refundedCount,
    grossAmount,
    totalFees,
    totalRefunds,
    netPayout: grossAmount - totalFees - totalRefunds,
  };
}

// ─── Format helpers ─────────────────────────────────────────
function zar(amount: number): string {
  return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── PDF Generator ──────────────────────────────────────────
export function generateStatementPDF(input: StatementInput): Buffer {
  const { merchant, transactions, periodLabel, statementNumber } = input;
  const summary = calculateSummary(transactions);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const marginL = 18;
  const marginR = 18;
  const contentW = pageW - marginL - marginR;
  let y = 0;

  // ─── Helper: set colour ────────────────────────────────
  function setFill(c: RGB) { doc.setFillColor(c[0], c[1], c[2]); }
  function setText(c: RGB) { doc.setTextColor(c[0], c[1], c[2]); }
  function setDraw(c: RGB) { doc.setDrawColor(c[0], c[1], c[2]); }

  // ─── Helper: check if we need a new page ───────────────
  function needPage(spaceNeeded: number) {
    if (y + spaceNeeded > pageH - 30) {
      addFooter();
      doc.addPage();
      y = 15;
    }
  }

  // ─── HEADER BAR ────────────────────────────────────────
  setFill(PINK);
  doc.rect(0, 0, pageW, 42, "F");

  // Logo
  const logo = getLogoDataUrl();
  if (logo) {
    doc.addImage(logo, "PNG", marginL, 6, 30, 30);
  }

  // Company name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  setText(WHITE);
  doc.text("Flamingo Pay", marginL + 35, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("www.flamingopay.co.za", marginL + 35, 25);

  // Statement label on right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("MERCHANT STATEMENT", pageW - marginR, 18, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(periodLabel, pageW - marginR, 25, { align: "right" });

  y = 50;

  // ─── STATEMENT INFO BAR ────────────────────────────────
  setFill(CREAM);
  doc.rect(0, 42, pageW, 22, "F");
  setDraw(PINK);
  doc.setLineWidth(0.5);
  doc.line(0, 42, pageW, 42);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setText(GREY60);

  const infoY = 50;
  doc.text("STATEMENT NO.", marginL, infoY);
  doc.text("PERIOD", marginL + 55, infoY);
  doc.text("GENERATED", marginL + 115, infoY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setText(DARK);
  doc.text(statementNumber, marginL, infoY + 5);
  doc.text(periodLabel, marginL + 55, infoY + 5);
  doc.text(fmtDate(new Date().toISOString()), marginL + 115, infoY + 5);

  y = 68;

  // ─── MERCHANT DETAILS (left) + BANK DETAILS (right) ───
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setText(PINK);
  doc.text("MERCHANT DETAILS", marginL, y);
  doc.text("PAYOUT BANK DETAILS", pageW / 2 + 5, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setText(DARK);

  const details = [
    ["Business", merchant.businessName],
    ["Owner", merchant.ownerName],
    ["Phone", merchant.phone],
    ["Type", merchant.businessType],
    ["Merchant ID", merchant.id],
  ];

  const bankDetails = [
    ["Bank", merchant.bank],
    ["Account", `•••• ${merchant.accountLast4}`],
    ["Account type", merchant.accountType === "cheque" ? "Cheque" : "Savings"],
    ["KYC tier", merchant.kycTier === "simplified" ? "Simplified" : merchant.kycTier === "standard" ? "Standard" : "Enhanced"],
  ];

  for (let i = 0; i < Math.max(details.length, bankDetails.length); i++) {
    if (details[i]) {
      doc.setFont("helvetica", "normal");
      setText(GREY60);
      doc.text(details[i][0] + ":", marginL, y);
      setText(DARK);
      doc.setFont("helvetica", "bold");
      doc.text(details[i][1], marginL + 28, y);
    }
    if (bankDetails[i]) {
      doc.setFont("helvetica", "normal");
      setText(GREY60);
      doc.text(bankDetails[i][0] + ":", pageW / 2 + 5, y);
      setText(DARK);
      doc.setFont("helvetica", "bold");
      doc.text(bankDetails[i][1], pageW / 2 + 35, y);
    }
    y += 5;
  }

  y += 4;

  // ─── SUMMARY CARDS ─────────────────────────────────────
  setDraw([220, 220, 230]);
  doc.setLineWidth(0.3);
  doc.line(marginL, y, pageW - marginR, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setText(PINK);
  doc.text("STATEMENT SUMMARY", marginL, y);
  y += 5;

  // Summary boxes
  const boxW = (contentW - 9) / 4; // 4 boxes with 3px gaps
  const boxH = 20;
  const boxes = [
    { label: "Gross Sales", value: zar(summary.grossAmount), bg: MINT },
    { label: "Total Fees", value: zar(summary.totalFees), bg: BUTTER },
    { label: "Refunds", value: zar(summary.totalRefunds), bg: [255, 220, 220] as RGB },
    { label: "Net Payout", value: zar(summary.netPayout), bg: [220, 235, 255] as RGB },
  ];

  for (let i = 0; i < boxes.length; i++) {
    const bx = marginL + i * (boxW + 3);
    setFill(boxes[i].bg);
    doc.roundedRect(bx, y, boxW, boxH, 2, 2, "F");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    setText(GREY60);
    doc.text(boxes[i].label.toUpperCase(), bx + 3, y + 6);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    setText(DARK);
    doc.text(boxes[i].value, bx + 3, y + 14);
  }

  y += boxH + 5;

  // Additional summary line
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  setText(GREY60);
  doc.text(
    `${summary.totalTransactions} total transactions · ${summary.completedCount} completed · ${summary.refundedCount} refunded · Fee rate: ${(FLAMINGO_FEE_RATE * 100).toFixed(1)}% + R${FLAMINGO_FEE_FIXED.toFixed(2)}/txn`,
    marginL,
    y,
  );
  y += 7;

  // ─── TRANSACTION TABLE ─────────────────────────────────
  setDraw([220, 220, 230]);
  doc.setLineWidth(0.3);
  doc.line(marginL, y, pageW - marginR, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setText(PINK);
  doc.text("TRANSACTION DETAILS", marginL, y);
  y += 5;

  // Table header
  const cols = [
    { label: "Date", x: marginL, w: 30 },
    { label: "Rail", x: marginL + 30, w: 14 },
    { label: "Reference", x: marginL + 44, w: 32 },
    { label: "Buyer Bank", x: marginL + 76, w: 28 },
    { label: "Amount", x: marginL + 104, w: 24 },
    { label: "Fee", x: marginL + 128, w: 20 },
    { label: "Net", x: marginL + 148, w: 26 },
  ];

  setFill(DARK);
  doc.roundedRect(marginL, y, contentW, 7, 1, 1, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  setText(WHITE);
  for (const col of cols) {
    const align = ["Amount", "Fee", "Net"].includes(col.label) ? "right" : "left";
    if (align === "right") {
      doc.text(col.label, col.x + col.w - 1, y + 5, { align: "right" });
    } else {
      doc.text(col.label, col.x + 2, y + 5);
    }
  }
  y += 9;

  // Table rows
  doc.setFontSize(7.5);
  let stripe = false;

  // Sort transactions by date (newest first)
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  for (const txn of sorted) {
    needPage(7);

    if (stripe) {
      setFill(CREAM);
      doc.rect(marginL, y - 1, contentW, 6, "F");
    }
    stripe = !stripe;

    const fee = (txn.status === "completed" || txn.status === "partial_refund")
      ? txn.amount * FLAMINGO_FEE_RATE + FLAMINGO_FEE_FIXED
      : 0;
    const net = (txn.status === "completed" || txn.status === "partial_refund")
      ? txn.amount - fee
      : 0;

    doc.setFont("helvetica", "normal");
    setText(DARK);

    // Date
    doc.text(fmtDateTime(txn.timestamp), cols[0].x + 2, y + 3);

    // Rail badge
    if (txn.rail === "payshap") {
      setFill(MINT);
      doc.roundedRect(cols[1].x + 1, y - 0.5, 12, 5, 1, 1, "F");
      setText([30, 100, 60]);
    } else {
      setFill([210, 230, 250]);
      doc.roundedRect(cols[1].x + 1, y - 0.5, 12, 5, 1, 1, "F");
      setText([40, 80, 150]);
    }
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(txn.rail === "payshap" ? "PayShap" : "EFT", cols[1].x + 7, y + 3, { align: "center" });

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    setText(DARK);

    // Reference (truncate)
    const ref = txn.reference.length > 14 ? txn.reference.slice(0, 14) + "…" : txn.reference;
    doc.text(ref, cols[2].x + 2, y + 3);

    // Bank
    const bank = txn.buyerBank.length > 12 ? txn.buyerBank.slice(0, 12) + "…" : txn.buyerBank;
    doc.text(bank, cols[3].x + 2, y + 3);

    // Amount
    doc.setFont("helvetica", "bold");
    if (txn.status === "refunded") {
      setText([180, 60, 60]);
    } else {
      setText(DARK);
    }
    doc.text(zar(txn.amount), cols[4].x + cols[4].w - 1, y + 3, { align: "right" });

    // Fee
    doc.setFont("helvetica", "normal");
    setText(GREY60);
    doc.text(fee > 0 ? zar(fee) : "—", cols[5].x + cols[5].w - 1, y + 3, { align: "right" });

    // Net
    doc.setFont("helvetica", "bold");
    setText(DARK);
    doc.text(net > 0 ? zar(net) : "—", cols[6].x + cols[6].w - 1, y + 3, { align: "right" });

    // Refund badge
    if (txn.status === "refunded") {
      doc.setFontSize(5.5);
      setFill([255, 200, 200]);
      doc.roundedRect(cols[6].x + cols[6].w + 1, y - 0.5, 9, 5, 1, 1, "F");
      setText([180, 40, 40]);
      doc.setFont("helvetica", "bold");
      doc.text("REF", cols[6].x + cols[6].w + 5.5, y + 3, { align: "center" });
      doc.setFontSize(7.5);
    }
    if (txn.status === "partial_refund") {
      doc.setFontSize(5.5);
      setFill(BUTTER);
      doc.roundedRect(cols[6].x + cols[6].w + 1, y - 0.5, 9, 5, 1, 1, "F");
      setText(DARK);
      doc.setFont("helvetica", "bold");
      doc.text("P/R", cols[6].x + cols[6].w + 5.5, y + 3, { align: "center" });
      doc.setFontSize(7.5);
    }

    y += 6;
  }

  // Table bottom border
  y += 2;
  setDraw([220, 220, 230]);
  doc.setLineWidth(0.3);
  doc.line(marginL, y, pageW - marginR, y);
  y += 6;

  // ─── TOTALS BOX ────────────────────────────────────────
  needPage(40);

  const totalsX = pageW - marginR - 70;
  setFill(CREAM);
  doc.roundedRect(totalsX - 5, y - 2, 75, 35, 2, 2, "F");
  setDraw(PINK);
  doc.setLineWidth(0.5);
  doc.roundedRect(totalsX - 5, y - 2, 75, 35, 2, 2, "S");

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  setText(GREY60);
  doc.text("Gross sales:", totalsX, y + 4);
  doc.text("Fees:", totalsX, y + 10);
  doc.text("Refunds:", totalsX, y + 16);

  doc.setFont("helvetica", "bold");
  setText(DARK);
  doc.text(zar(summary.grossAmount), totalsX + 65, y + 4, { align: "right" });
  setText([228, 62, 91]);
  doc.text(`-${zar(summary.totalFees)}`, totalsX + 65, y + 10, { align: "right" });
  doc.text(`-${zar(summary.totalRefunds)}`, totalsX + 65, y + 16, { align: "right" });

  // Divider line
  setDraw(PINK);
  doc.setLineWidth(0.3);
  doc.line(totalsX, y + 20, totalsX + 65, y + 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setText(DARK);
  doc.text("NET PAYOUT:", totalsX, y + 28);
  doc.text(zar(summary.netPayout), totalsX + 65, y + 28, { align: "right" });

  y += 42;

  // ─── NOTES ─────────────────────────────────────────────
  needPage(20);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  setText(GREY60);
  doc.text(
    "This statement is auto-generated by Flamingo Pay (Pty) Ltd. Fees are calculated at " +
    `${(FLAMINGO_FEE_RATE * 100).toFixed(1)}% + R${FLAMINGO_FEE_FIXED.toFixed(2)} per completed transaction. ` +
    "Settlements are processed via Ozow within 1–2 business days.",
    marginL,
    y,
    { maxWidth: contentW },
  );
  y += 12;

  doc.text(
    "For queries regarding this statement, contact support@flamingopay.co.za or your Flamingo account manager.",
    marginL,
    y,
    { maxWidth: contentW },
  );

  // ─── FOOTER ────────────────────────────────────────────
  addFooter();

  function addFooter() {
    const footerY = pageH - 12;
    setFill(DARK);
    doc.rect(0, footerY - 3, pageW, 15, "F");

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    setText(WHITE);
    doc.text("Flamingo Pay (Pty) Ltd", marginL, footerY + 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    setText([180, 180, 200]);
    doc.text(
      "Reg: 2025/XXXXXX/07  ·  SARB PSP Licence: Pending  ·  PASA Member: Pending  ·  www.flamingopay.co.za",
      marginL,
      footerY + 7,
    );
    doc.text(
      `Statement ${statementNumber}  ·  Page ${doc.getNumberOfPages()}`,
      pageW - marginR,
      footerY + 7,
      { align: "right" },
    );
  }

  // Return as Buffer
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
