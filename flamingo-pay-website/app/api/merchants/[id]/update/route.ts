import { NextRequest, NextResponse } from "next/server";
import { getMerchant } from "../../../../../lib/store";
import { appendAuditLog } from "../../../../../lib/audit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

export const dynamic = "force-dynamic";

/** PATCH /api/merchants/:id/update — merchant self-service profile update. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const m = await getMerchant(id);
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only allow updating safe fields
  const EDITABLE = ["businessName", "address", "ownerName", "bank", "accountType"] as const;
  const changes: string[] = [];

  for (const key of EDITABLE) {
    if (body[key] !== undefined && typeof body[key] === "string") {
      const oldVal = (m as Record<string, unknown>)[key];
      if (oldVal !== body[key]) {
        (m as Record<string, unknown>)[key] = body[key];
        changes.push(`${key}: "${oldVal}" → "${body[key]}"`);
      }
    }
  }

  if (changes.length === 0) {
    return NextResponse.json({ merchant: m, changed: false });
  }

  await redis.set(`merchant:${id}`, JSON.stringify(m));

  await appendAuditLog({
    action: "merchant_profile_updated",
    role: "merchant",
    actorId: id,
    actorName: m.businessName,
    targetId: id,
    targetType: "merchant",
    detail: `Profile updated: ${changes.join(", ")}`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return NextResponse.json({ merchant: m, changed: true });
}

/** DELETE /api/merchants/:id/update — POPIA right to erasure. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const m = await getMerchant(id);
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Remove merchant data
  const idsRaw = await redis.get("merchant_ids");
  const ids: string[] = typeof idsRaw === "string" ? JSON.parse(idsRaw) : (idsRaw as string[] | null) ?? [];
  const filtered = ids.filter(i => i !== id);

  await redis.pipeline()
    .del(`merchant:${id}`)
    .del(`txns:${id}`)
    .set("merchant_ids", JSON.stringify(filtered))
    .exec();

  await appendAuditLog({
    action: "account_deleted",
    role: "merchant",
    actorId: id,
    actorName: m.businessName,
    targetId: id,
    targetType: "merchant",
    detail: `Merchant account deleted (POPIA erasure request)`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return NextResponse.json({ deleted: true });
}
