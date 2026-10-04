import type { FirstIslandProgress } from "@/types/game";
import { accountRequest } from "@/lib/account";

export const emptyFirstIslandProgress: FirstIslandProgress = {
  completedLessonIds: [], challengeCompleted: false, coinsEarned: 0,
};
export function loadFirstIslandProgress(): Promise<FirstIslandProgress> {
  return accountRequest("/worlds/first-island");
}
export function saveFirstIslandProgress(progress: FirstIslandProgress): Promise<FirstIslandProgress> {
  return accountRequest("/worlds/first-island", { method: "PUT", body: JSON.stringify(progress) });
}
