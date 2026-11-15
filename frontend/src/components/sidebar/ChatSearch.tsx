"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChatSession } from "@/hooks/useChatSessions";
import { searchChats, type ChatSearchResult } from "@/lib/workspace/chatSearch";

export function ChatSearch({ sessions, onSelect, children }: {
  sessions: readonly ChatSession[];
  onSelect: (result: ChatSearchResult) => void;
  children: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setTerm(query.trim()), 180);
    return () => window.clearTimeout(timer);
  }, [query]);
  const results = useMemo(() => searchChats(sessions, term), [sessions, term]);
  const searching = query.trim() !== term;

  return (
    <>
      <div className="px-3 pb-1">
        <input type="search" aria-label="Search chats" placeholder="Search chats…" value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus-visible:outline-emerald-400/60"
        />
      </div>
      {query.trim() ? (
        <nav aria-label="Chat search results" className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {searching || !results.length ? (
            <p role="status" className="px-2 py-3 text-xs text-zinc-500">{searching ? "Searching…" : "No matching chats"}</p>
          ) : (
            <ul className="space-y-1 pt-2">
              {results.map((result) => (
                <li key={JSON.stringify([result.sessionId, result.messageId])}>
                  <button type="button" onClick={() => onSelect(result)} className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/[0.06] focus-visible:outline-emerald-400">
                    {result.messageId ? <span className="block truncate text-xs text-zinc-200">{result.title}</span> : null}
                    <span className="line-clamp-2 break-words text-xs text-zinc-400">
                      {result.match.before}
                      <mark className="rounded-sm bg-emerald-400/20 text-emerald-200">{result.match.text}</mark>
                      {result.match.after}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
      ) : children}
    </>
  );
}
