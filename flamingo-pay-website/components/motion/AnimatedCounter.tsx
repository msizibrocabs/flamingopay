"use client";

import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

type Props = {
  to: number;
  from?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  locale?: string;
  className?: string;
  /** If true, animate whenever 'to' changes (not just on mount). */
  animateOnChange?: boolean;
};

/**
 * Spring-smoothed animated number counter that starts when it enters view.
 * Uses tabular-nums so digits don't jiggle while counting.
 */
export function AnimatedCounter({
  to,
  from = 0,
  duration = 1.6,
  prefix = "",
  suffix = "",
  decimals = 0,
  locale = "en-ZA",
  className,
  animateOnChange = false,
}: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: !animateOnChange, amount: 0.35 });
  const reduce = useReducedMotion();
  const mv = useMotionValue(from);
  const rounded = useTransform(mv, latest => {
    const n = decimals > 0 ? Number(latest).toFixed(decimals) : Math.round(latest);
    return (
      prefix +
      Number(n).toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) +
      suffix
    );
  });

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      mv.set(to);
      return;
    }
    const controls = animate(mv, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [inView, to, duration, mv, reduce]);

  return (
    <motion.span ref={ref} className={`tabular-nums ${className ?? ""}`}>
      {rounded}
    </motion.span>
  );
}
