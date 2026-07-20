"use client";

import React from "react";

type Variant = "primary" | "secondary" | "success" | "danger" | "ghost";

const STYLES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-[0_4px_0_#1e40af] active:shadow-none active:translate-y-1",
  secondary:
    "bg-gradient-to-b from-amber-300 to-amber-400 hover:from-amber-200 hover:to-amber-300 text-amber-950 shadow-[0_4px_0_#b45309] active:shadow-none active:translate-y-1",
  success:
    "bg-gradient-to-b from-green-400 to-green-500 hover:from-green-300 hover:to-green-400 text-white shadow-[0_4px_0_#15803d] active:shadow-none active:translate-y-1",
  danger:
    "bg-gradient-to-b from-rose-400 to-rose-500 hover:from-rose-300 hover:to-rose-400 text-white shadow-[0_4px_0_#9f1239] active:shadow-none active:translate-y-1",
  ghost: "bg-white/70 hover:bg-white text-slate-700 border-2 border-slate-300",
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-3 text-base sm:text-lg font-bold transition-all duration-150 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none min-h-[3rem] ${STYLES[variant]} ${className}`}
      {...props}
    >
      {variant !== "ghost" && (
        <span
          className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
          style={{
            background:
              "linear-gradient(75deg, transparent 35%, rgba(255,255,255,0.5) 50%, transparent 65%)",
            animation: "shine 0.8s ease-out",
          }}
        />
      )}
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
