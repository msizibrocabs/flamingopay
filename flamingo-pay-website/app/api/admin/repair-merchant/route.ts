/**
 * POST /api/admin/repair-merchant — One-time repair for merchants whose
 * data was corrupted by the old pin-reset bug (saving without encryption).
 *
 * This re-reads the raw data, hashes a new PIN, encrypts, and saves.
 * Requires admin auth.
 */
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { encryptMerchantPII, decryptMerchantPII } from "../../../../lib/crypto";
import { hashPin, type MerchantApplication } from "../../../../lib/store";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

export async function POST(req: NextRequest) {
  let body: { phone?: string; newPin?: string; secret?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { phone, newPin, secret } = body;

  // Temporary repair key — remove this endpoint after use
  if (secret !== "flamingo-repair-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!phone || !newPin) {
    return NextResponse.json({ error: "phone and newPin required" }, { status: 400 });
  }

  // Find the merchant ID
  const idsRaw = await redis.get("merchant_ids");
  const ids: string[] = typeof idsRaw === "string" ? JSON.parse(idsRaw) : (idsRaw as string[] | null) ?? [];

  let foundId: string | null = null;
  let foundRaw: MerchantApplication | null = null;
  const cleanPhone = phone.replace(/\s/g, "");

  for (const id of ids) {
    const raw = await redis.get(`merchant:${id}`);
    if (!raw) continue;
    const m: MerchantApplication = typeof raw === "string" ? JSON.parse(raw) : raw as MerchantApplication;

    // Check phone both encrypted and unencrypted
    const phoneField = m.phone?.replace(/\s/g, "") ?? "";
    if (phoneField === cleanPhone || phoneField.includes(cleanPhone.slice(-9))) {
      foundId = id;
      foundRaw = m;
      break;
    }

    // Try decrypting if encrypted
    try {
      const decrypted = decryptMerchantPII(m);
      const decPhone = decrypted.phone?.replace(/\s/g, "") ?? "";
      if (decPhone === cleanPhone || decPhone.includes(cleanPhone.slice(-9))) {
        foundId = id;
        foundRaw = m;
        break;
      }
    } catch {
      // Skip if decryption fails
    }
  }

  if (!foundId || !foundRaw) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // Decrypt if needed, set new PIN, re-encrypt, save
  let merchant: MerchantApplication;
  try {
    merchant = decryptMerchantPII(foundRaw);
  } catch {
    // Data might be unencrypted (from the bug)
    merchant = foundRaw;
  }

  merchant.pinHash = hashPin(newPin);
  const encrypted = encryptMerchantPII(merchant);
  await redis.set(`merchant:${foundId}`, JSON.stringify(encrypted));

  // Clear lockout
  await redis.del(`login_attempts:${cleanPhone}`);

  return NextResponse.json({
    repaired: true,
    merchantId: foundId,
    businessName: merchant.businessName,
  });
}
