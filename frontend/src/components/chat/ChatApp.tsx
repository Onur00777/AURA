"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { ApiErrorBanner } from "@/components/chat/ApiErrorBanner";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageList } from "@/components/chat/MessageList";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useModels } from "@/hooks/useModels";
import { getModelShortName } from "@/lib/models/catalog";
import {
  loadAuraMode,
  persistAuraMode,
  type AuraMode,
} from "@/lib/workspace/mode";

export function ChatApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState<AuraMode>("general");

  useEffect(() => {
    setMode(loadAuraMode());
  }, []);

  function handleModeChange(next: AuraMode) {
    setMode(next);
    persistAuraMode(next);
  }

  const {
    models,
    selectedModel,
    loading: modelsLoading,
    error: modelsError,
    setSelectedModel,
    refresh: refreshModels,
  } = useModels();

  const {
    sessions,
    activeId,
    messages,
    generating,
    storage,
    newChat,
    selectChat,
    deleteSession,
    trimOldest,
    sendMessage,
  } = useChatSessions(selectedModel, mode);

  const canSend = Boolean(selectedModel) && !modelsLoading && !modelsError;

  return (
    <motion.div
      className="relative flex h-dvh overflow-hidden bg-[#080C0A]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.06),transparent)]"
        aria-hidden
      />

      <Sidebar
        open={sidebarOpen}
        mode={mode}
        sessions={sessions}
        activeId={activeId}
        storage={storage}
        generating={generating}
        onModeChange={handleModeChange}
        onNewChat={newChat}
        onSelectChat={selectChat}
        onDeleteChat={deleteSession}
        onAutoTrim={() => trimOldest(3)}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <ChatHeader
          models={models}
          selectedModel={selectedModel}
          loading={modelsLoading}
          error={modelsError}
          online={!modelsError && !modelsLoading}
          mode={mode}
          onSelectModel={setSelectedModel}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        {modelsError ? (
          <ApiErrorBanner message={modelsError} onRetry={refreshModels} />
        ) : !modelsLoading && models.length === 0 ? (
          <div className="mx-4 mt-3 rounded-xl border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-100 sm:mx-6">
            <p className="font-medium">No GGUF models found</p>
            <p className="mt-1 text-[13px] leading-relaxed text-amber-200/80">
              Put a chat-tuned <span className="font-mono">.gguf</span> file in{" "}
              <span className="font-mono">models/</span>, then retry. The API
              is up; it has nothing to load.
            </p>
            <button
              type="button"
              onClick={() => void refreshModels()}
              className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[12px] font-medium text-amber-100"
            >
              Retry
            </button>
          </div>
        ) : null}

        <MessageList
          messages={messages}
          generating={generating}
          mode={mode}
          modelLabel={
            selectedModel ? getModelShortName(selectedModel) : undefined
          }
        />

        <ChatInput
          disabled={!canSend}
          generating={generating}
          mode={mode}
          onSend={sendMessage}
        />
      </div>
    </motion.div>
  );
}
