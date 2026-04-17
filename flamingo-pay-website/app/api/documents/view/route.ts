import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/documents/view?url=<blobUrl>
 *
 * Private Vercel Blob URLs cannot be accessed directly — they return 403.
 * This proxy fetches the blob server-side (where the BLOB_READ_WRITE_TOKEN
 * is available) and streams it back to the admin's browser.
 *
 * Security: Only allows URLs from our own Vercel Blob store domain.
 */
export async function GET(req: NextRequest) {
  const blobUrl = req.nextUrl.searchParams.get("url");

  if (!blobUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Demo-mode URLs — nothing to proxy
  if (blobUrl.startsWith("demo://")) {
    return NextResponse.json(
      { error: "This is a demo upload — no real file exists." },
      { status: 404 },
    );
  }

  // Security: only allow our own blob store domain
  try {
    const parsed = new URL(blobUrl);
    if (!parsed.hostname.endsWith(".blob.vercel-storage.com")) {
      return NextResponse.json({ error: "Invalid blob URL" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "Blob storage not configured (missing BLOB_READ_WRITE_TOKEN)" },
      { status: 503 },
    );
  }

  try {
    // Use @vercel/blob's getDownloadUrl for a time-limited signed URL
    const { getDownloadUrl } = await import("@vercel/blob");
    const downloadUrl = await getDownloadUrl(blobUrl);
    // Redirect the admin to the signed URL
    return NextResponse.redirect(downloadUrl);
  } catch (err) {
    console.error("Blob view error:", err);

    // Fallback: try fetching with the token directly as auth header
    try {
      const res = await fetch(blobUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `Blob returned ${res.status}` },
          { status: res.status },
        );
      }

      const contentType = res.headers.get("content-type") || "application/octet-stream";
      const body = res.body;

      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, max-age=300",
          "Content-Disposition": "inline",
        },
      });
    } catch (fetchErr) {
      console.error("Blob fetch fallback error:", fetchErr);
      return NextResponse.json({ error: "Failed to retrieve document" }, { status: 500 });
    }
  }
}
