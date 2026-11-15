"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { streamChat } from "@/lib/api/client";
import { getStorageSnapshot, type StorageSnapshot } from "@/lib/storage/quota";
import type { ChatAttachment, ChatMessage } from "@/lib/types/api";
import { withAttachmentContext } from "@/lib/workspace/chatAttachment";
import { getStudyPhase, studyQuestion, STUDY_TOPICS, type StudyTopic } from "@/lib/workspace/study";
import {
  storageKeysFor,
  type AuraMode,
  type AuraPower,
} from "@/lib/workspace/mode";

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
  studyTopic?: StudyTopic;
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
    .map(({ role, content, attachment }) => ({
      role,
      content: attachment ? withAttachmentContext(content, attachment) : content,
    }));
}

export function useChatSessions(
  selectedModel: string,
  mode: AuraMode,
  power: AuraPower = "pulse",
) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => [createSession()]);
  const [activeId, setActiveId] = useState<string>("");
  const [pending, setPending] = useState<{
    sessionId: string;
    conversation: ChatMessage[];
    reply: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [storageTick, setStorageTick] = useState(0);
  const sessionsRef = useRef(sessions);
  const loadedModeRef = useRef<AuraMode | null>(null);
  const activeRequestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    setPending(null);
    const loaded = loadSessions(mode);
    setSessions(loaded);
    setActiveId(loadActiveId(mode, loaded));
    loadedModeRef.current = mode;
    setError(null);
    setHydrated(true);
    return () => {
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
    };
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
  const activePending = pending?.sessionId === activeSession?.id ? pending : null;
  const messages = activePending?.conversation ?? activeSession?.messages ?? [];
  const studyTopic = activeSession?.studyTopic;
  const studyPhase = studyTopic ? getStudyPhase(activeSession.messages) : undefined;

  const stopGeneration = useCallback(() => {
    const request = activeRequestRef.current;
    activeRequestRef.current = null;
    request?.abort();
    setPending(null);
  }, []);

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

  const generateReply = useCallback(
    async (
      original: ChatSession,
      conversation: ChatMessage[],
      title: string,
      requestPower: AuraPower,
      replacesHistory: boolean,
    ) => {
      if (!selectedModel || activeRequestRef.current || loadedModeRef.current !== mode) return;

      const request = new AbortController();
      activeRequestRef.current = request;
      const sessionId = original.id;
      const studyStep = conversation.at(-1)?.studyStep;
      const updateSession = (messages: ChatMessage[], nextTitle: string) => {
        const updatedAt = Date.now();
        setSessions((prev) =>
          prev.map((session) =>
            session.id === sessionId
              ? { ...session, title: nextTitle, messages, updatedAt }
              : session,
          ),
        );
      };

      // Keep the saved branch until a replacement answer is available.
      if (!replacesHistory) updateSession(conversation, title);
      setPending({ sessionId, conversation, reply: "" });
      setError(null);

      try {
        const result = await streamChat({
          model: selectedModel,
          messages: toApiMessages(conversation),
          mode,
          power: requestPower,
          study: original.studyTopic && studyStep ? { topic: original.studyTopic, step: studyStep } : undefined,
        }, request.signal, (reply) => {
          if (activeRequestRef.current === request) {
            setPending({ sessionId, conversation, reply });
          }
        });
        if (activeRequestRef.current !== request) return;
        const assistantMessage: ChatMessage = {
          id: createId(),
          role: "assistant",
          content: result.reply,
          modelUsed: result.model_used,
          powerUsed: requestPower,
          metrics: result.metrics,
          studyStep,
        };
        updateSession([...conversation, assistantMessage], title);
      } catch (err) {
        if (activeRequestRef.current !== request) return;
        const message =
          err instanceof Error ? err.message : "Chat request failed";
        if (replacesHistory) {
          setError(message);
          return;
        }
        const withError: ChatMessage[] = [
          ...conversation,
          {
            id: createId(),
            role: "assistant",
            content: `Something went wrong: ${message}`,
          },
        ];
        updateSession(withError, title);
      } finally {
        if (activeRequestRef.current === request) {
          activeRequestRef.current = null;
          setPending(null);
        }
      }
    },
    [mode, selectedModel],
  );

  const sendMessage = useCallback(
    async (text: string, attachment?: ChatAttachment) => {
      const content = text.trim();
      const session = sessionsRef.current.find((item) => item.id === activeId);
      if (!content || !session) return;
      if (session.studyTopic && getStudyPhase(session.messages) !== "answer") return;

      const userMessage: ChatMessage = {
        id: createId(), role: "user", content, attachment,
        studyStep: session.studyTopic ? "feedback" : undefined,
      };
      const title = session.messages.length ? session.title : titleFromMessage(content);
      await generateReply(session, [...session.messages, userMessage], title, power, false);
    },
    [activeId, generateReply, power],
  );

  const editMessage = useCallback(
    async (messageId: string, text: string) => {
      const content = text.trim();
      const session = sessionsRef.current.find((item) => item.id === activeId);
      if (!content || !session) return;

      const index = session.messages.findIndex((item) => item.id === messageId);
      const message = session.messages[index];
      if (message?.role !== "user" || message.studyStep === "question") return;

      const conversation = [...session.messages.slice(0, index), { ...message, content }];
      const title = index === 0 ? titleFromMessage(content) : session.title;
      await generateReply(session, conversation, title, power, true);
    },
    [activeId, generateReply, power],
  );

  const retryMessage = useCallback(
    async (messageId: string, requestPower?: AuraPower) => {
      const session = sessionsRef.current.find((item) => item.id === activeId);
      if (!session) return;

      const index = session.messages.findIndex((item) => item.id === messageId);
      const reply = session.messages[index];
      if (reply?.role !== "assistant") return;

      // The answer may follow another assistant entry in restored history.
      let userIndex = index - 1;
      while (userIndex >= 0 && session.messages[userIndex].role !== "user") userIndex--;
      if (userIndex < 0 || !session.messages[userIndex].content.trim()) return;

      const conversation = session.messages.slice(0, userIndex + 1);
      await generateReply(session, conversation, session.title, requestPower ?? reply.powerUsed ?? power, true);
    },
    [activeId, generateReply, power],
  );

  const startStudy = useCallback((topic: StudyTopic) => {
    if (!selectedModel || activeRequestRef.current || mode !== "engineering" || loadedModeRef.current !== mode) return;
    const title = `Study · ${STUDY_TOPICS[topic]}`;
    const session = { ...createSession(), title, studyTopic: topic };
    const question = studyQuestion(topic, false);
    const turn: ChatMessage = { id: createId(), role: "user", content: question.text, studyStep: question.step };
    setSessions((prev) => [session, ...prev]);
    setActiveId(session.id);
    void generateReply(session, [turn], title, power, false);
  }, [generateReply, mode, power, selectedModel]);

  const advanceStudy = useCallback(() => {
    const session = sessionsRef.current.find((item) => item.id === activeId);
    if (!session?.studyTopic) return;
    const phase = getStudyPhase(session.messages);
    if (phase === "retry") {
      const index = session.messages.findLastIndex((message) => message.role === "user" && message.studyStep);
      if (index >= 0) void generateReply(session, session.messages.slice(0, index + 1), session.title, power, true);
      return;
    }
    if (phase !== "next" && phase !== "start") return;
    const question = studyQuestion(session.studyTopic, phase === "next");
    const turn: ChatMessage = { id: createId(), role: "user", content: question.text, studyStep: question.step };
    void generateReply(session, [...session.messages, turn], session.title, power, false);
  }, [activeId, generateReply, power]);

  return {
    sessions,
    activeId: activeSession?.id ?? "",
    messages,
    generating: pending !== null,
    activeGenerating: activePending !== null,
    streamingReply: activePending?.reply ?? "",
    stopGeneration,
    error,
    storage,
    newChat,
    selectChat,
    deleteSession,
    trimOldest,
    sendMessage,
    editMessage,
    retryMessage,
    studyTopic,
    studyPhase,
    startStudy,
    advanceStudy,
  };
}
