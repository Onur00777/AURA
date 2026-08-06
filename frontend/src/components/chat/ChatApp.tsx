"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageList } from "@/components/chat/MessageList";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useModels } from "@/hooks/useModels";
import { getModelShortName } from "@/lib/models/catalog";

export function ChatApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    models,
    selectedModel,
    loading: modelsLoading,
    error: modelsError,
    setSelectedModel,
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
  } = useChatSessions(selectedModel);

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
        sessions={sessions}
        activeId={activeId}
        storage={storage}
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
          onSelectModel={setSelectedModel}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        {modelsError ? (
          <div className="mx-4 mt-3 rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-2.5 text-sm text-red-200 sm:mx-6">
            Could not reach AURA API: {modelsError}
          </div>
        ) : null}

        <MessageList
          messages={messages}
          generating={generating}
          modelLabel={
            selectedModel ? getModelShortName(selectedModel) : undefined
          }
        />

        <ChatInput
          disabled={!canSend}
          generating={generating}
          onSend={sendMessage}
        />
      </div>
    </motion.div>
  );
}
