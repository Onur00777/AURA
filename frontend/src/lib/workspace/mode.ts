export const AURA_MODES = ["general", "engineering"] as const;

export type AuraMode = (typeof AURA_MODES)[number];

export const AURA_MODE_STORAGE_KEY = "aura.workspace.mode.v1";

export function isAuraMode(value: string | null): value is AuraMode {
  return value === "general" || value === "engineering";
}

export function loadAuraMode(): AuraMode {
  if (typeof window === "undefined") return "general";
  try {
    const saved = localStorage.getItem(AURA_MODE_STORAGE_KEY);
    return isAuraMode(saved) ? saved : "general";
  } catch {
    return "general";
  }
}

export function persistAuraMode(mode: AuraMode): void {
  localStorage.setItem(AURA_MODE_STORAGE_KEY, mode);
}

/** localStorage keys — general keeps the original chat store so nothing is lost. */
export function storageKeysFor(mode: AuraMode) {
  if (mode === "engineering") {
    return {
      sessions: "aura.chat.engineering.sessions.v1",
      activeId: "aura.chat.engineering.activeId.v1",
    } as const;
  }
  return {
    sessions: "aura.chat.sessions.v1",
    activeId: "aura.chat.activeId.v1",
  } as const;
}
