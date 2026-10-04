"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { getExercise, requestDiagnosis, submitAttempt } from "@/lib/api";
import { currentLearnerId } from "@/lib/account";
import { createPythonCodeRunner, type PythonCodeRunner } from "@/lib/code-runner";
import { PixelSprite } from "@/components/ui/PixelSprite";
import type { DiagnosisResponse, Exercise, TestResults } from "@/types/learning";
import styles from "../GameWorld.module.css";

type Props = {
  exerciseId: string;
  exerciseOverride?: Exercise;
  hint?: string;
  recordAttempt?: boolean;
  guideName?: string;
  title: string;
  reward: number;
  alreadyCompleted: boolean;
  onClose: () => void;
  onComplete: (submittedCode: string, results: TestResults) => void | Promise<void>;
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

function guidanceFromTests(results: TestResults, exerciseId: string, hint?: string): ScoutGuidance {
  const failed = results.cases.filter((item) => !item.passed);
  const firstError = failed.find((item) => item.error)?.error;
  if (firstError) return {
    title: "Python could not run this yet",
    explanation: firstError,
    check: "Fix the reported Python error, then ask the Scout to check again.",
    source: "tests",
  };

  const unchanged = exerciseId === "starting-value-01" && failed.length > 0 && failed.every((item) => item.actual === item.args?.[0]);
  if (unchanged) return {
    title: "The score stayed unchanged",
    explanation: "Your function returns the starting score, but the 10-point bonus was never added.",
    example: "return score + 10",
    check: "If score is 7, the function should return 17.",
    source: "tests",
  };

  const constantBonus = exerciseId === "starting-value-01" && failed.length > 0 && failed.every((item) => item.actual === 10);
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
    check: hint ?? "Compare the first failed input, expected value, and actual value, then trace where they diverge.",
    source: "tests",
  };
}

export function IslandScoutChallenge({ exerciseId, exerciseOverride, hint, recordAttempt = true, guideName = "Island Scout", title, reward, alreadyCompleted, onClose, onComplete }: Props) {
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

    if (exerciseOverride) {
      setExercise(exerciseOverride);
      setCode(exerciseOverride.starterCode);
      setStatus("ready");
    } else getExercise(exerciseId)
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
  }, [exerciseId, exerciseOverride]);

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

      if (recordAttempt) try {
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
        setSyncWarning(`${guideName} used the challenge tests, but could not save this attempt to your learning journal.`);
      }

      if (nextResults.failed === 0 && nextResults.passed > 0) {
        if (!alreadyCompleted) await onComplete(code, nextResults);
        setStatus("passed");
        return;
      }

      setDiagnosis(journalGuidance ?? guidanceFromTests(nextResults, exerciseId, hint));
      setStatus("failed");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `${guideName} could not check that solution.`);
      setStatus("failed");
    }
  };

  const insertIndent = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const field = event.currentTarget;
    const start = field.selectionStart;
    const end = field.selectionEnd;
    setCode(`${code.slice(0, start)}    ${code.slice(end)}`);
    requestAnimationFrame(() => field.setSelectionRange(start + 4, start + 4));
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
            <div className={styles.challengeBrief}><span>YOUR TASK</span><p>{exercise?.prompt ?? `${guideName} is preparing your challenge...`}</p></div>
            <div className={styles.codeWorkbench}>
              <div className={styles.editorBar}><span className={styles.editorLights}><i /><i /><i /></span><strong>solution.py</strong><small>PYTHON 3</small></div>
              <div className={styles.editorSurface}>
                <div className={styles.lineNumbers} aria-hidden="true">{code.split("\n").map((_, index) => <span key={index}>{index + 1}</span>)}</div>
                <textarea
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  onKeyDown={insertIndent}
                  aria-label="Python solution"
                  spellCheck={false}
                  disabled={status === "loading" || status === "running"}
                />
              </div>
              <div className={styles.editorFooter}><span><i /> AUTOSAVED LOCALLY</span><span>Tab inserts 4 spaces</span></div>
            </div>
            <div className={styles.challengeActions}>
              <span>Run all {exercise?.testCases.length ?? 3} hidden checks before submitting.</span>
              <button type="button" className={styles.primaryAction} onClick={runChallenge} disabled={!exercise || status === "running"}>
                <b aria-hidden="true">▶</b>{status === "running" ? "Running tests..." : `Run ${exercise?.testCases.length ?? 3} tests`}
              </button>
            </div>
          </div>

          <aside className={styles.scoutFeedback}>
            <div className={styles.feedbackGuide}><PixelSprite character="scout" /><div><small>TRIAL KEEPER</small><strong>{guideName}</strong></div></div>
            {status === "loading" ? <div className={styles.statusCard}><small>PREPARING</small><p>“Let me prepare the trial.”</p></div> : null}
            {status === "ready" ? <div className={styles.statusCard}><small>READY FOR YOUR CODE</small><p>“Use everything the guides taught you. I’ll inspect every test, not just one answer.”</p></div> : null}
            {status === "running" ? <div className={`${styles.statusCard} ${styles.runningCard}`}><small>TRACING YOUR CODE</small><p>“I’m following each value through the program...”</p><i /></div> : null}
            {status === "passed" ? (
              <div className={styles.challengeSuccess}>
                <strong>Trial complete!</strong>
                <p>Every test passed. {alreadyCompleted ? "That’s another clean run." : reward > 0 ? `You earned ${reward} coins.` : "The coding check is recorded in your adventure."}</p>
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
            {results ? <div className={styles.testResults}><div><strong>TEST RUN</strong><span>{results.passed}/{results.cases.length} passed</span></div>{results.cases.map((item, index) => <span key={index} className={item.passed ? styles.testPassed : styles.testFailed}><b>{item.passed ? "✓" : "×"}</b> Case {String(index + 1).padStart(2, "0")}</span>)}</div> : null}
            {syncWarning ? <p className={styles.challengeError}>{syncWarning}</p> : null}
            {error ? <p className={styles.challengeError}>{error}</p> : null}
          </aside>
        </div>
      </section>
    </div>
  );
}
