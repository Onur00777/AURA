"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import type { AuraMode } from "@/lib/workspace/mode";

type QuickAction = {
  title: string;
  hint: string;
  prompt: string;
  icon: ReactNode;
};

function pickThree(pool: readonly QuickAction[], chatId: string): QuickAction[] {
  // Seed the shuffle with the chat ID so suggestions stay stable across renders.
  let seed = 2166136261;
  for (let i = 0; i < chatId.length; i += 1) {
    seed = Math.imul(seed ^ chatId.charCodeAt(i), 16777619);
  }

  const copy = [...pool];
  for (let i = 0; i < 3; i += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = i + Math.floor((seed / 2 ** 32) * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, 3);
}

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

function ActionIcon({ children }: { children: ReactNode }) {
  return <svg {...ICON_PROPS}>{children}</svg>;
}

const GENERAL_QUICK_ACTIONS: QuickAction[] = [
  {
    title: "What Can I Cook Tonight?",
    hint: "Quick dinner ideas",
    prompt: "Suggest three easy dinners I can make in 30 minutes with common pantry ingredients.",
    icon: <ActionIcon><path d="M3 12h18a9 9 0 0 1-18 0ZM8 21h8M9 4v4M15 4v4" /></ActionIcon>,
  },
  {
    title: "Help Me Write an Email",
    hint: "A friendly follow-up",
    prompt: "Draft a short, friendly email following up on a message I sent last week. Give me a subject line too.",
    icon: <ActionIcon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></ActionIcon>,
  },
  {
    title: "Why Is the Sky Blue?",
    hint: "Everyday science",
    prompt: "Explain why the sky is blue and why sunsets look red, using everyday language and a simple analogy.",
    icon: <ActionIcon><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2" /></ActionIcon>,
  },
  {
    title: "Plan a Relaxing Weekend",
    hint: "Low-cost activities",
    prompt: "Give me a flexible plan for a relaxing weekend at home and in my neighborhood, with a few free activities.",
    icon: <ActionIcon><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18" /></ActionIcon>,
  },
  {
    title: "Practice a New Language",
    hint: "A short café role-play",
    prompt: "Ask me which language I'm learning, then help me practice ordering at a café in a short beginner-friendly role-play.",
    icon: <ActionIcon><path d="M4 5h16v11H9l-5 4V5ZM8 10h8M8 13h5" /></ActionIcon>,
  },
  {
    title: "Find a Book to Read",
    hint: "Pick your next read",
    prompt: "Ask me what kinds of stories I enjoy and what mood I'm in, then suggest three books and briefly explain each pick.",
    icon: <ActionIcon><path d="M12 6v15M12 6c-3-2-6-3-10-2v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-4-1-7 0-10 2Z" /></ActionIcon>,
  },
];

const ENGINEERING_QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Analyze C Pointer Logic",
    hint: "Memory, aliasing, UB",
    prompt:
      "Walk me through how pointers, pointer arithmetic, and pointer-to-pointer work in C. Show a short example and point out the common undefined-behavior traps.",
    icon: (
      <ActionIcon>
        <path d="M8 6 3 12l5 6M16 6l5 6-5 6" />
      </ActionIcon>
    ),
  },
  {
    title: "Benchmark Algorithm",
    hint: "Big-O vs. real runtime",
    prompt:
      "Compare quicksort, mergesort, and heapsort: time and space complexity, cache behavior, and when each one wins in practice. Suggest how I'd benchmark them fairly.",
    icon: (
      <ActionIcon>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </ActionIcon>
    ),
  },
  {
    title: "Explain System Architecture",
    hint: "CPU, cache, memory, I/O",
    prompt:
      "Explain how a modern computer system fits together — CPU pipeline, cache hierarchy, main memory, buses, and I/O — and how a single instruction flows through it.",
    icon: (
      <ActionIcon>
        <rect x="6" y="6" width="12" height="12" rx="2" />
        <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
      </ActionIcon>
    ),
  },
  {
    title: "Virtual Memory",
    hint: "Pages, faults, the TLB",
    prompt:
      "Explain virtual memory: pages, page tables, the TLB, and what the CPU and OS do on a page fault. Use a short walk-through of one memory access.",
    icon: (
      <ActionIcon>
        <path d="M4 7h16M4 12h16M4 17h10" />
        <path d="M17 15l3 2-3 2" />
      </ActionIcon>
    ),
  },
  {
    title: "TCP and UDP",
    hint: "Handshake, ports, loss",
    prompt:
      "Compare TCP and UDP. Cover the three-way handshake, ports, reliability, and when a program should pick one over the other.",
    icon: (
      <ActionIcon>
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="7" r="2.5" />
        <circle cx="18" cy="17" r="2.5" />
        <path d="M8.5 11.2 15.5 8M8.5 12.8l7 3.2" />
      </ActionIcon>
    ),
  },
  {
    title: "Process vs Thread",
    hint: "Scheduling, shared memory",
    prompt:
      "Explain the difference between a process and a thread: address space, scheduling, and what is shared. Give one case where threads help and one where processes are safer.",
    icon: (
      <ActionIcon>
        <rect x="3" y="4" width="7" height="7" rx="1.5" />
        <rect x="14" y="4" width="7" height="7" rx="1.5" />
        <rect x="8.5" y="13" width="7" height="7" rx="1.5" />
      </ActionIcon>
    ),
  },
  {
    title: "Cache Locality",
    hint: "Hits, lines, row-major",
    prompt:
      "Explain spatial and temporal locality, cache lines, and why looping a 2D array in row-major order can be much faster. Sketch a tiny example.",
    icon: (
      <ActionIcon>
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
        <circle cx="12" cy="12" r="3.5" />
      </ActionIcon>
    ),
  },
  {
    title: "Spot a Deadlock",
    hint: "Locks and circular wait",
    prompt:
      "Show a small two-thread deadlock with two locks, name the four Coffman conditions, and explain one way to break it.",
    icon: (
      <ActionIcon>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </ActionIcon>
    ),
  },
  {
    title: "Stack and Heap",
    hint: "Lifetime and allocation",
    prompt:
      "Compare the stack and the heap in C: who allocates, how long data lives, and the usual bugs (leaks, dangling pointers, stack overflow). Keep the example short.",
    icon: (
      <ActionIcon>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </ActionIcon>
    ),
  },
  {
    title: "Pipeline Hazards",
    hint: "Stalls, forwarding, branches",
    prompt:
      "Explain data hazards and control hazards in a classic 5-stage pipeline. Show where forwarding helps and where the pipeline still has to stall.",
    icon: (
      <ActionIcon>
        <path d="M4 16l5-8 4 5 3-4 4 7" />
      </ActionIcon>
    ),
  },
  {
    title: "Mutex vs Semaphore",
    hint: "Critical sections",
    prompt:
      "Explain a mutex versus a counting semaphore. Give one critical-section example and one resource-pool example, and say which primitive fits each.",
    icon: (
      <ActionIcon>
        <path d="M8 11V8a4 4 0 0 1 8 0" />
        <rect x="5" y="11" width="14" height="9" rx="2" />
      </ActionIcon>
    ),
  },
  {
    title: "Number Representation",
    hint: "Two's complement, endianness",
    prompt:
      "Explain two's complement and the difference between big-endian and little-endian. Show how the 32-bit value 0x01020304 sits in memory in each order.",
    icon: (
      <ActionIcon>
        <path d="M5 8h4v8H5zM15 8h4v8h-4zM9 12h6" />
      </ActionIcon>
    ),
  },
];

type WorkspaceHeroProps = {
  chatId?: string;
  modelLabel?: string;
  mode?: AuraMode;
  canSend?: boolean;
  onQuickAction?: (prompt: string) => void;
};

export function WorkspaceHero({
  chatId = "",
  modelLabel,
  mode = "general",
  canSend = false,
  onQuickAction,
}: WorkspaceHeroProps) {
  const reduceMotion = useReducedMotion();
  const engineering = mode === "engineering";
  const actions = pickThree(
    engineering ? ENGINEERING_QUICK_ACTIONS : GENERAL_QUICK_ACTIONS,
    chatId,
  );
  const actionsEnabled = canSend && Boolean(onQuickAction);

  return (
    <div className="m-auto w-full max-w-3xl px-2 py-6 sm:px-5 sm:py-10">
      <motion.section
        key={mode}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        aria-labelledby="workspace-hero-title"
        className={`isolate overflow-hidden rounded-3xl border border-(--hero-accent)/15 bg-[#0c0d0e] shadow-xl shadow-black/30 ${
          engineering ? "[--hero-accent:#67e8f9]" : "[--hero-accent:#86efac]"
        }`}
      >
        <div className="relative overflow-hidden px-5 py-8 sm:px-9 sm:py-11">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-(--hero-accent)/15 via-(--hero-accent)/3 to-transparent"
          />
          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-pixel text-[10px] tracking-wide text-(--hero-accent)">
              {engineering ? "CompE" : "AURA"}
            </span>
            {modelLabel ? (
              <span className="max-w-full truncate rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-[10px] text-zinc-300">
                {modelLabel}
              </span>
            ) : null}
          </div>

          <h2 id="workspace-hero-title" className="max-w-xl text-balance font-display text-3xl font-medium tracking-tight text-zinc-50 sm:text-5xl">
            {engineering ? "How does it work under the hood?" : "What’s on your mind?"}
          </h2>
          <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-zinc-400">
            {engineering
              ? "Explore how computers work, from circuits and memory to operating systems and networks."
              : "Make a plan, find the right words, or explore something you’ve always wondered about."}
          </p>
        </div>

        <div className="border-t border-white/[0.08] bg-black/25 px-4 pb-4 pt-3.5 sm:px-5 sm:pb-5">
          <h3 className="mb-2.5 px-1 text-xs font-medium text-zinc-400">
            Start with a prompt
          </h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {actions.map((action) => (
              <button
                key={action.title}
                type="button"
                disabled={!actionsEnabled}
                onClick={() => onQuickAction?.(action.prompt)}
                className="group flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-left enabled:hover:border-(--hero-accent)/35 enabled:hover:bg-(--hero-accent)/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hero-accent) disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors sm:flex-col sm:items-start sm:gap-2"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-(--hero-accent)/10 text-(--hero-accent)">
                  {action.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-snug text-zinc-100">
                    {action.title}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-zinc-400">
                    {action.hint}
                  </span>
                </span>
                <span aria-hidden className="ml-auto text-sm text-zinc-500 group-enabled:group-hover:text-(--hero-accent) sm:hidden">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
