export type ModuleStatus = "completed" | "active" | "upcoming" | "locked";
export type QuestStatus = "open" | "completed";
export type ConceptState = "resolved" | "improving" | "needs-practice" | "untested";

export type Misconception =
  | "CORRECT"
  | "RANGE_ENDPOINT_EXCLUDED"
  | "WRONG_INITIALIZATION"
  | "ACCUMULATOR_OVERWRITTEN"
  | "WRONG_OR_MISSING_UPDATE"
  | "VARIABLE_ROLE_CONFUSION"
  | "UNCERTAIN";

export type AttemptType = "INITIAL" | "NEAR_TRANSFER" | "FAR_TRANSFER";

export interface ExerciseTestCase {
  input: Record<string, unknown>;
  expected: unknown;
  actual?: unknown;
  passed?: boolean;
}

export interface Exercise {
  id: string;
  conceptId: string;
  title: string;
  prompt: string;
  difficulty: "beginner" | "intermediate";
  starterCode: string;
  testCases: ExerciseTestCase[];
  exerciseType: "practice" | "near-transfer" | "far-transfer";
}

export interface TestResults {
  passed: number;
  failed: number;
  cases: Required<Pick<ExerciseTestCase, "input" | "expected" | "actual" | "passed">>[];
}

export interface AttemptRequest {
  learnerId: string;
  exerciseId: string;
  submittedCode: string;
  learnerExplanation?: string;
  attemptType?: AttemptType;
  parentAttemptId?: string;
  testResults: TestResults;
}

export interface AttemptResponse {
  id: string;
  learnerId: string;
  exerciseId: string;
  createdAt: string;
}

export interface DiagnosisEvidence {
  type: "code" | "test" | "ast";
  line?: number;
  message: string;
}

export interface DiagnosisResult {
  id: string;
  misconceptionCode: Misconception;
  learnerFriendlyName: string;
  confidence: number;
  summary: string;
  evidence: DiagnosisEvidence[];
  classProbabilities: Partial<Record<Misconception, number>>;
  modelVersion: string;
}

export interface Intervention {
  id: string;
  type: string;
  title: string;
  estimatedMinutes: number;
}

export interface DiagnosisResponse {
  attemptId: string;
  diagnosis: DiagnosisResult;
  intervention: Intervention;
  reassessmentExerciseId: string;
}

export interface ReassessmentRequest extends AttemptRequest {
  interventionId: string;
}

export interface Learner {
  id: string;
  name: string;
  level: number;
  xp: number;
  streak: number;
  avatar: string;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  beginnerNote: string;
  status: ModuleStatus;
  progress: number;
  xpReward: number;
  accent: "cyan" | "mint" | "lilac" | "pink" | "yellow" | "white";
  icon: string;
  misconception?: Misconception;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  status: QuestStatus;
  accent: "cyan" | "mint" | "lilac" | "pink" | "yellow";
  icon: string;
}

export interface LearnerConceptState {
  id: string;
  concept: string;
  state: ConceptState;
  mastery: number;
  friendlyDescription: string;
  misconception: Misconception;
}

export interface Diagnosis {
  misconception: Misconception;
  title: string;
  explanation: string;
  example: string;
  steps: number[];
}

export interface DashboardStatistics {
  totalConcepts: number;
  mastered: number;
  inProgress: number;
}

export interface LearningPlanResponse {
  learner: Learner;
  modules: LearningModule[];
  quests: Quest[];
  statistics: DashboardStatistics;
}
