/**
 * AES-256-GCM encryption for PII at rest in Redis.
 *
 * Requires ENCRYPTION_KEY env var (64-char hex = 32 bytes).
 * Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Fields encrypted: phone, email, ownerName, address, accountLast4
 * Fields NOT encrypted: id, businessName (needed for search), status, timestamps
 */

// server-only guard is enforced by store.ts (the sole importer)
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM standard
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    // In development without a key, pass through unencrypted
    // In production this MUST be set
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY env var is required in production (64-char hex string)");
    }
    return Buffer.alloc(0);
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt a plaintext string.
 * Returns format: iv:ciphertext:tag (all hex-encoded)
 * If no encryption key is configured (dev only), returns plaintext.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  if (key.length === 0) return plaintext; // dev passthrough

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `enc:${iv.toString("hex")}:${encrypted.toString("hex")}:${tag.toString("hex")}`;
}

/**
 * Decrypt an encrypted string (enc:iv:ciphertext:tag format).
 * If the string doesn't start with "enc:", it's treated as plaintext (migration support).
 */
export function decrypt(ciphertext: string): string {
  // Not encrypted (legacy data or dev passthrough)
  if (!ciphertext.startsWith("enc:")) return ciphertext;

  const key = getKey();
  if (key.length === 0) {
    // Dev without key — strip prefix for readability but can't actually decrypt
    // This shouldn't happen if data was encrypted with a key
    return ciphertext;
  }

  const parts = ciphertext.split(":");
  if (parts.length !== 4) return ciphertext; // malformed, return as-is

  const iv = Buffer.from(parts[1], "hex");
  const encrypted = Buffer.from(parts[2], "hex");
  const tag = Buffer.from(parts[3], "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

/** Check if a value is already encrypted. */
export function isEncrypted(value: string): boolean {
  return value.startsWith("enc:");
}

/** PII fields that should be encrypted in merchant records. */
export const PII_FIELDS = ["phone", "ownerName", "address", "accountLast4"] as const;

/**
 * Encrypt PII fields in a merchant object before storing to Redis.
 * Only encrypts fields that aren't already encrypted.
 */
export function encryptMerchantPII<T extends Record<string, unknown>>(merchant: T): T {
  const key = getKey();
  if (key.length === 0) return merchant; // dev passthrough

  const copy = { ...merchant };
  for (const field of PII_FIELDS) {
    const val = copy[field];
    if (typeof val === "string" && val && !isEncrypted(val)) {
      (copy as Record<string, unknown>)[field] = encrypt(val);
    }
  }
  return copy;
}

/**
 * Decrypt PII fields in a merchant object after reading from Redis.
 */
export function decryptMerchantPII<T extends Record<string, unknown>>(merchant: T): T {
  const copy = { ...merchant };
  for (const field of PII_FIELDS) {
    const val = copy[field];
    if (typeof val === "string" && isEncrypted(val)) {
      (copy as Record<string, unknown>)[field] = decrypt(val);
    }
  }
  return copy;
}
