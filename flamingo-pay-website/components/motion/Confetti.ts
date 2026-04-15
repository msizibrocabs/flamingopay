"use client";

import confetti from "canvas-confetti";

/**
 * One-liner celebratory burst using Flamingo brand colours.
 * Safe to call from any client component.
 */
export function flamingoConfetti() {
  const colors = ["#FF5277", "#B42A48", "#FFE9B8", "#C6F3D8", "#BFE4FF", "#E9DCFF"];
  const end = Date.now() + 700;

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.85 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.85 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/** Quick single burst near a specific DOM element (good for button clicks). */
export function burstAt(x: number, y: number) {
  confetti({
    particleCount: 60,
    spread: 70,
    startVelocity: 35,
    origin: { x, y },
    colors: ["#FF5277", "#FFE9B8", "#C6F3D8", "#BFE4FF"],
  });
}
