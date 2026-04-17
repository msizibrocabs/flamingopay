import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/documents/view?url=<blobUrl>
 *
 * Private Vercel Blob URLs return 403 when accessed directly.
 * This route fetches the blob server-side using the SDK (which has
 * access to BLOB_READ_WRITE_TOKEN) and streams the file content
 * directly to the admin's browser.
 */
export async function GET(req: NextRequest) {
  const blobUrl = req.nextUrl.searchParams.get("url");

  if (!blobUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Demo-mode URLs — nothing to proxy
  if (blobUrl.startsWith("demo://")) {
    return new NextResponse("This is a demo upload — no real file was stored.", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
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

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Blob storage not configured" },
      { status: 503 },
    );
  }

  try {
    // Use the Vercel Blob SDK to download the private file server-side
    const blob = await import("@vercel/blob");

    // blob.get() returns metadata; we need the actual content.
    // For private blobs, we fetch using the token in the Authorization header.
    const response = await fetch(blobUrl, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      // Try the SDK's getDownloadUrl as a fallback
      try {
        const downloadUrl = await blob.getDownloadUrl(blobUrl);
        const dlRes = await fetch(downloadUrl);
        if (dlRes.ok && dlRes.body) {
          const ct = dlRes.headers.get("content-type") || "application/octet-stream";
          return new NextResponse(dlRes.body, {
            status: 200,
            headers: {
              "Content-Type": ct,
              "Cache-Control": "private, max-age=300",
              "Content-Disposition": "inline",
            },
          });
        }
      } catch {
        // fall through to error
      }

      return NextResponse.json(
        { error: `Could not retrieve file (${response.status})` },
        { status: response.status },
      );
    }

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
        "Content-Disposition": "inline",
      },
    });
  } catch (err) {
    console.error("Document view error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve document" },
      { status: 500 },
    );
  }
}
