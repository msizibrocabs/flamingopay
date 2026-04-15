"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Stylised cut-paper illustration of a South African spaza owner —
 * a warm, confident woman behind her counter with a phone showing
 * a Flamingo QR. Matisse-ish flat shapes, bold Flamingo palette.
 *
 * All illustration, no photography. Safe to resize via width/height
 * props; aspect ratio is ~4:5.
 */
export function SpazaOwner({
  className = "",
  width,
  height,
}: {
  className?: string;
  width?: number | string;
  height?: number | string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.svg
      viewBox="0 0 800 1000"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Illustration of a South African spaza shop owner with a Flamingo Pay QR on her phone"
    >
      <defs>
        {/* Soft sunrise backdrop */}
        <radialGradient id="sky" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#FFE9B8" />
          <stop offset="55%" stopColor="#FFD6E0" />
          <stop offset="100%" stopColor="#FF5277" />
        </radialGradient>

        {/* Skin */}
        <linearGradient id="skin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7A3F26" />
          <stop offset="100%" stopColor="#5E2E18" />
        </linearGradient>
        <linearGradient id="skinArm" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6B361F" />
          <stop offset="100%" stopColor="#83472C" />
        </linearGradient>

        {/* Doek + apron */}
        <linearGradient id="doek" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF5277" />
          <stop offset="100%" stopColor="#B42A48" />
        </linearGradient>
        <linearGradient id="blouse" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF7F3" />
          <stop offset="100%" stopColor="#FFE9B8" />
        </linearGradient>
        <linearGradient id="apron" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF8FAA" />
          <stop offset="100%" stopColor="#FF5277" />
        </linearGradient>

        {/* Ground + counter */}
        <linearGradient id="ground" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5C7A0" />
          <stop offset="100%" stopColor="#C98C5E" />
        </linearGradient>
        <linearGradient id="counter" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8B5A2B" />
          <stop offset="100%" stopColor="#5C3A1C" />
        </linearGradient>

        {/* Flamingo sign */}
        <linearGradient id="sign" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1A1A2E" />
          <stop offset="100%" stopColor="#12121F" />
        </linearGradient>

        {/* Phone screen */}
        <linearGradient id="screen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF7F3" />
          <stop offset="100%" stopColor="#FFD6E0" />
        </linearGradient>
      </defs>

      {/* ——— SKY + SUN ——— */}
      <rect x="0" y="0" width="800" height="760" fill="url(#sky)" />
      <circle cx="620" cy="220" r="130" fill="#FFE9B8" opacity="0.85" />
      <circle cx="620" cy="220" r="90" fill="#FFF7F3" opacity="0.6" />

      {/* Distant township silhouette */}
      <motion.g
        initial={reduce ? undefined : { opacity: 0, y: 10 }}
        animate={{ opacity: 0.28, y: 0 }}
        transition={{ duration: 1.2, delay: 0.1 }}
        fill="#B42A48"
      >
        <rect x="0" y="620" width="140" height="60" />
        <rect x="140" y="600" width="50" height="80" />
        <rect x="190" y="630" width="80" height="50" />
        <rect x="270" y="610" width="60" height="70" />
        <rect x="330" y="630" width="100" height="50" />
        <rect x="430" y="605" width="70" height="75" />
        <rect x="500" y="625" width="90" height="55" />
        <rect x="590" y="615" width="60" height="65" />
        <rect x="650" y="630" width="80" height="50" />
        <rect x="730" y="620" width="70" height="60" />
      </motion.g>

      {/* Power lines */}
      <g stroke="#1A1A2E" strokeOpacity="0.22" strokeWidth="1.2" fill="none">
        <path d="M0 560 Q 400 540 800 565" />
        <path d="M0 580 Q 400 562 800 588" />
        <line x1="160" y1="500" x2="160" y2="620" />
        <line x1="640" y1="500" x2="640" y2="620" />
      </g>

      {/* ——— GROUND ——— */}
      <rect x="0" y="760" width="800" height="240" fill="url(#ground)" />

      {/* ——— COUNTER with stock ——— */}
      {/* Back wall of products (stacked boxes behind counter) */}
      <motion.g
        initial={reduce ? undefined : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        {/* Mealie meal sack — left */}
        <g>
          <path
            d="M90 700 Q 88 640 110 620 L 190 620 Q 212 640 210 700 Z"
            fill="#FFE9B8"
            stroke="#1A1A2E"
            strokeWidth="3"
          />
          <rect x="115" y="645" width="70" height="24" fill="#1A1A2E" />
          <text
            x="150"
            y="663"
            textAnchor="middle"
            fontSize="14"
            fontWeight="800"
            fill="#FFE9B8"
            fontFamily="sans-serif"
          >
            MEALIE
          </text>
          <circle cx="130" cy="690" r="3" fill="#B42A48" />
          <circle cx="145" cy="690" r="3" fill="#B42A48" />
          <circle cx="160" cy="690" r="3" fill="#B42A48" />
          <circle cx="175" cy="690" r="3" fill="#B42A48" />
        </g>

        {/* Sugar box */}
        <rect
          x="220"
          y="640"
          width="80"
          height="60"
          fill="#FFFFFF"
          stroke="#1A1A2E"
          strokeWidth="3"
        />
        <rect x="228" y="650" width="64" height="16" fill="#FF5277" />
        <text
          x="260"
          y="663"
          textAnchor="middle"
          fontSize="11"
          fontWeight="800"
          fill="#FFF7F3"
          fontFamily="sans-serif"
        >
          SUIKER
        </text>
        <rect x="230" y="674" width="60" height="18" fill="#1A1A2E" opacity="0.1" />

        {/* Bread loaf */}
        <g transform="translate(310 660)">
          <path
            d="M0 30 Q 5 0 40 0 L 80 0 Q 115 0 120 30 L 120 40 L 0 40 Z"
            fill="#D9A86B"
            stroke="#1A1A2E"
            strokeWidth="3"
          />
          <path d="M20 10 L 100 10" stroke="#1A1A2E" strokeOpacity="0.3" strokeWidth="2" />
          <path d="M15 20 L 105 20" stroke="#1A1A2E" strokeOpacity="0.3" strokeWidth="2" />
        </g>

        {/* Cold drink — red bottle */}
        <g transform="translate(460 598)">
          <rect x="14" y="0" width="16" height="18" fill="#1A1A2E" />
          <path
            d="M8 18 L 36 18 L 40 38 Q 44 55 40 75 L 40 98 Q 40 110 34 110 L 10 110 Q 4 110 4 98 L 4 75 Q 0 55 4 38 Z"
            fill="#D93A5C"
            stroke="#1A1A2E"
            strokeWidth="3"
          />
          <rect x="6" y="55" width="32" height="24" fill="#FFF7F3" />
          <text
            x="22"
            y="72"
            textAnchor="middle"
            fontSize="10"
            fontWeight="800"
            fill="#D93A5C"
            fontFamily="serif"
          >
            Coca
          </text>
        </g>

        {/* Chips pack */}
        <g transform="translate(520 640)">
          <path
            d="M0 0 L 80 0 L 75 60 L 5 60 Z"
            fill="#BFE4FF"
            stroke="#1A1A2E"
            strokeWidth="3"
          />
          <text
            x="40"
            y="28"
            textAnchor="middle"
            fontSize="14"
            fontWeight="900"
            fill="#1A1A2E"
            fontFamily="sans-serif"
          >
            SIMBA
          </text>
          <circle cx="40" cy="44" r="8" fill="#FF5277" />
        </g>

        {/* Tin of fish */}
        <g transform="translate(620 660)">
          <ellipse cx="30" cy="10" rx="30" ry="6" fill="#C6F3D8" stroke="#1A1A2E" strokeWidth="3" />
          <path d="M0 10 L 0 36 Q 30 46 60 36 L 60 10" fill="#C6F3D8" stroke="#1A1A2E" strokeWidth="3" />
          <text
            x="30"
            y="30"
            textAnchor="middle"
            fontSize="10"
            fontWeight="800"
            fill="#1A1A2E"
            fontFamily="sans-serif"
          >
            PILCHARDS
          </text>
        </g>
      </motion.g>

      {/* Wooden counter */}
      <rect x="0" y="780" width="800" height="40" fill="url(#counter)" />
      <rect x="0" y="800" width="800" height="20" fill="#1A1A2E" opacity="0.25" />
      {/* counter lines */}
      <line x1="0" y1="800" x2="800" y2="800" stroke="#1A1A2E" strokeOpacity="0.3" strokeWidth="2" />

      {/* ——— FLAMINGO shop sign ——— */}
      <motion.g
        initial={reduce ? undefined : { y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        <rect x="250" y="120" width="300" height="80" rx="8" fill="url(#sign)" stroke="#1A1A2E" strokeWidth="3" />
        <text
          x="400"
          y="170"
          textAnchor="middle"
          fontSize="34"
          fontWeight="900"
          fill="#FFF7F3"
          fontFamily="serif"
          letterSpacing="0.05em"
        >
          FLAMINGO
        </text>
        <circle cx="270" cy="160" r="8" fill="#FF5277" />
        <circle cx="530" cy="160" r="8" fill="#FF5277" />
        {/* String */}
        <line x1="260" y1="125" x2="180" y2="80" stroke="#1A1A2E" strokeWidth="2" />
        <line x1="540" y1="125" x2="620" y2="80" stroke="#1A1A2E" strokeWidth="2" />
      </motion.g>

      {/* ——— OWNER ——— */}
      <motion.g
        initial={reduce ? undefined : { y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.15 }}
      >
        {/* Body / apron behind counter (visible above counter) */}
        <path
          d="M300 780 Q 290 700 330 640 L 470 640 Q 510 700 500 780 Z"
          fill="url(#apron)"
          stroke="#1A1A2E"
          strokeWidth="3"
        />
        {/* Apron ties */}
        <path
          d="M330 660 Q 300 690 290 720"
          fill="none"
          stroke="#1A1A2E"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M470 660 Q 500 690 510 720"
          fill="none"
          stroke="#1A1A2E"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Apron pocket */}
        <rect
          x="360"
          y="700"
          width="80"
          height="48"
          rx="6"
          fill="#FFD6E0"
          stroke="#1A1A2E"
          strokeWidth="2.5"
        />

        {/* Blouse under apron */}
        <path
          d="M315 640 Q 330 570 400 560 Q 470 570 485 640 Z"
          fill="url(#blouse)"
          stroke="#1A1A2E"
          strokeWidth="3"
        />

        {/* Neck */}
        <path
          d="M375 565 L 425 565 L 420 540 L 380 540 Z"
          fill="url(#skin)"
          stroke="#1A1A2E"
          strokeWidth="2"
        />

        {/* Face */}
        <ellipse
          cx="400"
          cy="480"
          rx="76"
          ry="88"
          fill="url(#skin)"
          stroke="#1A1A2E"
          strokeWidth="3"
        />

        {/* Ears + earrings */}
        <ellipse cx="326" cy="490" rx="10" ry="16" fill="url(#skin)" stroke="#1A1A2E" strokeWidth="2.5" />
        <ellipse cx="474" cy="490" rx="10" ry="16" fill="url(#skin)" stroke="#1A1A2E" strokeWidth="2.5" />
        <circle cx="320" cy="514" r="6" fill="#FFD46B" stroke="#1A1A2E" strokeWidth="1.5" />
        <circle cx="480" cy="514" r="6" fill="#FFD46B" stroke="#1A1A2E" strokeWidth="1.5" />

        {/* Doek (headscarf) */}
        <path
          d="M318 480 Q 300 360 400 340 Q 500 360 482 480 Q 470 440 400 430 Q 330 440 318 480 Z"
          fill="url(#doek)"
          stroke="#1A1A2E"
          strokeWidth="3"
        />
        {/* Doek front fold */}
        <path
          d="M340 430 Q 400 380 460 430"
          fill="none"
          stroke="#FFE9B8"
          strokeOpacity="0.5"
          strokeWidth="4"
        />
        {/* Doek knot */}
        <path
          d="M398 340 Q 380 310 420 310 Q 440 325 420 342 Z"
          fill="#D93A5C"
          stroke="#1A1A2E"
          strokeWidth="2.5"
        />

        {/* Eyebrows */}
        <path d="M358 458 Q 372 450 388 458" fill="none" stroke="#1A1A2E" strokeWidth="4" strokeLinecap="round" />
        <path d="M412 458 Q 428 450 442 458" fill="none" stroke="#1A1A2E" strokeWidth="4" strokeLinecap="round" />

        {/* Eyes — confident closed/warm smile-eyes */}
        <path d="M358 478 Q 372 486 388 478" fill="none" stroke="#1A1A2E" strokeWidth="4" strokeLinecap="round" />
        <path d="M412 478 Q 428 486 442 478" fill="none" stroke="#1A1A2E" strokeWidth="4" strokeLinecap="round" />

        {/* Nose hint */}
        <path
          d="M396 490 Q 394 508 400 516 Q 406 508 404 490"
          fill="none"
          stroke="#1A1A2E"
          strokeOpacity="0.6"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Smile */}
        <path
          d="M375 532 Q 400 556 425 532"
          fill="#B42A48"
          stroke="#1A1A2E"
          strokeWidth="3"
        />
        <path
          d="M378 533 Q 400 548 422 533"
          fill="#FFF7F3"
        />

        {/* Cheek warmth */}
        <circle cx="350" cy="510" r="10" fill="#FF5277" opacity="0.18" />
        <circle cx="450" cy="510" r="10" fill="#FF5277" opacity="0.18" />
      </motion.g>

      {/* ——— ARM + PHONE ——— */}
      <motion.g
        initial={reduce ? undefined : { y: 12, opacity: 0, rotate: 4 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.45 }}
        style={{ transformOrigin: "520px 760px" }}
      >
        {/* Sleeve */}
        <path
          d="M470 650 Q 540 660 560 700 L 555 750 L 520 755 Q 500 740 475 690 Z"
          fill="url(#blouse)"
          stroke="#1A1A2E"
          strokeWidth="3"
        />
        {/* Forearm */}
        <path
          d="M520 755 Q 575 790 610 760 L 618 720 Q 590 705 558 720 Z"
          fill="url(#skinArm)"
          stroke="#1A1A2E"
          strokeWidth="3"
        />
        {/* Hand */}
        <path
          d="M610 760 Q 640 750 650 730 Q 655 710 640 700 L 620 708 Q 605 722 608 740 Z"
          fill="url(#skinArm)"
          stroke="#1A1A2E"
          strokeWidth="3"
        />

        {/* Phone */}
        <g transform="translate(560 560) rotate(12)">
          <rect
            x="0"
            y="0"
            width="140"
            height="230"
            rx="20"
            fill="#1A1A2E"
            stroke="#1A1A2E"
            strokeWidth="3"
          />
          <rect x="8" y="12" width="124" height="206" rx="12" fill="url(#screen)" />

          {/* Status bar */}
          <rect x="20" y="22" width="30" height="4" rx="2" fill="#1A1A2E" opacity="0.5" />
          <rect x="90" y="20" width="30" height="8" rx="3" fill="#1A1A2E" opacity="0.4" />

          {/* QR grid — 7x7 stylised */}
          <g transform="translate(22 42)">
            <rect x="0" y="0" width="96" height="96" rx="8" fill="#FFF7F3" stroke="#1A1A2E" strokeWidth="2" />
            {/* three finder patterns */}
            <rect x="6" y="6" width="22" height="22" fill="#1A1A2E" />
            <rect x="10" y="10" width="14" height="14" fill="#FFF7F3" />
            <rect x="13" y="13" width="8" height="8" fill="#1A1A2E" />

            <rect x="68" y="6" width="22" height="22" fill="#1A1A2E" />
            <rect x="72" y="10" width="14" height="14" fill="#FFF7F3" />
            <rect x="75" y="13" width="8" height="8" fill="#1A1A2E" />

            <rect x="6" y="68" width="22" height="22" fill="#1A1A2E" />
            <rect x="10" y="72" width="14" height="14" fill="#FFF7F3" />
            <rect x="13" y="75" width="8" height="8" fill="#1A1A2E" />

            {/* scatter bits */}
            {[
              [36, 6], [46, 6], [56, 6],
              [36, 16], [56, 16],
              [36, 26], [46, 26],
              [6, 34], [16, 34], [36, 34], [46, 34], [66, 34], [76, 34], [86, 34],
              [16, 42], [26, 42], [56, 42], [66, 42], [86, 42],
              [6, 50], [36, 50], [56, 50], [76, 50],
              [16, 58], [26, 58], [46, 58], [66, 58], [86, 58],
              [36, 66], [56, 66], [76, 66],
              [36, 76], [46, 76], [76, 76], [86, 76],
              [36, 86], [56, 86], [66, 86], [86, 86],
            ].map(([x, y], i) => (
              <rect key={i} x={x} y={y} width="6" height="6" fill="#1A1A2E" />
            ))}

            {/* Centre flamingo chip */}
            <rect x="40" y="40" width="16" height="16" rx="3" fill="#FFF7F3" />
            <rect x="42" y="42" width="12" height="12" rx="2" fill="#FF5277" />
            <text
              x="48"
              y="52"
              textAnchor="middle"
              fontSize="10"
              fontWeight="900"
              fill="#FFF7F3"
              fontFamily="serif"
            >
              F
            </text>
          </g>

          {/* Amount toast */}
          <g transform="translate(16 148)">
            <rect
              x="0"
              y="0"
              width="108"
              height="38"
              rx="10"
              fill="#C6F3D8"
              stroke="#1A1A2E"
              strokeWidth="2"
            />
            <text
              x="12"
              y="26"
              fontSize="18"
              fontWeight="900"
              fill="#1A1A2E"
              fontFamily="serif"
            >
              +R 45.00
            </text>
            <text
              x="92"
              y="26"
              fontSize="18"
              fontWeight="900"
              fill="#1A1A2E"
              fontFamily="sans-serif"
            >
              ✓
            </text>
          </g>

          <rect x="18" y="196" width="104" height="10" rx="5" fill="#1A1A2E" opacity="0.15" />
        </g>
      </motion.g>

      {/* ——— PING motion rings floating up ——— */}
      {!reduce && (
        <>
          {[0, 1, 2].map(i => (
            <motion.circle
              key={i}
              cx="680"
              cy="540"
              r="10"
              fill="none"
              stroke="#FF5277"
              strokeWidth="3"
              initial={{ opacity: 0, y: 0, scale: 1 }}
              animate={{
                opacity: [0, 1, 0],
                y: [-0, -120],
                scale: [0.8, 1.6],
              }}
              transition={{
                duration: 2.2,
                delay: 0.6 + i * 0.45,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}
    </motion.svg>
  );
}
