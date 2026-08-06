"use client";

import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <div
      className="flex items-start gap-2"
      aria-live="polite"
      aria-label="AURA is generating a response"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[11px] font-semibold text-emerald-400">
        A
      </span>
      <div className="flex items-center gap-1.5 pt-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-emerald-400/80"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{
              duration: 0.85,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.14,
            }}
          />
        ))}
      </div>
    </div>
  );
}
