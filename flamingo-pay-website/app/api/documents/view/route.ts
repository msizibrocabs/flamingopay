import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

/**
 * GET /api/documents/view?url=<blobUrl>
 *
 * Private Vercel Blob URLs return 403 when hit directly in the browser.
 * This route uses the @vercel/blob SDK (which reads BLOB_READ_WRITE_TOKEN
 * from the environment automatically) to download the file server-side
 * and stream it to the caller.
 */
export async function GET(req: NextRequest) {
  const blobUrl = req.nextUrl.searchParams.get("url");

  if (!blobUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (blobUrl.startsWith("demo://")) {
    return new NextResponse("Demo upload — no real file stored.", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Only allow our own blob store
  try {
    const parsed = new URL(blobUrl);
    if (!parsed.hostname.endsWith(".blob.vercel-storage.com")) {
      return NextResponse.json({ error: "Invalid blob URL" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Blob storage not configured" }, { status: 503 });
  }

  try {
    // SDK's get() authenticates via BLOB_READ_WRITE_TOKEN env var
    const blob = await get(blobUrl, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!blob || blob.statusCode !== 200) {
      return NextResponse.json({ error: "File not found in blob store" }, { status: 404 });
    }

    // Stream the file content directly to the browser
    const contentType =
      blob.headers.get("content-type") ||
      blob.blob?.contentType ||
      "application/octet-stream";

    return new NextResponse(blob.stream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
        "Content-Disposition": "inline",
      },
    });
  } catch (err) {
    console.error("Document view error:", err);
    const msg = err instanceof Error ? err.message : "Failed to retrieve document";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
