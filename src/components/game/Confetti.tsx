"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

/** Lightweight confetti burst — pure CSS/SVG, no assets. Remount to replay. */

const COLORS = ["#f43f5e", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#fbbf24", "#ec4899"];

export default function Confetti({ count = 40 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.6 + Math.random() * 1.2,
        rotate: Math.random() * 720 - 360,
        color: COLORS[i % COLORS.length],
        width: 6 + Math.random() * 8,
        round: Math.random() < 0.3,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50" aria-hidden="true">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ y: -24, rotate: 0, opacity: 1 }}
          animate={{ y: "110vh", rotate: p.rotate, opacity: [1, 1, 0.6] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: p.width,
            height: p.round ? p.width : p.width * 0.55,
            background: p.color,
            borderRadius: p.round ? "50%" : 2,
          }}
        />
      ))}
    </div>
  );
}
