import { MessageContent } from "@/components/chat/MessageContent";

const sections = [
  { title: "Correct", accent: "text-emerald-300" },
  { title: "Missing", accent: "text-amber-300" },
  { title: "Incorrect", accent: "text-rose-300" },
] as const;

export function StudyFeedback({ content }: { content: string }) {
  const headings = [...content.matchAll(/^\s*(?:#{1,6}\s+)?(?:\*\*)?(Correct|Missing|Incorrect)(?:\*\*)?:?[ \t]*(?:\r?\n|$)/gim)];
  if (headings.length !== sections.length ||
      headings.some((heading, index) => heading[1].toLowerCase() !== sections[index].title.toLowerCase())) {
    return <MessageContent content={content} />;
  }
  const introduction = content.slice(0, headings[0].index).trim();

  return (
    <div className="space-y-2">
      {introduction ? <MessageContent content={introduction} /> : null}
      {sections.map(({ title, accent }, index) => {
        const heading = headings[index];
        const body = content.slice(heading.index + heading[0].length, headings[index + 1]?.index).trim();
        return (
          <div key={title} className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2">
            <h3 className={`mb-0.5 text-xs font-medium ${accent}`}>{title}</h3>
            {body ? <MessageContent content={body} /> : <span className="text-xs text-zinc-500">No feedback provided.</span>}
          </div>
        );
      })}
    </div>
  );
}
