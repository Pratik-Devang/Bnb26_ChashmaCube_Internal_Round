import { accountRequest } from "@/lib/account";

export type AdventureWorld = "first-island" | "chapel-of-choices";
export type Difficulty = "easy" | "medium" | "hard";
export type CurriculumTrack = {
  id: string; topic: string; difficulty: Difficulty;
  lessons: { id: string; title: string; body: string; code: string; takeaway: string }[];
  questions: { id: string; prompt: string; code: string; options: string[]; kind: string }[];
};
export type AdventureSelection = { world: AdventureWorld; track: string };
export type AdventureProgress = AdventureSelection & {
  completedLessonIds: string[]; passedQuestionIds: string[]; completed: boolean;
  coinsEarned: number; attemptCount: number; mistakeCount: number; updatedAt: string | null;
};
export type AdventureJournal = { recent: AdventureSelection | null; saves: AdventureProgress[] };
export const topicNames: Record<string, string> = {
  variables: "Variables & values", conditions: "Conditions", loops: "Loops", lists: "Lists", functions: "Functions",
};
export const difficultyDescriptions: Record<Difficulty, string> = {
  easy: "Start with examples, small steps, and output predictions.",
  medium: "Trace changing values, fix mistakes, and connect ideas.",
  hard: "Reason through edge cases and apply ideas in unfamiliar situations.",
};
export const worldPath = (world: AdventureWorld) => world === "first-island" ? "/game" : "/game/church";
export const adventureHref = (selection: AdventureSelection) => `${worldPath(selection.world)}?track=${encodeURIComponent(selection.track)}`;
export const loadCurriculum = () => accountRequest<CurriculumTrack[]>("/adventures/catalog");
export const loadAdventureJournal = () => accountRequest<AdventureJournal>("/adventures/progress");
export const startAdventure = (selection: AdventureSelection) => accountRequest<AdventureProgress>("/adventures/start", { method: "POST", body: JSON.stringify(selection) });
export const finishAdventureLesson = (selection: AdventureSelection, lessonId: string) => accountRequest<AdventureProgress>("/adventures/lesson", { method: "POST", body: JSON.stringify({ ...selection, lessonId }) });
export const answerAdventureQuestion = (selection: AdventureSelection, questionId: string, answer: number) => accountRequest<{ progress: AdventureProgress; correct: boolean; feedback: string; source: string }>("/adventures/answer", { method: "POST", body: JSON.stringify({ ...selection, questionId, answer }) });
