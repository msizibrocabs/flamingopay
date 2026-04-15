"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

/**
 * Decorative, animated QR-style badge. Not a real QR — that comes from
 * a server-rendered SVG tied to a merchant id — but it *reads* as a QR
 * and animates in beautifully on the marketing site.
 */
export function QRBadge({
  size = 220,
  label = "Scan to pay",
  initial = 17,
}: {
  size?: number;
  label?: string;
  initial?: number;
}) {
  const reduce = useReducedMotion();
  // Stable pseudo-random pattern (same render client + server)
  const cells = useMemo(() => {
    const grid = 21;
    const out: { x: number; y: number; on: boolean; delay: number }[] = [];
    let seed = 1337;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; x++) {
        const isCorner =
          (x < 7 && y < 7) ||
          (x >= grid - 7 && y < 7) ||
          (x < 7 && y >= grid - 7);
        out.push({
          x,
          y,
          on: isCorner || rand() > 0.55,
          delay: (x + y) * 0.015,
        });
      }
    }
    return { grid, list: out };
  }, []);

  const cell = size / cells.grid;

  return (
    <div
      className="relative rounded-3xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_14px_40px_-8px_rgba(26,26,46,0.25)]"
      style={{ width: size + 40, height: size + 70 }}
    >
      {/* Gradient glow behind */}
      <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[36px] bg-gradient-flamingo opacity-40 blur-3xl" />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${cells.grid} ${cells.grid}`}
        className="mx-auto block"
        aria-hidden
      >
        {cells.list.map((c, i) =>
          !c.on ? null : (
            <motion.rect
              key={i}
              x={c.x}
              y={c.y}
              width={0.9}
              height={0.9}
              rx={0.2}
              fill="#1A1A2E"
              initial={reduce ? undefined : { opacity: 0, scale: 0.2 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: c.delay, duration: 0.3, ease: "easeOut" }}
            />
          ),
        )}
        {/* Centre flamingo logo chip */}
        <motion.g
          initial={reduce ? undefined : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.7, type: "spring", stiffness: 220 }}
        >
          <rect
            x={cells.grid / 2 - 2.5}
            y={cells.grid / 2 - 2.5}
            width={5}
            height={5}
            rx={1}
            fill="#fff"
          />
          <rect
            x={cells.grid / 2 - 2}
            y={cells.grid / 2 - 2}
            width={4}
            height={4}
            rx={0.8}
            fill="#FF5277"
          />
          <text
            x={cells.grid / 2}
            y={cells.grid / 2 + 0.9}
            textAnchor="middle"
            fontSize={2.8}
            fontWeight={800}
            fill="#fff"
            fontFamily="serif"
          >
            F
          </text>
        </motion.g>
        {/* subtle initial amount badge */}
        <motion.g
          initial={reduce ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          <rect
            x={cells.grid - 5.5}
            y={cells.grid - 5.5}
            width={5}
            height={5}
            rx={1}
            fill="#FFE9B8"
            stroke="#1A1A2E"
            strokeWidth={0.15}
          />
          <text
            x={cells.grid - 3}
            y={cells.grid - 2.8}
            textAnchor="middle"
            fontSize={2.2}
            fontWeight={800}
            fill="#1A1A2E"
            fontFamily="serif"
          >
            {initial}
          </text>
        </motion.g>
        <rect
          x={cell * -0.01}
          y={cell * -0.01}
          width={cells.grid}
          height={cells.grid}
          fill="none"
          stroke="rgba(26,26,46,0.06)"
          strokeWidth={0.05}
        />
      </svg>

      <p className="mt-3 text-center text-xs font-bold uppercase tracking-widest text-flamingo-dark/70">
        {label}
      </p>
    </div>
  );
}
