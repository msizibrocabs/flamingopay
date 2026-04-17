import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { updateMerchantDocument, type DocumentKind } from "../../../lib/store";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const VALID_KINDS = new Set<DocumentKind>([
  "id",
  "selfie",
  "affidavit",
  "company_reg",
  "proof_of_address",
  "bank_letter",
  "source_of_funds",
]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const merchantId = formData.get("merchantId") as string | null;
    const kind = formData.get("kind") as DocumentKind | null;

    if (!file || !merchantId || !kind) {
      return NextResponse.json(
        { error: "Missing required fields: file, merchantId, kind" },
        { status: 400 },
      );
    }

    if (!VALID_KINDS.has(kind)) {
      return NextResponse.json(
        { error: `Invalid document kind: ${kind}` },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Use JPEG, PNG, WebP, or PDF." },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5 MB." },
        { status: 400 },
      );
    }

    // Upload to Vercel Blob
    const blob = await put(
      `kyc/${merchantId}/${kind}-${Date.now()}.${extFor(file.type)}`,
      file,
      { access: "public" },
    );

    // Update the merchant document record in Redis
    const updated = await updateMerchantDocument(merchantId, kind, {
      status: "submitted",
      fileName: file.name,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      url: blob.url,
      kind,
      merchantId,
      fileName: file.name,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 },
    );
  }
}

function extFor(mime: string): string {
  switch (mime) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "application/pdf": return "pdf";
    default: return "bin";
  }
}
