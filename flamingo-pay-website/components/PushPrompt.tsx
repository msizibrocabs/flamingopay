"use client";

/**
 * PushPrompt — a dismissible banner that prompts merchants to enable
 * push notifications. Shows on the dashboard if they haven't subscribed yet.
 *
 * On iOS Safari, Web Push requires the site to be installed as a PWA
 * (Add to Home Screen) first. We detect this and show install instructions.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePushNotifications } from "../lib/usePushNotifications";

const DISMISS_KEY = "fp_push_prompt_dismissed";

/** Detect if running on iOS (iPhone/iPad). */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** Detect if the page is running as an installed PWA (standalone mode). */
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function PushPrompt({ merchantId }: { merchantId: string | null | undefined }) {
  const { supported, permission, subscribed, loading, subscribe } = usePushNotifications(merchantId);
  const [dismissed, setDismissed] = useState(true);
  const [iosNeedInstall, setIosNeedInstall] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(!!localStorage.getItem(DISMISS_KEY));

    // On iOS in Safari (not standalone), push isn't available — show install prompt
    if (isIOS() && !isStandalone()) {
      setIosNeedInstall(true);
    }
  }, []);

  if (!merchantId || dismissed) return null;

  // Already subscribed — nothing to show
  if (supported && subscribed) return null;

  // Permission permanently denied
  if (supported && permission === "denied") return null;

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  // iOS in Safari — needs to install as PWA first
  if (iosNeedInstall) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-2xl border-2 border-flamingo-pink bg-flamingo-pink/10 p-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">📲</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-flamingo-dark">
                Install Flamingo Pay
              </p>
              <p className="text-xs text-flamingo-dark/60 mt-0.5">
                Add to your home screen to get instant payment alerts — even when your phone is locked.
              </p>

              {showIOSSteps ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-flamingo-dark">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-flamingo-pink text-[10px] font-bold text-white">1</span>
                    <span>Tap the <strong>Share</strong> button <span className="inline-block text-base leading-none align-middle">⬆</span> at the bottom of Safari</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-flamingo-dark">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-flamingo-pink text-[10px] font-bold text-white">2</span>
                    <span>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-flamingo-dark">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-flamingo-pink text-[10px] font-bold text-white">3</span>
                    <span>Open <strong>Flamingo Pay</strong> from your home screen</span>
                  </div>
                  <p className="text-[10px] text-flamingo-dark/50 mt-1">
                    Once installed, you&apos;ll be able to enable push notifications.
                  </p>
                </div>
              ) : (
                <div className="flex gap-2 mt-3">
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 1 }}
                    onClick={() => setShowIOSSteps(true)}
                    className="rounded-xl border-2 border-flamingo-dark bg-flamingo-pink px-4 py-2 text-xs font-bold text-white shadow-[0_3px_0_0_#1A1A2E] transition active:translate-y-[2px] active:shadow-[0_1px_0_0_#1A1A2E]"
                  >
                    Show me how
                  </motion.button>
                  <button
                    onClick={handleDismiss}
                    className="rounded-xl px-3 py-2 text-xs font-semibold text-flamingo-dark/50 hover:text-flamingo-dark/80 transition"
                  >
                    Not now
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Android / Desktop — direct push subscribe
  if (!supported) return null;

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
