/**
 * Payment notifications — WhatsApp (primary) + SMS (fallback).
 *
 * When a merchant receives a payment, we:
 *  1. Try to send a WhatsApp message via Meta Cloud API
 *  2. If WhatsApp fails or isn't configured, fall back to SMS via MyMobileAPI
 *
 * Required env vars:
 *   WHATSAPP_PHONE_NUMBER_ID  — Meta WhatsApp Business phone number ID
 *   WHATSAPP_ACCESS_TOKEN     — Meta permanent / system-user access token
 *   SMS_SA_CLIENT_ID          — MyMobileAPI REST API Client ID (already used for OTP)
 *   SMS_SA_SECRET             — MyMobileAPI REST API Secret
 *
 * WhatsApp Cloud API docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 * MyMobileAPI docs: https://mymobileapi.readme.io/docs/rest
 */

import "server-only";

/* ─── helpers ─────────────────────────────────────────────────────── */

/** Format rands to ZAR string, e.g. 20 → "R20.00" */
function formatZAR(amount: number): string {
  return `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Normalise a South African phone number to 27xxxxxxxxx (no +, no spaces). */
function normaliseSAPhone(phone: string): string {
  let d = phone.replace(/[\s\-()]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("0")) d = "27" + d.slice(1);
  if (!d.startsWith("27")) d = "27" + d;
  return d;
}

/* ─── WhatsApp Cloud API ──────────────────────────────────────────── */

type WAResult = { ok: true; messageId: string } | { ok: false; error: string };

async function sendWhatsApp(
  to: string,
  message: string,
): Promise<WAResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return { ok: false, error: "WhatsApp not configured" };
  }

  const destination = normaliseSAPhone(to);

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: destination,
          type: "text",
          text: { body: message },
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("[notifications] WhatsApp send failed:", res.status, body);
      return { ok: false, error: `WhatsApp ${res.status}` };
    }

    const data = await res.json();
    const messageId = data?.messages?.[0]?.id ?? "unknown";
    return { ok: true, messageId };
  } catch (err) {
    console.error("[notifications] WhatsApp error:", err);
    return { ok: false, error: (err as Error).message };
  }
}

/* ─── SMS via MyMobileAPI ─────────────────────────────────────────── */

type SMSResult = { ok: true } | { ok: false; error: string };

async function sendSMS(to: string, message: string): Promise<SMSResult> {
  const clientId = process.env.SMS_SA_CLIENT_ID;
  const secret = process.env.SMS_SA_SECRET;

  if (!clientId || !secret) {
    return { ok: false, error: "SMS not configured" };
  }

  const destination = normaliseSAPhone(to);
  const credentials = Buffer.from(`${clientId}:${secret}`).toString("base64");

  try {
    const res = await fetch("https://rest.mymobileapi.com/v1/bulkmessages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        Messages: [{ Content: message, Destination: destination }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[notifications] SMS send failed:", res.status, body);
      return { ok: false, error: `SMS ${res.status}` };
    }

    return { ok: true };
  } catch (err) {
    console.error("[notifications] SMS error:", err);
    return { ok: false, error: (err as Error).message };
  }
}

/* ─── Public API ──────────────────────────────────────────────────── */

export type NotificationChannel = "whatsapp" | "sms" | "none";

export type NotificationResult = {
  delivered: boolean;
  channel: NotificationChannel;
  error?: string;
};

/**
 * Send an instant payment notification to a merchant.
 * Tries WhatsApp first, falls back to SMS.
 *
 * This is fire-and-forget — callers should not await or handle errors.
 */
export async function sendPaymentNotification(opts: {
  phone: string;
  merchantName: string;
  amount: number;        // in cents
  reference: string;
  buyerBank: string;
}): Promise<NotificationResult> {
  const { phone, merchantName, amount, reference, buyerBank } = opts;

  if (!phone) {
    return { delivered: false, channel: "none", error: "No phone number" };
  }

  const destination = normaliseSAPhone(phone);
  console.log(`[notifications] Sending to ${destination} for ${merchantName} (${formatZAR(amount)})`);

  const amountStr = formatZAR(amount);
  const message =
    `Payment received!\n\n` +
    `${amountStr} from ${buyerBank}\n` +
    `Ref: ${reference}\n` +
    `Business: ${merchantName}\n\n` +
    `-- Flamingo Pay`;

  // 1. Try WhatsApp
  const waResult = await sendWhatsApp(phone, message);
  if (waResult.ok) {
    console.log(`[notifications] WhatsApp delivered to ${destination}`);
    return { delivered: true, channel: "whatsapp" };
  }
  console.log(`[notifications] WhatsApp failed: ${waResult.error}, trying SMS…`);

  // 2. Fall back to SMS (shorter message for 160-char limit)
  const smsMessage =
    `Flamingo Pay: ${amountStr} received from ${buyerBank}. ` +
    `Ref: ${reference}. ${merchantName}`;

  const smsResult = await sendSMS(phone, smsMessage);
  if (smsResult.ok) {
    console.log(`[notifications] SMS delivered to ${destination}`);
    return { delivered: true, channel: "sms" };
  }

  // Both failed
  console.error(
    `[notifications] Failed to notify ${merchantName} (${destination}): WA=${waResult.error}, SMS=${smsResult.error}`,
  );
  return {
    delivered: false,
    channel: "none",
    error: `WhatsApp: ${waResult.error}; SMS: ${smsResult.error}`,
  };
}
