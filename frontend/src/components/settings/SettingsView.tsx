"use client";

import { StorageUsageBar } from "@/components/sidebar/StorageUsageBar";
import type { ChatSession } from "@/hooks/useChatSessions";
import type { StorageSnapshot } from "@/lib/storage/quota";
import {
  readStoredSessions,
  summarizeSessions,
  type ModeUsage,
} from "@/lib/storage/usage";
import type { AuraMode } from "@/lib/workspace/mode";

type SettingsViewProps = {
  mode: AuraMode;
  sessions: ChatSession[];
  storage: StorageSnapshot;
  onAutoTrim: () => void;
  onBack: () => void;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-2 font-display text-2xl tabular-nums tracking-tight text-white">{value}</p>
    </div>
  );
}

function ModeLine({ name, usage }: { name: string; usage: ModeUsage }) {
  const chatLabel = usage.chats === 1 ? "chat" : "chats";
  const messageLabel = usage.messages === 1 ? "message" : "messages";
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-black/25 px-3 py-2.5">
      <span className="text-[13px] text-zinc-200">{name}</span>
      <span className="font-mono text-[11px] tabular-nums text-zinc-500">
        {usage.chats} {chatLabel}
        <span className="text-zinc-700"> · </span>
        {usage.messages} {messageLabel}
      </span>
    </div>
  );
}

export function SettingsView({
  mode,
  sessions,
  storage,
  onAutoTrim,
  onBack,
}: SettingsViewProps) {
  const general = summarizeSessions(
    mode === "general" ? sessions : readStoredSessions("general"),
  );
  const engineering = summarizeSessions(
    mode === "engineering" ? sessions : readStoredSessions("engineering"),
  );
  const chats = general.chats + engineering.chats;
  const messages = general.messages + engineering.messages;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-xl">
        <button
          type="button"
          onClick={onBack}
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        >
          Back to chat
        </button>
        <h1 className="mt-4 font-display text-3xl tracking-tight text-white">Settings</h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-zinc-400">
          Usage on this browser. Chats stay in local storage — there is no account total.
        </p>

        <section className="mt-8" aria-labelledby="usage-heading">
          <h2
            id="usage-heading"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500"
          >
            Usage
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Conversations" value={String(chats)} />
            <Stat label="Messages" value={String(messages)} />
          </div>
          <div className="mt-2 flex flex-col gap-2">
            <ModeLine name="General" usage={general} />
            <ModeLine name="CompE" usage={engineering} />
          </div>
          <div className="mt-4">
            <StorageUsageBar storage={storage} onAutoTrim={onAutoTrim} />
          </div>
        </section>
      </div>
    </div>
  );
}
