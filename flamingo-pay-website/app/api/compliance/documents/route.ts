/**
 * GET /api/compliance/documents — Document review queue.
 *
 * Returns all merchants that have documents needing human review,
 * along with their VerifyNow automated KYC results for context.
 *
 * Query params:
 *   ?filter=pending    — only merchants with submitted (unreviewed) docs (default)
 *   ?filter=rejected   — only merchants with rejected docs awaiting resubmission
 *   ?filter=all        — all merchants with documents
 *   ?merchantId=FP-xxx — single merchant
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "../../../../lib/api-auth";
import { listMerchants, type MerchantApplication, type MerchantDocument } from "../../../../lib/store";
import { getKycRecord, type KycVerificationRecord } from "../../../../lib/verifynow";

export const dynamic = "force-dynamic";

type DocReviewItem = {
  merchantId: string;
  merchantName: string;
  ownerName: string;
  businessType: string;
  kycTier: string;
  merchantStatus: string;
  createdAt: string;
  documents: MerchantDocument[];
  /** VerifyNow automated KYC results — null if not yet run */
  kycRecord: KycVerificationRecord | null;
  /** Summary counts */
  counts: {
    total: number;
    submitted: number;
    verified: number;
    rejected: number;
    required: number;
  };
};

export async function GET(req: NextRequest) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") ?? "pending";
  const singleId = url.searchParams.get("merchantId");

  const merchants = await listMerchants();
  const targets = singleId
    ? merchants.filter(m => m.id === singleId)
    : merchants;

  const queue: DocReviewItem[] = [];
  let totalPending = 0;
  let totalRejected = 0;
  let totalVerified = 0;

  for (const m of targets) {
    if (!m.documents || m.documents.length === 0) continue;

    const counts = {
      total: m.documents.length,
      submitted: m.documents.filter(d => d.status === "submitted").length,
      verified: m.documents.filter(d => d.status === "verified").length,
      rejected: m.documents.filter(d => d.status === "rejected").length,
      required: m.documents.filter(d => d.status === "required").length,
    };

    // Apply filter
    if (filter === "pending" && counts.submitted === 0) continue;
    if (filter === "rejected" && counts.rejected === 0) continue;

    // Get VerifyNow record for context
    const kycRecord = await getKycRecord(m.id);

    queue.push({
      merchantId: m.id,
      merchantName: m.businessName,
      ownerName: m.ownerName,
      businessType: m.businessType,
      kycTier: m.kycTier,
      merchantStatus: m.status,
      createdAt: m.createdAt,
      documents: m.documents,
      kycRecord,
      counts,
    });

    totalPending += counts.submitted;
    totalRejected += counts.rejected;
    totalVerified += counts.verified;
  }

  // Sort: merchants with most pending docs first
  queue.sort((a, b) => b.counts.submitted - a.counts.submitted);

  return NextResponse.json({
    queue,
    summary: {
      merchantsInQueue: queue.length,
      totalPending,
      totalRejected,
      totalVerified,
    },
  });
}
