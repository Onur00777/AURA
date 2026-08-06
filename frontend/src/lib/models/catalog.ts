export type ModelMeta = {
  /** Short UI label, e.g. "DeepSeek" */
  shortName: string;
  /** One-line specialty for the info popover */
  bestFor: string;
  /** Optional longer blurb */
  summary: string;
};

type CatalogRule = {
  /** Matched against the lowercase filename */
  match: RegExp;
  meta: ModelMeta;
};

/**
 * Known AURA GGUF aliases. First matching rule wins.
 * API still uses the full filename — only the UI displays short names.
 */
const CATALOG: CatalogRule[] = [
  {
    match: /deepseek/i,
    meta: {
      shortName: "DeepSeek",
      bestFor: "Reasoning & analysis",
      summary:
        "DeepSeek-R1 distill — strong at step-by-step reasoning, math, and careful problem solving. Great when you want deeper thinking over casual chat.",
    },
  },
  {
    match: /qwen/i,
    meta: {
      shortName: "Qwen2",
      bestFor: "Coding & instruction following",
      summary:
        "Qwen2.5 Instruct — solid all-rounder for coding, structured answers, and following detailed prompts. A strong default for everyday work.",
    },
  },
  {
    match: /tinyllama/i,
    meta: {
      shortName: "TinyLlama",
      bestFor: "Fast chat & light tasks",
      summary:
        "TinyLlama Chat — small and snappy on CPU. Best for quick replies, brainstorming, and lightweight chatting when speed matters most.",
    },
  },
];

function prettifyFilename(filename: string): string {
  const stem = filename.replace(/\.gguf$/i, "");
  const cleaned = stem
    .replace(/[-_]/g, " ")
    .replace(/\bq\d(_k)?(_m)?\b/gi, "")
    .replace(/\b\d+(\.\d+)?[bm]\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return stem;
  return cleaned
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

export function getModelMeta(filename: string): ModelMeta {
  for (const rule of CATALOG) {
    if (rule.match.test(filename)) return rule.meta;
  }
  const shortName = prettifyFilename(filename) || filename;
  return {
    shortName,
    bestFor: "General purpose",
    summary: "Local GGUF model. Specialty not catalogued yet — try it and see how it fits your workflow.",
  };
}

export function getModelShortName(filename: string): string {
  if (!filename) return "";
  return getModelMeta(filename).shortName;
}
