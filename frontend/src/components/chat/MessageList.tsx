"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

import { CopyMessageButton } from "@/components/chat/CopyMessageButton";
import { MessageContent } from "@/components/chat/MessageContent";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { WorkspaceHero } from "@/components/chat/WorkspaceHero";
import type { ChatMessage } from "@/lib/types/api";

type MessageListProps = {
  messages: ChatMessage[];
  generating: boolean;
  modelLabel?: string;
};

export function MessageList({
  messages,
  generating,
  modelLabel,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, generating]);

  const empty = messages.length === 0 && !generating;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-8">
      {empty ? (
        <WorkspaceHero modelLabel={modelLabel} />
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
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[11px] font-semibold text-emerald-400">
                          A
                        </span>
                        <span className="text-[12px] font-medium tracking-tight text-[#c8c8d0]">
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
                      <div className="rounded-2xl border border-emerald-500/15 bg-[#0D1117] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                        <p className="whitespace-pre-wrap text-[14.5px] leading-[1.65] text-[#e8e8ed]">
                          {message.content}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/[0.05] bg-transparent px-1 py-1 sm:px-0">
                        <MessageContent content={message.content} />
                      </div>
                    )}
                    <CopyMessageButton
                      content={message.content}
                      align={isUser ? "end" : "start"}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {generating ? <TypingIndicator /> : null}
          <div ref={bottomRef} className="h-px w-full shrink-0" />
        </div>
      )}
    </div>
  );
}
