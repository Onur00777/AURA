"use client";

import { motion } from "framer-motion";

type WorkspaceHeroProps = {
  modelLabel?: string;
};

export function WorkspaceHero({ modelLabel }: WorkspaceHeroProps) {
  return (
    <div className="m-auto flex w-full max-w-xl flex-col items-center px-4 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full"
      >
        <div className="mx-auto mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <span className="text-lg font-semibold tracking-tight text-emerald-400">
            A
          </span>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#6e6e7a]">
          AURA Workspace
        </p>
        <h2 className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-[-0.045em] text-[#f2f2f5] sm:text-[2rem]">
          Start a conversation
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-[#8b8b9a]">
          Messages stay on this device. Pick a model and type below — your
          sessions restore automatically.
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
