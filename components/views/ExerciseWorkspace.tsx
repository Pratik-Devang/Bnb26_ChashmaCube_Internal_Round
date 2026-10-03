"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { RangeInterventionGame, type InterventionContent } from "@/components/exercise/RangeInterventionGame";
import { Icon } from "@/components/ui/Icon";
import {
  ApiError,
  completeIntervention,
  diagnoseCode,
  getExercise,
  requestDiagnosis,
  submitAttempt,
  submitReassessment,
} from "@/lib/api";
import { createPythonCodeRunner, type PythonCodeRunner } from "@/lib/code-runner";
import type {
  AttemptResponse,
  AttemptType,
  DiagnosisResponse,
  Exercise,
  MLDiagnoseResponse,
  TestResults,
} from "@/types/learning";

export type WorkspacePhase =
  | "loading"
  | "editing"
  | "running"
  | "tests-ready"
  | "submitting"
  | "diagnosed"
  | "intervention"
  | "reassessing"
  | "resolved"
  | "error";

interface Props {
  exerciseId: string;
}

export function ExerciseWorkspace({ exerciseId }: Props) {
  const router = useRouter();

  // Exercise & Editor state
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [code, setCode] = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");
  const [phase, setPhase] = useState<WorkspacePhase>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Runner & Submission results
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<AttemptResponse | null>(null);
  const [diagnosisResponse, setDiagnosisResponse] = useState<DiagnosisResponse | null>(null);
  const [mlDiagnosis, setMlDiagnosis] = useState<MLDiagnoseResponse | null>(null);
  const [previousMisconceptionId, setPreviousMisconceptionId] = useState<number | null>(null);
  const [activeInterventionId, setActiveInterventionId] = useState<string | null>(null);

  // Workflow tracking
  const [reassessmentType, setReassessmentType] = useState<AttemptType>("INITIAL");
  const [parentAttemptId, setParentAttemptId] = useState<string | null>(null);
  const [activeInterventionContent, setActiveInterventionContent] = useState<InterventionContent | null>(null);

  // Runner ref
  const runnerRef = useRef<PythonCodeRunner | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const diagnosisSectionRef = useRef<HTMLDivElement | null>(null);

  // Initialize runner
  useEffect(() => {
    const runner = createPythonCodeRunner();
    runnerRef.current = runner;
    runner.initialize().catch(() => {
      // Background init; fallback runner will be used if Pyodide fails
    });
    return () => {
      runner.terminate();
    };
  }, []);

  // Fetch exercise data
  const loadExercise = useCallback(async (id: string) => {
    setPhase("loading");
    setErrorMessage(null);
    setTestResults(null);
    setDiagnosisResponse(null);
    try {
      const data = await getExercise(id);
      setExercise(data);
      setCode(data.starterCode);
      setPhase("editing");

      // Infer attempt type if this is a transfer challenge
      const exType = String(data.exerciseType).toUpperCase();
      if (exType === "NEAR_TRANSFER" || exType === "NEAR-TRANSFER") {
        setReassessmentType("NEAR_TRANSFER");
      } else if (exType === "FAR_TRANSFER" || exType === "FAR-TRANSFER") {
        setReassessmentType("FAR_TRANSFER");
      } else {
        setReassessmentType("INITIAL");
      }
    } catch (err) {
      setPhase("error");
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to load exercise. Please verify the API server is reachable.");
      }
    }
  }, []);

  useEffect(() => {
    loadExercise(exerciseId);
  }, [exerciseId, loadExercise]);

  // Code editor keyboard indentation handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const spaces = "    ";

      if (!e.shiftKey) {
        // Insert 4 spaces
        const nextCode = code.substring(0, start) + spaces + code.substring(end);
        setCode(nextCode);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
          }
        });
      } else {
        // Dedent current line
        const lineStart = code.lastIndexOf("\n", start - 1) + 1;
        if (code.substring(lineStart, lineStart + 4) === spaces) {
          const nextCode = code.substring(0, lineStart) + code.substring(lineStart + 4);
          setCode(nextCode);
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = Math.max(lineStart, start - 4);
            }
          });
        }
      }
    }
  };

  const handleResetStarter = () => {
    if (exercise) {
      setCode(exercise.starterCode);
    }
  };

  // Run tests strictly inside browser Web Worker
  const handleRunTests = async () => {
    if (!exercise || !runnerRef.current) return;
    setPhase("running");
    setErrorMessage(null);

    try {
      const results = await runnerRef.current.run({
        code,
        testCases: exercise.testCases,
        timeoutMs: 4000,
      });
      setTestResults(results);
      setPhase("tests-ready");
    } catch (err) {
      setPhase("editing");
      setErrorMessage(err instanceof Error ? err.message : "Code execution failed.");
    }
  };

  // Submit attempt and request diagnosis
  const handleSubmit = async () => {
    if (!exercise) return;
    setPhase("submitting");
    setErrorMessage(null);

    try {
      let currentTestResults = testResults;
      if (!currentTestResults && runnerRef.current) {
        try {
          currentTestResults = await runnerRef.current.run({
            code,
            testCases: exercise.testCases,
            timeoutMs: 4000,
          });
          setTestResults(currentTestResults);
        } catch {
          // ignore runner error if pure ML diagnosis is requested
        }
      }

      // Call ML model /diagnose endpoint
      let mlResult: MLDiagnoseResponse | null = null;
      try {
        mlResult = await diagnoseCode(code, previousMisconceptionId);
        setMlDiagnosis(mlResult);
        if (mlResult?.top_prediction?.id) {
          setPreviousMisconceptionId(mlResult.top_prediction.id);
        }
      } catch (mlErr) {
        console.warn("ML diagnosis service unreachable or error:", mlErr);
      }

      if (reassessmentType === "INITIAL" || !activeInterventionId) {
        // Standard initial attempt submission
        const attempt = await submitAttempt({
          learnerId: "learner-demo",
          exerciseId: exercise.id,
          submittedCode: code,
          learnerExplanation: explanation.trim() || undefined,
          attemptType: "INITIAL",
          testResults: currentTestResults || { passed: 0, failed: 0, cases: [] },
        });
        setActiveAttempt(attempt);
        setParentAttemptId(attempt.id);

        const diagnosis = await requestDiagnosis(attempt.id);
        setDiagnosisResponse(diagnosis);
        setActiveInterventionId(diagnosis.intervention.id);
        if (diagnosis.intervention.content) {
          setActiveInterventionContent(diagnosis.intervention.content as unknown as InterventionContent);
        }
        setPhase("diagnosed");

        // Focus diagnosis section for accessibility
        setTimeout(() => {
          diagnosisSectionRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        // Reassessment submission (Near or Far Transfer)
        const reassessResponse = await submitReassessment({
          learnerId: "learner-demo",
          exerciseId: exercise.id,
          submittedCode: code,
          learnerExplanation: explanation.trim() || undefined,
          attemptType: reassessmentType,
          parentAttemptId: parentAttemptId || undefined,
          interventionId: activeInterventionId,
          testResults,
        });
        setDiagnosisResponse(reassessResponse);

        if (
          (reassessmentType === "FAR_TRANSFER" && reassessResponse.conceptStatus === "RESOLVED") ||
          mlResult?.reassessment?.status === "resolved"
        ) {
          setPhase("resolved");
        } else {
          setPhase("diagnosed");
        }

        setTimeout(() => {
          diagnosisSectionRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (err) {
      setPhase("tests-ready");
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Submission failed. Please check your network connection and retry.");
      }
    }
  };

  // Launch targeted intervention mini-game
  const handleStartIntervention = () => {
    setPhase("intervention");
  };

  // Complete intervention mini-game
  const handleCompleteIntervention = async () => {
    if (!activeInterventionId) return;
    const result = await completeIntervention(activeInterventionId, "learner-demo");
    if (result.nearTransferExerciseId) {
      setActiveInterventionContent((prev) => ({
        type: prev?.type ?? "RANGE_PATH_GAME",
        title: prev?.title ?? "Help Byte reach the final tile",
        ...prev,
        nearTransferExerciseId: result.nearTransferExerciseId ?? undefined,
        farTransferExerciseId: result.farTransferExerciseId ?? undefined,
      }));
    }
  };

  // Transition to next reassessment exercise
  const handleContinueToReassessment = (nextExId: string, type: AttemptType) => {
    setReassessmentType(type);
    router.push(`/learn/${nextExId}`);
  };

  // Render loading state
  if (phase === "loading") {
    return (
      <main className="route-page exercise-page" aria-busy="true">
        <div className="surface-card loading-card">
          <div className="spinner" aria-hidden="true" />
          <p>Loading exercise workspace...</p>
        </div>
      </main>
    );
  }

  // Render error state
  if (phase === "error" || !exercise) {
    return (
      <main className="route-page exercise-page">
        <div className="surface-card error-card" role="alert">
          <Icon name="brain" />
          <h2>Exercise Unavailable</h2>
          <p>{errorMessage || "The requested exercise could not be loaded."}</p>
          <div className="error-actions">
            <button type="button" className="solid-action" onClick={() => loadExercise(exerciseId)}>
              <Icon name="check" /> Try again
            </button>
            <Link href="/learn" className="quiet-action">
              Return to learning path
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const allPassed = testResults && testResults.failed === 0 && testResults.passed > 0;
  const isDiagnosedCorrect = diagnosisResponse?.diagnosis.misconceptionCode === "CORRECT";
  const isDiagnosedUncertain = diagnosisResponse?.diagnosis.misconceptionCode === "UNCERTAIN";
  const lineCount = code.split("\n").length;

  return (
    <main className="route-page exercise-page">
      {/* Exercise Header */}
      <header className="page-heading">
        <div>
          <div className="exercise-crumbs">
            <Link href="/learn" className="quiet-action back-crumb">
              <Icon name="chevron" /> Learning path
            </Link>
            <span className="crumb-sep">/</span>
            <span className="crumb-badge tone-lilac">{exercise.difficulty}</span>
            <span className="crumb-badge tone-cyan">{String(exercise.exerciseType).replace("_", " ")}</span>
          </div>
          <h1>{exercise.title}</h1>
          <p>{exercise.prompt}</p>
        </div>
        <div className="exercise-actions-top">
          <span className="status-announcer" aria-live="polite">
            {phase === "running" ? "Running tests safely in browser..." : ""}
            {phase === "submitting" ? "Submitting attempt for diagnosis..." : ""}
          </span>
        </div>
      </header>

      {/* Main 2-column workspace layout */}
      <div className="exercise-layout">
        {/* Left Column: Code Editor & Reasoning */}
        <section className="editor-column" aria-label="Code editor">
          <div className="editor-toolbar">
            <div className="editor-tab-label">
              <Icon name="book" /> solution.py
            </div>
            <button
              type="button"
              className="quiet-action"
              onClick={handleResetStarter}
              title="Reset code to starter template"
              disabled={phase === "running" || phase === "submitting"}
            >
              Reset code
            </button>
          </div>

          <div className="editor-wrapper">
            <div className="editor-line-numbers" aria-hidden="true">
              {Array.from({ length: Math.max(lineCount, 6) }, (_, i) => (
                <span key={i + 1}>{i + 1}</span>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              className="code-editor-textarea"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              aria-label="Python code editor. Press Tab to indent by 4 spaces, Shift+Tab to dedent."
              disabled={phase === "running" || phase === "submitting"}
            />
          </div>

          {/* Reasoning Input */}
          <div className="reasoning-box">
            <label htmlFor="learner-explanation">
              <strong>Explain your reasoning (optional)</strong>
              <span>Helps Re:Learn understand the thinking behind your approach.</span>
            </label>
            <textarea
              id="learner-explanation"
              className="reasoning-textarea"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="e.g., I used range(1, n) because I wanted to visit each number from 1 to n..."
              rows={2}
              disabled={phase === "running" || phase === "submitting"}
            />
          </div>

          {/* Editor Action Buttons */}
          <div className="editor-actions-bar">
            <button
              type="button"
              className="solid-action"
              onClick={handleRunTests}
              disabled={phase === "running" || phase === "submitting"}
              aria-busy={phase === "running"}
            >
              <Icon name="play" />
              {phase === "running" ? "Running tests..." : "Run predefined tests"}
            </button>

            <button
              type="button"
              className="solid-action submit-action"
              onClick={handleSubmit}
              disabled={!code.trim() || phase === "running" || phase === "submitting"}
              aria-busy={phase === "submitting"}
            >
              <Icon name="check" />
              {phase === "submitting" ? "Analyzing..." : "Submit for diagnosis"}
            </button>
          </div>

          {errorMessage ? (
            <div className="action-error-banner" role="alert">
              <Icon name="brain" /> {errorMessage}
            </div>
          ) : null}
        </section>

        {/* Right Column: Predefined Tests, Diagnosis & Interventions */}
        <aside className="results-column" aria-label="Tests and diagnosis results">
          {/* Test Results Card */}
          <div className="surface-card test-results-card">
            <div className="results-header">
              <h3>Predefined Tests</h3>
              {testResults ? (
                <span className={`results-badge ${allPassed ? "badge-pass" : "badge-fail"}`}>
                  {testResults.passed} / {testResults.passed + testResults.failed} passed
                </span>
              ) : (
                <span className="results-badge badge-idle">Ready to run</span>
              )}
            </div>

            <div className="test-cases-list">
              {exercise.testCases.map((tc, idx) => {
                const resultCase = testResults?.cases[idx];
                const inputDisplay = tc.args ? tc.args.map((a) => JSON.stringify(a)).join(", ") : JSON.stringify(tc.input);

                return (
                  <article
                    key={idx}
                    className={`test-case-item ${
                      resultCase ? (resultCase.passed ? "case-passed" : "case-failed") : "case-pending"
                    }`}
                  >
                    <div className="case-status-indicator">
                      {resultCase ? (
                        resultCase.passed ? (
                          <span className="icon-pass" title="Passed">✓</span>
                        ) : (
                          <span className="icon-fail" title="Failed">✕</span>
                        )
                      ) : (
                        <span className="icon-pending">·</span>
                      )}
                    </div>
                    <div className="case-content">
                      <div className="case-call">
                        <code>input: ({inputDisplay})</code>
                      </div>
                      <div className="case-values">
                        <small>Expected: <code>{JSON.stringify(tc.expected)}</code></small>
                        {resultCase?.actual !== undefined ? (
                          <small>
                            Actual:{" "}
                            <code className={resultCase.passed ? "code-pass" : "code-fail"}>
                              {JSON.stringify(resultCase.actual)}
                            </code>
                          </small>
                        ) : null}
                        {resultCase?.error ? (
                          <small className="case-error-msg">Error: {resultCase.error}</small>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Diagnosis Card (visible once diagnosed) */}
          {diagnosisResponse && phase !== "intervention" && phase !== "resolved" ? (
            <div ref={diagnosisSectionRef} className="surface-card diagnosis-card" aria-label="AI diagnosis">
              <header className="diagnosis-card-header">
                <span className="page-eyebrow">DIAGNOSIS RESULT</span>
                <h2>{diagnosisResponse.diagnosis.learnerFriendlyName}</h2>
                <p className="diagnosis-summary">{diagnosisResponse.diagnosis.summary}</p>
              </header>

              {/* Evidence details */}
              {diagnosisResponse.diagnosis.evidence.length > 0 ? (
                <div className="diagnosis-evidence-box">
                  <span className="evidence-title">What we observed:</span>
                  <ul>
                    {diagnosisResponse.diagnosis.evidence.map((ev, i) => (
                      <li key={i}>
                        {ev.line ? <strong>Line {ev.line}: </strong> : null}
                        <span>{ev.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* ML Model Diagnosis & Targeted Intervention */}
              {mlDiagnosis ? (
                <div className="ml-diagnosis-panel" style={{ marginTop: "1rem", padding: "1rem", borderRadius: "8px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span className="crumb-badge tone-lilac" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                      ML CLASSIFIER (ID #{mlDiagnosis.top_prediction.id})
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                      Score: {mlDiagnosis.top_prediction.score}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#f3f4f6", marginBottom: "0.25rem" }}>
                    {mlDiagnosis.intervention.title}
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#d1d5db", marginBottom: "0.75rem" }}>
                    {mlDiagnosis.top_prediction.misconception}
                  </p>

                  <div style={{ background: "rgba(0, 0, 0, 0.25)", padding: "0.75rem", borderRadius: "6px", marginBottom: "0.75rem", borderLeft: "3px solid #8b5cf6" }}>
                    <p style={{ fontSize: "0.85rem", color: "#e5e7eb", margin: 0, marginBottom: "0.4rem" }}>
                      <strong>Intervention:</strong> {mlDiagnosis.intervention.explanation}
                    </p>
                    <div style={{ fontSize: "0.8rem", color: "#a78bfa", fontFamily: "monospace", marginBottom: "0.3rem" }}>
                      Example: <code>{mlDiagnosis.intervention.example}</code>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#93c5fd" }}>
                      💡 <em>{mlDiagnosis.intervention.check}</em>
                    </div>
                  </div>

                  {mlDiagnosis.alternatives && mlDiagnosis.alternatives.length > 0 ? (
                    <details style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.75rem" }}>
                      <summary style={{ cursor: "pointer" }}>Alternative diagnoses ({mlDiagnosis.alternatives.length})</summary>
                      <ul style={{ paddingLeft: "1.2rem", marginTop: "0.4rem" }}>
                        {mlDiagnosis.alternatives.map((alt) => (
                          <li key={alt.id} style={{ marginBottom: "0.25rem" }}>
                            <strong>ID #{alt.id}</strong> (score {alt.score}): {alt.misconception}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}

                  {mlDiagnosis.reassessment ? (
                    <div style={{ padding: "0.5rem", borderRadius: "4px", background: mlDiagnosis.reassessment.status === "resolved" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", color: mlDiagnosis.reassessment.status === "resolved" ? "#34d399" : "#f87171", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                      Reassessment status: <strong>{mlDiagnosis.reassessment.status.toUpperCase()}</strong> (Previous Misconception ID: #{mlDiagnosis.reassessment.misconception_id})
                    </div>
                  ) : null}

                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                    <button
                      type="button"
                      className="solid-action"
                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                      onClick={() => {
                        setPhase("editing");
                        textareaRef.current?.focus();
                      }}
                    >
                      <Icon name="check" /> Try Again / Reassess
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Action according to diagnosis result */}
              <div className="diagnosis-action-area">
                {isDiagnosedCorrect ? (
                  <div className="correct-feedback">
                    <span className="correct-check">✓</span>
                    <div>
                      <strong>Concept understanding verified!</strong>
                      <p>Your loop logic correctly handles the required start, stop, and step rules.</p>
                      {diagnosisResponse.reassessmentExerciseId ? (
                        <button
                          type="button"
                          className="solid-action"
                          onClick={() =>
                            handleContinueToReassessment(
                              diagnosisResponse.reassessmentExerciseId!,
                              reassessmentType === "INITIAL" ? "NEAR_TRANSFER" : "FAR_TRANSFER"
                            )
                          }
                        >
                          <Icon name="play" /> Continue to transfer challenge
                        </button>
                      ) : (
                        <Link href="/learn" className="solid-action">
                          <Icon name="check" /> Return to learning path
                        </Link>
                      )}
                    </div>
                  </div>
                ) : isDiagnosedUncertain ? (
                  <div className="uncertain-feedback">
                    <p>
                      We didn’t detect a standard known misconception pattern, but some tests are not passing.
                      Review your loop syntax and variable names, then click <strong>Run predefined tests</strong> again.
                    </p>
                  </div>
                ) : (
                  <div className="intervention-prompt">
                    <p>
                      A quick 2-minute targeted mini-game will help this idea click before you retry.
                    </p>
                    <button
                      type="button"
                      className="solid-action"
                      onClick={handleStartIntervention}
                    >
                      <Icon name="brain" /> Start targeted mini-game
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Intervention Mini-Game (Active Phase) */}
          {phase === "intervention" && diagnosisResponse ? (
            <RangeInterventionGame
              interventionId={diagnosisResponse.intervention.id}
              content={
                activeInterventionContent ||
                (diagnosisResponse.intervention.content as unknown as InterventionContent) || {
                  type: "RANGE_PATH_GAME",
                  title: diagnosisResponse.intervention.title,
                  nearTransferExerciseId: diagnosisResponse.reassessmentExerciseId || "list-traversal-04",
                }
              }
              onComplete={handleCompleteIntervention}
              onContinueToTransfer={(nextExId) => {
                handleContinueToReassessment(nextExId, "NEAR_TRANSFER");
              }}
            />
          ) : null}

          {/* Concept Resolved Banner */}
          {phase === "resolved" ? (
            <div className="surface-card resolved-card" role="alert">
              <span className="resolved-trophy" role="img" aria-label="Trophy">
                🏆
              </span>
              <h2>Concept Resolved!</h2>
              <p>
                Congratulations! You’ve demonstrated mastery across initial practice, the targeted intervention,
                and both near- and far-transfer challenges.
              </p>
              <div className="resolved-rewards">
                <span className="reward-chip">+150 XP</span>
                <span className="reward-chip">Quest: Transfer challenge complete</span>
              </div>
              <Link href="/learn" className="solid-action">
                <Icon name="check" /> View updated learning path
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
