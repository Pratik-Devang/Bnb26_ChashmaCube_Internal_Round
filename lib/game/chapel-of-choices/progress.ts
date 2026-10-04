import { accountRequest } from "@/lib/account";
import type { ChapelProgress } from "@/types/game";

export const emptyChapelProgress: ChapelProgress = {
  introComplete: false,
  completedObjectiveIds: [],
  questCompleted: false,
  coinsEarned: 0,
};

export function loadChapelProgress(): Promise<ChapelProgress> {
  return accountRequest("/worlds/chapel-of-choices");
}

export function saveChapelProgress(progress: ChapelProgress): Promise<ChapelProgress> {
  return accountRequest("/worlds/chapel-of-choices", {
    method: "PUT",
    body: JSON.stringify(progress),
  });
}
