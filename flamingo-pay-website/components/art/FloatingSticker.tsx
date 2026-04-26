"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * FloatingSticker
 *
 * 3D floating Flamingo Pay QR sticker for the website hero.
 * Auto-fits its parent (no fixed width/height required).
 *
 * Ported from /flamingo-design/flamingo-qr/project/{floating-sticker,stickers}.jsx
 */

const BRAND = {
  pink: "#FF5277",
  pinkDeep: "#B42A48",
  cream: "#FFF7F3",
  butter: "#FFE9B8",
  dark: "#1A1A2E",
  ink: "#0B0B17",
} as const;

// Native sticker dimensions — same as the design source.
const STICKER_W = 500;
const STICKER_H = 800;

/* ───────────────────────── F badge ───────────────────────── */
function FBadge({
  size = 54,
  invert = false,
  squared = false,
}: {
  size?: number;
  invert?: boolean;
  squared?: boolean;
}) {
  const bg = invert ? "#FFFFFF" : BRAND.pink;
  const fg = invert ? BRAND.pink : "#FFFFFF";
  const r = squared ? size * 0.22 : size / 2;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"DM Sans", system-ui, sans-serif',
        fontWeight: 900,
        fontSize: size * 0.56,
        color: fg,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}
    >
      F
    </div>
  );
}

/* ───────────────────────── QR pattern ───────────────────────── */
function QRPattern({
  size = 280,
  fg = BRAND.dark,
  bg = "#fff",
  seed = 7,
}: {
  size?: number;
  fg?: string;
  bg?: string;
  seed?: number;
}) {
  const N = 29;
  const cell = size / N;

  const rects = useMemo(() => {
    let s = seed;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const grid: boolean[][] = Array.from({ length: N }, () =>
      Array<boolean>(N).fill(false),
    );
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) grid[y][x] = rand() > 0.52;

    const drawFinder = (cx: number, cy: number) => {
      for (let y = 0; y < 7; y++)
        for (let x = 0; x < 7; x++) {
          const on =
            x === 0 ||
            x === 6 ||
            y === 0 ||
            y === 6 ||
            (x >= 2 && x <= 4 && y >= 2 && y <= 4);
          grid[cy + y][cx + x] = on;
        }
      for (let y = -1; y <= 7; y++)
        for (let x = -1; x <= 7; x++) {
          if (x === -1 || x === 7 || y === -1 || y === 7) {
            const yy = cy + y;
            const xx = cx + x;
            if (yy >= 0 && yy < N && xx >= 0 && xx < N) grid[yy][xx] = false;
          }
        }
    };
    drawFinder(0, 0);
    drawFinder(N - 7, 0);
    drawFinder(0, N - 7);

    const ax = N - 9;
    const ay = N - 9;
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 5; x++) {
        const on =
          x === 0 || x === 4 || y === 0 || y === 4 || (x === 2 && y === 2);
        grid[ay + y][ax + x] = on;
      }

    const logoSize = 7;
    const lo = Math.floor((N - logoSize) / 2);
    for (let y = 0; y < logoSize; y++)
      for (let x = 0; x < logoSize; x++) grid[lo + y][lo + x] = false;

    const out: { x: number; y: number }[] = [];
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) if (grid[y][x]) out.push({ x, y });
    return out;
  }, [seed]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block" }}
    >
      <rect width={size} height={size} fill={bg} />
      {rects.map(({ x, y }) => (
        <rect
          key={`${x}-${y}`}
          x={x * cell + 0.5}
          y={y * cell + 0.5}
          width={cell - 1}
          height={cell - 1}
          fill={fg}
          rx={cell * 0.15}
        />
      ))}
    </svg>
  );
}

function QR({ size = 280 }: { size?: number }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <QRPattern size={size} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: size * 0.025,
            borderRadius: size * 0.12,
          }}
        >
          <FBadge size={size * 0.2} squared />
        </div>
      </div>
    </div>
  );
}

function ScanBrackets({
  color = BRAND.pinkDeep,
  thickness = 4,
  armLen = 26,
  offset = -8,
}: {
  color?: string;
  thickness?: number;
  armLen?: number;
  offset?: number;
}) {
  const s = { position: "absolute", width: armLen, height: armLen } as const;
  const border = `${thickness}px solid ${color}`;
  return (
    <>
      <div
        style={{
          ...s,
          top: offset,
          left: offset,
          borderTop: border,
          borderLeft: border,
        }}
      />
      <div
        style={{
          ...s,
          top: offset,
          right: offset,
          borderTop: border,
          borderRight: border,
        }}
      />
      <div
        style={{
          ...s,
          bottom: offset,
          left: offset,
          borderBottom: border,
          borderLeft: border,
        }}
      />
      <div
        style={{
          ...s,
          bottom: offset,
          right: offset,
          borderBottom: border,
          borderRight: border,
        }}
      />
    </>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: BRAND.pink,
        color: "#fff",
        fontWeight: 900,
        fontSize: 14,
        lineHeight: "28px",
        textAlign: "center",
        flexShrink: 0,
      }}
    >
      {n}
    </div>
  );
}

/* ───────────────────────── Sticker face (full design) ───────────────────────── */
function StickerClassic({
  merchant = "Bra Mike's Braai",
  handle = "bra-mike-braai",
}: {
  merchant?: string;
  handle?: string;
}) {
  return (
    <div
      style={{
        width: STICKER_W,
        height: STICKER_H,
        background: BRAND.pink,
        fontFamily: '"DM Sans", system-ui, sans-serif',
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "30px 36px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <FBadge size={54} invert />
        <div style={{ lineHeight: 1 }}>
          <div
            style={{
              fontSize: 13,
              letterSpacing: "0.22em",
              fontWeight: 800,
              opacity: 0.9,
            }}
          >
            FLAMINGO
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              marginTop: 4,
            }}
          >
            Pay here
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          padding: "6px 36px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: '"Fraunces", ui-serif, Georgia, serif',
            fontWeight: 900,
            fontSize: 40,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            textAlign: "center",
            color: BRAND.cream,
          }}
        >
          {merchant}
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            letterSpacing: "0.26em",
            fontWeight: 800,
            color: BRAND.butter,
            textTransform: "uppercase",
          }}
        >
          Scan to pay · no fees
        </div>

        {/* QR tile */}
        <div
          style={{
            position: "relative",
            marginTop: 22,
            padding: 18,
            background: "#fff",
            border: `3px solid ${BRAND.ink}`,
            boxShadow: `8px 8px 0 ${BRAND.ink}`,
          }}
        >
          <ScanBrackets color={BRAND.pinkDeep} armLen={26} thickness={4} offset={-8} />
          <QR size={280} />
        </div>

        <div
          style={{
            marginTop: 14,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: BRAND.cream,
            opacity: 0.9,
          }}
        >
          or open{" "}
          <span style={{ fontWeight: 900, textDecoration: "underline" }}>
            flamingopay.co.za/pay/{handle}
          </span>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* How it works — 3 steps on cream strip */}
      <div
        style={{
          background: BRAND.cream,
          color: BRAND.dark,
          padding: "16px 28px 14px",
          borderTop: `3px solid ${BRAND.ink}`,
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.28em",
            fontWeight: 800,
            textAlign: "center",
            color: BRAND.pinkDeep,
            marginBottom: 10,
          }}
        >
          HOW IT WORKS
        </div>
        <div
          style={{ display: "flex", gap: 10, alignItems: "stretch" }}
        >
          {[
            { n: 1, label: "Scan", sub: "Point your camera at the code" },
            { n: 2, label: "Type amount", sub: "Enter what you owe" },
            { n: 3, label: "Done", sub: "Tap pay — you're good to go" },
          ].map((step, i) => (
            <div
              key={step.n}
              style={{ display: "contents" }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 6,
                }}
              >
                <StepNumber n={step.n} />
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {step.label}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    lineHeight: 1.25,
                    opacity: 0.65,
                  }}
                >
                  {step.sub}
                </div>
              </div>
              {i < 2 && (
                <div
                  style={{
                    width: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: BRAND.pink,
                    fontWeight: 900,
                    fontSize: 18,
                    marginTop: 4,
                  }}
                >
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tiny ID strip */}
      <div
        style={{
          background: BRAND.ink,
          color: BRAND.cream,
          padding: "8px 36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        <span>Works with any SA bank app</span>
        <span style={{ color: BRAND.pink }}>
          FL-{handle.slice(0, 4).toUpperCase()}-0421
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────── 3D floating wrapper ───────────────────────── */
export function FloatingSticker({
  merchant,
  handle,
  className = "",
  initialYaw = -8,
  initialPitch = 5,
}: {
  merchant?: string;
  handle?: string;
  className?: string;
  initialYaw?: number;
  initialPitch?: number;
}) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({
    w: 460,
    h: 600,
  });

  // Auto-fit to parent
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setSize({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w: width, h: height } = size;
  // Fit so the rotated card stays inside the box
  const displayScale = Math.min(width / STICKER_W, height / STICKER_H) * 0.92;
  const dispW = STICKER_W * displayScale;
  const dispH = STICKER_H * displayScale;

  const cardThickness = 8;
  const yaw = initialYaw;
  const pitch = initialPitch;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* Soft floor shadow */}
      <motion.div
        aria-hidden
        animate={
          reduce ? undefined : { y: [0, 4, 0], opacity: [0.85, 1, 0.85] }
        }
        transition={
          reduce
            ? undefined
            : { duration: 5.2, ease: "easeInOut", repeat: Infinity }
        }
        style={{
          position: "absolute",
          left: "50%",
          bottom: "6%",
          width: dispW * 0.85,
          height: 28,
          transform: "translate(-50%, 0)",
          background:
            "radial-gradient(ellipse at center, rgba(180,42,72,0.32) 0%, rgba(180,42,72,0) 65%)",
          filter: "blur(14px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          perspective: 1800,
          perspectiveOrigin: "50% 45%",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Idle sway */}
          <motion.div
            animate={
              reduce
                ? { rotateX: -pitch, rotateY: yaw, y: 0 }
                : {
                    rotateX: [-pitch + 1.2, -pitch - 1.2, -pitch + 1.2],
                    rotateY: [yaw + 2.5, yaw - 2.5, yaw + 2.5],
                    y: [-3, 3, -3],
                  }
            }
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 7.5, ease: "easeInOut", repeat: Infinity }
            }
            style={{
              transformStyle: "preserve-3d",
              transform: "translate(-50%, -50%)",
              transformOrigin: "center center",
            }}
          >
            <div
              style={{
                position: "relative",
                width: dispW,
                height: dispH,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Front face */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `translateZ(${cardThickness / 2}px)`,
                  boxShadow:
                    "0 40px 80px -20px rgba(180,42,72,0.45), 0 20px 40px -10px rgba(26,26,46,0.25)",
                  overflow: "hidden",
                  borderRadius: 2,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <div
                  style={{
                    width: STICKER_W,
                    height: STICKER_H,
                    transform: `scale(${displayScale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <StickerClassic merchant={merchant} handle={handle} />
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                      "linear-gradient(115deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 25%, rgba(255,255,255,0) 75%, rgba(255,255,255,0.10) 100%)",
                    mixBlendMode: "screen",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.07) 100%)",
                  }}
                />
              </div>

              {/* Back face */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `translateZ(-${cardThickness / 2}px) rotateY(180deg)`,
                  background: BRAND.ink,
                  color: BRAND.cream,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontWeight: 900,
                  fontSize: 24,
                  letterSpacing: "-0.02em",
                  borderRadius: 2,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <span style={{ opacity: 0.55 }}>Flamingo Pay</span>
              </div>

              {/* Edges */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: cardThickness,
                  transform: `rotateX(90deg) translateZ(${cardThickness / 2}px)`,
                  transformOrigin: "top",
                  background: "linear-gradient(180deg, #f0c2cd, #b88a93)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  width: "100%",
                  height: cardThickness,
                  transform: `rotateX(-90deg) translateZ(${cardThickness / 2}px)`,
                  transformOrigin: "bottom",
                  background: "linear-gradient(180deg, #b88a93, #7a565d)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: cardThickness,
                  height: "100%",
                  transform: `rotateY(-90deg) translateZ(${cardThickness / 2}px)`,
                  transformOrigin: "left",
                  background: "linear-gradient(90deg, #c89098, #b07880)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  width: cardThickness,
                  height: "100%",
                  transform: `rotateY(90deg) translateZ(${cardThickness / 2}px)`,
                  transformOrigin: "right",
                  background: "linear-gradient(90deg, #b07880, #c89098)",
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
