import {
  activeExercise,
  conceptStates,
  learner,
  learningModules,
  mockDiagnosisResponse,
  quests,
  statistics,
} from "./mock-data";
import type {
  AttemptRequest,
  AttemptResponse,
  DiagnosisResponse,
  Exercise,
  LearnerConceptState,
  LearningPlanResponse,
  Quest,
  ReassessmentRequest,
} from "@/types/learning";

/** Base URL for the future FastAPI service. Components should only call this module. */
export const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const mockDelay = <T,>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), 180));

export async function getLearningPlan(): Promise<LearningPlanResponse> {
  return mockDelay({ learner, modules: learningModules, quests, statistics });
}

export async function getExercise(exerciseId: string): Promise<Exercise> {
  return mockDelay({ ...activeExercise, id: exerciseId });
}

export async function submitAttempt(payload: AttemptRequest): Promise<AttemptResponse> {
  return mockDelay({
    id: "attempt-demo",
    learnerId: payload.learnerId,
    exerciseId: payload.exerciseId,
    createdAt: new Date().toISOString(),
  });
}

export async function requestDiagnosis(attemptId: string): Promise<DiagnosisResponse> {
  return mockDelay({ ...mockDiagnosisResponse, attemptId });
}

export async function getLearnerProgress(_learnerId: string): Promise<LearnerConceptState[]> {
  return mockDelay(conceptStates);
}

export async function completeIntervention(interventionId: string): Promise<{ interventionId: string; completed: true }> {
  return mockDelay({ interventionId, completed: true });
}

export async function submitReassessment(payload: ReassessmentRequest): Promise<DiagnosisResponse> {
  return mockDelay({ ...mockDiagnosisResponse, attemptId: `reassessment-${payload.exerciseId}` });
}

export async function getQuests(_learnerId: string): Promise<Quest[]> {
  return mockDelay(quests);
}

export async function completeQuest(questId: string): Promise<Quest> {
  const quest = quests.find((item) => item.id === questId);
  if (!quest) throw new Error("Quest not found");
  return mockDelay({ ...quest, status: "completed" });
}
