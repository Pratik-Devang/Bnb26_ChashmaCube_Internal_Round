export type GameSpriteKey =
  | "traveler"
  | "slime"
  | "emberbug"
  | "bristleback"
  | "fox"
  | "mossling"
  | "scout"
  | "caveKeeper";

export type MapPosition = { x: number; y: number };

export type IslandLesson = {
  id: string;
  order: number;
  title: string;
  eyebrow: string;
  body: string[];
  code?: string;
  takeaway?: string;
};

export type IslandActor = {
  id: string;
  name: string;
  sprite: GameSpriteKey;
  frames: 4 | 5 | 6 | 8;
  role: "ambient" | "teacher" | "challenge";
  reaction: string;
  position: MapPosition;
  scale?: number;
  lesson?: IslandLesson;
};

export type FirstIslandProgress = {
  completedLessonIds: string[];
  challengeCompleted: boolean;
  coinsEarned: number;
};

export type ChapelObjectiveId = "lever" | "treasure" | "keeper";

export type ChapelProgress = {
  introComplete: boolean;
  completedObjectiveIds: ChapelObjectiveId[];
  questCompleted: boolean;
  coinsEarned: number;
};

/** Legacy prototype types retained until the original static GameWorld is removed. */
export type AmbientActor = Omit<IslandActor, "role" | "lesson">;

export type LearningLandmark = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  objective: string;
  reward: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  exerciseId: string;
  position: MapPosition;
};
