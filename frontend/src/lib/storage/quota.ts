/** AURA localStorage keys and quota helpers. */

export const AURA_STORAGE = {
  sessions: "aura.chat.sessions.v1",
  activeId: "aura.chat.activeId.v1",
} as const;

/** Standard browser localStorage soft quota used for the UI meter. */
export const STORAGE_QUOTA_BYTES = 5 * 1024 * 1024; // 5 MB

export type StorageSnapshot = {
  usedBytes: number;
  quotaBytes: number;
  usedMb: number;
  quotaMb: number;
  percent: number;
};

function byteLength(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }
  return value.length * 2;
}

/** Bytes used by all `aura.*` keys in localStorage. */
export function measureAuraStorageBytes(): number {
  if (typeof window === "undefined") return 0;
  let total = 0;
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith("aura.")) continue;
    const value = localStorage.getItem(key) ?? "";
    total += byteLength(key) + byteLength(value);
  }
  return total;
}

export function getStorageSnapshot(): StorageSnapshot {
  const usedBytes = measureAuraStorageBytes();
  const quotaBytes = STORAGE_QUOTA_BYTES;
  const percent = Math.min(100, (usedBytes / quotaBytes) * 100);
  return {
    usedBytes,
    quotaBytes,
    usedMb: usedBytes / (1024 * 1024),
    quotaMb: quotaBytes / (1024 * 1024),
    percent,
  };
}

/** Human label for chat cache size (KB until 1 MB so the meter is not stuck at 0.00). */
export function formatStorageUsed(bytes: number): string {
  if (bytes < 1024) return `${Math.max(0, bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatStorageQuota(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
