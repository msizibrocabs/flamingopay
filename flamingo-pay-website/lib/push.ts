/**
 * Web Push notifications for Flamingo Pay.
 *
 * Sends native push notifications to merchants when they receive a payment.
 * Uses the Web Push protocol with VAPID authentication — completely free,
 * no third-party messaging provider required.
 *
 * Required env vars:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  — VAPID public key (also used client-side)
 *   VAPID_PRIVATE_KEY             — VAPID private key (server-only)
 *
 * Redis keys:
 *   push_subs:{merchantId}  — JSON PushSubscription[] (one merchant can have multiple devices)
 */

import "server-only";
import webpush from "web-push";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

/* ─── VAPID setup ─────────────────────────────────────────────────── */

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = "mailto:msizi@brocabs.co.za";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

/* ─── Types ───────────────────────────────────────────────────────── */

/** Browser PushSubscription JSON (from client pushManager.subscribe()) */
export type PushSub = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

/* ─── Subscription management ─────────────────────────────────────── */

function subsKey(merchantId: string): string {
  return `push_subs:${merchantId}`;
}

/** Save a push subscription for a merchant (one merchant, multiple devices). */
export async function savePushSubscription(
  merchantId: string,
  sub: PushSub,
): Promise<void> {
  const key = subsKey(merchantId);
  const existing = await loadSubscriptions(merchantId);

  // Deduplicate by endpoint
  const filtered = existing.filter((s) => s.endpoint !== sub.endpoint);
  filtered.push(sub);

  await redis.set(key, JSON.stringify(filtered));
}

/** Remove a push subscription (e.g. when user unsubscribes). */
export async function removePushSubscription(
  merchantId: string,
  endpoint: string,
): Promise<void> {
  const key = subsKey(merchantId);
  const existing = await loadSubscriptions(merchantId);
  const filtered = existing.filter((s) => s.endpoint !== endpoint);

  if (filtered.length === 0) {
    await redis.del(key);
  } else {
    await redis.set(key, JSON.stringify(filtered));
  }
}

/** Load all push subscriptions for a merchant. */
async function loadSubscriptions(merchantId: string): Promise<PushSub[]> {
  const raw = await redis.get(subsKey(merchantId));
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* ─── Send push notification ──────────────────────────────────────── */

/** Format cents to ZAR string, e.g. 1500 → "R15.00" */
function formatZAR(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

export type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, string>;
};

/**
 * Send a payment push notification to all of a merchant's subscribed devices.
 * Returns the number of devices successfully notified.
 */
export async function sendPaymentPush(opts: {
  merchantId: string;
  merchantName: string;
  amount: number; // cents
  reference: string;
  buyerBank: string;
}): Promise<{ sent: number; failed: number; total: number }> {
  const { merchantId, merchantName, amount, reference, buyerBank } = opts;

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.log("[push] VAPID keys not configured, skipping push");
    return { sent: 0, failed: 0, total: 0 };
  }

  const subs = await loadSubscriptions(merchantId);
  if (subs.length === 0) {
    return { sent: 0, failed: 0, total: 0 };
  }

  const payload: PushPayload = {
    title: `${formatZAR(amount)} received!`,
    body: `From ${buyerBank} — Ref: ${reference}`,
    icon: "/logo-primary.png",
    badge: "/logo-primary.png",
    tag: `payment-${reference}`, // collapse duplicate notifications
    data: {
      url: "/merchant/dashboard",
      merchantId,
      reference,
      amount: String(amount),
    },
  };

  const payloadStr = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          payloadStr,
          { TTL: 60 }, // notification expires after 60s if device is offline
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        const statusCode = (err as { statusCode?: number })?.statusCode;
        // 404 or 410 = subscription expired/invalid, clean it up
        if (statusCode === 404 || statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        }
        console.error(
          `[push] Failed to send to ${sub.endpoint.slice(0, 60)}…: ${statusCode ?? (err as Error).message}`,
        );
      }
    }),
  );

  // Clean up expired subscriptions
  for (const endpoint of expiredEndpoints) {
    await removePushSubscription(merchantId, endpoint);
  }

  console.log(
    `[push] ${merchantName}: ${sent}/${subs.length} devices notified (${failed} failed, ${expiredEndpoints.length} expired removed)`,
  );

  return { sent, failed, total: subs.length };
}
