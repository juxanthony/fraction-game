"use client";

import React from "react";
import type { Visual } from "@/lib/question-generator/types";
import type { Fraction } from "@/lib/math/fraction";
import { value } from "@/lib/math/fraction";
import FractionText from "./FractionText";

/**
 * SVG fraction models: bars, circles and number lines. Colour-blind safe —
 * shaded parts also use a hatch pattern, not colour alone.
 */

const FILL = ["#3b82f6", "#f59e0b", "#10b981", "#ec4899"];

export function FractionBar({ f, color = FILL[0], width = 240 }: { f: Fraction; color?: string; width?: number }) {
  const h = 34;
  const cells = f.den;
  const filled = Math.min(f.num, f.den);
  const overflow = f.num > f.den;
  return (
    <svg
      viewBox={`0 0 ${width} ${h}`}
      width="100%"
      style={{ maxWidth: width }}
      role="img"
      aria-label={`${f.num}/${f.den}`}
    >
      <defs>
        <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
        </pattern>
      </defs>
      {Array.from({ length: cells }, (_, i) => {
        const w = width / cells;
        const isFilled = i < filled;
        return (
          <g key={i}>
            <rect
              x={i * w + 1}
              y={1}
              width={w - 2}
              height={h - 2}
              rx={5}
              fill={isFilled ? color : "#f1f5f9"}
              stroke="#475569"
              strokeWidth="1.5"
            />
            {isFilled && <rect x={i * w + 1} y={1} width={w - 2} height={h - 2} rx={5} fill="url(#hatch)" />}
          </g>
        );
      })}
      {overflow && (
        <text x={width - 4} y={h / 2 + 5} textAnchor="end" fontSize="14" fontWeight="bold" fill="#475569">
          +
        </text>
      )}
    </svg>
  );
}

export function FractionCircle({ f, color = FILL[0], size = 110 }: { f: Fraction; color?: string; size?: number }) {
  const wholes = Math.floor(f.num / f.den);
  const remainder = f.num % f.den;
  const circles = f.num >= f.den ? wholes + (remainder > 0 ? 1 : 0) : 1;
  const r = size / 2 - 4;

  const renderCircle = (filledSlices: number, key: number) => {
    const cx = size / 2;
    const cy = size / 2;
    const slices = Array.from({ length: f.den }, (_, i) => {
      const a0 = (i / f.den) * 2 * Math.PI - Math.PI / 2;
      const a1 = ((i + 1) / f.den) * 2 * Math.PI - Math.PI / 2;
      const large = 1 / f.den > 0.5 ? 1 : 0;
      const d = `M ${cx} ${cy} L ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`;
      const isFilled = i < filledSlices;
      return (
        <g key={i}>
          <path d={d} fill={isFilled ? color : "#f1f5f9"} stroke="#475569" strokeWidth="1.5" />
          {isFilled && <path d={d} fill="url(#hatchC)" />}
        </g>
      );
    });
    return (
      <svg key={key} viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={`${f.num}/${f.den}`}>
        <defs>
          <pattern id="hatchC" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
          </pattern>
        </defs>
        {f.den === 1 ? (
          <circle cx={cx} cy={cy} r={r} fill={filledSlices > 0 ? color : "#f1f5f9"} stroke="#475569" strokeWidth="1.5" />
        ) : (
          slices
        )}
      </svg>
    );
  };

  return (
    <div className="flex flex-wrap gap-2 items-center justify-center">
      {Array.from({ length: circles }, (_, i) => {
        const filledSlices = i < wholes ? f.den : remainder;
        return renderCircle(f.num >= f.den ? filledSlices : Math.min(f.num, f.den), i);
      })}
    </div>
  );
}

export function NumberLine({ fractions, width = 320 }: { fractions: Fraction[]; width?: number }) {
  const h = 64;
  const pad = 18;
  const lineW = width - pad * 2;
  const maxDen = Math.max(...fractions.map((f) => f.den));
  const ticks = maxDen <= 12 ? maxDen : 10;
  return (
    <svg viewBox={`0 0 ${width} ${h}`} width="100%" style={{ maxWidth: width }} role="img" aria-label="number line">
      <line x1={pad} y1={40} x2={pad + lineW} y2={40} stroke="#475569" strokeWidth="2.5" />
      {Array.from({ length: ticks + 1 }, (_, i) => (
        <line key={i} x1={pad + (i / ticks) * lineW} y1={34} x2={pad + (i / ticks) * lineW} y2={46} stroke="#475569" strokeWidth="1.5" />
      ))}
      <text x={pad} y={60} textAnchor="middle" fontSize="12" fill="#475569" fontWeight="bold">0</text>
      <text x={pad + lineW} y={60} textAnchor="middle" fontSize="12" fill="#475569" fontWeight="bold">1</text>
      {fractions.map((f, i) => {
        const x = pad + Math.min(1, value(f)) * lineW;
        return (
          <g key={i}>
            <circle cx={x} cy={40} r={6} fill={FILL[i % FILL.length]} stroke="#1e293b" strokeWidth="1.5" />
            <text x={x} y={22} textAnchor="middle" fontSize="11" fontWeight="bold" fill={FILL[i % FILL.length]}>
              {f.num}/{f.den}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function FractionVisual({ visual }: { visual: Visual }) {
  if (visual.kind === "numberline") {
    return (
      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
        <NumberLine fractions={visual.fractions} />
      </div>
    );
  }
  if (visual.kind === "circle") {
    return (
      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex flex-wrap gap-4 justify-center">
        {visual.fractions.map((f, i) => (
          <FractionCircle key={i} f={f} color={FILL[i % FILL.length]} />
        ))}
      </div>
    );
  }
  return (
    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2">
      {visual.fractions.map((f, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-12 text-sm font-bold text-slate-600 shrink-0 text-center">
            {visual.labels?.[i] ? <FractionText text={visual.labels[i]} /> : null}
          </span>
          <FractionBar f={f} color={FILL[i % FILL.length]} />
        </div>
      ))}
    </div>
  );
}
