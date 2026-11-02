"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import {
  AURA_POWER_TIERS,
  type AuraMode,
  type AuraPower,
} from "@/lib/workspace/mode";

type ChatInputProps = {
  disabled: boolean;
  generating: boolean;
  mode?: AuraMode;
  power?: AuraPower;
  onPowerChange?: (power: AuraPower) => void;
  onSend: (text: string) => void;
};

function PowerIcon({
  tier,
  className = "h-3.5 w-3.5",
}: {
  tier: AuraPower;
  className?: string;
}) {
  if (tier === "spark") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
      </svg>
    );
  }
  if (tier === "nova") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </svg>
  );
}

function tierAccentClasses(tier: AuraPower, engineering: boolean): string {
  if (tier === "spark") {
    return "text-amber-300";
  }
  if (tier === "nova") {
    return engineering ? "text-violet-300" : "text-[#00FF41]";
  }
  return engineering ? "text-cyan-300" : "text-emerald-300";
}

export function ChatInput({
  disabled,
  generating,
  mode = "general",
  power = "pulse",
  onPowerChange,
  onSend,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

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

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

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

  const engineering = mode === "engineering";
  const activeTier =
    AURA_POWER_TIERS.find((t) => t.id === power) ?? AURA_POWER_TIERS[1];

  return (
    <div className="relative z-40 px-4 pb-5 sm:px-8">
      <div ref={pickerRef} className="relative mx-auto max-w-3xl">
        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              id={menuId}
              role="listbox"
              aria-label="AURA compute power configuration"
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute bottom-full left-0 z-50 mb-2.5 w-[min(100vw-2rem,20.5rem)] rounded-xl border border-white/[0.09] bg-[#0c0c0e]/95 p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.75),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between px-2.5 pb-1.5 pt-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                  Engine Power
                </span>
                <span className="font-mono text-[9px] text-zinc-600">
                  CPU · Local GGUF
                </span>
              </div>

              <div className="space-y-0.5">
                {AURA_POWER_TIERS.map((tier) => {
                  const selected = tier.id === power;
                  const accent = tierAccentClasses(tier.id, engineering);

                  return (
                    <button
                      key={tier.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onPowerChange?.(tier.id);
                        setMenuOpen(false);
                        textareaRef.current?.focus();
                      }}
                      className={`group/item flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                        selected
                          ? "bg-white/[0.07] text-white"
                          : "text-zinc-300 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] ${accent}`}
                      >
                        <PowerIcon tier={tier.id} className="h-3.5 w-3.5" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[12.5px] font-semibold tracking-tight text-white">
                            {tier.name}
                          </span>
                          <span className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                            {tier.tag}
                          </span>
                          <span className="ml-auto font-mono text-[9.5px] text-zinc-500">
                            {tier.tokens}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-zinc-400">
                          {tier.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <form
          onSubmit={handleSubmit}
          className={`group relative mx-auto max-w-3xl overflow-hidden rounded-xl ${
            engineering
              ? "bg-white/[0.08] p-[1.5px]"
              : "border border-white/[0.08] bg-[#0c0c0e]/90 px-2.5 pb-2 pt-1.5 shadow-[0_0_40px_-10px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl transition-all duration-200 focus-within:border-emerald-500/40"
          }`}
        >
          {engineering ? <span aria-hidden className="aura-ring" /> : null}
          <div
            className={
              engineering
                ? "aura-glass relative z-[1] rounded-[11px] px-2.5 pb-2 pt-1.5 shadow-[0_0_40px_-12px_rgba(0,0,0,0.8)]"
                : "contents"
            }
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

            <div className="mt-1 flex items-center justify-between gap-3 pl-1">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                disabled={generating}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-7 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-left text-xs text-zinc-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-colors hover:border-white/[0.15] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={tierAccentClasses(activeTier.id, engineering)}>
                  <PowerIcon tier={activeTier.id} className="h-3 w-3" />
                </span>
                <span className="text-[11.5px] font-medium tracking-tight text-zinc-100">
                  {activeTier.name}
                </span>
                <span className="hidden font-mono text-[9.5px] text-zinc-500 sm:inline">
                  · {activeTier.tag}
                </span>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                  className={`ml-0.5 h-3 w-3 text-zinc-500 transition-transform duration-200 ${
                    menuOpen ? "rotate-180 text-zinc-300" : ""
                  }`}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

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
                      <path
                        d="M5 12h14M13 6l6 6-6 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
