"use client";

import { ModelSelector } from "@/components/models/ModelSelector";
import type { ModelItem } from "@/lib/types/api";

type ChatHeaderProps = {
  models: ModelItem[];
  selectedModel: string;
  loading: boolean;
  error: string | null;
  online: boolean;
  onSelectModel: (name: string) => void;
  onToggleSidebar: () => void;
};

export function ChatHeader({
  models,
  selectedModel,
  loading,
  error,
  online,
  onSelectModel,
  onToggleSidebar,
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[rgba(8,12,10,0.78)] px-3 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-[#c9c9d1] transition-colors hover:bg-white/[0.04] hover:text-emerald-300 md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative hidden h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] sm:flex">
              <span className="text-sm font-semibold tracking-tight text-emerald-400">A</span>
              <span
                className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${
                  online
                    ? "bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.75)]"
                    : "bg-zinc-600"
                }`}
                aria-hidden
              />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold tracking-[-0.03em] text-[#f0f0f3]">
                Workspace
              </p>
              <p className="font-mono text-[10px] tracking-wide text-[#6e6e7a]">
                {online ? (
                  <span className="text-emerald-500/85">Online</span>
                ) : (
                  <span>Offline</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          loading={loading}
          error={error}
          onSelect={onSelectModel}
        />
      </div>
    </header>
  );
}
