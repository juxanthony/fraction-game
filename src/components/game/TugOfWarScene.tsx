"use client";

import React from "react";
import { motion } from "framer-motion";
import { WIN_AT } from "@/lib/game-engine/engine";

/**
 * The animated tug-of-war field: crowd, grass, two teams, rope and centre
 * marker. `ropePosition` runs from -WIN_AT (blue/opponent wins, left) to
 * +WIN_AT (red/player wins, right); everything shifts smoothly with it.
 */

interface Props {
  ropePosition: number;
  playerName: string;
  opponentName: string;
  shake?: boolean;
}

const W = 800;
const H = 260;
const CENTER = W / 2;
const PIXELS_PER_POINT = 38;

function Puller({ color, flip = false }: { color: string; flip?: boolean }) {
  const s = flip ? -1 : 1;
  return (
    <g transform={`scale(${s},1)`}>
      {/* leaning body */}
      <line x1="0" y1="0" x2="-16" y2="26" stroke={color} strokeWidth="7" strokeLinecap="round" />
      {/* legs */}
      <line x1="-16" y1="26" x2="-30" y2="44" stroke={color} strokeWidth="6" strokeLinecap="round" />
      <line x1="-16" y1="26" x2="-6" y2="46" stroke={color} strokeWidth="6" strokeLinecap="round" />
      {/* arms gripping rope */}
      <line x1="-2" y1="6" x2="14" y2="10" stroke={color} strokeWidth="5" strokeLinecap="round" />
      {/* head */}
      <circle cx="2" cy="-8" r="9" fill="#fcd9b8" stroke={color} strokeWidth="2.5" />
    </g>
  );
}

function Team({ x, color, flip }: { x: number; color: string; flip?: boolean }) {
  const dir = flip ? 1 : -1;
  return (
    <g transform={`translate(${x},170)`}>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${dir * i * 38},0)`}>
          <Puller color={color} flip={flip} />
        </g>
      ))}
    </g>
  );
}

export default function TugOfWarScene({ ropePosition, playerName, opponentName, shake }: Props) {
  const offset = ropePosition * PIXELS_PER_POINT;
  const blueWinning = ropePosition < 0;
  const redWinning = ropePosition > 0;

  return (
    <div className="rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-gradient-to-b from-sky-300 to-sky-200">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="tug of war field">
        {/* sun + clouds */}
        <circle cx="60" cy="42" r="24" fill="#fde047" className="animate-float" />
        <g fill="#ffffff" opacity="0.9">
          <ellipse cx="220" cy="40" rx="34" ry="14" />
          <ellipse cx="250" cy="34" rx="26" ry="12" />
          <ellipse cx="600" cy="50" rx="38" ry="14" />
        </g>

        {/* crowd stands — the crowd jumps and cheers after every answer */}
        <rect x="0" y="64" width={W} height="44" fill="#94a3b8" />
        {Array.from({ length: 26 }, (_, i) => (
          <motion.circle
            key={i}
            cx={18 + i * 30}
            cy={i % 2 === 0 ? 78 : 92}
            r="8"
            fill={["#f472b6", "#60a5fa", "#fbbf24", "#34d399", "#a78bfa"][i % 5]}
            animate={shake ? { cy: [i % 2 === 0 ? 78 : 92, (i % 2 === 0 ? 78 : 92) - 6 - (i % 3) * 2, i % 2 === 0 ? 78 : 92] } : {}}
            transition={{ duration: 0.5, delay: (i % 5) * 0.05, repeat: shake ? 1 : 0 }}
          />
        ))}

        {/* grass field */}
        <rect x="0" y="108" width={W} height={H - 108} fill="#4ade80" />
        <rect x="0" y="108" width={W} height="8" fill="#86efac" />

        {/* win zones */}
        <rect x="0" y="116" width={CENTER - WIN_AT * PIXELS_PER_POINT} height={H - 116} fill="#60a5fa" opacity="0.18" />
        <rect x={CENTER + WIN_AT * PIXELS_PER_POINT} y="116" width={CENTER - WIN_AT * PIXELS_PER_POINT} height={H - 116} fill="#f87171" opacity="0.18" />

        {/* centre line */}
        <line x1={CENTER} y1="116" x2={CENTER} y2={H} stroke="#ffffff" strokeWidth="4" strokeDasharray="10 8" />

        {/* pull-strength scale */}
        {Array.from({ length: WIN_AT * 2 + 1 }, (_, i) => {
          const x = CENTER + (i - WIN_AT) * PIXELS_PER_POINT;
          return <line key={i} x1={x} y1={H - 14} x2={x} y2={H - 4} stroke="#ffffff" strokeWidth="2" opacity="0.7" />;
        })}

        {/* everything that moves with the rope */}
        <motion.g
          animate={{ x: offset, rotate: shake ? [0, -0.6, 0.6, 0] : 0 }}
          transition={{ type: "spring", stiffness: 70, damping: 14 }}
        >
          {/* rope */}
          <line x1={CENTER - 190} y1="180" x2={CENTER + 190} y2="180" stroke="#92400e" strokeWidth="9" strokeLinecap="round" />
          <line x1={CENTER - 190} y1="180" x2={CENTER + 190} y2="180" stroke="#d97706" strokeWidth="4" strokeDasharray="14 10" />

          {/* centre flag on the rope */}
          <g transform={`translate(${CENTER},180)`}>
            <line x1="0" y1="0" x2="0" y2="-38" stroke="#1e293b" strokeWidth="3.5" />
            <path d="M 0 -38 L 30 -30 L 0 -22 Z" fill="#ef4444" stroke="#1e293b" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="7" fill="#fbbf24" stroke="#92400e" strokeWidth="2.5" />
          </g>

          {/* teams (they hold the rope, so they slide with it) */}
          <Team x={CENTER - 215} color="#2563eb" />
          <Team x={CENTER + 215} color="#dc2626" flip />
        </motion.g>

        {/* team labels */}
        <g fontWeight="bold" fontSize="17">
          <text x="24" y="140" fill="#1d4ed8" opacity={blueWinning ? 1 : 0.75}>
            🔵 {opponentName}
          </text>
          <text x={W - 24} y="140" fill="#b91c1c" textAnchor="end" opacity={redWinning ? 1 : 0.75}>
            {playerName} 🔴
          </text>
        </g>
      </svg>
    </div>
  );
}
