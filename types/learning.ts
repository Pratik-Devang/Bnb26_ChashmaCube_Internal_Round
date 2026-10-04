export type ModuleStatus = "completed" | "active" | "upcoming" | "locked";
export type QuestStatus = "open" | "completed";

export type ConceptState = "resolved" | "improving" | "needs-practice" | "learned" | "untested";
export type ConceptStatus = "UNTESTED" | "NEEDS_PRACTICE" | "IMPROVING" | "RESOLVED";

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
  input?: Record<string, unknown>;
  args?: unknown[];
  expected: unknown;
  actual?: unknown;
  passed?: boolean;
  error?: string;
}

export interface Exercise {
  id: string;
  conceptId: string;
  title: string;
  prompt: string;
  difficulty: "beginner" | "intermediate" | string;
  starterCode: string;
  testCases: ExerciseTestCase[];
  exerciseType: "practice" | "near-transfer" | "far-transfer" | "PRACTICE" | "NEAR_TRANSFER" | "FAR_TRANSFER";
}

export interface TestCaseResult {
  input?: Record<string, unknown>;
  args?: unknown[];
  expected: unknown;
  actual?: unknown;
  passed: boolean;
  error?: string;
}

export interface TestResults {
  passed: number;
  failed: number;
  cases: TestCaseResult[];
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
  attemptType?: AttemptType;
  parentAttemptId?: string | null;
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
  diagnosisId?: string;
  type: string;
  title: string;
  estimatedMinutes: number;
  content?: Record<string, unknown>;
  completedAt?: string | null;
}

export interface DiagnosisResponse {
  attemptId: string;
  diagnosis: DiagnosisResult;
  intervention: Intervention;
  reassessmentExerciseId?: string | null;
  conceptStatus?: ConceptStatus | null;
}

export interface CodeReviewResponse {
  source: "gemini" | "deterministic";
  model: string;
  availabilityMessage?: string | null;
  diagnosisCode: Misconception;
  summary: string;
  strengths: string[];
  issues: { title: string; explanation: string; line?: number | null }[];
  nextSteps: string[];
}

export interface InterventionCompletion {
  interventionId: string;
  completed: boolean;
  completedAt: string;
  nearTransferExerciseId?: string | null;
  farTransferExerciseId?: string | null;
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
  conceptCode?: string;
  title: string;
  description: string;
  beginnerNote?: string;
  status: ModuleStatus;
  progress: number;
  xpReward?: number;
  accent?: "cyan" | "mint" | "lilac" | "pink" | "yellow" | "white";
  icon?: string;
  misconception?: Misconception;
  displayOrder?: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  questType?: string;
  status: QuestStatus;
  progress?: number;
  completedAt?: string | null;
  accent?: "cyan" | "mint" | "lilac" | "pink" | "yellow";
  icon?: string;
}

export interface QuestCompletion {
  quest: Quest;
  learnerXp: number;
  xpAwarded: number;
}

export interface ConceptProgress {
  conceptId: string;
  concept: string;
  status: ConceptStatus;
  masteryScore: number;
  evidenceCount: number;
  lastMisconceptionCode?: string | null;
  updatedAt: string;
}

export interface ProgressResponse {
  learnerId: string;
  concepts: ConceptProgress[];
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

export interface ModelMetrics {
  id: string;
  name: string;
  datasetVersion: string;
  metrics: Record<string, unknown>;
  createdAt: string;
}

export interface ApiErrorShape {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
}

export interface PredictionItem {
  id: number;
  misconception: string;
  score: number;
}

export interface InterventionDetail {
  title: string;
  explanation: string;
  example: string;
  check: string;
}

export interface ReassessmentResult {
  status: "resolved" | "unresolved" | "uncertain";
  misconception_id: number;
}

export interface AlternativeItem {
  misconception_id?: number;
  misconception: string;
  confidence?: "high" | "medium" | "low" | string;
  score?: number;
  id?: number;
}

export interface MLDiagnoseResponse {
  misconception_id?: number;
  misconception?: string;
  confidence?: "high" | "medium" | "low" | string;
  evidence?: string;
  alternatives?: AlternativeItem[];
  model_confident?: boolean;
  top_prediction?: PredictionItem;
  intervention?: InterventionDetail;
  reassessment?: ReassessmentResult | null;
}
