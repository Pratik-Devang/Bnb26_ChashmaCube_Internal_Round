"use client";

import { useEffect, useRef, useState } from "react";
import { getExercise, requestCodeReview, requestDiagnosis, reviewCode, submitAttempt } from "@/lib/api";
import { currentLearnerId } from "@/lib/account";
import { createPythonCodeRunner, type PythonCodeRunner } from "@/lib/code-runner";
import { challengeSolutions } from "@/lib/game/challenge-solutions";
import type { CodeReviewResponse, DiagnosisResponse, Exercise, TestResults } from "@/types/learning";
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
  onAttempt?: (submittedCode: string, results: TestResults) => void | Promise<void>;
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

function friendlyPythonError(error: string, exerciseId: string, hint?: string): ScoutGuidance {
  if (/can only concatenate str|unsupported operand type\(s\) for \+/.test(error)) return {
    title: "Convert the text before adding",
    explanation: exerciseId === "variables-medium-code"
      ? "raw arrives as text, so Python cannot add 5 to it yet. Convert it with int(raw), add 5, then return the result so the Scout can check it. print displays a value but does not return it."
      : "This input arrives as text, and Python cannot add text and a number directly. Convert the input to a number first, then do the addition.",
    example: exerciseId === "variables-medium-code" ? "return int(raw) + 5" : undefined,
    check: hint ?? "Use int(...) on the text value before doing arithmetic.",
    source: "tests",
  };
  if (/NameError/.test(error)) return {
    title: "Check the name you used",
    explanation: "Python found a name it does not recognize. Check the spelling and make sure the value is created before you use it.",
    check: hint ?? "Compare each name in your code with the names in the function prompt.", source: "tests",
  };
  if (/IndentationError|TabError/.test(error)) return {
    title: "Check the line spacing",
    explanation: "Python uses indentation to show which lines belong inside a function, loop, or if statement. Lines in the same block need the same spacing.",
    check: "Indent each line in a block by four spaces, and keep the return line inside the function.", source: "tests",
  };
  if (/SyntaxError/.test(error)) return {
    title: "Check the Python punctuation",
    explanation: "Python could not understand one of the lines. Check that parentheses and quotes are paired, and that lines ending in if, else, or a function header have a colon.",
    check: hint ?? "Read the line before the one Python points to; a missing symbol can make the next line look wrong.", source: "tests",
  };
  if (/ZeroDivisionError/.test(error)) return {
    title: "Check before dividing",
    explanation: "The code tried to divide by zero. Handle the zero case before running the division.",
    check: hint ?? "Add an if check for a zero divisor before the division line.", source: "tests",
  };
  return {
    title: "Python stopped before it could check your answer",
    explanation: "That message is about how the code ran, not a score. Read your function from top to bottom and check the names, indentation, and the value it returns.",
    check: hint ?? "Try one small change, then submit again. You can reveal a worked solution if you get stuck.", source: "tests",
  };
}

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

function guidanceFromTests(results: TestResults, exerciseId: string, submittedCode: string, hint?: string): ScoutGuidance {
  const failed = results.cases.filter((item) => !item.passed);
  const firstError = failed.find((item) => item.error)?.error;
  if (firstError) return friendlyPythonError(firstError, exerciseId, hint);

  const returnedNothing = failed.length > 0 && failed.every((item) => item.actual === null || typeof item.actual === "undefined");
  if (returnedNothing && /(^|\s)pass(\s|$)/m.test(submittedCode)) return {
    title: "The function does not return a result yet",
    explanation: "pass is only a placeholder. Python reaches the end of the function without a return statement, so every test receives None instead of the requested value.",
    check: hint ?? "Replace pass with the requested logic, and make sure every possible path returns a value.",
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

export function IslandScoutChallenge({ exerciseId, exerciseOverride, hint, recordAttempt = true, guideName = "Island Scout", title, reward, alreadyCompleted, onClose, onAttempt, onComplete }: Props) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [code, setCode] = useState("");
  const [results, setResults] = useState<TestResults | null>(null);
  const [diagnosis, setDiagnosis] = useState<ScoutGuidance | null>(null);
  const [codeReview, setCodeReview] = useState<CodeReviewResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "running" | "passed" | "failed">("loading");
  const [error, setError] = useState("");
  const [syncWarning, setSyncWarning] = useState("");
  const [hintOpen, setHintOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
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
    setCodeReview(null);
    setHintOpen(false);
    setSolutionOpen(false);

    try {
      let nextResults: TestResults;
      try {
        nextResults = await runnerRef.current.run({ code, testCases: exercise.testCases });
      } catch (reason) {
        // A timeout or worker failure is still an incorrect submitted answer.
        // Turn it into failed test evidence so the adventure journal records it.
        const message = reason instanceof Error ? reason.message : "Python could not finish running this attempt.";
        nextResults = {
          passed: 0,
          failed: exercise.testCases.length,
          cases: exercise.testCases.map((testCase) => ({
            input: testCase.input,
            args: testCase.args,
            expected: testCase.expected,
            actual: null,
            passed: false,
            error: message,
          })),
        };
      }
      setResults(nextResults);
      if (onAttempt) await onAttempt(code, nextResults);
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
        try {
          setCodeReview(await requestCodeReview(attempt.id));
        } catch {
          // Diagnosis and test evidence remain available if optional review fails.
        }
      } catch {
        setSyncWarning(`${guideName} used the challenge tests, but could not save this attempt to your learning journal.`);
      } else try {
        setCodeReview(await reviewCode({
          exerciseId: exercise.id,
          prompt: exercise.prompt,
          submittedCode: code,
          testResults: nextResults,
        }));
      } catch {
        // The local test explanation below remains available.
      }

      if (nextResults.failed === 0 && nextResults.passed > 0) {
        if (!alreadyCompleted) await onComplete(code, nextResults);
        setStatus("passed");
        return;
      }

      const testGuidance = guidanceFromTests(nextResults, exerciseId, code, hint);
      const hasRuntimeError = nextResults.cases.some((item) => !item.passed && item.error);
      setDiagnosis(hasRuntimeError ? testGuidance : journalGuidance ?? testGuidance);
      setStatus("failed");
    } catch (reason) {
      setError(reason instanceof Error
        ? `This attempt could not be saved: ${reason.message}`
        : "This attempt could not be saved. Your code is still here; try again.");
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
            <div className={styles.editorHeading}>
              <div><span>PYTHON EDITOR</span><strong>Your solution</strong></div>
              <small>{status === "running" ? "RUNNING TESTS…" : "EDIT · TEST · IMPROVE"}</small>
            </div>
            <p className={styles.challengePrompt}>{exercise?.prompt ?? "The Island Scout is preparing your challenge..."}</p>
            <textarea
              id="scout-python-solution"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              aria-label="Python solution"
              spellCheck={false}
              disabled={status === "loading" || status === "running"}
            />
            <div className={styles.editorActions}>
              <small>Runs against {exercise?.testCases.length ?? 0} hidden checks</small>
              <button type="button" className={styles.primaryAction} onClick={runChallenge} disabled={!exercise || status === "running"}>
                {status === "running" ? "Scout is checking..." : "Run code & review"}
              </button>
            </div>
          </div>

          <aside className={styles.scoutFeedback}>
            <div className={styles.reviewHeading}><span>{guideName.toUpperCase()}</span><small>REVIEW PANEL</small></div>
            {status === "loading" ? <p>“Let me prepare the trial.”</p> : null}
            {status === "ready" ? <p>“Use everything the island taught you. I’ll inspect the result, not just the final answer.”</p> : null}
            {status === "running" ? <p>“I’m tracing your code now...”</p> : null}
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
            {codeReview ? (
              <details className={styles.codeReview} open={status === "failed"}>
                <summary>Detailed code review</summary>
                <small>{codeReview.source === "gemini" ? "GEMINI-ASSISTED EXPLANATION" : "EVIDENCE-BASED FALLBACK"}</small>
                <p>{codeReview.summary}</p>
                {codeReview.strengths.length ? <div><strong>What worked</strong><ul>{codeReview.strengths.map(item => <li key={item}>{item}</li>)}</ul></div> : null}
                {codeReview.issues.length ? <div><strong>What to inspect</strong><ul>{codeReview.issues.map((item, index) => <li key={`${item.title}-${index}`}><b>{item.line ? `Line ${item.line}: ` : ""}{item.title}</b> — {item.explanation}</li>)}</ul></div> : null}
                <div><strong>Next step</strong><ol>{codeReview.nextSteps.map(item => <li key={item}>{item}</li>)}</ol></div>
              </details>
            ) : null}
            {results ? <div className={styles.testCount}>{results.passed} passed · {results.failed} failed</div> : null}
            {status === "failed" && exercise ? <div className={styles.challengeHelp}>
              {hint && <button type="button" onClick={() => setHintOpen((open) => !open)} aria-expanded={hintOpen}>
                {hintOpen ? "Hide hint" : "Show a hint"}
              </button>}
              {challengeSolutions[exercise.id] && <button type="button" onClick={() => setSolutionOpen((open) => !open)} aria-expanded={solutionOpen}>
                {solutionOpen ? "Hide solution" : "Show solution"}
              </button>}
              {hintOpen && hint ? <p><strong>Hint:</strong> {hint}</p> : null}
              {solutionOpen && challengeSolutions[exercise.id] ? <div className={styles.solutionReveal}>
                <strong>Worked solution</strong>
                <pre><code>{challengeSolutions[exercise.id]}</code></pre>
                <p>Read each line, then load it into the editor and submit it to finish the trial.</p>
                <button type="button" onClick={() => { setCode(challengeSolutions[exercise.id] ?? ""); setError(""); }}>Use this solution</button>
              </div> : null}
            </div> : null}
            {syncWarning ? <p className={styles.challengeError}>{syncWarning}</p> : null}
            {error ? <p className={styles.challengeError}>{error}</p> : null}
          </aside>
        </div>
      </section>
    </div>
  );
}
