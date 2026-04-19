"use client";

/**
 * usePaymentNotifications — polls for new completed transactions and triggers
 * a ka-ching sound + in-app toast when a new payment arrives.
 *
 * Usage:
 *   const { latestPayment, dismiss } = usePaymentNotifications(merchantId);
 *
 * The hook stores the last-seen transaction timestamp in localStorage so it
 * only fires for genuinely new payments, even across page navigations.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { StoredTxn } from "./store";

const POLL_INTERVAL = 8_000; // 8 seconds
const LS_KEY = "fp_last_seen_txn_ts";

export type PaymentNotification = {
  txn: StoredTxn;
  amount: number;
  payer: string;
  timestamp: string;
};

export function usePaymentNotifications(merchantId: string | null | undefined) {
  const [latestPayment, setLatestPayment] = useState<PaymentNotification | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSeenRef = useRef<string>("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialise last-seen from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      lastSeenRef.current = localStorage.getItem(LS_KEY) ?? "";
    }
  }, []);

  // Pre-load the audio element
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio("/kaching.wav");
      audio.preload = "auto";
      audio.volume = 0.7;
      audioRef.current = audio;
    }
  }, []);

  const playSound = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Browser may block autoplay until user interaction
    });
  }, []);

  const dismiss = useCallback(() => {
    setLatestPayment(null);
  }, []);

  // Polling loop
  useEffect(() => {
    if (!merchantId) return;

    async function checkForNew() {
      try {
        const res = await fetch(`/api/merchants/${merchantId}/transactions?limit=3`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const txns: StoredTxn[] = data.transactions ?? [];

        // Find the latest completed transaction
        const latest = txns.find(
          (t) => t.status === "completed",
        );
        if (!latest) return;

        const txnTs = latest.timestamp ?? "";
        if (!txnTs || txnTs <= lastSeenRef.current) return;

        // New payment detected!
        lastSeenRef.current = txnTs;
        if (typeof window !== "undefined") {
          localStorage.setItem(LS_KEY, txnTs);
        }

        const amount = typeof latest.amount === "number"
          ? latest.amount
          : parseFloat(String(latest.amount)) || 0;

        setLatestPayment({
          txn: latest,
          amount,
          payer: latest.buyerBank ?? "Customer",
          timestamp: txnTs,
        });

        playSound();
      } catch {
        // Silently ignore network errors
      }
    }

    // Initial check after a short delay (let the page settle)
    const initTimer = setTimeout(checkForNew, 2000);

    // Then poll regularly
    pollRef.current = setInterval(checkForNew, POLL_INTERVAL);

    return () => {
      clearTimeout(initTimer);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [merchantId, playSound]);

  return { latestPayment, dismiss };
}
