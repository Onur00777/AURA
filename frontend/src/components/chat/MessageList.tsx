"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

import { CopyMessageButton } from "@/components/chat/CopyMessageButton";
import { EditableUserMessage } from "@/components/chat/EditableUserMessage";
import { MessageContent } from "@/components/chat/MessageContent";
import { RetryResponse } from "@/components/chat/RetryResponse";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { WorkspaceHero } from "@/components/chat/WorkspaceHero";
import type { ChatMessage } from "@/lib/types/api";
import type { AuraMode, AuraPower } from "@/lib/workspace/mode";
import { AURA_POWER_TIERS } from "@/lib/workspace/mode";

type MessageListProps = {
  messages: ChatMessage[];
  generating: boolean;
  busy?: boolean;
  streamingReply?: string;
  chatId?: string;
  modelLabel?: string;
  mode?: AuraMode;
  canSend?: boolean;
  onQuickAction?: (prompt: string) => void;
  onEdit?: (id: string, text: string) => void;
  onRetry?: (id: string, power?: AuraPower) => void;
};

export function MessageList({
  messages,
  generating,
  busy = generating,
  streamingReply,
  chatId,
  modelLabel,
  mode = "general",
  canSend = false,
  onQuickAction,
  onEdit,
  onRetry,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, generating, streamingReply]);

  const empty = messages.length === 0 && !generating;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-8">
      {empty ? (
        <WorkspaceHero
          chatId={chatId}
          modelLabel={modelLabel}
          mode={mode}
          canSend={canSend}
          onQuickAction={onQuickAction}
        />
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`min-w-0 ${isUser ? "max-w-[85%] sm:max-w-[75%]" : "w-full"}`}
                  >
                    {!isUser ? (
                      <div className="mb-2 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] font-pixel text-[8px] leading-none text-emerald-400">
                          A
                        </span>
                        <span className="font-pixel text-[8px] leading-none tracking-tight text-[#c8c8d0]">
                          AURA
                        </span>
                        {message.modelUsed ? (
                          <span className="truncate font-mono text-[10px] text-[#6e6e7a]">
                            {message.modelUsed}
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {isUser ? (
                      <EditableUserMessage
                        content={message.content}
                        disabled={!canSend || busy}
                        onSave={onEdit ? (text) => onEdit(message.id, text) : undefined}
                      />
                    ) : (
                      <div className="rounded-2xl border border-white/[0.05] bg-transparent px-1 py-1 sm:px-0">
                        <MessageContent content={message.content} />
                      </div>
                    )}
                    <CopyMessageButton
                      content={message.content}
                      align={isUser ? "end" : "start"}
                    />
                    {message.metrics ? (
                      <p
                        className="mt-1.5 flex flex-wrap gap-x-1.5 font-mono text-[10px] text-zinc-400"
                        title="First text from the backend. Token count and speed use the model tokenizer on the emitted text."
                      >
                        <span>{(message.metrics.ttft_ms / 1000).toFixed(2)} s first text</span>
                        {message.metrics.tokens_per_second !== null ? (
                          <span>· ~{message.metrics.tokens_per_second.toFixed(1)} tok/s</span>
                        ) : null}
                        <span>· ~{message.metrics.output_tokens} tokens</span>
                        {message.powerUsed ? (
                          <span>· {AURA_POWER_TIERS.find((tier) => tier.id === message.powerUsed)?.name}</span>
                        ) : null}
                      </p>
                    ) : null}
                    {!isUser && onRetry ? (
                      <RetryResponse disabled={!canSend || busy} onRetry={(power) => onRetry(message.id, power)} />
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {streamingReply ? (
            <div className="rounded-2xl border border-white/[0.05] px-1 py-1 sm:px-0" aria-busy="true">
              <MessageContent content={streamingReply} />
            </div>
          ) : generating ? <TypingIndicator /> : null}
          <div ref={bottomRef} className="h-px w-full shrink-0" />
        </div>
      )}
    </div>
  );
}
