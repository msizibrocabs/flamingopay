/**
 * POST /api/admin/diagnose-merchant — Debug endpoint to inspect merchant data state.
 * Shows hash format, encryption state, and PIN verification result.
 * Remove after debugging is complete.
 */
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { decrypt, isEncrypted, PII_FIELDS } from "../../../../lib/crypto";
import { hashPin, verifyPin } from "../../../../lib/store";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

export async function POST(req: NextRequest) {
  let body: { phone?: string; testPin?: string; secret?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { phone, testPin, secret } = body;

  if (secret !== "flamingo-repair-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!phone) {
    return NextResponse.json({ error: "phone required" }, { status: 400 });
  }

  const cleanPhone = phone.replace(/\s/g, "");

  // Get all merchant IDs
  const idsRaw = await redis.get("merchant_ids");
  const ids: string[] = typeof idsRaw === "string" ? JSON.parse(idsRaw) : (idsRaw as string[] | null) ?? [];

  const diagnostics: Record<string, unknown>[] = [];

  for (const id of ids) {
    const raw = await redis.get(`merchant:${id}`);
    if (!raw) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m: any = typeof raw === "string" ? JSON.parse(raw) : raw;

    // Check phone field state
    const phoneField = m.phone ?? "";
    const phoneEncrypted = isEncrypted(phoneField);
    let decryptedPhone = phoneField;
    if (phoneEncrypted) {
      try {
        decryptedPhone = decrypt(phoneField);
      } catch {
        decryptedPhone = "[DECRYPTION_FAILED]";
      }
    }

    const phoneClean = decryptedPhone.replace(/\s/g, "");
    const isMatch = phoneClean === cleanPhone || phoneClean.includes(cleanPhone.slice(-9));

    if (!isMatch) continue;

    // Build diagnostic report
    const report: Record<string, unknown> = {
      merchantId: id,
      businessName: m.businessName,
      status: m.status,

      // Phone state
      phoneRaw: phoneField.substring(0, 20) + (phoneField.length > 20 ? "..." : ""),
      phoneEncrypted,
      phoneDecrypted: decryptedPhone,

      // PII encryption state
      piiFieldStates: {} as Record<string, string>,

      // PIN hash state
      pinHashExists: !!m.pinHash,
      pinHashValue: m.pinHash ? m.pinHash.substring(0, 20) + "..." : "MISSING",
      pinHashLength: m.pinHash?.length ?? 0,
      pinHashIsBcrypt: m.pinHash?.startsWith("$2") ?? false,
      pinHashIsLegacySHA: m.pinHash ? (m.pinHash.length === 64 && /^[0-9a-f]+$/.test(m.pinHash)) : false,
      pinHashIsEncrypted: m.pinHash ? isEncrypted(m.pinHash) : false,

      // Lockout state
      lockoutKey: `login_attempts:${cleanPhone}`,
    };

    // Check each PII field
    for (const field of PII_FIELDS) {
      const val = m[field];
      if (typeof val === "string") {
        (report.piiFieldStates as Record<string, string>)[field] = isEncrypted(val)
          ? "encrypted"
          : val
          ? "plaintext"
          : "empty";
      } else {
        (report.piiFieldStates as Record<string, string>)[field] = "missing";
      }
    }

    // Check lockout
    const lockRaw = await redis.get(`login_attempts:${cleanPhone}`);
    report.lockoutAttempts = lockRaw ?? 0;
    if (lockRaw) {
      const ttl = await redis.ttl(`login_attempts:${cleanPhone}`);
      report.lockoutTTL = ttl;
    }

    // Test PIN verification if provided
    if (testPin && m.pinHash) {
      try {
        // If pinHash got accidentally encrypted, try decrypting it first
        let hashToTest = m.pinHash;
        if (isEncrypted(m.pinHash)) {
          try {
            hashToTest = decrypt(m.pinHash);
            report.pinHashDecrypted = hashToTest.substring(0, 20) + "...";
          } catch {
            report.pinHashDecryptError = "Failed to decrypt pinHash";
          }
        }

        const pinValid = verifyPin(testPin, hashToTest);
        report.pinVerificationResult = pinValid;

        // Also try generating a fresh hash to compare format
        const freshHash = hashPin(testPin);
        report.freshHashExample = freshHash.substring(0, 20) + "...";
        report.freshHashLength = freshHash.length;
      } catch (err) {
        report.pinVerificationError = String(err);
      }
    }

    diagnostics.push(report);
  }

  return NextResponse.json({
    searched: cleanPhone,
    totalMerchants: ids.length,
    matchesFound: diagnostics.length,
    diagnostics,
  });
}
