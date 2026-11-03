import { storageKeysFor, type AuraMode } from "@/lib/workspace/mode";

export type ModeUsage = {
  chats: number;
  messages: number;
};

type StoredMessage = {
  content?: string;
};

type StoredSession = {
  messages?: StoredMessage[];
};

function filledMessages(session: StoredSession): number {
  return (session.messages ?? []).filter((message) => (message.content ?? "").trim().length > 0)
    .length;
}

/** Conversations are threads with at least one real message. Blank "New chat" rows do not count. */
export function summarizeSessions(sessions: StoredSession[]): ModeUsage {
  let chats = 0;
  let messages = 0;
  for (const session of sessions) {
    const count = filledMessages(session);
    if (count > 0) chats += 1;
    messages += count;
  }
  return { chats, messages };
}

export function readStoredSessions(mode: AuraMode): StoredSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKeysFor(mode).sessions);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredSession[]) : [];
  } catch {
    return [];
  }
}
