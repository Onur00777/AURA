"use client";

import { AnimatePresence, motion } from "framer-motion";

import { StorageUsageBar } from "@/components/sidebar/StorageUsageBar";
import type { ChatSession } from "@/hooks/useChatSessions";
import type { StorageSnapshot } from "@/lib/storage/quota";

type SidebarProps = {
  open: boolean;
  sessions: ChatSession[];
  activeId: string;
  storage: StorageSnapshot;
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
  sessions,
  activeId,
  storage,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onAutoTrim,
  onCloseMobile,
}: SidebarProps) {
  const recent = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  const panel = (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0A0D0B]/95 backdrop-blur-2xl">
      <div className="border-b border-white/[0.05] px-4 pb-4 pt-5">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6e6e7a]">
          AURA
        </p>
        <button
          type="button"
          onClick={() => {
            onNewChat();
            onCloseMobile();
          }}
          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-transparent px-3 py-2.5 text-[13px] font-medium tracking-tight text-emerald-300 transition-all duration-200 hover:border-emerald-400/70 hover:bg-emerald-500/[0.08] hover:shadow-[0_0_24px_rgba(16,185,129,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
        >
          <span className="text-base leading-none text-emerald-400">+</span>
          New Chat
        </button>
      </div>

      <div className="px-4 pb-2 pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6e6e7a]">
          Recent
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
                  className={`flex w-full items-center gap-2 rounded-lg py-2 pl-2.5 pr-9 text-left transition-colors duration-150 ${
                    active
                      ? "bg-white/[0.06] text-[#f0f0f3]"
                      : "text-[#9a9aa6] hover:bg-white/[0.03] hover:text-[#d8d8e0]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      active ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" : "bg-[#3a3a44]"
                    }`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] tracking-tight">
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
                  className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#5c5c68] opacity-0 transition-all hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/[0.06] p-3.5">
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
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
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
