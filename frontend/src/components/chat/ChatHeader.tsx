"use client";

import { ModelSelector } from "@/components/models/ModelSelector";
import type { ModelItem } from "@/lib/types/api";
import type { AuraMode } from "@/lib/workspace/mode";

type ChatHeaderProps = {
  models: ModelItem[];
  selectedModel: string;
  loading: boolean;
  error: string | null;
  online: boolean;
  mode: AuraMode;
  onSelectModel: (name: string) => void;
  onToggleSidebar: () => void;
};

export function ChatHeader({
  models,
  selectedModel,
  loading,
  error,
  online,
  mode,
  onSelectModel,
  onToggleSidebar,
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#050505]/70 px-3 py-2.5 backdrop-blur-xl sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative hidden h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] sm:flex">
              <span className="font-pixel text-[7px] leading-none text-[#00FF41]">
                A
              </span>
              <span
                className={`absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ${
                  online
                    ? "bg-[#00FF41] shadow-[0_0_6px_rgba(0,255,65,0.7)]"
                    : "bg-zinc-600"
                }`}
                aria-hidden
              />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium tracking-tight text-white">
                {mode === "engineering" ? "Computer Engineering" : "Workspace"}
              </p>
              <p className="font-mono text-[10px] tracking-wide text-zinc-500">
                {mode === "engineering" ? (
                  <span className="text-[#00FF41]/80">CompE · Beta</span>
                ) : online ? (
                  <span className="text-[#00FF41]/80">Online</span>
                ) : (
                  <span>Offline</span>
                )}
                {mode === "engineering" && !online ? (
                  <span className="ml-1.5">· Offline</span>
                ) : null}
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
