"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import type { AuraMode } from "@/lib/workspace/mode";

const KBD =
  "rounded border border-white/[0.1] bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] leading-none text-zinc-400 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.06)]";

type ChatInputProps = {
  disabled: boolean;
  generating: boolean;
  mode?: AuraMode;
  onSend: (text: string) => void;
};

export function ChatInput({
  disabled,
  generating,
  mode = "general",
  onSend,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useLayoutEffect(() => {
    resize();
  }, [resize]);

  useEffect(() => {
    if (!generating) textareaRef.current?.focus();
  }, [generating]);

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    const el = textareaRef.current;
    if (!el || disabled || generating) return;
    const value = el.value;
    if (!value.trim()) return;
    onSend(value);
    el.value = "";
    resize();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="relative z-40 px-4 pb-5 sm:px-8">
      <div className="relative mx-auto max-w-3xl">
        <form
          onSubmit={handleSubmit}
          className="group mx-auto max-w-3xl rounded-xl border border-white/[0.08] bg-[#0c0c0e]/90 px-2.5 pb-2 pt-1.5 shadow-[0_0_40px_-10px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl transition-all duration-200 focus-within:border-emerald-500/40"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={
              disabled
                ? "Select a model to begin…"
                : mode === "engineering"
                  ? "Ask a Computer Engineering question…"
                  : "Message AURA…"
            }
            disabled={disabled || generating}
            onInput={resize}
            onKeyDown={handleKeyDown}
            className="max-h-40 min-h-[36px] w-full resize-none bg-transparent px-1.5 py-1.5 text-[14px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />

          <div className="mt-1 flex items-center justify-between gap-3 pl-1.5">
            <p className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
              <kbd className={KBD}>Enter</kbd>
              <span>send</span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <span className="mx-1 h-3 w-px bg-white/[0.08]" aria-hidden />
                <kbd className={KBD}>Shift</kbd>
                <span className="-mx-0.5 text-zinc-600">+</span>
                <kbd className={KBD}>Enter</kbd>
                <span>newline</span>
              </span>
            </p>

            <button
              type="submit"
              disabled={disabled || generating}
              aria-label="Send message"
              className="flex h-8 items-center gap-1.5 rounded-lg bg-[#00FF41] px-3 text-xs font-semibold text-black transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF41]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0c0e] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-600 disabled:hover:brightness-100"
            >
              {generating ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              ) : (
                <>
                  Send
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    aria-hidden
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
