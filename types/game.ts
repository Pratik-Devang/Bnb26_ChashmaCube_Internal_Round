export type LearningLandmark = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  objective: string;
  reward: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  exerciseId: string;
  position: {
    x: number;
    y: number;
  };
};

export type AmbientActor = {
  id: string;
  name: string;
  sprite: "traveler" | "slime" | "emberbug" | "bristleback" | "fox" | "mossling" | "scout" | "caveKeeper";
  frames: 4 | 5 | 6 | 8;
  reaction: string;
  position: {
    x: number;
    y: number;
  };
  scale?: number;
};
