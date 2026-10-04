import type { AmbientActor, LearningLandmark } from "@/types/game";

export const starterIsland = {
  name: "Starter Island",
  chapter: "Chapter 01",
  objective: "Investigate the signal at the hilltop camp",
  coins: 120,
};

export const learningLandmarks: LearningLandmark[] = [
  {
    id: "loop-boundary-camp",
    title: "The Boundary Beacon",
    eyebrow: "Python expedition",
    description:
      "The hilltop beacon has stopped one step too early. Repair its control sequence by learning how Python ranges handle their final value.",
    objective: "Restore the beacon and reveal the northern trail.",
    reward: 50,
    difficulty: "Beginner",
    exerciseId: "inclusive-sum-01",
    position: { x: 86, y: 17 },
  },
];

export const ambientActors: AmbientActor[] = [
  {
    id: "meadow-fox",
    name: "Trail Fox",
    sprite: "fox",
    frames: 6,
    reaction: "The fox perks up and watches the hilltop trail.",
    position: { x: 40, y: 29},
    scale: 0.68,
  },
  {
    id: "west-slime",
    name: "Dewdrop",
    sprite: "slime",
    frames: 5,
    reaction: "Dewdrop jiggles. It seems pleased to meet you.",
    position: { x: 14, y: 30 },
    scale: 0.7,
  },
  {
    id: "west-slime",
    name: "Dewdrop",
    sprite: "slime",
    frames: 5,
    reaction: "Dewdrop jiggles. It seems pleased to meet you.",
    position: { x: 14, y: 30 },
    scale: 0.7,
  },
  {
    id: "west-slime",
    name: "Dewdrop",
    sprite: "slime",
    frames: 5,
    reaction: "Dewdrop jiggles. It seems pleased to meet you.",
    position: { x: 20, y: 22 },
    scale: 0.75,
  },
  {
    id: "east-mossling",
    name: "Mossling",
    sprite: "mossling",
    frames: 4,
    reaction: "The beacon keeps stopping too early. Curious...",
    position: { x: 85, y: 30 },
    scale: 0.8,
  },
  {
    id: "hill-scout",
    name: "Island Scout",
    sprite: "scout",
    frames: 4,
    reaction: "Restore the beacon and the northern trail should open.",
    position: { x: 78, y: 34 },
  },
  
];
