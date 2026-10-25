"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

import type { AuraMode } from "@/lib/workspace/mode";

const GREETINGS = [
  "What shall we build today, Onur?",
  "Ready to change the world?",
  "Pick a model and let's craft something amazing.",
  "AURA is online. What's on the agenda?",
  "Let's turn complex ideas into code, Onur.",
  "Ship something sharp today, Onur.",
  "Your local models are standing by.",
  "Ideas in. Code out. Where do we start?",
] as const;

const ENGINEERING_GREETINGS = [
  "Where should we go deeper — OS, networks, or the ISA?",
  "Ask like a CE student. I'll teach like a TA, not a search box.",
  "Pointers, pipelines, protocols — pick a layer.",
  "Let's reason through the hardware–software boundary.",
] as const;

type QuickAction = {
  title: string;
  hint: string;
  prompt: string;
  icon: ReactNode;
};

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  className: "h-3.5 w-3.5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Analyze C Pointer Logic",
    hint: "Memory, aliasing, UB",
    prompt:
      "Walk me through how pointers, pointer arithmetic, and pointer-to-pointer work in C. Show a short example and point out the common undefined-behavior traps.",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M8 6 3 12l5 6M16 6l5 6-5 6" />
      </svg>
    ),
  },
  {
    title: "Benchmark Algorithm",
    hint: "Big-O vs. real runtime",
    prompt:
      "Compare quicksort, mergesort, and heapsort: time and space complexity, cache behavior, and when each one wins in practice. Suggest how I'd benchmark them fairly.",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
  {
    title: "Explain System Architecture",
    hint: "CPU, cache, memory, I/O",
    prompt:
      "Explain how a modern computer system fits together — CPU pipeline, cache hierarchy, main memory, buses, and I/O — and how a single instruction flows through it.",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="6" y="6" width="12" height="12" rx="2" />
        <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
      </svg>
    ),
  },
];

type WorkspaceHeroProps = {
  modelLabel?: string;
  mode?: AuraMode;
  canSend?: boolean;
  onQuickAction?: (prompt: string) => void;
};

function Emblem() {
  return (
    <div className="relative mx-auto mb-7 h-14 w-14">
      <div className="absolute inset-0 rounded-2xl bg-[#00FF41]/10 blur-xl" aria-hidden />
      <div className="absolute inset-0 rotate-6 rounded-2xl border border-white/[0.05] bg-white/[0.02]" aria-hidden />
      <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-white/[0.1] bg-linear-to-b from-white/[0.08] to-white/[0.02] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] backdrop-blur-xl">
        <span className="font-pixel text-[12px] leading-none text-white">A</span>
        <span className="absolute right-2 top-2 flex h-1.5 w-1.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00FF41] opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#00FF41] shadow-[0_0_6px_rgba(0,255,65,0.8)]" />
        </span>
      </div>
    </div>
  );
}

export function WorkspaceHero({
  modelLabel,
  mode = "general",
  canSend = false,
  onQuickAction,
}: WorkspaceHeroProps) {
  const [greeting, setGreeting] = useState<string>(GREETINGS[0]);

  useEffect(() => {
    const next = mode === "engineering" ? ENGINEERING_GREETINGS : GREETINGS;
    const index = Math.floor(Math.random() * next.length);
    setGreeting(next[index]);
  }, [mode]);

  const actionsEnabled = canSend && Boolean(onQuickAction);

  return (
    <div className="m-auto flex w-full max-w-2xl flex-col items-center px-4 py-14 text-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full"
      >
        <Emblem />

        <p className="font-pixel text-[8px] uppercase leading-relaxed tracking-[0.18em] text-zinc-500">
          {mode === "engineering" ? "CompE · Beta" : "AURA"}
        </p>
        <h2 className="mx-auto mt-3 max-w-xl bg-linear-to-b from-white via-white/90 to-white/50 bg-clip-text pb-1 font-display text-3xl font-medium leading-tight tracking-tight text-transparent">
          {greeting}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-[#8a8a93]">
          {mode === "engineering"
            ? "This thread is separate from General. Answers stay inside Computer Engineering — from first year through architecture, OS, and networks."
            : "Messages stay on this device. Pick a model and type below — your sessions restore automatically."}
        </p>

        <div className="mx-auto mt-7 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] tracking-wide text-zinc-400">
            Local GGUF
          </span>
          {modelLabel ? (
            <span className="inline-flex max-w-[16rem] items-center gap-1.5 truncate rounded-md border border-[#00FF41]/20 bg-[#00FF41]/[0.05] px-2.5 py-1 font-mono text-[10px] tracking-wide text-[#00FF41]/90">
              <span className="h-1 w-1 rounded-full bg-[#00FF41]" aria-hidden />
              {modelLabel}
            </span>
          ) : (
            <span className="rounded-md border border-white/[0.08] px-2.5 py-1 font-mono text-[10px] tracking-wide text-zinc-500">
              No model selected
            </span>
          )}
        </div>

        <div className="mx-auto mt-8 grid w-full max-w-2xl grid-cols-1 gap-2 text-left sm:grid-cols-3">
          {QUICK_ACTIONS.map((action, index) => (
            <motion.button
              key={action.title}
              type="button"
              disabled={!actionsEnabled}
              onClick={() => onQuickAction?.(action.prompt)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut", delay: 0.08 + index * 0.05 }}
              className="group relative flex flex-col items-start gap-2 overflow-hidden rounded-xl text-left border border-white/[0.06] bg-white/[0.02] p-3 transition-all duration-200 hover:border-emerald-500/30 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/[0.06] disabled:hover:bg-white/[0.02]"
            >
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#00FF41]/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                aria-hidden
              />
              <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-colors group-hover:text-[#00FF41]">
                {action.icon}
              </span>
              <span className="text-[12.5px] font-medium leading-snug tracking-tight text-zinc-200">
                {action.title}
              </span>
              <span className="font-mono text-[10px] text-zinc-500">{action.hint}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
