import type { FirstIslandProgress } from "@/types/game";

const STORAGE_KEY = "relearn:first-island-progress";

export const emptyFirstIslandProgress: FirstIslandProgress = {
  completedLessonIds: [],
  challengeCompleted: false,
  coinsEarned: 0,
};

export function loadFirstIslandProgress(): FirstIslandProgress {
  if (typeof window === "undefined") return { ...emptyFirstIslandProgress };
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...emptyFirstIslandProgress };
    const parsed = JSON.parse(stored) as Partial<FirstIslandProgress>;
    return {
      completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [],
      challengeCompleted: Boolean(parsed.challengeCompleted),
      coinsEarned: typeof parsed.coinsEarned === "number" ? parsed.coinsEarned : 0,
    };
  } catch {
    return { ...emptyFirstIslandProgress };
  }
}

export function saveFirstIslandProgress(progress: FirstIslandProgress): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
