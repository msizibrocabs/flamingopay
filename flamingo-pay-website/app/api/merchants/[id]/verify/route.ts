/**
 * KYC Verification API — VerifyNow Integration
 *
 * POST /api/merchants/[id]/verify  — Trigger full KYC verification
 * GET  /api/merchants/[id]/verify  — Get verification status & results
 */

import { NextRequest, NextResponse } from "next/server";
import { getMerchant, updateMerchantFields } from "../../../../../lib/store";
import {
  runFullKycVerification,
  getKycRecord,
  requiredChecksForTier,
  estimateCredits,
  type KycVerificationInput,
} from "../../../../../lib/verifynow";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // KYC checks can take up to 2 minutes

type Params = { params: Promise<{ id: string }> };

/**
 * GET — Retrieve verification status for a merchant.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const merchant = await getMerchant(id);
  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  const record = await getKycRecord(id);
  const isRegisteredBiz = !!merchant.cipcRegistrationNumber;
  const requiredChecks = requiredChecksForTier(
    merchant.kycTier,
    isRegisteredBiz,
  );

  return NextResponse.json({
    merchantId: id,
    kycTier: merchant.kycTier,
    overallStatus: record?.status ?? "not_started",
    requiredChecks,
    estimatedCredits: estimateCredits(requiredChecks),
    record: record
      ? {
          status: record.status,
          startedAt: record.startedAt,
          completedAt: record.completedAt,
          checks: record.checks.map((c) => ({
            service: c.service,
            status: c.status,
            confidence: c.confidence,
            summary: c.summary,
            completedAt: c.completedAt,
            credits: c.credits,
          })),
          isPep: record.isPep,
          hasSanctionsHit: record.hasSanctionsHit,
          totalCredits: record.totalCredits,
          notes: record.notes,
        }
      : null,
  });
}

/**
 * POST — Trigger full KYC verification for a merchant.
 *
 * Body:
 *   idNumber:       string (required) — 13-digit SA ID
 *   selfieBase64?:  string            — base64-encoded selfie
 *   cipcRegistrationNumber?: string   — for registered businesses
 *   dateOfBirth?:   string            — YYYY-MM-DD
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const merchant = await getMerchant(id);
  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // Check if verification is already in progress
  const existing = await getKycRecord(id);
  if (existing?.status === "in_progress") {
    return NextResponse.json(
      { error: "Verification already in progress", record: existing },
      { status: 409 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const idNumber = body.idNumber as string;
  if (!idNumber || typeof idNumber !== "string" || idNumber.length !== 13) {
    return NextResponse.json(
      { error: "idNumber must be a 13-digit SA ID number" },
      { status: 400 },
    );
  }

  // Validate SA ID number format (basic Luhn check)
  if (!/^\d{13}$/.test(idNumber)) {
    return NextResponse.json(
      { error: "idNumber must contain only digits" },
      { status: 400 },
    );
  }

  const input: KycVerificationInput = {
    merchantId: id,
    idNumber,
    fullName: merchant.ownerName,
    selfieBase64: (body.selfieBase64 as string) || undefined,
    bankName: merchant.bank,
    accountNumber: body.accountNumber as string || "",
    accountType: merchant.accountType,
    cipcRegistrationNumber:
      (body.cipcRegistrationNumber as string) ||
      merchant.cipcRegistrationNumber ||
      undefined,
    businessName: merchant.businessName,
    dateOfBirth: (body.dateOfBirth as string) || undefined,
  };

  // Run verification (this may take 30-90 seconds)
  const result = await runFullKycVerification(input);

  // Update merchant record with KYC result
  await updateMerchantFields(id, {
    kycVerificationStatus: result.status,
    idNumberMasked: result.idNumberMasked,
    isPep: result.isPep,
    cipcRegistrationNumber: input.cipcRegistrationNumber,
    // Auto-approve if fully verified
    ...(result.status === "verified"
      ? { status: "approved", approvedAt: new Date().toISOString() }
      : {}),
  });

  return NextResponse.json({
    merchantId: id,
    status: result.status,
    checks: result.checks.map((c) => ({
      service: c.service,
      status: c.status,
      confidence: c.confidence,
      summary: c.summary,
    })),
    isPep: result.isPep,
    hasSanctionsHit: result.hasSanctionsHit,
    totalCredits: result.totalCredits,
    notes: result.notes,
    autoApproved: result.status === "verified",
  });
}
