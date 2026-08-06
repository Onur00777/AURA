"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";

import { getModelMeta, getModelShortName } from "@/lib/models/catalog";
import type { ModelItem } from "@/lib/types/api";

type ModelSelectorProps = {
  models: ModelItem[];
  selectedModel: string;
  loading: boolean;
  error: string | null;
  onSelect: (name: string) => void;
};

function formatSize(bytes: number): string {
  if (bytes <= 0) return "—";
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

function InfoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function ModelSelector({
  models,
  selectedModel,
  loading,
  error,
  onSelect,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [infoFor, setInfoFor] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setInfoFor(null);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (infoFor) setInfoFor(null);
        else setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [infoFor]);

  const selectedShort = selectedModel
    ? getModelShortName(selectedModel)
    : "";

  const label = loading
    ? "Loading models…"
    : error
      ? "Models unavailable"
      : selectedShort || "No models found";

  return (
    <div ref={rootRef} className="relative min-w-[11rem] max-w-[16rem]">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={loading || models.length === 0}
        onClick={() => {
          setOpen((v) => !v);
          setInfoFor(null);
        }}
        className="group flex w-full items-center justify-between gap-3 rounded-xl border border-emerald-900/40 bg-[#0D1117]/80 px-3.5 py-2 text-left transition-colors hover:border-emerald-500/40 hover:bg-emerald-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-500/80">
            Model
          </p>
          <p className="truncate text-xs font-medium tracking-tight text-[#e8e8ed]">
            {label}
          </p>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-emerald-400/70 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && models.length > 0 ? (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label="Available GGUF models"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,18rem)] overflow-visible rounded-xl border border-emerald-900/40 bg-[#0A0E0C]/95 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            {models.map((model) => {
              const active = model.name === selectedModel;
              const meta = getModelMeta(model.name);
              const showInfo = infoFor === model.name;

              return (
                <li
                  key={model.path}
                  role="option"
                  aria-selected={active}
                  className="relative"
                >
                  <div
                    className={`flex items-center gap-1 rounded-lg transition-colors ${
                      active
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "text-[#e8e8ed] hover:bg-emerald-950/60 hover:text-emerald-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(model.name);
                        setOpen(false);
                        setInfoFor(null);
                      }}
                      className="min-w-0 flex-1 px-3 py-2.5 text-left"
                    >
                      <span className="block truncate text-[13px] font-medium tracking-tight">
                        {meta.shortName}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] text-[#8b8b9a]">
                        {formatSize(model.size_bytes)} · {meta.bestFor}
                      </span>
                    </button>

                    <button
                      type="button"
                      aria-label={`About ${meta.shortName}`}
                      aria-expanded={showInfo}
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoFor((current) =>
                          current === model.name ? null : model.name,
                        );
                      }}
                      className={`mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        showInfo
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "text-[#6e6e7a] hover:bg-white/[0.06] hover:text-emerald-300"
                      }`}
                    >
                      <InfoIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <AnimatePresence>
                    {showInfo ? (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -2 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="absolute left-0 right-0 top-full z-[60] mt-1 rounded-xl border border-emerald-500/25 bg-[#0D1117] p-3 shadow-[0_12px_32px_rgba(0,0,0,0.55)]"
                      >
                        <p className="text-[13px] font-semibold tracking-tight text-emerald-300">
                          {meta.shortName}
                        </p>
                        <p className="mt-1.5 break-all font-mono text-[10px] leading-relaxed text-[#8b8b9a]">
                          {model.name}
                        </p>
                        <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-500/80">
                          Best for · {meta.bestFor}
                        </p>
                        <p className="mt-1.5 text-[12px] leading-relaxed text-[#c9c9d1]">
                          {meta.summary}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
