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

export const AURA_POWERS = ["spark", "pulse", "nova"] as const;

export type AuraPower = (typeof AURA_POWERS)[number];

export const AURA_POWER_STORAGE_KEY = "aura.workspace.power.v1";

export type AuraPowerTierMeta = {
  id: AuraPower;
  name: string;
  tag: string;
  tokens: string;
  description: string;
};

/**
 * Three compute/depth configurations (Gemini Flash-Lite / Flash / Pro style).
 * Names can be changed in one place here whenever desired.
 */
export const AURA_POWER_TIERS: readonly AuraPowerTierMeta[] = [
  {
    id: "spark",
    name: "Spark",
    tag: "Fast",
    tokens: "280 tok",
    description: "Quick, concise replies with minimal CPU load",
  },
  {
    id: "pulse",
    name: "Pulse",
    tag: "Balanced",
    tokens: "640 tok",
    description: "Everyday balance of speed, structure, and clarity",
  },
  {
    id: "nova",
    name: "Nova",
    tag: "Max Power",
    tokens: "1536 tok",
    description: "Full CPU power for deep reasoning & complete examples",
  },
] as const;

export function isAuraPower(value: string | null): value is AuraPower {
  return value === "spark" || value === "pulse" || value === "nova";
}

export function loadAuraPower(): AuraPower {
  if (typeof window === "undefined") return "pulse";
  try {
    const saved = localStorage.getItem(AURA_POWER_STORAGE_KEY);
    return isAuraPower(saved) ? saved : "pulse";
  } catch {
    return "pulse";
  }
}

export function persistAuraPower(power: AuraPower): void {
  localStorage.setItem(AURA_POWER_STORAGE_KEY, power);
}
