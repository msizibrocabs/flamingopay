"use client";

import dynamic from "next/dynamic";

/**
 * Client-only dynamic import of the 3D scene.
 *   - avoids shipping Three.js in the server bundle
 *   - safe SSR: renders a CSS-only glow fallback while the canvas warms up
 */
export const FlamingoHero = dynamic(
  () => import("./FlamingoScene").then(m => m.FlamingoScene),
  {
    ssr: false,
    loading: () => (
      <div className="relative grid h-full w-full place-items-center">
        <div className="h-40 w-40 rounded-full bg-flamingo-pink/40 blur-3xl" />
        <div className="absolute grid h-28 w-28 place-items-center rounded-full bg-gradient-flamingo text-5xl font-black text-white shadow-[0_20px_50px_-10px_rgba(255,82,119,0.6)] float-slow">
          🦩
        </div>
      </div>
    ),
  },
);
