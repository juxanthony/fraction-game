"use client";

import React from "react";

type Variant = "primary" | "secondary" | "success" | "danger" | "ghost";

const STYLES: Record<Variant, string> = {
  primary:
    "bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_0_#1e40af] active:shadow-none active:translate-y-1",
  secondary:
    "bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-[0_4px_0_#b45309] active:shadow-none active:translate-y-1",
  success:
    "bg-green-500 hover:bg-green-600 text-white shadow-[0_4px_0_#15803d] active:shadow-none active:translate-y-1",
  danger:
    "bg-rose-500 hover:bg-rose-600 text-white shadow-[0_4px_0_#9f1239] active:shadow-none active:translate-y-1",
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
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base sm:text-lg font-bold transition-all disabled:opacity-50 disabled:pointer-events-none min-h-[3rem] ${STYLES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
