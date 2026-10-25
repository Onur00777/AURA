"use client";

import type { AuraMode } from "@/lib/workspace/mode";

type ModeToggleProps = {
  mode: AuraMode;
  disabled?: boolean;
  onChange: (mode: AuraMode) => void;
};

export function ModeToggle({ mode, disabled, onChange }: ModeToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Workspace mode"
      className="relative grid h-8 grid-cols-2 rounded-lg border border-white/[0.06] bg-black/40 p-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0.5 left-0.5 top-0.5 w-[calc(50%-2px)] rounded-md border border-white/[0.06] bg-white/[0.08] shadow-sm transition-transform duration-200 ease-out"
        style={{
          transform: mode === "engineering" ? "translateX(100%)" : "translateX(0)",
        }}
      />

      <button
        type="button"
        role="tab"
        aria-selected={mode === "general"}
        disabled={disabled}
        onClick={() => onChange("general")}
        className={`relative z-10 rounded-md text-[11px] font-medium tracking-tight transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 ${
          mode === "general" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        General
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={mode === "engineering"}
        disabled={disabled}
        onClick={() => onChange("engineering")}
        className={`relative z-10 flex items-center justify-center gap-1 rounded-md text-[11px] font-medium tracking-tight transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 ${
          mode === "engineering" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        CompE
        <span
          className={`font-mono text-[8px] font-semibold uppercase tracking-[0.12em] ${
            mode === "engineering" ? "text-[#00FF41]/80" : "text-zinc-600"
          }`}
        >
          Beta
        </span>
      </button>
    </div>
  );
}
