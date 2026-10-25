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
      className="relative grid grid-cols-2 rounded-full bg-white/[0.05] p-1"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-[#161b1d] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-transform duration-200 ease-out"
        style={{
          left: 4,
          transform:
            mode === "engineering"
              ? "translateX(calc(100% + 4px))"
              : "translateX(0)",
        }}
      />

      <button
        type="button"
        role="tab"
        aria-selected={mode === "general"}
        disabled={disabled}
        onClick={() => onChange("general")}
        className={`relative z-10 rounded-full px-1.5 py-1.5 text-[11px] font-medium tracking-tight transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
          mode === "general" ? "text-[#f0f0f3]" : "text-[#8b8b9a] hover:text-[#c9c9d1]"
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
        className={`relative z-10 flex items-center justify-center gap-1 rounded-full px-1.5 py-1.5 text-[11px] font-medium tracking-tight transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
          mode === "engineering" ? "text-[#f0f0f3]" : "text-[#8b8b9a] hover:text-[#c9c9d1]"
        }`}
      >
        CompE
        <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-[#6e6e7a]">
          Beta
        </span>
      </button>
    </div>
  );
}
