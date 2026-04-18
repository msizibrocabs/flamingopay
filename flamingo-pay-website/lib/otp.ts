/**
 * OTP (One-Time Password) system for 2FA and PIN reset.
 *
 * Generates 6-digit OTPs stored in Redis with 5-minute TTL.
 * SMS delivery via SMS South Africa (MyMobileAPI REST API).
 *
 * Required env vars:
 *   SMS_SA_CLIENT_ID  — REST API Client ID (Username)
 *   SMS_SA_SECRET     — REST API Secret (Password)
 *
 * API docs: https://mymobileapi.readme.io/docs/rest
 */

import "server-only";
import { Redis } from "@upstash/redis";
import { randomInt } from "crypto";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

const OTP_LENGTH = 6;
const OTP_TTL = 5 * 60;          // 5 minutes
const OTP_MAX_ATTEMPTS = 3;       // Max verification attempts
const OTP_COOLDOWN = 60;          // Minimum seconds between OTP requests

export type OTPPurpose = "login_2fa" | "pin_reset";

type StoredOTP = {
  code: string;
  phone: string;
  purpose: OTPPurpose;
  attempts: number;
  createdAt: string;
};

function otpKey(phone: string, purpose: OTPPurpose): string {
  return `otp:${purpose}:${phone.replace(/\s/g, "")}`;
}

function cooldownKey(phone: string, purpose: OTPPurpose): string {
  return `otp_cooldown:${purpose}:${phone.replace(/\s/g, "")}`;
}

/** Generate a cryptographically random 6-digit OTP. */
function generateOTP(): string {
  return randomInt(100000, 999999).toString();
}

/**
 * Send an OTP to a phone number.
 * Returns the OTP in dev (for testing) or sends via SMS in production.
 */
export async function sendOTP(
  phone: string,
  purpose: OTPPurpose,
): Promise<{ ok: true; expiresIn: number; devOTP?: string } | { ok: false; error: string; retryAfter?: number }> {
  const cleanPhone = phone.replace(/\s/g, "");

  // Cooldown check — prevent OTP spam
  const cooldown = await redis.get(cooldownKey(cleanPhone, purpose));
  if (cooldown) {
    const ttl = await redis.ttl(cooldownKey(cleanPhone, purpose));
    return {
      ok: false,
      error: `Please wait ${ttl} seconds before requesting a new code.`,
      retryAfter: ttl,
    };
  }

  const code = generateOTP();

  // Store OTP in Redis
  const stored: StoredOTP = {
    code,
    phone: cleanPhone,
    purpose,
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  await redis.set(otpKey(cleanPhone, purpose), JSON.stringify(stored), { ex: OTP_TTL });
  await redis.set(cooldownKey(cleanPhone, purpose), "1", { ex: OTP_COOLDOWN });

  // Send SMS via SMS South Africa (MyMobileAPI)
  const clientId = process.env.SMS_SA_CLIENT_ID;
  const secret = process.env.SMS_SA_SECRET;

  if (clientId && secret) {
    try {
      const message = purpose === "pin_reset"
        ? `Your Flamingo PIN reset code is: ${code}. It expires in 5 minutes. Do not share this code.`
        : `Your Flamingo verification code is: ${code}. It expires in 5 minutes.`;

      // Format phone for E.164 (SA numbers: 0xx → 27xx)
      let destination = cleanPhone;
      if (destination.startsWith("0")) {
        destination = "27" + destination.slice(1);
      }
      if (!destination.startsWith("+")) {
        destination = "+" + destination;
      }

      // MyMobileAPI REST: Basic Auth with Client ID & Secret
      const credentials = Buffer.from(`${clientId}:${secret}`).toString("base64");

      const res = await fetch("https://rest.mymobileapi.com/v1/bulkmessages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${credentials}`,
        },
        body: JSON.stringify({
          Messages: [
            {
              Content: message,
              Destination: destination,
            },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error("[OTP] SMS send failed:", res.status, body);
      }
    } catch (err) {
      console.error("[OTP] SMS send error:", err);
      // Don't fail the OTP generation — code is stored in Redis regardless
    }
  }

  // In dev (no SMS provider configured), return the OTP for testing
  const isDev = !clientId || process.env.NODE_ENV === "development";
  return {
    ok: true,
    expiresIn: OTP_TTL,
    devOTP: isDev ? code : undefined,
  };
}

/**
 * Verify an OTP.
 */
export async function verifyOTP(
  phone: string,
  purpose: OTPPurpose,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string; attemptsLeft?: number }> {
  const cleanPhone = phone.replace(/\s/g, "");
  const key = otpKey(cleanPhone, purpose);

  const raw = await redis.get(key);
  if (!raw) {
    return { ok: false, error: "Code expired or not found. Please request a new one." };
  }

  const stored: StoredOTP = typeof raw === "string" ? JSON.parse(raw) : raw as StoredOTP;

  // Check max attempts
  if (stored.attempts >= OTP_MAX_ATTEMPTS) {
    await redis.del(key);
    return { ok: false, error: "Too many incorrect attempts. Please request a new code." };
  }

  // Verify code
  if (stored.code !== code) {
    stored.attempts += 1;
    const remaining = OTP_MAX_ATTEMPTS - stored.attempts;

    if (remaining <= 0) {
      await redis.del(key);
      return { ok: false, error: "Too many incorrect attempts. Please request a new code." };
    }

    await redis.set(key, JSON.stringify(stored), { ex: OTP_TTL });
    return {
      ok: false,
      error: "Incorrect code.",
      attemptsLeft: remaining,
    };
  }

  // Success — delete the OTP (single use)
  await redis.del(key);
  return { ok: true };
}
