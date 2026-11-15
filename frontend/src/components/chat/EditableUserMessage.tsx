"use client";

import { useRef, useState } from "react";

export function EditableUserMessage({ content, disabled, onSave }: {
  content: string;
  disabled: boolean;
  onSave?: (text: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const bubble = "rounded-xl border border-white/[0.08] bg-[#0c0c0e] px-4 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";

  function cancel() {
    setDraft(null);
    requestAnimationFrame(() => editButton.current?.focus());
  }

  if (draft !== null) {
    return (
      <form className={bubble} onSubmit={(event) => {
        event.preventDefault();
        const text = draft.trim();
        if (!text || disabled || !onSave) return;
        setDraft(null);
        onSave(text);
      }}>
        <textarea
          autoFocus
          aria-label="Edit message"
          rows={4}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Escape") cancel(); }}
          className="w-full min-w-0 resize-y rounded-md bg-white/[0.04] p-2 text-sm text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-400/60 sm:min-w-64"
        />
        <div className="mt-2 flex flex-wrap justify-end gap-2 text-xs">
          <button type="button" onClick={cancel} className="rounded-md px-2 py-1 text-zinc-400 hover:text-white">Cancel</button>
          <button type="submit" disabled={disabled || !draft.trim()} className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-emerald-300 disabled:opacity-40">Save &amp; send</button>
        </div>
      </form>
    );
  }

  return (
    <div className={`group relative ${bubble}`}>
      <p className="whitespace-pre-wrap break-words text-[14.5px] leading-[1.65] text-[#e8e8ed]">{content}</p>
      {onSave ? (
        <button ref={editButton} type="button" disabled={disabled} aria-label="Edit message" title="Edit message" onClick={() => setDraft(content)}
          className="absolute right-1 top-1 rounded-md border border-white/10 bg-[#141416] p-1.5 text-zinc-400 hover:text-emerald-300 focus-visible:opacity-100 focus-visible:outline-emerald-400 disabled:hidden [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
          <svg aria-hidden viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m14 6 4 4M4 20l4-1 12-12-3-3L5 16z" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
