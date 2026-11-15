"use client";

import { useState } from "react";

export function usePromptSuggestions<T>(key: string, pool: readonly T[], initial: T[]) {
  const [refreshed, setRefreshed] = useState<{ key: string; actions: T[]; revision: number }>();
  const current = refreshed?.key === key ? refreshed : undefined;
  const actions = current?.actions ?? initial;
  const revision = current?.revision ?? 0;

  function refresh() {
    const available = pool.filter((item) => !actions.includes(item));
    if (available.length < actions.length) return;
    const next: T[] = [];
    while (next.length < actions.length) {
      const index = Math.floor(Math.random() * available.length);
      next.push(available.splice(index, 1)[0]);
    }
    setRefreshed({ key, actions: next, revision: revision + 1 });
  }

  return { actions, refresh, revision };
}
