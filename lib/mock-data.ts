import type {
  DashboardStatistics,
  Diagnosis,
  Learner,
  LearnerConceptState,
  LearningModule,
  Quest,
  Exercise,
  DiagnosisResponse,
} from "@/types/learning";

export const learner: Learner = {
  id: "learner-01",
  name: "Maya",
  level: 4,
  xp: 1280,
  streak: 7,
  avatar: "👩🏽‍💻",
};

export const learningModules: LearningModule[] = [
  {
    id: "variables",
    title: "Variables & values",
    description: "Give information a name so your program can remember it.",
    beginnerNote: "Think of a variable as a labeled box that can hold a value.",
    status: "completed",
    progress: 100,
    xpReward: 80,
    accent: "cyan",
    icon: "📦",
    misconception: "CORRECT",
  },
  {
    id: "conditions",
    title: "Conditions",
    description: "Help your code choose what to do next.",
    beginnerNote: "An if statement asks a yes-or-no question before running code.",
    status: "completed",
    progress: 100,
    xpReward: 90,
    accent: "mint",
    icon: "🔀",
    misconception: "CORRECT",
  },
  {
    id: "loop-boundaries",
    title: "Loop Boundaries",
    description: "Learn exactly where a Python loop starts and stops.",
    beginnerNote: "Python range includes the first number, but stops before the last one.",
    status: "active",
    progress: 64,
    xpReward: 120,
    accent: "lilac",
    icon: "🎯",
    misconception: "RANGE_ENDPOINT_EXCLUDED",
  },
  {
    id: "accumulators",
    title: "Accumulators",
    description: "Build a total one small step at a time.",
    beginnerNote: "Keep the running total outside the loop, then add to it inside.",
    status: "upcoming",
    progress: 0,
    xpReward: 130,
    accent: "yellow",
    icon: "➕",
    misconception: "ACCUMULATOR_OVERWRITTEN",
  },
  {
    id: "while-loops",
    title: "While loops",
    description: "Repeat an action while a condition remains true.",
    beginnerNote: "Remember to change something in the loop so it can eventually stop.",
    status: "locked",
    progress: 0,
    xpReward: 140,
    accent: "white",
    icon: "🔁",
    misconception: "WRONG_OR_MISSING_UPDATE",
  },
  {
    id: "loop-mastery",
    title: "Loop mastery challenge",
    description: "Mix your loop skills in a fresh problem.",
    beginnerNote: "This unlocks after you complete the lessons leading to it.",
    status: "locked",
    progress: 0,
    xpReward: 250,
    accent: "pink",
    icon: "🏆",
    misconception: "VARIABLE_ROLE_CONFUSION",
  },
];

export const quests: Quest[] = [
  {
    id: "quest-loop-lesson",
    title: "Complete a loop lesson",
    description: "Take one small step along your Python path.",
    xpReward: 60,
    status: "open",
    accent: "cyan",
    icon: "📘",
  },
  {
    id: "quest-boundary-bug",
    title: "Fix a boundary bug",
    description: "Help a tiny robot visit every numbered tile.",
    xpReward: 90,
    status: "open",
    accent: "mint",
    icon: "🛠️",
  },
  {
    id: "quest-transfer",
    title: "Beat the transfer challenge",
    description: "Use the same idea in a brand-new question.",
    xpReward: 150,
    status: "open",
    accent: "yellow",
    icon: "✨",
  },
];

export const diagnosis: Diagnosis = {
  misconception: "RANGE_ENDPOINT_EXCLUDED",
  title: "You found a boundary bug",
  explanation:
    "You’re very close. In Python, range(1, 5) begins at 1 and stops just before 5, so the loop visits four numbers.",
  example: "range(1, 5)",
  steps: [1, 2, 3, 4, 5],
};

export const conceptStates: LearnerConceptState[] = [
  {
    id: "state-variables",
    concept: "Variables",
    state: "resolved",
    mastery: 94,
    friendlyDescription: "You can confidently store and update values.",
    misconception: "CORRECT",
  },
  {
    id: "state-conditions",
    concept: "Conditions",
    state: "improving",
    mastery: 76,
    friendlyDescription: "Your choices are getting more precise each round.",
    misconception: "VARIABLE_ROLE_CONFUSION",
  },
  {
    id: "state-boundaries",
    concept: "Loop boundaries",
    state: "needs-practice",
    mastery: 48,
    friendlyDescription: "One quick game will help the stop point click.",
    misconception: "RANGE_ENDPOINT_EXCLUDED",
  },
  {
    id: "state-accumulators",
    concept: "Accumulators",
    state: "untested",
    mastery: 12,
    friendlyDescription: "This concept is waiting for its first try.",
    misconception: "WRONG_INITIALIZATION",
  },
];

export const statistics: DashboardStatistics = {
  totalConcepts: learningModules.length,
  mastered: learningModules.filter((module) => module.status === "completed").length,
  inProgress: learningModules.filter((module) => module.status === "active").length,
};

export const exerciseCatalog: Record<string, Exercise> = {
  "inclusive-sum-01": {
    id: "inclusive-sum-01",
    conceptId: "concept-loop-boundaries",
    title: "Add every number",
    prompt: "Write inclusive_sum(n) so it returns the sum of every whole number from 1 through n.",
    difficulty: "beginner",
    starterCode: "def inclusive_sum(n):\n    total = 0\n    # Add your loop here\n    return total",
    testCases: [
      { args: [1], expected: 1 },
      { args: [5], expected: 15 },
      { args: [8], expected: 36 },
    ],
    exerciseType: "PRACTICE",
  },
  "list-traversal-04": {
    id: "list-traversal-04",
    conceptId: "concept-loop-boundaries",
    title: "Visit every item",
    prompt: "Write add_items(values) so it adds every number in the list, including the final item.",
    difficulty: "beginner",
    starterCode: "def add_items(values):\n    total = 0\n    # Visit every index\n    return total",
    testCases: [
      { args: [[4]], expected: 4 },
      { args: [[2, 3, 5]], expected: 10 },
      { args: [[1, 1, 1, 7]], expected: 10 },
    ],
    exerciseType: "NEAR_TRANSFER",
  },
  "multiples-through-n-02": {
    id: "multiples-through-n-02",
    conceptId: "concept-loop-boundaries",
    title: "Count landing tiles",
    prompt: "Write count_multiples(n, step) to count multiples of step from step through n, including n when it is a multiple.",
    difficulty: "beginner",
    starterCode: "def count_multiples(n, step):\n    count = 0\n    # Count every landing tile\n    return count",
    testCases: [
      { args: [6, 3], expected: 2 },
      { args: [10, 2], expected: 5 },
      { args: [9, 4], expected: 2 },
    ],
    exerciseType: "FAR_TRANSFER",
  },
};

export const activeExercise: Exercise = exerciseCatalog["inclusive-sum-01"];

export const mockIntervention = {
  id: "intervention-123",
  type: "RANGE_PATH_GAME",
  title: "Help Byte reach the final tile",
  estimatedMinutes: 2,
  content: {
    type: "RANGE_PATH_GAME",
    title: "Help Byte reach the final tile",
    estimatedMinutes: 2,
    instructions: "Choose an endpoint that lets Byte visit every required tile.",
    rounds: [
      { start: 1, requiredLastTile: 5, choices: [5, 6, 7], correctStop: 6 },
      { start: 2, requiredLastTile: 8, choices: [8, 9, 10], correctStop: 9 },
    ],
    nearTransferExerciseId: "list-traversal-04",
    farTransferExerciseId: "multiples-through-n-02",
  },
};

export const mockDiagnosisResponse: DiagnosisResponse = {
  attemptId: "attempt-123",
  diagnosis: {
    id: "diagnosis-123",
    misconceptionCode: "RANGE_ENDPOINT_EXCLUDED",
    learnerFriendlyName: "Boundary bug",
    confidence: 0.87,
    summary: "Your loop stops one step before the final number.",
    evidence: [
      { type: "code", line: 2, message: "range(1, n) stops before n." },
      { type: "test", message: "The result is missing the final value." },
    ],
    classProbabilities: {
      RANGE_ENDPOINT_EXCLUDED: 0.87,
      WRONG_INITIALIZATION: 0.05,
      ACCUMULATOR_OVERWRITTEN: 0.03,
      WRONG_OR_MISSING_UPDATE: 0.03,
      VARIABLE_ROLE_CONFUSION: 0.02,
    },
    modelVersion: "baseline-demo-v0",
  },
  intervention: mockIntervention,
  reassessmentExerciseId: "list-traversal-04",
  conceptStatus: "NEEDS_PRACTICE",
};

