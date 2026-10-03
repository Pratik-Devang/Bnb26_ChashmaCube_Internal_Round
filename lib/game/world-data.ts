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
    id: "beach-traveler",
    name: "Beach Cartographer",
    sprite: "traveler",
    frames: 4,
    reaction: "I am charting every trail. That beacon should reveal a new route.",
    position: { x: 38, y: 84 },
    scale: 0.52,
  },
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
    id: "cliff-slime",
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
    id: "shore-emberbug",
    name: "Emberbug",
    sprite: "emberbug",
    frames: 8,
    reaction: "The tiny creature crackles warmly against the sea breeze.",
    position: { x: 68, y: 84 },
    scale: 0.38,
  },
  {
    id: "forest-bristleback",
    name: "Bristleback",
    sprite: "bristleback",
    frames: 4,
    reaction: "Bristleback sniffs around the quiet forest clearing.",
    position: { x: 45, y: 57 },
    scale: 0.58,
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
  {
    id: "cave-keeper",
    name: "Cave Keeper",
    sprite: "caveKeeper",
    frames: 4,
    reaction: "Something beyond the cave is still locked. The beacon may know why.",
    position: { x: 13.5, y: 39 },
    scale: 0.5,
  },
];
