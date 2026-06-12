"use client";

import React from "react";

/** Dependency-free SVG charts used by the student and teacher dashboards. */

export function HBarChart({
  data,
  unit = "%",
  max = 100,
  colorFor,
}: {
  data: { label: string; value: number; sub?: string }[];
  unit?: string;
  max?: number;
  colorFor?: (value: number) => string;
}) {
  const color = colorFor ?? ((v: number) => (v < 50 ? "#f43f5e" : v < 75 ? "#f59e0b" : "#22c55e"));
  if (data.length === 0) return null;
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex justify-between text-sm font-bold text-slate-700">
            <span>
              {d.label}
              {d.sub && <span className="text-slate-400 font-normal ml-2">{d.sub}</span>}
            </span>
            <span>
              {d.value}
              {unit}
            </span>
          </div>
          <div className="h-4 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (d.value / max) * 100)}%`, background: color(d.value) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LineChart({
  points,
  height = 160,
  unit = "%",
}: {
  points: { x: string; y: number }[];
  height?: number;
  unit?: string;
}) {
  const W = 560;
  const pad = 30;
  if (points.length === 0) return null;
  const maxY = 100;
  const xs = (i: number) =>
    points.length === 1 ? W / 2 : pad + (i / (points.length - 1)) * (W - pad * 2);
  const ys = (v: number) => height - pad - (v / maxY) * (height - pad * 2);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xs(i)} ${ys(p.y)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label="trend chart">
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={pad} y1={ys(g)} x2={W - pad} y2={ys(g)} stroke="#e2e8f0" strokeWidth="1" />
          <text x={4} y={ys(g) + 4} fontSize="10" fill="#94a3b8">
            {g}
            {unit}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={xs(i)} cy={ys(p.y)} r="5" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
          <text x={xs(i)} y={height - 8} fontSize="9" fill="#64748b" textAnchor="middle">
            {p.x.slice(5)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/90 border-2 border-white shadow p-4 flex items-center gap-3">
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="text-xs font-bold text-slate-500">{label}</div>
        <div className="text-xl font-extrabold text-slate-800">{value}</div>
      </div>
    </div>
  );
}
