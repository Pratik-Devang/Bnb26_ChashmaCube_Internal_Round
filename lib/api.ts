import {
  conceptStates,
  exerciseCatalog,
  learner,
  learningModules,
  mockDiagnosisResponse,
  mockIntervention,
  quests as initialQuests,
  statistics,
} from "./mock-data";
import { accountApiBase, currentLearnerId } from "./account";
import type {
  AttemptRequest,
  AttemptResponse,
  DiagnosisResponse,
  Exercise,
  Intervention,
  InterventionCompletion,
  LearnerConceptState,
  LearningPlanResponse,
  MLDiagnoseResponse,
  ModelMetrics,
  Quest,
  QuestCompletion,
  ReassessmentRequest,
} from "@/types/learning";

/**
 * Custom typed error class for API errors.
 */
export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: Record<string, unknown> | null;

  constructor(message: string, code = "API_ERROR", status = 500, details?: Record<string, unknown> | null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/** Base URL for the FastAPI service. When omitted or blank, mock mode is active. */
export const NEXT_PUBLIC_API_BASE_URL = accountApiBase;

// Account data must never fall back to the shared demo learner.
const isMockMode = false;

const mockDelay = <T,>(value: T, delayMs = 180): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), delayMs));

let mockQuestsState = [...initialQuests];
let mockLastAttemptCode = "";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

async function apiFetch<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const base = normalizeBaseUrl(NEXT_PUBLIC_API_BASE_URL);
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${base}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Learner-Id": currentLearnerId(),
        ...init?.headers,
      },
    });
  } catch (error) {
    throw new ApiError(
      `Network error: unable to reach Re:Learn API at ${base}. Please ensure the server is running.`,
      "NETWORK_ERROR",
      0,
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }

  const rawText = await response.text();
  let json: unknown = null;
  try {
    json = rawText ? JSON.parse(rawText) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event("relearn:session-expired"));
    if (json && typeof json === "object") {
      const data = json as Record<string, unknown>;
      if (typeof data.code === "string" && typeof data.message === "string") {
        throw new ApiError(
          data.message,
          data.code,
          response.status,
          (data.details as Record<string, unknown>) ?? null
        );
      }
      if (data.detail) {
        if (typeof data.detail === "string") {
          throw new ApiError(data.detail, "HTTP_ERROR", response.status);
        }
        if (typeof data.detail === "object" && data.detail !== null) {
          const detailObj = data.detail as Record<string, unknown>;
          if (typeof detailObj.message === "string") {
            throw new ApiError(
              detailObj.message,
              typeof detailObj.code === "string" ? detailObj.code : "HTTP_ERROR",
              response.status,
              detailObj.details as Record<string, unknown>
            );
          }
        }
        throw new ApiError(
          "Request validation failed.",
          "VALIDATION_ERROR",
          response.status,
          { detail: data.detail }
        );
      }
    }
    throw new ApiError(
      rawText || `Request failed with status ${response.status}`,
      "HTTP_ERROR",
      response.status
    );
  }

  if (init?.method === "POST" && typeof window !== "undefined") window.dispatchEvent(new Event("relearn:account-updated"));
  return json as T;
}

export async function getLearningPlan(learnerId = currentLearnerId()): Promise<LearningPlanResponse> {
  if (isMockMode) {
    return mockDelay({
      learner,
      modules: learningModules,
      quests: mockQuestsState,
      statistics,
    });
  }
  const plan = await apiFetch<LearningPlanResponse>(`/api/v1/learning-plan?learnerId=${encodeURIComponent(learnerId)}`);
  return {
    ...plan,
    modules: plan.modules.map((item) => ({ ...item, status: String(item.status) === "RESOLVED" ? "completed" : ["IMPROVING", "NEEDS_PRACTICE"].includes(String(item.status)) ? "active" : "upcoming" })),
    quests: plan.quests.map((item) => ({ ...item, status: String(item.status).toLowerCase() as Quest["status"] })),
  };
}

export async function getExercise(exerciseId: string): Promise<Exercise> {
  if (isMockMode) {
    const found = exerciseCatalog[exerciseId];
    if (!found) {
      throw new ApiError(`Exercise '${exerciseId}' was not found in mock catalog.`, "EXERCISE_NOT_FOUND", 404);
    }
    return mockDelay({ ...found });
  }
  return apiFetch<Exercise>(`/api/v1/exercises/${encodeURIComponent(exerciseId)}`);
}

export async function submitAttempt(payload: AttemptRequest): Promise<AttemptResponse> {
  if (isMockMode) {
    mockLastAttemptCode = payload.submittedCode;
    return mockDelay({
      id: `attempt-mock-${Date.now()}`,
      learnerId: payload.learnerId,
      exerciseId: payload.exerciseId,
      attemptType: payload.attemptType ?? "INITIAL",
      parentAttemptId: payload.parentAttemptId ?? null,
      createdAt: new Date().toISOString(),
    });
  }
  return apiFetch<AttemptResponse>("/api/v1/attempts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function requestDiagnosis(attemptId: string): Promise<DiagnosisResponse> {
  if (isMockMode) {
    const code = mockLastAttemptCode;
    const isPassing = !code.includes("range(1, n)") && (code.includes("range(1, n + 1)") || code.includes("range(1, n+1)") || code.includes("for x in values") || code.includes("range(step, n + 1"));
    if (isPassing) {
      return mockDelay({
        attemptId,
        diagnosis: {
          id: `diagnosis-pass-${Date.now()}`,
          misconceptionCode: "CORRECT",
          learnerFriendlyName: "Ready for the next step",
          confidence: 0.99,
          summary: "Your solution passed every test successfully!",
          evidence: [{ type: "test", message: "All test cases produced the expected result." }],
          classProbabilities: { CORRECT: 0.99 },
          modelVersion: "rule-based-mock-v1",
        },
        intervention: mockIntervention,
        reassessmentExerciseId: "list-traversal-04",
        conceptStatus: "IMPROVING",
      });
    }

    const hasBoundaryBug = /range\s*\(\s*1\s*,\s*n\s*\)/.test(code);
    if (hasBoundaryBug) {
      return mockDelay({
        ...mockDiagnosisResponse,
        attemptId,
      });
    }

    return mockDelay({
      attemptId,
      diagnosis: {
        id: `diagnosis-unc-${Date.now()}`,
        misconceptionCode: "UNCERTAIN",
        learnerFriendlyName: "Let’s look a little closer",
        confidence: 0.0,
        summary: "No standard misconception pattern was detected in your code. Review your loop boundaries.",
        evidence: [{ type: "code", message: "Inspect your loop initialization, range, or update condition." }],
        classProbabilities: { UNCERTAIN: 1.0 },
        modelVersion: "rule-based-mock-v1",
      },
      intervention: mockIntervention,
      reassessmentExerciseId: "list-traversal-04",
      conceptStatus: "NEEDS_PRACTICE",
    });
  }
  return apiFetch<DiagnosisResponse>(`/api/v1/attempts/${encodeURIComponent(attemptId)}/diagnose`, {
    method: "POST",
  });
}

export async function getDiagnosis(diagnosisId: string): Promise<DiagnosisResponse> {
  if (isMockMode) {
    return mockDelay({ ...mockDiagnosisResponse });
  }
  return apiFetch<DiagnosisResponse>(`/api/v1/diagnoses/${encodeURIComponent(diagnosisId)}`);
}

export async function selectIntervention(diagnosisId: string): Promise<Intervention> {
  if (isMockMode) {
    return mockDelay({ ...mockIntervention, diagnosisId });
  }
  return apiFetch<Intervention>(`/api/v1/diagnoses/${encodeURIComponent(diagnosisId)}/intervention`, {
    method: "POST",
  });
}

export async function completeIntervention(
  interventionId: string,
  learnerId = currentLearnerId()
): Promise<InterventionCompletion> {
  if (isMockMode) {
    return mockDelay({
      interventionId,
      completed: true,
      completedAt: new Date().toISOString(),
      nearTransferExerciseId: "list-traversal-04",
      farTransferExerciseId: "multiples-through-n-02",
    });
  }
  return apiFetch<InterventionCompletion>(`/api/v1/interventions/${encodeURIComponent(interventionId)}/complete`, {
    method: "POST",
    body: JSON.stringify({ learnerId }),
  });
}

export async function submitReassessment(payload: ReassessmentRequest): Promise<DiagnosisResponse> {
  if (isMockMode) {
    const isFar = payload.attemptType === "FAR_TRANSFER";
    const allPassing = payload.testResults.failed === 0 && payload.testResults.passed > 0;
    const finalStatus = isFar && allPassing ? "RESOLVED" : allPassing ? "IMPROVING" : "NEEDS_PRACTICE";

    return mockDelay({
      attemptId: `attempt-reassess-${Date.now()}`,
      diagnosis: {
        id: `diag-reassess-${Date.now()}`,
        misconceptionCode: allPassing ? "CORRECT" : "RANGE_ENDPOINT_EXCLUDED",
        learnerFriendlyName: allPassing ? "Ready for the next step" : "Boundary bug",
        confidence: 0.96,
        summary: allPassing
          ? isFar
            ? "Outstanding! You proved mastery across both transfer challenges."
            : "Great job! The near-transfer challenge confirmed your understanding."
          : "The loop endpoint still missed the final required value.",
        evidence: allPassing
          ? [{ type: "test", message: "All test cases passed." }]
          : [{ type: "code", message: "Check that the loop range or index covers the end of the collection." }],
        classProbabilities: { CORRECT: allPassing ? 0.98 : 0.05 },
        modelVersion: "rule-based-mock-v1",
      },
      intervention: mockIntervention,
      reassessmentExerciseId: isFar ? null : "multiples-through-n-02",
      conceptStatus: finalStatus,
    });
  }
  return apiFetch<DiagnosisResponse>("/api/v1/reassessments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getLearnerProgress(learnerId = currentLearnerId()): Promise<LearnerConceptState[]> {
  if (isMockMode) {
    return mockDelay(conceptStates);
  }
  const response = await apiFetch<{
    learnerId: string;
    concepts: {
      conceptId: string;
      concept: string;
      status: string;
      masteryScore: number;
      evidenceCount: number;
      lastMisconceptionCode?: string | null;
      updatedAt: string;
    }[];
  }>(`/api/v1/learners/${encodeURIComponent(learnerId)}/progress`);

  return response.concepts.map((item) => {
    const stateStr = item.status.toLowerCase().replace("_", "-") as LearnerConceptState["state"];
    return {
      id: item.conceptId,
      concept: item.concept,
      state: stateStr,
      mastery: Math.round(item.masteryScore * 100),
      friendlyDescription: `Mastery at ${Math.round(item.masteryScore * 100)}% (${item.evidenceCount} attempts)`,
      misconception: (item.lastMisconceptionCode as LearnerConceptState["misconception"]) ?? "CORRECT",
    };
  });
}

export async function getQuests(learnerId = currentLearnerId()): Promise<Quest[]> {
  if (isMockMode) {
    return mockDelay(mockQuestsState);
  }
  return apiFetch<Quest[]>(`/api/v1/learners/${encodeURIComponent(learnerId)}/quests`);
}

export async function completeQuest(questId: string, learnerId = currentLearnerId()): Promise<QuestCompletion> {
  if (isMockMode) {
    const quest = mockQuestsState.find((item) => item.id === questId);
    if (!quest) throw new ApiError(`Quest '${questId}' not found`, "QUEST_NOT_FOUND", 404);
    quest.status = "completed";
    return mockDelay({
      quest: { ...quest, status: "completed" },
      learnerXp: learner.xp + quest.xpReward,
      xpAwarded: quest.xpReward,
    });
  }
  return apiFetch<QuestCompletion>(`/api/v1/quests/${encodeURIComponent(questId)}/complete`, {
    method: "POST",
    body: JSON.stringify({ learnerId }),
  });
}

export async function getModelMetrics(): Promise<ModelMetrics> {
  if (isMockMode) {
    return mockDelay({
      id: "model-rule-demo-v1",
      name: "rule-based-demo-v1",
      datasetVersion: "baseline-curated",
      metrics: { kind: "deterministic-integration-provider", accuracy: 0.96 },
      createdAt: new Date().toISOString(),
    });
  }
  return apiFetch<ModelMetrics>("/api/v1/model/metrics");
}

export async function diagnoseCode(
  code: string,
  previousMisconceptionId?: number | null
): Promise<MLDiagnoseResponse> {
  const targetBase = NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const url = `${normalizeBaseUrl(targetBase)}/diagnose`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        code,
        previous_misconception_id: previousMisconceptionId ?? undefined,
      }),
    });

    if (res.ok) {
      return (await res.json()) as MLDiagnoseResponse;
    }
  } catch {
    // Backend fetch failed, proceed to fallback mock
  }

  // Fallback prediction if server is offline
  const isParens = code.includes("return(") || code.includes("return (");
  const topId = isParens ? 31 : 15;
  const isResolved =
    previousMisconceptionId !== null &&
    previousMisconceptionId !== undefined &&
    topId !== previousMisconceptionId;

  return mockDelay({
    top_prediction: {
      id: topId,
      misconception: isParens
        ? "Student believes that the `return` statement requires parentheses around its argument."
        : "Student believes Python sequences use 1-based indexing instead of 0-based indexing.",
      score: isParens ? 0.305 : 0.28,
    },
    alternatives: [
      {
        id: 56,
        misconception: "Student uses incorrect argument count or mismatches positional and keyword arguments.",
        score: -0.527,
      },
      {
        id: 46,
        misconception: "Student misplaces indentation causing block association errors.",
        score: -0.835,
      },
    ],
    intervention: isParens
      ? {
          title: "Understanding return statements",
          explanation: "In Python, parentheses are not required around the value returned by a function.",
          example: "return a + b",
          check: "Try rewriting the return statement without parentheses.",
        }
      : {
          title: "Python uses zero-based indexing",
          explanation: "The first element of a Python list is at index 0, not index 1.",
          example: "numbers[0]",
          check: "Which index accesses the first element?",
        },
    reassessment:
      previousMisconceptionId !== null && previousMisconceptionId !== undefined
        ? {
            status: isResolved ? "resolved" : "unresolved",
            misconception_id: previousMisconceptionId,
          }
        : null,
  });
}

