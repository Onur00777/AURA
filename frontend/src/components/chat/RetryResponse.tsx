"use client";

import { AURA_POWER_TIERS, isAuraPower, type AuraPower } from "@/lib/workspace/mode";

export function RetryResponse({ disabled, onRetry }: {
  disabled: boolean;
  onRetry: (power?: AuraPower) => void;
}) {
  const control = "rounded-lg border border-white/[0.08] bg-[#111113] px-2 py-1 font-mono text-[10px] text-zinc-400 enabled:hover:text-emerald-300 focus-visible:outline-emerald-400 disabled:opacity-40";
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <button type="button" disabled={disabled} className={control} onClick={() => onRetry()}>
        Retry
      </button>
      <select
        aria-label="Retry with a different power profile"
        className={control}
        disabled={disabled}
        value=""
        onChange={(event) => {
          if (isAuraPower(event.target.value)) onRetry(event.target.value);
        }}
      >
        <option value="" disabled>Retry with…</option>
        {AURA_POWER_TIERS.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
      </select>
    </div>
  );
}
