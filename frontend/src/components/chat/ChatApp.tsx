"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { CompEAurora } from "@/components/CompEAurora";
import { ApiErrorBanner } from "@/components/chat/ApiErrorBanner";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageList } from "@/components/chat/MessageList";
import { SettingsView } from "@/components/settings/SettingsView";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useModels } from "@/hooks/useModels";
import { getModelShortName } from "@/lib/models/catalog";
import {
  loadAuraMode,
  loadAuraPower,
  persistAuraMode,
  persistAuraPower,
  type AuraMode,
  type AuraPower,
} from "@/lib/workspace/mode";

export function ChatApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mode, setMode] = useState<AuraMode>("general");
  const [power, setPower] = useState<AuraPower>("pulse");
  const [searchTarget, setSearchTarget] = useState<{ sessionId: string; messageId: string } | null>(null);

  useEffect(() => {
    setMode(loadAuraMode());
    setPower(loadAuraPower());
  }, []);

  function handleModeChange(next: AuraMode) {
    setSearchTarget(null);
    setMode(next);
    persistAuraMode(next);
  }

  function handlePowerChange(next: AuraPower) {
    setPower(next);
    persistAuraPower(next);
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
    activeGenerating,
    streamingReply,
    stopGeneration,
    error: chatError,
    storage,
    newChat,
    selectChat,
    deleteSession,
    trimOldest,
    sendMessage,
    editMessage,
    retryMessage,
  } = useChatSessions(selectedModel, mode, power);

  const canSend = Boolean(selectedModel) && !modelsLoading && !modelsError;

  return (
    <motion.div
      className="relative flex h-dvh overflow-hidden bg-[#050505]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_90%_70%_at_50%_0%,#000_40%,transparent_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px]"
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
        onNewChat={() => {
          setSearchTarget(null);
          newChat();
          setSettingsOpen(false);
        }}
        onSelectChat={(id, messageId) => {
          setSearchTarget(messageId ? { sessionId: id, messageId } : null);
          selectChat(id);
          setSettingsOpen(false);
        }}
        onDeleteChat={deleteSession}
        onAutoTrim={() => trimOldest(3)}
        onCloseMobile={() => setSidebarOpen(false)}
        settingsOpen={settingsOpen}
        onOpenSettings={() => setSettingsOpen((open) => !open)}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <CompEAurora active={mode === "engineering"} paused={generating} />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
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
                Put a chat-tuned <span className="font-mono">.gguf</span> file
                in <span className="font-mono">models/</span>, then retry. The
                API is up; it has nothing to load.
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

          {settingsOpen ? (
            <SettingsView
              mode={mode}
              sessions={sessions}
              storage={storage}
              onAutoTrim={() => trimOldest(3)}
              onBack={() => setSettingsOpen(false)}
            />
          ) : (
            <>
              <MessageList
                messages={messages}
                generating={activeGenerating}
                busy={generating}
                streamingReply={streamingReply}
                chatId={activeId}
                searchTarget={searchTarget?.sessionId === activeId ? searchTarget : null}
                mode={mode}
                modelLabel={
                  selectedModel ? getModelShortName(selectedModel) : undefined
                }
                canSend={canSend && !generating}
                onQuickAction={sendMessage}
                onEdit={(id, text) => { setSearchTarget(null); void editMessage(id, text); }}
                onRetry={(id, profile) => { setSearchTarget(null); void retryMessage(id, profile); }}
              />
              {chatError ? (
                <p role="alert" className="mx-auto mb-2 w-full max-w-3xl px-4 text-xs text-amber-300">
                  {chatError}
                </p>
              ) : null}

              <ChatInput
                disabled={!canSend}
                generating={generating}
                mode={mode}
                power={power}
                onPowerChange={handlePowerChange}
                onSend={(text) => { setSearchTarget(null); void sendMessage(text); }}
                onStop={stopGeneration}
              />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
