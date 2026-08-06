"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";

type ChatInputProps = {
  disabled: boolean;
  generating: boolean;
  onSend: (text: string) => void;
};

export function ChatInput({ disabled, generating, onSend }: ChatInputProps) {
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
    <div className="relative z-40 px-4 pb-6 sm:px-8">
      <div className="relative mx-auto max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="group rounded-2xl border border-white/[0.08] bg-[rgba(13,17,23,0.72)] p-3 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-[border-color,box-shadow] duration-200 focus-within:border-emerald-500/35 focus-within:shadow-[0_8px_48px_rgba(16,185,129,0.12),0_0_0_1px_rgba(16,185,129,0.12)]"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={
              disabled
                ? "Select a model to begin…"
                : "Message AURA…"
            }
            disabled={disabled || generating}
            onInput={resize}
            onKeyDown={handleKeyDown}
            className="max-h-40 min-h-[44px] w-full resize-none bg-transparent px-2 py-1.5 text-[14.5px] leading-relaxed text-[#e8e8ed] placeholder:text-[#6e6e7a] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />

          <div className="mt-2 flex items-center justify-between gap-3 px-1">
            <p className="hidden font-mono text-[10px] tracking-wide text-[#5c5c68] sm:block">
              <span className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[#8b8b9a]">
                ENTER
              </span>
              <span className="mx-1.5 text-[#5c5c68]">Send</span>
              <span className="text-[#3a3a44]">|</span>
              <span className="mx-1.5 rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[#8b8b9a]">
                SHIFT+ENTER
              </span>
              <span className="text-[#8b8b9a]">Line</span>
            </p>
            <p className="font-mono text-[10px] text-[#5c5c68] sm:hidden">
              Enter send · Shift+Enter line
            </p>

            <button
              type="submit"
              disabled={disabled || generating}
              aria-label="Send message"
              className="flex h-9 items-center gap-1.5 rounded-xl bg-[#10B981] px-3.5 text-[12.5px] font-medium tracking-tight text-[#04110a] transition-all duration-200 hover:bg-[#22C55E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50 disabled:cursor-not-allowed disabled:bg-emerald-950 disabled:text-emerald-800"
            >
              {generating ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-900 border-t-emerald-200" />
              ) : (
                <>
                  Send
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
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
