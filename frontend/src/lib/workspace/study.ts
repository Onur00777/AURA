import type { ChatMessage, StudyStep } from "@/lib/types/api";

export const STUDY_TOPICS = {
  algorithms: "Data Structures & Algorithms",
  operating_systems: "Operating Systems",
  architecture: "Computer Architecture",
  embedded: "Embedded Systems",
  networks: "Computer Networks",
  memory: "C/C++ Memory Management",
} as const;

export type StudyTopic = keyof typeof STUDY_TOPICS;
export type StudyPhase = "start" | "answer" | "next" | "retry";

export function getStudyPhase(messages: readonly ChatMessage[]): StudyPhase {
  const last = messages.at(-1);
  if (!last) return "start";
  if (last.role === "user" || !last.studyStep) return "retry";
  return last.studyStep === "question" ? "answer" : "next";
}

export function studyQuestion(topic: StudyTopic, next: boolean): { text: string; step: StudyStep } {
  const label = STUDY_TOPICS[topic];
  return {
    text: next ? `Ask me the next question on ${label}.` : `Start a study session on ${label}.`,
    step: "question",
  };
}
