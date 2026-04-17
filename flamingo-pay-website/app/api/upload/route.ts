import { NextRequest, NextResponse } from "next/server";
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

    let blobUrl: string | undefined;

    // Try Vercel Blob if token is configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const blob = await put(
        `kyc/${merchantId}/${kind}-${Date.now()}.${extFor(file.type)}`,
        file,
        { access: "private" },
      );
      blobUrl = blob.url;
    } else {
      // No Blob token — accept the upload anyway (demo mode).
      // In production you MUST set BLOB_READ_WRITE_TOKEN.
      blobUrl = `demo://kyc/${merchantId}/${kind}-${file.name}`;
    }

    // If the merchant already exists in Redis, update their document record.
    // During signup the merchant doesn't exist yet — the docs get created
    // when createMerchant() runs after signup completes.
    if (merchantId !== "signup-pending") {
      await updateMerchantDocument(merchantId, kind, {
        status: "submitted",
        fileName: file.name,
        blobUrl,
      });
    }

    return NextResponse.json({
      url: blobUrl,
      kind,
      merchantId,
      fileName: file.name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("Upload error:", message, err);
    return NextResponse.json(
      { error: message },
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
