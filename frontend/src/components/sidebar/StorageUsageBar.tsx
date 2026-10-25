"use client";

import {
  formatStorageQuota,
  formatStorageUsed,
  type StorageSnapshot,
} from "@/lib/storage/quota";

type StorageUsageBarProps = {
  storage: StorageSnapshot;
  onAutoTrim: () => void;
};

function barColor(percent: number): string {
  if (percent > 90) return "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]";
  if (percent > 75) return "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]";
  return "bg-[#00FF41] shadow-[0_0_6px_rgba(0,255,65,0.7)]";
}

function statusColor(percent: number): string {
  if (percent > 90) return "text-red-400";
  if (percent > 75) return "text-amber-400";
  return "text-[#00FF41]";
}

export function StorageUsageBar({ storage, onAutoTrim }: StorageUsageBarProps) {
  const { usedBytes, quotaBytes, percent } = storage;
  const showWarning = percent > 85;
  const barWidth = usedBytes <= 0 ? 0 : Math.max(2, Math.min(100, percent));

  return (
    <div className="space-y-2.5">
      {showWarning ? (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2">
          <p className="text-[11px] leading-snug text-amber-100/90">
            Browser chat cache is getting full. Trim old threads to free space.
          </p>
          <button
            type="button"
            onClick={onAutoTrim}
            className="mt-2 w-full rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-1.5 text-[11px] font-medium text-amber-200 transition-colors hover:bg-amber-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
          >
            Auto-Trim Oldest 3 Chats
          </button>
        </div>
      ) : null}

      <div className="rounded-lg border border-white/[0.05] bg-black/30 px-2.5 py-2 font-mono">
        <div className="mb-2 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.16em]">
          <span className="flex items-center gap-1.5 text-zinc-500">
            <span className={`h-1 w-1 rounded-full ${barColor(percent)}`} aria-hidden />
            Chat cache
          </span>
          <span className={`tabular-nums ${statusColor(percent)}`}>
            {percent.toFixed(1).padStart(4, "0")}%
          </span>
        </div>
        <div
          className="h-px bg-white/[0.08]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
          aria-label="Browser localStorage used by AURA chats"
        >
          <div
            className={`h-full transition-[width,background-color] duration-300 ${barColor(percent)}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[9px] tabular-nums text-zinc-500">
          <span>
            {formatStorageUsed(usedBytes)}
            <span className="text-zinc-700"> / </span>
            {formatStorageQuota(quotaBytes)}
          </span>
          <span className="uppercase tracking-[0.14em] text-zinc-700">localStorage</span>
        </div>
      </div>
    </div>
  );
}
