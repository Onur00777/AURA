"use client";

import { useState, type ReactNode } from "react";

type Block =
  | { type: "text"; content: string }
  | { type: "code"; language: string; content: string };

const SUPERSCRIPTS: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "-": "⁻",
  "n": "ⁿ",
  "i": "ⁱ",
};

const SUBSCRIPTS: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
  "i": "ᵢ",
  "j": "ⱼ",
  "k": "ₖ",
  "n": "ₙ",
};

const LATEX_SYMBOLS: Array<[RegExp, string]> = [
  [/\\log\b/g, "log"],
  [/\\ln\b/g, "ln"],
  [/\\min\b/g, "min"],
  [/\\max\b/g, "max"],
  [/\\exp\b/g, "exp"],
  [/\\sin\b/g, "sin"],
  [/\\cos\b/g, "cos"],
  [/\\tan\b/g, "tan"],
  [/\\times\b/g, "×"],
  [/\\cdot\b/g, "·"],
  [/\\div\b/g, "÷"],
  [/\\pm\b/g, "±"],
  [/\\le(?:q)?\b/g, "≤"],
  [/\\ge(?:q)?\b/g, "≥"],
  [/\\ne(?:q)?\b/g, "≠"],
  [/\\approx\b/g, "≈"],
  [/\\equiv\b/g, "≡"],
  [/\\(?:to|rightarrow)\b/g, "→"],
  [/\\leftarrow\b/g, "←"],
  [/\\Rightarrow\b/g, "⇒"],
  [/\\infty\b/g, "∞"],
  [/\\Theta\b/g, "Θ"],
  [/\\Omega\b/g, "Ω"],
  [/\\Delta\b/g, "Δ"],
  [/\\theta\b/g, "θ"],
  [/\\omega\b/g, "ω"],
  [/\\alpha\b/g, "α"],
  [/\\beta\b/g, "β"],
  [/\\gamma\b/g, "γ"],
  [/\\lambda\b/g, "λ"],
  [/\\mu\b/g, "μ"],
  [/\\pi\b/g, "π"],
  [/\\sigma\b/g, "σ"],
  [/\\sum\b/g, "∑"],
  [/\\prod\b/g, "∏"],
  [/\\in\b/g, "∈"],
  [/\\notin\b/g, "∉"],
  [/\\subset\b/g, "⊂"],
  [/\\subseteq\b/g, "⊆"],
  [/\\cup\b/g, "∪"],
  [/\\cap\b/g, "∩"],
  [/\\(?:ldots|dots)\b/g, "…"],
  [/\\left\s*/g, ""],
  [/\\right\s*/g, ""],
  [/\\[,;!]\s*/g, " "],
  [/\\quad\b/g, " "],
  [/\\qquad\b/g, "  "],
];

function cleanLatexMath(expr: string): string {
  let out = expr.trim();

  // \text{...}, \mathrm{...}, \mathbf{...} -> inner text
  out = out.replace(/\\(?:text|mathrm|mathbf|mathit|operatorname)\{([^{}]*)\}/g, "$1");
  // \frac{a}{b} -> (a / b)
  out = out.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1 / $2)");
  // \sqrt{x} -> √(x)
  out = out.replace(/\\sqrt\{([^{}]*)\}/g, "√($1)");

  for (const [pattern, replacement] of LATEX_SYMBOLS) {
    out = out.replace(pattern, replacement);
  }

  // Superscripts: ^{2} or ^2 -> ²
  out = out.replace(/\^\{([0-9+\-ni]+)\}/g, (_, chars: string) =>
    chars
      .split("")
      .map((ch) => SUPERSCRIPTS[ch] ?? ch)
      .join(""),
  );
  out = out.replace(/\^([0-9ni])/g, (_, ch: string) => SUPERSCRIPTS[ch] ?? `^${ch}`);

  // Subscripts: _{2} or _2 -> ₂
  out = out.replace(/_\{([0-9ijkn]+)\}/g, (_, chars: string) =>
    chars
      .split("")
      .map((ch) => SUBSCRIPTS[ch] ?? ch)
      .join(""),
  );
  out = out.replace(/_([0-9ijkn])/g, (_, ch: string) => SUBSCRIPTS[ch] ?? `_${ch}`);

  // Strip leftover braces and stray backslashes before words
  out = out.replace(/[{}]/g, "");
  out = out.replace(/\\([a-zA-Z]+)/g, "$1");
  // Tidy spacing around "log", e.g. "n log n"
  out = out.replace(/([a-zA-Z0-9)])\s*log\b/g, "$1 log");
  out = out.replace(/\s{2,}/g, " ");

  return out.trim();
}

/**
 * Convert raw LaTeX delimiters (\(...\), \[...\], $$...$$) and stray LaTeX
 * commands in plain text into readable Unicode notation.
 */
function normalizeText(raw: string): string {
  let out = raw;

  // Block math \[ ... \] or $$ ... $$
  out = out.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner: string) => cleanLatexMath(inner));
  out = out.replace(/\$\$([\s\S]*?)\$\$/g, (_, inner: string) => cleanLatexMath(inner));

  // Inline math \( ... \)
  out = out.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner: string) => cleanLatexMath(inner));

  // Inline $...$ when it looks like math (contains \, ^, _, or O(...))
  out = out.replace(/\$([^$\n]+)\$/g, (full, inner: string) => {
    if (/[\\^_]|^[OΘΩ]\(/.test(inner.trim())) {
      return cleanLatexMath(inner);
    }
    return full;
  });

  // Catch any unwrapped \log, \times, \le, etc. that the model emitted bare
  if (out.includes("\\")) {
    for (const [pattern, replacement] of LATEX_SYMBOLS) {
      out = out.replace(pattern, replacement);
    }
  }

  return out;
}

function parseBlocks(content: string): Block[] {
  const parts = content.split(/```/);
  const blocks: Block[] = [];

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (i % 2 === 0) {
      if (part.length) blocks.push({ type: "text", content: part });
      continue;
    }
    const newline = part.indexOf("\n");
    if (newline === -1) {
      blocks.push({ type: "code", language: "", content: part });
      continue;
    }
    const language = part.slice(0, newline).trim();
    const code = part.slice(newline + 1).replace(/\n$/, "");
    blocks.push({ type: "code", language, content: code });
  }

  return blocks.length > 0 ? blocks : [{ type: "text", content }];
}

function CodeBlock({ language, content }: { language: string; content: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-white/[0.08] bg-[#050708]">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-3.5 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8b8b9a]">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded-md px-2 py-0.5 font-mono text-[10px] tracking-wide text-[#8b8b9a] transition-colors hover:bg-white/[0.05] hover:text-emerald-300"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5">
        <code className="font-mono text-[13px] leading-[1.65] text-[#d4e8dc]">
          {content}
        </code>
      </pre>
    </div>
  );
}

function renderInline(rawText: string) {
  const text = normalizeText(rawText);
  const nodes: ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("`")) {
      nodes.push(
        <code
          key={`c-${key++}`}
          className="rounded-md border border-white/[0.08] bg-white/[0.05] px-1.5 py-0.5 font-mono text-[12.5px] text-emerald-300/90"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong key={`b-${key++}`} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(
        <em key={`i-${key++}`} className="italic text-[#ececf2]">
          {token.slice(1, -1)}
        </em>,
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/**
 * Gemini-style list item rendering: if a list item starts with a subheading
 * label like "Quicksort: ..." (even without **bold**), render the "Quicksort:"
 * prefix in bold white so terms stand out cleanly.
 */
function renderListItemContent(rawItem: string): ReactNode {
  const trimmed = rawItem.trim();

  // Already starts with **bold**
  if (trimmed.startsWith("**")) {
    return renderInline(trimmed);
  }

  // Starts with a short plain label before a colon, e.g. "Quicksort: Average time..."
  const labelMatch = /^([A-Za-z0-9À-ž_+/()\- ]{1,38}):(?:\s+(.*))?$/.exec(trimmed);
  if (labelMatch) {
    const label = labelMatch[1].trim();
    const rest = labelMatch[2] ?? "";
    const wordCount = label.split(/\s+/).length;
    if (wordCount <= 5) {
      return (
        <>
          <strong className="font-bold text-white">{normalizeText(label)}:</strong>
          {rest ? <> {renderInline(rest)}</> : null}
        </>
      );
    }
  }

  return renderInline(trimmed);
}

function isListLine(line: string): boolean {
  const t = line.trim();
  return /^[-*•]\s+.+$/.test(t) || /^\d+[.)]\s+.+$/.test(t);
}

function isStandaloneSectionTitle(lines: string[], index: number): boolean {
  const current = lines[index].trim();
  if (!current || current.length > 64) return false;
  if (/^[#*•\-]/.test(current) || /^\d+[.)]\s/.test(current)) return false;
  // Sentence-ending punctuation (. ! ?) means it's a normal sentence, not a title
  if (/[.!?]$/.test(current)) return false;

  // Look ahead for the next non-empty line; if it's a bullet/numbered list item,
  // this short line is acting as a section heading (e.g. "Cache Behavior").
  for (let next = index + 1; next < lines.length; next += 1) {
    const peek = lines[next].trim();
    if (!peek) continue;
    return isListLine(peek);
  }
  return false;
}

function renderTextBlock(content: string, blockKey: number) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const elements: ReactNode[] = [];
  let paragraphLines: string[] = [];
  let key = 0;

  function flushParagraph() {
    if (paragraphLines.length === 0) return;
    const joined = paragraphLines.join("\n").trim();
    paragraphLines = [];
    if (!joined) return;
    elements.push(
      <p
        key={`p-${blockKey}-${key++}`}
        className="whitespace-pre-wrap text-[14.5px] leading-[1.7] text-[#e4e4ea]"
      >
        {renderInline(joined)}
      </p>,
    );
  }

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Markdown headings: #, ##, ###, ####
    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].replace(/\s*#+\s*$/, "").replace(/^\*\*|\*\*$/g, "");
      const sizeClass =
        level === 1
          ? "text-[17.5px] font-bold text-white mt-5 mb-1.5"
          : level === 2
            ? "text-[16px] font-bold text-white mt-4 mb-1.5"
            : "text-[15px] font-bold text-white mt-4 mb-1";
      elements.push(
        <h3
          key={`h-${blockKey}-${key++}`}
          className={`${sizeClass} tracking-tight first:mt-0`}
        >
          {renderInline(headingText)}
        </h3>,
      );
      continue;
    }

    // Unmarked section heading right before a list (e.g. "Cache Behavior")
    if (isStandaloneSectionTitle(lines, i)) {
      flushParagraph();
      const cleanTitle = trimmed.replace(/^\*\*|\*\*$/g, "").replace(/:$/, "");
      elements.push(
        <h3
          key={`sh-${blockKey}-${key++}`}
          className="mt-4 mb-1 text-[15px] font-bold tracking-tight text-white first:mt-0"
        >
          {renderInline(cleanTitle)}
        </h3>,
      );
      continue;
    }

    // Unordered list item: - item or * item
    const bulletMatch = /^[-*•]\s+(.+)$/.exec(trimmed);
    if (bulletMatch) {
      flushParagraph();
      elements.push(
        <div
          key={`ul-${blockKey}-${key++}`}
          className="flex items-start gap-2.5 pl-1 text-[14.5px] leading-[1.7] text-[#e4e4ea]"
        >
          <span
            className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/75"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            {renderListItemContent(bulletMatch[1])}
          </div>
        </div>,
      );
      continue;
    }

    // Ordered list item: 1. item
    const orderedMatch = /^(\d+)[.)]\s+(.+)$/.exec(trimmed);
    if (orderedMatch) {
      flushParagraph();
      elements.push(
        <div
          key={`ol-${blockKey}-${key++}`}
          className="flex items-start gap-2 pl-1 text-[14.5px] leading-[1.7] text-[#e4e4ea]"
        >
          <span className="shrink-0 font-mono text-[12.5px] font-semibold text-emerald-400/85">
            {orderedMatch[1]}.
          </span>
          <div className="min-w-0 flex-1">
            {renderListItemContent(orderedMatch[2])}
          </div>
        </div>,
      );
      continue;
    }

    paragraphLines.push(rawLine);
  }

  flushParagraph();
  return elements;
}

type MessageContentProps = {
  content: string;
  className?: string;
};

export function MessageContent({ content, className = "" }: MessageContentProps) {
  const blocks = parseBlocks(content);

  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((block, index) => {
        if (block.type === "code") {
          return (
            <CodeBlock
              key={`code-${index}`}
              language={block.language}
              content={block.content}
            />
          );
        }
        return (
          <div key={`text-${index}`} className="space-y-2">
            {renderTextBlock(block.content, index)}
          </div>
        );
      })}
    </div>
  );
}
