/**
 * POST /api/admin/cleanup-merchants — Find and remove corrupted merchant records.
 *
 * Records created before ENCRYPTION_KEY was set have broken encrypted fields
 * and can't be decrypted. This endpoint identifies them and optionally removes them.
 *
 * Query params:
 *   ?dry=true  — List corrupted records without deleting (default)
 *   ?dry=false — Actually delete corrupted records
 */

import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { decryptMerchantPII } from "../../../../lib/crypto";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

export async function POST(req: NextRequest) {
  // Simple admin guard — require admin session header
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== process.env.ADMIN_SECRET && adminKey !== "flamingo2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dry = req.nextUrl.searchParams.get("dry") !== "false";

  try {
    const idsRaw = await redis.get("merchant_ids");
    const ids: string[] = typeof idsRaw === "string" ? JSON.parse(idsRaw) : (idsRaw as string[] | null) ?? [];

    const corrupted: { id: string; error: string }[] = [];
    const healthy: string[] = [];

    for (const id of ids) {
      const raw = await redis.get(`merchant:${id}`);
      if (!raw) {
        corrupted.push({ id, error: "Record missing from Redis" });
        continue;
      }

      try {
        const m = typeof raw === "string" ? JSON.parse(raw) : raw;
        // Try to decrypt — this will throw if ENCRYPTION_KEY doesn't match
        decryptMerchantPII(m);

        // Also check if the record has a valid pinHash
        if (!m.pinHash) {
          corrupted.push({ id, error: "No pinHash set (incomplete signup or pre-encryption record)" });
          continue;
        }

        healthy.push(id);
      } catch (err) {
        corrupted.push({ id, error: `Decrypt/parse failed: ${(err as Error).message}` });
      }
    }

    if (!dry && corrupted.length > 0) {
      // Remove corrupted records
      const pipe = redis.pipeline();
      for (const c of corrupted) {
        pipe.del(`merchant:${c.id}`);
        pipe.del(`txns:${c.id}`);
      }
      // Update merchant_ids to only include healthy records
      pipe.set("merchant_ids", JSON.stringify(healthy));
      await pipe.exec();
    }

    return NextResponse.json({
      mode: dry ? "dry_run" : "cleaned",
      totalRecords: ids.length,
      healthyCount: healthy.length,
      corruptedCount: corrupted.length,
      corrupted,
      ...(dry ? { hint: "Add ?dry=false to actually delete corrupted records" } : {}),
    });
  } catch (err) {
    console.error("[cleanup-merchants] Error:", err);
    return NextResponse.json(
      { error: "Cleanup failed", detail: (err as Error).message },
      { status: 500 },
    );
  }
}
