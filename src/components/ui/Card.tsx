import React from "react";

export default function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-3xl bg-white/90 backdrop-blur shadow-lg border-2 border-white p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}
