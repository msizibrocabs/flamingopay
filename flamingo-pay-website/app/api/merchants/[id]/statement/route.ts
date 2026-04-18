import { NextRequest, NextResponse } from "next/server";
import { getMerchant, listTransactions } from "../../../../../lib/store";
import { generateStatementPDF } from "../../../../../lib/statement-pdf";

export const dynamic = "force-dynamic";

/**
 * GET /api/merchants/:id/statement?from=2026-03-01&to=2026-03-31&month=2026-03
 *
 * Query params:
 *   month — YYYY-MM (calendar month shortcut, overrides from/to)
 *   from  — YYYY-MM-DD start date
 *   to    — YYYY-MM-DD end date
 *
 * Returns a PDF file.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const merchant = await getMerchant(id);
  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  let fromDate: string;
  let toDate: string;
  let periodLabel: string;

  const month = url.searchParams.get("month");
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    // Calendar month
    const [yr, mo] = month.split("-").map(Number);
    fromDate = `${month}-01`;
    // Last day of month
    const lastDay = new Date(yr, mo, 0).getDate();
    toDate = `${month}-${String(lastDay).padStart(2, "0")}`;
    periodLabel = new Date(yr, mo - 1).toLocaleDateString("en-ZA", {
      month: "long",
      year: "numeric",
    });
  } else {
    fromDate = url.searchParams.get("from") || "";
    toDate = url.searchParams.get("to") || "";
    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: "Provide ?month=YYYY-MM or ?from=YYYY-MM-DD&to=YYYY-MM-DD" },
        { status: 400 },
      );
    }
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }
    const fmtShort = (iso: string) =>
      new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
    periodLabel = `${fmtShort(fromDate)} – ${fmtShort(toDate)}`;
  }

  // Fetch all transactions and filter by date range
  const allTxns = await listTransactions(id);
  const filtered = allTxns.filter(t => {
    const d = new Date(t.timestamp).toISOString().slice(0, 10);
    return d >= fromDate && d <= toDate;
  });

  // Generate statement number
  const stmtNum = `FP-${fromDate.slice(0, 7)}-${id}`.toUpperCase();

  const pdfBuffer = generateStatementPDF({
    merchant,
    transactions: filtered,
    periodLabel,
    periodFrom: fromDate,
    periodTo: toDate,
    statementNumber: stmtNum,
  });

  const filename = `Flamingo-Statement-${merchant.businessName.replace(/[^a-zA-Z0-9]/g, "-")}-${fromDate}-to-${toDate}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
