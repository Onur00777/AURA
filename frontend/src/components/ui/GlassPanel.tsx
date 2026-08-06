import type { ReactNode } from "react";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
};

export function GlassPanel({ children, className = "" }: GlassPanelProps) {
  return (
    <div
      className={`rounded-2xl border border-emerald-900/30 bg-[rgba(13,17,23,0.72)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}
