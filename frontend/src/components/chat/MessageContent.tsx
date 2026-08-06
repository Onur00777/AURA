"use client";

import { useState, type ReactNode } from "react";

type Block =
  | { type: "text"; content: string }
  | { type: "code"; language: string; content: string };

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

function renderInline(text: string) {
  // Light markdown: `inline code` and **bold**
  const nodes: ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
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
    } else {
      nodes.push(
        <strong key={`b-${key++}`} className="font-semibold text-[#f0f0f3]">
          {token.slice(2, -2)}
        </strong>,
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type MessageContentProps = {
  content: string;
  className?: string;
};

export function MessageContent({ content, className = "" }: MessageContentProps) {
  const blocks = parseBlocks(content);

  return (
    <div className={`space-y-1 ${className}`}>
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
          <p
            key={`text-${index}`}
            className="whitespace-pre-wrap text-[14.5px] leading-[1.7] text-[#e4e4ea]"
          >
            {renderInline(block.content)}
          </p>
        );
      })}
    </div>
  );
}
