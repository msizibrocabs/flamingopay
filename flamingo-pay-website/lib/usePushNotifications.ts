"use client";

/**
 * usePushNotifications — client-side hook to manage Web Push subscriptions.
 *
 * Handles:
 *  - Checking if push is supported and permission state
 *  - Requesting notification permission
 *  - Subscribing to push via the service worker
 *  - Sending the subscription to the server
 *  - Unsubscribing
 *
 * Usage:
 *   const { supported, permission, subscribed, subscribe, unsubscribe } = usePushNotifications(merchantId);
 */

import { useCallback, useEffect, useState } from "react";

type PushState = {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
  loading: boolean;
  error: string | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
};

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** Convert a URL-safe base64 VAPID key to a Uint8Array for pushManager.subscribe() */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(merchantId: string | null | undefined): PushState {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check support and current state on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setSupported(false);
      setPermission("unsupported");
      return;
    }

    setSupported(true);
    setPermission(Notification.permission);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!merchantId || !VAPID_PUBLIC_KEY) return;
    setLoading(true);
    setError(null);

    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setError("Notification permission denied");
        setLoading(false);
        return;
      }

      // Get service worker registration
      const reg = await navigator.serviceWorker.ready;

      // Subscribe to push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      const subJSON = sub.toJSON();

      // Send subscription to server
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId,
          subscription: {
            endpoint: subJSON.endpoint,
            keys: subJSON.keys,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Subscribe failed");
      }

      setSubscribed(true);
    } catch (err) {
      console.error("[push] Subscribe error:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  const unsubscribe = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();

        // Tell server to remove
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ merchantId, endpoint }),
        });
      }

      setSubscribed(false);
    } catch (err) {
      console.error("[push] Unsubscribe error:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  return { supported, permission, subscribed, loading, error, subscribe, unsubscribe };
}
