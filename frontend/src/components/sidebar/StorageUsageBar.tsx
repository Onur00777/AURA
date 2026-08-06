"use client";

import { formatMb, type StorageSnapshot } from "@/lib/storage/quota";

type StorageUsageBarProps = {
  storage: StorageSnapshot;
  onAutoTrim: () => void;
};

function barColor(percent: number): string {
  if (percent > 90) return "bg-red-500";
  if (percent > 75) return "bg-amber-400";
  return "bg-emerald-400";
}

function labelColor(percent: number): string {
  if (percent > 90) return "text-red-300";
  if (percent > 75) return "text-amber-300";
  return "text-emerald-400/90";
}

export function StorageUsageBar({ storage, onAutoTrim }: StorageUsageBarProps) {
  const { usedMb, quotaMb, percent } = storage;
  const showWarning = percent > 85;

  return (
    <div className="space-y-2.5">
      {showWarning ? (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2">
          <p className="text-[11px] leading-snug text-amber-100/90">
            Storage is getting full. Free space by trimming old chats.
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

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span
            className={`font-mono text-[9px] uppercase tracking-[0.14em] ${labelColor(percent)}`}
          >
            Storage
          </span>
          <span className="font-mono text-[9px] tracking-wide text-[#8b8b9a]">
            {formatMb(usedMb)} MB / {formatMb(quotaMb)} MB ({Math.round(percent)}%)
          </span>
        </div>
        <div
          className="h-1 overflow-hidden rounded-full bg-white/[0.06]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
          aria-label="AURA localStorage usage"
        >
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-300 ${barColor(percent)}`}
            style={{ width: `${Math.max(2, Math.min(100, percent))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
