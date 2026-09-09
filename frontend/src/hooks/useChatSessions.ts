"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { postChat } from "@/lib/api/client";
import { getStorageSnapshot, type StorageSnapshot } from "@/lib/storage/quota";
import type { ChatMessage } from "@/lib/types/api";
import { storageKeysFor, type AuraMode } from "@/lib/workspace/mode";

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function titleFromMessage(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean;
}

function createSession(): ChatSession {
  return {
    id: createId(),
    title: "New chat",
    messages: [],
    updatedAt: Date.now(),
  };
}

function loadSessions(mode: AuraMode): ChatSession[] {
  const keys = storageKeysFor(mode);
  try {
    const raw = localStorage.getItem(keys.sessions);
    if (!raw) return [createSession()];
    const parsed = JSON.parse(raw) as ChatSession[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [createSession()];
    return parsed;
  } catch {
    return [createSession()];
  }
}

function loadActiveId(mode: AuraMode, sessions: ChatSession[]): string {
  const keys = storageKeysFor(mode);
  try {
    const saved = localStorage.getItem(keys.activeId);
    if (saved && sessions.some((s) => s.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  const newest = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  return newest?.id ?? sessions[0]?.id ?? "";
}

function toApiMessages(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.content.trim().length > 0)
    .map(({ role, content }) => ({ role, content }));
}

export function useChatSessions(selectedModel: string, mode: AuraMode) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => [createSession()]);
  const [activeId, setActiveId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [storageTick, setStorageTick] = useState(0);
  const sessionsRef = useRef(sessions);
  const loadedModeRef = useRef<AuraMode | null>(null);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    setGenerating(false);
    const loaded = loadSessions(mode);
    setSessions(loaded);
    setActiveId(loadActiveId(mode, loaded));
    loadedModeRef.current = mode;
    setError(null);
    setHydrated(true);
  }, [mode]);

  useEffect(() => {
    if (!hydrated) return;
    if (loadedModeRef.current !== mode) return;
    const keys = storageKeysFor(mode);
    localStorage.setItem(keys.sessions, JSON.stringify(sessions));
    setStorageTick((n) => n + 1);
  }, [sessions, hydrated, mode]);

  useEffect(() => {
    if (!hydrated || !activeId) return;
    if (loadedModeRef.current !== mode) return;
    const keys = storageKeysFor(mode);
    localStorage.setItem(keys.activeId, activeId);
    setStorageTick((n) => n + 1);
  }, [activeId, hydrated, mode]);

  const storage: StorageSnapshot = useMemo(() => {
    void storageTick;
    if (!hydrated) {
      return {
        usedBytes: 0,
        quotaBytes: 5 * 1024 * 1024,
        usedMb: 0,
        quotaMb: 5,
        percent: 0,
      };
    }
    return getStorageSnapshot();
  }, [hydrated, storageTick]);

  const activeSession =
    sessions.find((s) => s.id === activeId) ?? sessions[0] ?? null;
  const messages = activeSession?.messages ?? [];

  const newChat = useCallback(() => {
    const session = createSession();
    setSessions((prev) => [session, ...prev]);
    setActiveId(session.id);
    setError(null);
  }, []);

  const selectChat = useCallback((id: string) => {
    setActiveId(id);
    setError(null);
  }, []);

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (next.length === 0) {
          const fresh = createSession();
          setActiveId(fresh.id);
          return [fresh];
        }
        if (id === activeId) {
          const sorted = [...next].sort((a, b) => b.updatedAt - a.updatedAt);
          setActiveId(sorted[0]?.id ?? next[0].id);
        }
        return next;
      });
      setError(null);
    },
    [activeId],
  );

  const trimOldest = useCallback((count = 3) => {
    setSessions((prev) => {
      if (prev.length <= 1) return prev;
      const sorted = [...prev].sort((a, b) => a.updatedAt - b.updatedAt);
      const removeIds = new Set(
        sorted.slice(0, Math.min(count, prev.length - 1)).map((s) => s.id),
      );
      const next = prev.filter((s) => !removeIds.has(s.id));
      setActiveId((current) => {
        if (next.some((s) => s.id === current)) return current;
        const newest = [...next].sort((a, b) => b.updatedAt - a.updatedAt)[0];
        return newest?.id ?? "";
      });
      return next;
    });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      const sessionId = activeId;
      if (!trimmed || !selectedModel || generating || !sessionId) return;

      const existing =
        sessionsRef.current.find((s) => s.id === sessionId)?.messages ?? [];
      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
      };
      const conversation = [...existing, userMessage];

      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                title:
                  session.messages.length === 0
                    ? titleFromMessage(trimmed)
                    : session.title,
                messages: conversation,
                updatedAt: Date.now(),
              }
            : session,
        ),
      );

      setGenerating(true);
      setError(null);

      try {
        const result = await postChat({
          model: selectedModel,
          messages: toApiMessages(conversation),
          mode,
        });
        const assistantMessage: ChatMessage = {
          id: createId(),
          role: "assistant",
          content: result.reply,
          modelUsed: result.model_used,
        };
        const withReply = [...conversation, assistantMessage];
        const keys = storageKeysFor(mode);

        setSessions((prev) => {
          const next = prev.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: withReply,
                  updatedAt: Date.now(),
                }
              : session,
          );
          localStorage.setItem(keys.sessions, JSON.stringify(next));
          return next;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Chat request failed";
        setError(message);
        const withError: ChatMessage[] = [
          ...conversation,
          {
            id: createId(),
            role: "assistant",
            content: `Something went wrong: ${message}`,
          },
        ];
        setSessions((prev) =>
          prev.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: withError,
                  updatedAt: Date.now(),
                }
              : session,
          ),
        );
      } finally {
        setGenerating(false);
      }
    },
    [activeId, generating, mode, selectedModel],
  );

  return {
    sessions,
    activeId: activeSession?.id ?? "",
    messages,
    generating,
    error,
    storage,
    newChat,
    selectChat,
    deleteSession,
    trimOldest,
    sendMessage,
  };
}
