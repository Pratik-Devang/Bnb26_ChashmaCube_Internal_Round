"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PRACTICE_QUESTIONS,
  type Difficulty,
  type PracticeQuestion,
} from "@/lib/practice-questions";
import {
  executePythonCode,
  runQuestionTests,
  type RunSummary,
} from "@/lib/python-executor";
import { diagnoseCode } from "@/lib/api";
import type { MLDiagnoseResponse } from "@/types/learning";
import styles from "./PracticeArena.module.css";

interface PracticeArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDifficulty?: Difficulty;
}

export function PracticeArenaModal({
  isOpen,
  onClose,
  initialDifficulty = "easy",
}: PracticeArenaModalProps) {
  // Navigation & Selection State
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const currentQuestions = PRACTICE_QUESTIONS[difficulty];
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const currentQuestion: PracticeQuestion =
    currentQuestions[selectedQuestionIndex] || currentQuestions[0];

  // Editor State - codespace is left empty
  const [userCode, setUserCode] = useState<string>("");
  const [customInput, setCustomInput] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Execution & Diagnostics State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [mlDiagnosis, setMlDiagnosis] = useState<MLDiagnoseResponse | null>(null);
  const [diagnosisStatus, setDiagnosisStatus] = useState<
    "idle" | "correct" | "misconception" | "error"
  >("idle");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showSolution, setShowSolution] = useState<boolean>(false);

  // Reset editor and state when switching questions
  useEffect(() => {
    setUserCode("");
    setCustomInput(
      currentQuestion.examples[0]?.input !== "(none)"
        ? currentQuestion.examples[0]?.input || ""
        : ""
    );
    setRunSummary(null);
    setMlDiagnosis(null);
    setDiagnosisStatus("idle");
    setShowSolution(false);
  }, [currentQuestion]);

  // Handle Tab key in editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const newValue = value.substring(0, start) + "    " + value.substring(end);
      setUserCode(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Run code with custom input
  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      const execResult = await executePythonCode(userCode, customInput);
      setRunSummary({
        allPassed: false,
        totalTests: 1,
        passedCount: execResult.stderr === "" ? 1 : 0,
        failedCount: execResult.stderr !== "" ? 1 : 0,
        results: [
          {
            testCase: {
              input: customInput,
              expectedOutput: "",
              description: "Custom Input Run",
            },
            passed: execResult.stderr === "",
            actualOutput: execResult.stdout,
            expectedOutput: "(Manual execution)",
            error: execResult.stderr || undefined,
            executionTimeMs: execResult.timeMs,
          },
        ],
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        executionTimeMs: execResult.timeMs,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Run tests & ML Diagnosis
  const handleSubmitAndDiagnose = async () => {
    if (isDiagnosing || isRunning) return;
    setIsDiagnosing(true);
    try {
      const testSummary = await runQuestionTests(
        userCode,
        currentQuestion.testCases
      );
      setRunSummary(testSummary);

      const mlResult = await diagnoseCode(userCode);
      setMlDiagnosis(mlResult);

      if (testSummary.allPassed) {
        setDiagnosisStatus("correct");
        setShowSolution(true);
      } else {
        setDiagnosisStatus("misconception");
        setShowSolution(true);
      }
    } catch {
      setDiagnosisStatus("error");
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleCopySolution = () => {
    navigator.clipboard.writeText(currentQuestion.solutionCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleClearCode = () => {
    setUserCode("");
    setRunSummary(null);
    setMlDiagnosis(null);
    setDiagnosisStatus("idle");
  };

  if (!isOpen) return null;

  const lineCount = Math.max(userCode.split("\n").length, 12);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header: Left: Difficulty Selector | Center: Golden QUIZ | Right: Question Tabs (1, 2, 3) + Close */}
        <header className={styles.header}>
          {/* TOP LEFT: Difficulty Group */}
          <div className={styles.headerLeft}>
            <div className={styles.difficultyGroup}>
              <button
                type="button"
                className={`${styles.diffBtn} ${
                  difficulty === "easy" ? styles.diffBtnActive : ""
                }`}
                onClick={() => {
                  setDifficulty("easy");
                  setSelectedQuestionIndex(0);
                }}
              >
                Easy
              </button>
              <button
                type="button"
                className={`${styles.diffBtn} ${
                  difficulty === "medium" ? styles.diffBtnActive : ""
                }`}
                onClick={() => {
                  setDifficulty("medium");
                  setSelectedQuestionIndex(0);
                }}
              >
                Medium
              </button>
              <button
                type="button"
                className={`${styles.diffBtn} ${
                  difficulty === "hard" ? styles.diffBtnActive : ""
                }`}
                onClick={() => {
                  setDifficulty("hard");
                  setSelectedQuestionIndex(0);
                }}
              >
                Hard
              </button>
            </div>
          </div>

          {/* CENTER: Golden QUIZ Title */}
          <div className={styles.headerCenter}>
            <h2 className={styles.quizTitle}>QUIZ</h2>
          </div>

          {/* TOP RIGHT: Questions 1, 2, 3 Tabs + Close Button */}
          <div className={styles.headerRight}>
            <nav className={styles.questionsNav}>
              <span className={styles.questionTabLabel}>Question:</span>
              {currentQuestions.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  className={`${styles.questionTab} ${
                    selectedQuestionIndex === idx ? styles.questionTabActive : ""
                  }`}
                  onClick={() => setSelectedQuestionIndex(idx)}
                >
                  {q.number}
                </button>
              ))}
            </nav>

            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close Quiz"
            >
              ×
            </button>
          </div>
        </header>

        {/* 3-Column Content Grid */}
        <div className={styles.contentGrid}>
          {/* ========================================================================= */}
          {/* PART 1: PROBLEM DESCRIPTION */}
          {/* ========================================================================= */}
          <aside className={styles.columnProblem}>
            <div className={styles.problemBadge}>
              {difficulty.toUpperCase()} · QUESTION {currentQuestion.number}
            </div>

            <h1 className={styles.problemTitle}>{currentQuestion.title}</h1>
            <p className={styles.problemDescription}>
              {currentQuestion.description}
            </p>

            <div className={styles.sectionHeader}>Instructions</div>
            <ul className={styles.instructionList}>
              {currentQuestion.instructions.map((inst, i) => (
                <li key={i}>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: inst.replace(/`([^`]+)`/g, "<code>$1</code>"),
                    }}
                  />
                </li>
              ))}
            </ul>

            <div className={styles.sectionHeader}>Examples</div>
            {currentQuestion.examples.map((ex, i) => (
              <div key={i} className={styles.exampleCard}>
                <div className={styles.exampleRow}>
                  <span className={styles.exampleLabel}>Input:</span>
                  <div className={styles.exampleCode}>{ex.input}</div>
                </div>
                <div className={styles.exampleRow}>
                  <span className={styles.exampleLabel}>Output:</span>
                  <div className={styles.exampleCode}>{ex.output}</div>
                </div>
                {ex.explanation && (
                  <small style={{ color: "#bebbad", fontSize: "0.78rem" }}>
                    {ex.explanation}
                  </small>
                )}
              </div>
            ))}

            <div className={styles.customInputSection}>
              <div className={styles.sectionHeader}>Custom Test Input</div>
              <textarea
                className={styles.customInputArea}
                placeholder="Enter input lines to feed into input()..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
              />
            </div>
          </aside>

          {/* ========================================================================= */}
          {/* PART 2: CODE EDITOR (EMPTY) & TERMINAL OUTPUT */}
          {/* ========================================================================= */}
          <main className={styles.columnCode}>
            <div className={styles.editorHeader}>
              <div className={styles.editorTitle}>Python 3 Editor</div>
              <div className={styles.editorActions}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={handleClearCode}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Code Input Area */}
            <div className={styles.editorWrapper}>
              <div className={styles.lineNumbers}>
                {lineNumbers.map((num) => (
                  <div key={num}>{num}</div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                className={styles.codeTextarea}
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                placeholder="# Write your Python solution here..."
              />
            </div>

            {/* Editor Action Buttons */}
            <div className={styles.editorButtonBar}>
              <div className={styles.btnGroup}>
                <button
                  type="button"
                  className={`${styles.btnRun} ${
                    isRunning ? styles.btnDisabled : ""
                  }`}
                  onClick={handleRunCode}
                  disabled={isRunning || isDiagnosing}
                >
                  {isRunning ? "Running..." : "Run Code"}
                </button>
                <button
                  type="button"
                  className={`${styles.btnSubmit} ${
                    isDiagnosing ? styles.btnDisabled : ""
                  }`}
                  onClick={handleSubmitAndDiagnose}
                  disabled={isRunning || isDiagnosing}
                >
                  {isDiagnosing ? "Diagnosing..." : "Submit & Diagnose"}
                </button>
              </div>

              {runSummary && (
                <div
                  style={{
                    font: "700 0.8rem monospace",
                    color: runSummary.allPassed ? "#d4b277" : "#ffc1a1",
                  }}
                >
                  {runSummary.allPassed
                    ? `All ${runSummary.totalTests} tests passed (${runSummary.executionTimeMs}ms)`
                    : `${runSummary.passedCount}/${runSummary.totalTests} tests passed`}
                </div>
              )}
            </div>

            {/* Output Space Below Code */}
            <section className={styles.outputSection}>
              <div className={styles.outputHeader}>
                <div className={styles.outputTitle}>Output</div>
                {runSummary && (
                  <span style={{ font: "0.72rem monospace", color: "#8d9567" }}>
                    Time: {runSummary.executionTimeMs}ms
                  </span>
                )}
              </div>
              <div className={styles.outputBody}>
                {runSummary ? (
                  <>
                    {runSummary.results.length > 1 && (
                      <div style={{ marginBottom: "0.5rem" }}>
                        {runSummary.results.map((res, i) => (
                          <div
                            key={i}
                            className={`${styles.testResultItem} ${
                              res.passed
                                ? styles.testResultPassed
                                : styles.testResultFailed
                            }`}
                          >
                            <span>
                              {res.passed ? "[PASS]" : "[FAIL]"}{" "}
                              {res.testCase.description || `Test ${i + 1}`}
                            </span>
                            <span>
                              {res.passed
                                ? "Correct"
                                : `Expected: "${res.expectedOutput}" | Got: "${res.actualOutput.trim()}"`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {runSummary.stdout && (
                      <div className={styles.terminalStdout}>
                        {runSummary.stdout}
                      </div>
                    )}

                    {runSummary.stderr && (
                      <div className={styles.terminalStderr}>
                        {runSummary.stderr}
                      </div>
                    )}

                    {!runSummary.stdout && !runSummary.stderr && (
                      <div style={{ color: "#8d9567" }}>
                        (Program finished with no console output)
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ color: "#8d9567" }}>
                    Write your solution above. Click &quot;Run Code&quot; to test with custom input, or &quot;Submit &amp; Diagnose&quot; to test all cases and receive ML diagnosis.
                  </div>
                )}
              </div>
            </section>
          </main>

          {/* ========================================================================= */}
          {/* PART 3: ML MISCONCEPTION DIAGNOSIS */}
          {/* ========================================================================= */}
          <aside className={styles.columnDiagnosis}>
            <div className={styles.diagnosisHeader}>
              <div className={styles.diagnosisTitle}>ML Misconception Diagnosis</div>
              <span className={styles.mlModelBadge}>LinearSVC</span>
            </div>

            {/* When Correct */}
            {diagnosisStatus === "correct" && (
              <div className={styles.correctCard}>
                <div className={styles.correctTitle}>Correct</div>
                <p className={styles.correctMsg}>
                  All test cases passed. No misconceptions were detected in your code.
                </p>
              </div>
            )}

            {/* When Incorrect / Misconception Detected */}
            {diagnosisStatus === "misconception" && mlDiagnosis && (
              <div className={styles.misconceptionCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardBadge}>Misconception Detected</span>
                  {mlDiagnosis.top_prediction?.score !== undefined && (
                    <span className={styles.scoreBadge}>
                      Confidence:{" "}
                      {(
                        Math.max(
                          0.1,
                          Math.min(
                            0.99,
                            (mlDiagnosis.top_prediction.score + 1) / 2
                          )
                        ) * 100
                      ).toFixed(1)}
                      %
                    </span>
                  )}
                </div>

                <div className={styles.misconceptionText}>
                  {mlDiagnosis.top_prediction?.misconception}
                </div>

                {mlDiagnosis.intervention && (
                  <div className={styles.interventionSection}>
                    <div className={styles.interventionTitle}>
                      {mlDiagnosis.intervention.title}
                    </div>
                    <div className={styles.interventionExplanation}>
                      {mlDiagnosis.intervention.explanation}
                    </div>
                    {mlDiagnosis.intervention.check && (
                      <div className={styles.interventionCheck}>
                        Check: {mlDiagnosis.intervention.check}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Idle State */}
            {diagnosisStatus === "idle" && (
              <div className={styles.idleDiagnosis}>
                <div className={styles.idleTitle}>Awaiting Submission</div>
                <p className={styles.idleDescription}>
                  Submit your code to receive machine learning diagnosis. If an error or misconception is found, guidance and the correct reference code will appear here.
                </p>
              </div>
            )}

            {/* Correct Reference Solution */}
            {(showSolution || diagnosisStatus !== "idle") && (
              <div className={styles.solutionCard}>
                <div className={styles.solutionHeader}>
                  <div className={styles.solutionTitle}>Correct Code</div>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={handleCopySolution}
                  >
                    {copiedCode ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className={styles.solutionCodeBlock}>
                  <code>{currentQuestion.solutionCode}</code>
                </pre>
                <div className={styles.solutionExplanation}>
                  <strong>Explanation:</strong>{" "}
                  {currentQuestion.solutionExplanation}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
