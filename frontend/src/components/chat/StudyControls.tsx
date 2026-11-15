"use client";

import { useState } from "react";
import { STUDY_TOPICS, type StudyPhase, type StudyTopic } from "@/lib/workspace/study";

export function StudyControls({ topic, phase, disabled, onStart, onAdvance, onLeave }: {
  topic?: StudyTopic;
  phase?: StudyPhase;
  disabled: boolean;
  onStart: (topic: StudyTopic) => void;
  onAdvance: () => void;
  onLeave: () => void;
}) {
  const [selection, setSelection] = useState<StudyTopic>("algorithms");
  const control = "rounded-lg border border-white/[0.08] bg-[#101416] px-2 py-1.5 text-xs text-cyan-200 enabled:hover:border-cyan-400/30 focus-visible:outline-cyan-400 disabled:opacity-45";
  return (
    <div className="mx-auto mb-2 flex w-full max-w-3xl flex-wrap items-center gap-2 px-4 sm:px-8">
      {topic ? (
        <>
          <p className="mr-auto min-w-0 text-xs text-cyan-200">Study · {STUDY_TOPICS[topic]}</p>
          {phase === "answer" ? <span className="text-xs text-zinc-400">Answer below</span> : (
            <button type="button" disabled={disabled} onClick={onAdvance} className={control}>
              {phase === "retry" ? "Retry study step" : phase === "start" ? "Ask first question" : "Next question"}
            </button>
          )}
          <button type="button" onClick={onLeave} className="rounded-md px-2 py-1.5 text-xs text-zinc-400 hover:text-white focus-visible:outline-cyan-400">
            Leave study
          </button>
        </>
      ) : (
        <>
          <label htmlFor="compe-study-topic" className="text-xs text-zinc-400">CompE study</label>
          <select id="compe-study-topic" value={selection} onChange={(event) => setSelection(event.target.value as StudyTopic)} className={control}>
            {Object.entries(STUDY_TOPICS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <button type="button" disabled={disabled} onClick={() => onStart(selection)} className={control}>Start study</button>
        </>
      )}
    </div>
  );
}
