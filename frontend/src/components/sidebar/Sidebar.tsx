"use client";

import { AnimatePresence, motion } from "framer-motion";

import { ModeToggle } from "@/components/sidebar/ModeToggle";
import { StorageUsageBar } from "@/components/sidebar/StorageUsageBar";
import type { ChatSession } from "@/hooks/useChatSessions";
import type { StorageSnapshot } from "@/lib/storage/quota";
import type { AuraMode } from "@/lib/workspace/mode";

type SidebarProps = {
  open: boolean;
  mode: AuraMode;
  sessions: ChatSession[];
  activeId: string;
  storage: StorageSnapshot;
  generating: boolean;
  onModeChange: (mode: AuraMode) => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onAutoTrim: () => void;
  onCloseMobile: () => void;
};

function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
    </svg>
  );
}

export function Sidebar({
  open,
  mode,
  sessions,
  activeId,
  storage,
  generating,
  onModeChange,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onAutoTrim,
  onCloseMobile,
}: SidebarProps) {
  const recent = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  const panel = (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-white/[0.06] bg-[#080808]/90 backdrop-blur-xl">
      <div className="px-3 pb-3 pt-4">
        <div className="mb-3.5 flex items-center gap-2 px-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00FF41] shadow-[0_0_6px_rgba(0,255,65,0.7)]" aria-hidden />
          <p className="font-pixel text-[8px] uppercase leading-none tracking-[0.18em] text-zinc-300">
            AURA
          </p>
        </div>
        <ModeToggle
          mode={mode}
          disabled={generating}
          onChange={onModeChange}
        />
        <button
          type="button"
          onClick={() => {
            onNewChat();
            onCloseMobile();
          }}
          className="group mt-2.5 flex h-9 w-full items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 text-xs font-medium text-zinc-200 transition-all hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 text-[#00FF41]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Chat
        </button>
      </div>

      <div className="px-4 pb-1.5 pt-2">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">
          {mode === "engineering" ? "CompE · Recent" : "Recent"}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-3" aria-label="Recent chats">
        <ul className="flex flex-col gap-0.5">
          {recent.map((session) => {
            const active = session.id === activeId;
            return (
              <li key={session.id} className="group relative">
                <button
                  type="button"
                  onClick={() => {
                    onSelectChat(session.id);
                    onCloseMobile();
                  }}
                  className={`flex w-full items-center gap-2 rounded-md py-1.5 pl-2.5 pr-9 text-left transition-colors duration-150 ${
                    active
                      ? "bg-white/[0.06] text-white"
                      : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200"
                  }`}
                >
                  <span
                    className={`h-1 w-1 shrink-0 rounded-full ${
                      active ? "bg-[#00FF41] shadow-[0_0_6px_rgba(0,255,65,0.7)]" : "bg-zinc-700"
                    }`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] tracking-tight">
                    {session.title}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${session.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(session.id);
                  }}
                  className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-zinc-600 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <StorageUsageBar storage={storage} onAutoTrim={onAutoTrim} />
      </div>
    </aside>
  );

  return (
    <>
      <div className="relative z-30 hidden h-full md:block">{panel}</div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Close sidebar"
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 md:hidden"
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              {panel}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
