"use client";

import { useEffect, useRef, useState } from "react";
import { diagnoseCode, getExercise } from "@/lib/api";
import { createPythonCodeRunner, type PythonCodeRunner } from "@/lib/code-runner";
import type { Exercise, MLDiagnoseResponse, TestResults } from "@/types/learning";
import styles from "../GameWorld.module.css";

type Props = {
  exerciseId: string;
  title: string;
  reward: number;
  alreadyCompleted: boolean;
  onClose: () => void;
  onComplete: () => void;
};

export function IslandScoutChallenge({ exerciseId, title, reward, alreadyCompleted, onClose, onComplete }: Props) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [code, setCode] = useState("");
  const [results, setResults] = useState<TestResults | null>(null);
  const [diagnosis, setDiagnosis] = useState<MLDiagnoseResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "running" | "passed" | "failed">("loading");
  const [error, setError] = useState("");
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
    setDiagnosis(null);

    try {
      const nextResults = await runnerRef.current.run({ code, testCases: exercise.testCases });
      setResults(nextResults);
      if (nextResults.failed === 0 && nextResults.passed > 0) {
        setStatus("passed");
        if (!alreadyCompleted) onComplete();
        return;
      }

      const classifierResult = await diagnoseCode(code);
      setDiagnosis(classifierResult);
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
                <small>MISCONCEPTION DETECTED</small>
                <strong>{diagnosis.top_prediction.misconception}</strong>
                <p>{diagnosis.intervention.explanation}</p>
                <code>{diagnosis.intervention.example}</code>
                <em>{diagnosis.intervention.check}</em>
              </div>
            ) : null}
            {results ? <div className={styles.testCount}>{results.passed} passed · {results.failed} failed</div> : null}
            {error ? <p className={styles.challengeError}>{error}</p> : null}
          </aside>
        </div>
      </section>
    </div>
  );
}
