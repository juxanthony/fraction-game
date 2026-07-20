"use client";

import React, { useMemo } from "react";

/**
 * Decorative, non-interactive backdrop rendered behind the whole app:
 * soft drifting colour blobs + gently floating fraction/maths emojis.
 * Pure CSS animation, no assets, and hidden from assistive tech & print.
 */

const BLOBS = [
  { c: "#f9a8d4", top: "-6%", left: "-4%", size: 340, delay: "0s" },
  { c: "#93c5fd", top: "40%", left: "72%", size: 380, delay: "-4s" },
  { c: "#fde047", top: "68%", left: "-6%", size: 300, delay: "-8s" },
  { c: "#86efac", top: "8%", left: "58%", size: 300, delay: "-12s" },
  { c: "#c4b5fd", top: "78%", left: "60%", size: 320, delay: "-6s" },
];

const FLOATERS = ["½", "¾", "⅓", "⅖", "➕", "➖", "🟰", "🔢", "🧮", "⭐", "🎈", "✨"];

export default function AnimatedBackground() {
  // Deterministic positions (no Math.random on server) to avoid hydration drift.
  const floaters = useMemo(
    () =>
      FLOATERS.map((ch, i) => ({
        ch,
        left: `${(i * 8.3 + 4) % 96}%`,
        top: `${(i * 13.7 + 6) % 90}%`,
        size: 22 + ((i * 7) % 26),
        duration: 6 + ((i * 5) % 9),
        delay: `-${(i * 1.7) % 8}s`,
        opacity: 0.12 + ((i * 3) % 5) * 0.03,
      })),
    []
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none no-print" aria-hidden="true">
      {BLOBS.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-blob"
          style={{
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            background: b.c,
            filter: "blur(70px)",
            opacity: 0.5,
            animationDelay: b.delay,
          }}
        />
      ))}
      {floaters.map((f, i) => (
        <span
          key={i}
          className="absolute font-black select-none"
          style={{
            left: f.left,
            top: f.top,
            fontSize: f.size,
            opacity: f.opacity,
            color: "#1e293b",
            animation: `bob ${f.duration}s ease-in-out infinite`,
            animationDelay: f.delay,
          }}
        >
          {f.ch}
        </span>
      ))}
    </div>
  );
}
