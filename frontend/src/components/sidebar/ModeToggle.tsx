"use client";

import type { AuraMode } from "@/lib/workspace/mode";

type ModeToggleProps = {
  mode: AuraMode;
  disabled?: boolean;
  onChange: (mode: AuraMode) => void;
};

/** Set to false to drop the frosted plate on the CompE tab. */
const COMPE_GLASS = true;

export function ModeToggle({ mode, disabled, onChange }: ModeToggleProps) {
  const engineering = mode === "engineering";
  const slide = engineering ? "translateX(100%)" : "translateX(0)";

  return (
    <div
      role="tablist"
      aria-label="Workspace mode"
      className="relative grid h-8 grid-cols-2 overflow-visible rounded-lg border border-white/[0.06] bg-black/40 p-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute -bottom-1.5 left-0 -top-1.5 w-1/2 rounded-lg blur-[8px] transition-transform duration-200 ease-out ${
          engineering
            ? "bg-[linear-gradient(100deg,rgba(14,165,233,0.55),rgba(16,185,129,0.32)_48%,rgba(139,92,246,0.5))]"
            : "bg-white/30"
        }`}
        style={{ transform: slide }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0.5 left-0.5 top-0.5 z-[1] w-[calc(50%-2px)] rounded-md border border-white/[0.08] bg-white/[0.07] transition-transform duration-200 ease-out"
        style={{ transform: slide }}
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
        className={`relative z-10 flex items-center justify-center gap-1 overflow-hidden rounded-md text-[11px] font-medium tracking-tight transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 ${
          engineering ? "text-white" : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 isolate transition-opacity duration-200 ${
            engineering ? "opacity-100" : "opacity-30"
          }`}
        >
          <span className="absolute -left-1/4 top-0 h-full w-3/4 rounded-full bg-[#0ea5e9] opacity-70 mix-blend-screen blur-[6px] will-change-transform [animation:aura-drift-a_16s_cubic-bezier(0.4,0,0.2,1)_-4s_infinite_alternate_both]" />
          <span className="absolute left-1/4 top-0 h-full w-3/4 rounded-full bg-[#10b981] opacity-60 mix-blend-screen blur-[6px] will-change-transform [animation:aura-drift-b_21s_cubic-bezier(0.4,0,0.2,1)_-9s_infinite_alternate_both]" />
          <span className="absolute left-1/3 top-0 h-full w-1/2 rounded-full bg-[#8b5cf6] opacity-45 mix-blend-screen blur-[8px] will-change-transform [animation:aura-drift-d_18s_cubic-bezier(0.4,0,0.2,1)_-6s_infinite_alternate_both]" />
        </span>
        {COMPE_GLASS ? (
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-0 rounded-[5px] border border-white/20 bg-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] backdrop-blur-[3px] transition-opacity duration-200 ${
              engineering ? "opacity-100" : "opacity-40"
            }`}
          />
        ) : null}
        <span
          className={`relative ${engineering ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.65)]" : ""}`}
        >
          CompE
        </span>
        <span
          className={`relative font-mono text-[8px] font-semibold uppercase tracking-[0.12em] ${
            engineering
              ? "text-[#b6ffc9] drop-shadow-[0_1px_1px_rgba(0,0,0,0.55)]"
              : "text-zinc-500"
          }`}
        >
          Beta
        </span>
      </button>
    </div>
  );
}
