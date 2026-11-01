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
      className="relative flex h-dvh overflow-hidden bg-[#030305]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_90%_70%_at_50%_0%,#000_40%,transparent_100%)]"
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
        {mode === "engineering" ? (
          <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#030305]">
            {/* 1. Sol Üst - Zümrüt Yeşili Kuzey Işığı Şeridi */}
            <div
              className="absolute -top-[25%] -left-[10%] h-[550px] w-[70%] -rotate-12 rounded-full opacity-40 blur-[90px] mix-blend-screen will-change-transform animate-[aurora-drift-1_18s_ease-in-out_infinite]"
              style={{
                background:
                  "radial-gradient(ellipse at center, #10b981 0%, #059669 35%, transparent 75%)",
              }}
            />

            {/* 2. Orta Üst - Elektrik Mavisi / Cyan Geçiş Şeridi */}
            <div
              className="absolute -top-[30%] left-[20%] h-[500px] w-[60%] rotate-6 rounded-full opacity-35 blur-[100px] mix-blend-screen will-change-transform animate-[aurora-drift-2_24s_ease-in-out_infinite]"
              style={{
                background:
                  "radial-gradient(ellipse at center, #06b6d4 0%, #2563eb 40%, transparent 75%)",
              }}
            />

            {/* 3. Sağ Üst - Derin Mor / Violet Kuzey Işığı Şeridi */}
            <div
              className="absolute -top-[20%] -right-[10%] h-[600px] w-[65%] -rotate-6 rounded-full opacity-45 blur-[95px] mix-blend-screen will-change-transform animate-[aurora-drift-3_20s_ease-in-out_infinite]"
              style={{
                background:
                  "radial-gradient(ellipse at center, #8b5cf6 0%, #6d28d9 40%, transparent 75%)",
              }}
            />

            {/* 4. İkinci Katman - Kıvrımlı Parlak Yeşil-Mor Aurora Çizgisi */}
            <div
              className="absolute top-[5%] left-[15%] h-[220px] w-[70%] -rotate-3 rounded-full opacity-30 blur-[60px] mix-blend-screen will-change-transform animate-[pulse_10s_ease-in-out_infinite]"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, #10b981 25%, #06b6d4 50%, #a855f7 80%, transparent 100%)",
              }}
            />

            {/* 5. Alt Karartma Maskesi (Ekranın ortasından aşağısını kesin olarak zifiri siyah tutar) */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 0%, rgba(3,3,5,0.5) 45%, #030305 75%)",
              }}
            />
          </div>
        ) : null}

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

          <MessageList
            messages={messages}
            generating={generating}
            mode={mode}
            modelLabel={
              selectedModel ? getModelShortName(selectedModel) : undefined
            }
            canSend={canSend}
            onQuickAction={sendMessage}
          />

          <ChatInput
            disabled={!canSend}
            generating={generating}
            mode={mode}
            onSend={sendMessage}
          />
        </div>
      </div>
    </motion.div>
  );
}
