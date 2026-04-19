"use client";

/**
 * PushPrompt — a dismissible banner that prompts merchants to enable
 * push notifications. Shows on the dashboard if they haven't subscribed yet.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePushNotifications } from "../lib/usePushNotifications";

const DISMISS_KEY = "fp_push_prompt_dismissed";

export function PushPrompt({ merchantId }: { merchantId: string | null | undefined }) {
  const { supported, permission, subscribed, loading, subscribe } = usePushNotifications(merchantId);
  const [dismissed, setDismissed] = useState(true); // default hidden until check

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(!!localStorage.getItem(DISMISS_KEY));
    }
  }, []);

  // Don't show if: not supported, already subscribed, already dismissed, or denied
  if (!supported || subscribed || dismissed || permission === "denied" || !merchantId) {
    return null;
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rounded-2xl border-2 border-flamingo-pink bg-flamingo-pink/10 p-4"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔔</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-flamingo-dark">
              Get instant payment alerts
            </p>
            <p className="text-xs text-flamingo-dark/60 mt-0.5">
              Get notified the moment a customer pays — even when your phone is locked.
            </p>
            <div className="flex gap-2 mt-3">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ y: 1 }}
                onClick={subscribe}
                disabled={loading}
                className="rounded-xl border-2 border-flamingo-dark bg-flamingo-pink px-4 py-2 text-xs font-bold text-white shadow-[0_3px_0_0_#1A1A2E] transition disabled:opacity-50 active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E]"
              >
                {loading ? "Enabling…" : "Enable Notifications"}
              </motion.button>
              <button
                onClick={handleDismiss}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-flamingo-dark/50 hover:text-flamingo-dark/80 transition"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
