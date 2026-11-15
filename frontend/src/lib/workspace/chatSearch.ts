import type { ChatSession } from "@/hooks/useChatSessions";

export type SearchMatch = { before: string; text: string; after: string };

export type ChatSearchResult = {
  sessionId: string;
  title: string;
  messageId?: string;
  match: SearchMatch;
};

export function searchChats(sessions: readonly ChatSession[], query: string): ChatSearchResult[] {
  const term = query.trim();
  if (!term) return [];
  const pattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "iu");
  const results: ChatSearchResult[] = [];

  function findMatch(content: string): SearchMatch | undefined {
    const match = pattern.exec(content);
    if (!match) return;
    const start = Math.max(0, match.index - 30);
    const endOfMatch = match.index + match[0].length;
    const end = Math.min(content.length, endOfMatch + 42);
    return {
      before: (start > 0 ? "…" : "") + content.slice(start, match.index),
      text: match[0],
      after: content.slice(endOfMatch, end) + (end < content.length ? "…" : ""),
    };
  }

  for (const session of sessions) {
    const base = { sessionId: session.id, title: session.title };
    const title = findMatch(session.title);
    if (title) results.push({ ...base, match: title });
    for (const message of session.messages) {
      const match = findMatch(message.content);
      if (match) results.push({ ...base, messageId: message.id, match });
    }
  }
  return results;
}
