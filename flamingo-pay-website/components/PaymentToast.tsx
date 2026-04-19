"use client";

/**
 * PaymentToast — a slide-in notification that appears when a new payment arrives.
 * Shows the amount, payer name, and auto-dismisses after 6 seconds.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PaymentNotification } from "../lib/usePaymentNotifications";

function formatZAR(cents: number): string {
  return `R ${(cents / 100).toFixed(2)}`;
}

export function PaymentToast({
  payment,
  onDismiss,
}: {
  payment: PaymentNotification | null;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (payment) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 400); // wait for exit animation
      }, 6000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [payment, onDismiss]);

  return (
    <AnimatePresence>
      {visible && payment && (
        <motion.div
          initial={{ y: -120, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -120, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-4 left-1/2 z-[9999] -translate-x-1/2"
          style={{ width: "min(90vw, 360px)" }}
        >
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(onDismiss, 400);
            }}
            className="w-full text-left"
          >
            <div className="relative overflow-hidden rounded-2xl border-2 border-green-500 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.15)]">
              {/* Green shimmer bar */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-green-300/30 to-green-400/20"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: 1 }}
              />

              <div className="relative flex items-center gap-3 px-4 py-3">
                {/* Coin icon */}
                <motion.div
                  initial={{ rotate: -30, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", damping: 10 }}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-2xl"
                >
                  💰
                </motion.div>

                <div className="min-w-0 flex-1">
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-xs font-bold uppercase tracking-wider text-green-600"
                  >
                    Payment received!
                  </motion.p>
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="display text-xl font-extrabold text-flamingo-dark"
                  >
                    {formatZAR(payment.amount)}
                  </motion.p>
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs text-flamingo-dark/60 truncate"
                  >
                    from {payment.payer}
                  </motion.p>
                </div>

                {/* Tap to dismiss hint */}
                <span className="text-xs text-flamingo-dark/30">✕</span>
              </div>

              {/* Auto-dismiss progress bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 6, ease: "linear" }}
                className="h-1 origin-left bg-green-400"
              />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
