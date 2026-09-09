"use client";

import { useEffect, useState } from "react";
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

type WorkspaceHeroProps = {
  modelLabel?: string;
  mode?: AuraMode;
};

export function WorkspaceHero({
  modelLabel,
  mode = "general",
}: WorkspaceHeroProps) {
  const [greeting, setGreeting] = useState<string>(GREETINGS[0]);

  useEffect(() => {
    const next = mode === "engineering" ? ENGINEERING_GREETINGS : GREETINGS;
    const index = Math.floor(Math.random() * next.length);
    setGreeting(next[index]);
  }, [mode]);

  return (
    <div className="m-auto flex w-full max-w-xl flex-col items-center px-4 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full"
      >
        <div className="mx-auto mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <span className="font-pixel text-[12px] leading-none text-emerald-400">
            A
          </span>
        </div>

        <p className="font-pixel text-[8px] uppercase leading-relaxed tracking-[0.18em] text-[#6e6e7a]">
          {mode === "engineering"
            ? "CompE · Beta"
            : "AURA"}
        </p>
        <h2 className="mt-3 font-display text-[1.75rem] font-bold leading-tight tracking-[-0.045em] text-[#f2f2f5] sm:text-[2rem]">
          {greeting}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-[#8b8b9a]">
          {mode === "engineering"
            ? "This thread is separate from General. Answers stay inside Computer Engineering — from first year through architecture, OS, and networks."
            : "Messages stay on this device. Pick a model and type below — your sessions restore automatically."}
        </p>

        <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-[10px] tracking-wide text-[#8b8b9a]">
            Local GGUF
          </span>
          {modelLabel ? (
            <span className="max-w-[16rem] truncate rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1 font-mono text-[10px] tracking-wide text-emerald-400/90">
              {modelLabel}
            </span>
          ) : (
            <span className="rounded-full border border-white/[0.08] px-3 py-1 font-mono text-[10px] tracking-wide text-[#6e6e7a]">
              No model selected
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
