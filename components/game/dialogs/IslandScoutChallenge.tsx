"use client";

import { useEffect, useRef, useState } from "react";
import { getExercise, requestDiagnosis, submitAttempt } from "@/lib/api";
import { currentLearnerId } from "@/lib/account";
import { createPythonCodeRunner, type PythonCodeRunner } from "@/lib/code-runner";
import type { DiagnosisResponse, Exercise, TestResults } from "@/types/learning";
import styles from "../GameWorld.module.css";

type Props = {
  exerciseId: string;
  title: string;
  reward: number;
  alreadyCompleted: boolean;
  onClose: () => void;
  onComplete: () => void;
};

type ScoutGuidance = {
  title: string;
  explanation: string;
  example?: string;
  check?: string;
  source: "journal" | "tests";
};

const recommendedCode: Partial<Record<DiagnosisResponse["diagnosis"]["misconceptionCode"], string>> = {
  WRONG_INITIALIZATION: "return score + 10",
  WRONG_OR_MISSING_UPDATE: "return score + 10",
  VARIABLE_ROLE_CONFUSION: "return score + 10",
};

function guidanceFromDiagnosis(result: DiagnosisResponse): ScoutGuidance | null {
  const diagnosis = result.diagnosis;
  if (diagnosis.misconceptionCode === "CORRECT") return null;
  if (diagnosis.misconceptionCode === "UNCERTAIN") return null;
  return {
    title: diagnosis.learnerFriendlyName,
    explanation: diagnosis.evidence[0]?.message ?? diagnosis.summary,
    example: recommendedCode[diagnosis.misconceptionCode],
    check: "For each test, start with its input score and confirm the result is exactly 10 higher.",
    source: "journal",
  };
}

function guidanceFromTests(results: TestResults): ScoutGuidance {
  const failed = results.cases.filter((item) => !item.passed);
  const firstError = failed.find((item) => item.error)?.error;
  if (firstError) return {
    title: "Python could not run this yet",
    explanation: firstError,
    check: "Fix the reported Python error, then ask the Scout to check again.",
    source: "tests",
  };

  const unchanged = failed.length > 0 && failed.every((item) => item.actual === item.args?.[0]);
  if (unchanged) return {
    title: "The score stayed unchanged",
    explanation: "Your function returns the starting score, but the 10-point bonus was never added.",
    example: "return score + 10",
    check: "If score is 7, the function should return 17.",
    source: "tests",
  };

  const constantBonus = failed.length > 0 && failed.every((item) => item.actual === 10);
  if (constantBonus) return {
    title: "Keep the starting score",
    explanation: "Returning only 10 forgets the score supplied to the function. Add the bonus to score.",
    example: "return score + 10",
    check: "Try both score = 0 and score = 7. The answers should be 10 and 17.",
    source: "tests",
  };

  const first = failed[0];
  return {
    title: "One result does not match yet",
    explanation: first
      ? `For input ${JSON.stringify(first.args ?? first.input)}, the Scout expected ${JSON.stringify(first.expected)} but received ${JSON.stringify(first.actual)}.`
      : "The submitted function did not satisfy the challenge tests.",
    example: "return score + 10",
    check: "Use the score parameter in the result and add exactly 10.",
    source: "tests",
  };
}

export function IslandScoutChallenge({ exerciseId, title, reward, alreadyCompleted, onClose, onComplete }: Props) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [code, setCode] = useState("");
  const [results, setResults] = useState<TestResults | null>(null);
  const [diagnosis, setDiagnosis] = useState<ScoutGuidance | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "running" | "passed" | "failed">("loading");
  const [error, setError] = useState("");
  const [syncWarning, setSyncWarning] = useState("");
  const runnerRef = useRef<PythonCodeRunner | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let mounted = true;
    const runner = createPythonCodeRunner();
    runnerRef.current = runner;

    getExercise(exerciseId)
      .then((loaded) => {
        if (!mounted) return;
        setExercise(loaded);
        setCode(loaded.starterCode);
        setStatus("ready");
      })
      .catch((reason: unknown) => {
        if (!mounted) return;
        setError(reason instanceof Error ? reason.message : "The challenge could not be loaded.");
        setStatus("failed");
      });

    return () => {
      mounted = false;
      runner.terminate();
    };
  }, [exerciseId]);

  useEffect(() => {
    closeRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const runChallenge = async () => {
    if (!exercise || !runnerRef.current) return;
    setStatus("running");
    setError("");
    setSyncWarning("");
    setDiagnosis(null);

    try {
      const nextResults = await runnerRef.current.run({ code, testCases: exercise.testCases });
      setResults(nextResults);
      let journalGuidance: ScoutGuidance | null = null;

      try {
        const attempt = await submitAttempt({
          learnerId: currentLearnerId(),
          exerciseId: exercise.id,
          submittedCode: code,
          attemptType: "INITIAL",
          testResults: nextResults,
        });
        const savedDiagnosis = await requestDiagnosis(attempt.id);
        journalGuidance = guidanceFromDiagnosis(savedDiagnosis);
      } catch {
        setSyncWarning("The Scout used the challenge tests, but could not save this attempt to your learning journal.");
      }

      if (nextResults.failed === 0 && nextResults.passed > 0) {
        setStatus("passed");
        if (!alreadyCompleted) onComplete();
        return;
      }

      setDiagnosis(journalGuidance ?? guidanceFromTests(nextResults));
      setStatus("failed");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The Scout could not check that solution.");
      setStatus("failed");
    }
  };

  return (
    <div className={styles.dialogScrim} role="presentation" onMouseDown={onClose}>
      <section
        className={`${styles.dialog} ${styles.challengeDialog}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scout-challenge-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.challengeHeader}>
          <div><span>FINAL ENCOUNTER</span><h2 id="scout-challenge-title">{title}</h2></div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close code challenge">×</button>
        </div>

        <div className={styles.challengeGrid}>
          <div className={styles.challengeEditor}>
            <p>{exercise?.prompt ?? "The Island Scout is preparing your challenge..."}</p>
            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              aria-label="Python solution"
              spellCheck={false}
              disabled={status === "loading" || status === "running"}
            />
            <button type="button" className={styles.primaryAction} onClick={runChallenge} disabled={!exercise || status === "running"}>
              {status === "running" ? "Scout is checking..." : "Submit to the Scout"}
            </button>
          </div>

          <aside className={styles.scoutFeedback}>
            <span>ISLAND SCOUT</span>
            {status === "loading" ? <p>“Let me prepare the trial.”</p> : null}
            {status === "ready" ? <p>“Use everything the island taught you. I’ll inspect the result, not just the final answer.”</p> : null}
            {status === "running" ? <p>“I’m tracing your code now...”</p> : null}
            {status === "passed" ? (
              <div className={styles.challengeSuccess}>
                <strong>Trial complete!</strong>
                <p>Every test passed. You earned {alreadyCompleted ? "another clean run" : `${reward} coins`}.</p>
              </div>
            ) : null}
            {status === "failed" && diagnosis ? (
              <div className={styles.classifierFeedback}>
                <small>{diagnosis.source === "journal" ? "SUPPORTED PATTERN" : "TEST EVIDENCE"}</small>
                <strong>{diagnosis.title}</strong>
                <p>{diagnosis.explanation}</p>
                {diagnosis.example ? <code>{diagnosis.example}</code> : null}
                {diagnosis.check ? <em>{diagnosis.check}</em> : null}
              </div>
            ) : null}
            {results ? <div className={styles.testCount}>{results.passed} passed · {results.failed} failed</div> : null}
            {syncWarning ? <p className={styles.challengeError}>{syncWarning}</p> : null}
            {error ? <p className={styles.challengeError}>{error}</p> : null}
          </aside>
        </div>
      </section>
    </div>
  );
}
