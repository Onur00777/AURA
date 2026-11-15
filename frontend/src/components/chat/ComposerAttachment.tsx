"use client";

import { useRef, useState, type DragEvent } from "react";
import type { ChatAttachment } from "@/lib/types/api";
import { readChatAttachment } from "@/lib/workspace/chatAttachment";

export function useComposerAttachment(scope: string, disabled: boolean) {
  const [entry, setEntry] = useState<{ scope: string; file?: ChatAttachment; error?: string; reading?: boolean }>();
  const [dragScope, setDragScope] = useState<string | null>(null);
  const request = useRef(0);
  const current = entry?.scope === scope ? entry : undefined;

  function clear() {
    request.current++;
    setEntry(undefined);
    setDragScope(null);
  }

  async function choose(files: FileList | null) {
    if (!files?.length || disabled) return;
    const revision = ++request.current;
    if (files.length !== 1) {
      setEntry({ scope, file: current?.file, error: "Attach one file at a time." });
      return;
    }
    setEntry({ scope, file: current?.file, reading: true });
    try {
      const file = await readChatAttachment(files[0]);
      if (request.current === revision) setEntry({ scope, file });
    } catch (error) {
      if (request.current === revision) {
        setEntry({ scope, file: current?.file, error: error instanceof Error ? error.message : "Couldn't read file." });
      }
    }
  }

  const dragHandlers = {
    onDragOver(event: DragEvent) {
      if (!event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = disabled ? "none" : "copy";
      if (!disabled) setDragScope(scope);
    },
    onDragLeave(event: DragEvent) {
      if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
        setDragScope(null);
      }
    },
    onDrop(event: DragEvent) {
      if (!event.dataTransfer.files.length) return;
      event.preventDefault();
      setDragScope(null);
      void choose(event.dataTransfer.files);
    },
  };

  return { ...current, dragging: dragScope === scope && !disabled, clear, choose, dragHandlers };
}

export function AttachmentPicker({ disabled, onChoose }: { disabled: boolean; onChoose: (files: FileList | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={input} type="file" className="hidden" accept=".txt,.md" onChange={(event) => {
        onChoose(event.target.files);
        event.target.value = "";
      }} />
      <button type="button" disabled={disabled} aria-label="Attach a text file" title="Attach a .txt or .md file (up to 4 KB)"
        onClick={() => input.current?.click()}
        className="grid size-7 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-emerald-300 focus-visible:outline-emerald-400 disabled:opacity-40">
        <svg aria-hidden className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="m8 13 6-6a2 2 0 0 1 3 3l-8 8a4 4 0 0 1-6-6l8-8a6 6 0 0 1 9 8l-8 8" />
        </svg>
      </button>
    </>
  );
}

export function AttachmentChip({ file, onRemove, onSummarize, disabled }: {
  file: ChatAttachment;
  onRemove?: () => void;
  onSummarize?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-zinc-300">
      <span className="max-w-full truncate" title={file.name}>{file.name}</span>
      <span className="font-mono text-[10px] text-zinc-400">{file.size.toLocaleString()} B</span>
      {onSummarize ? <button type="button" disabled={disabled} onClick={onSummarize} className="rounded text-emerald-300 disabled:opacity-50">Summarize file</button> : null}
      {onRemove ? <button type="button" aria-label="Remove attachment" onClick={onRemove} className="ml-auto rounded px-1 text-zinc-400 hover:text-white">×</button> : null}
    </div>
  );
}
