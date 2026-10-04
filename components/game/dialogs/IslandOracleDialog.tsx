"use client";

import { useEffect, useId, useRef, useState } from "react";
import { diagnoseCode } from "@/lib/api";
import { createPythonCodeRunner, type PythonCodeRunner } from "@/lib/code-runner";
import type { MLDiagnoseResponse } from "@/types/learning";
import styles from "../GameWorld.module.css";

type Props = {
  onClose: () => void;
  onRewardCoins?: (amount: number) => void;
};

// Friendly, humanized explanations for Python misconceptions
interface HumanConcept {
  title: string;
  shortDesc: string;
  whyItHappens: string;
  fixTip: string;
  hintCode: string;
  nextTopics: { name: string; time: string }[];
}

const HUMAN_CATALOG: Record<number, HumanConcept> = {
  15: {
    title: "Zero-Based List Indexing",
    shortDesc: "In Python, counting starts at 0 rather than 1. The first element in any list is always at index [0].",
    whyItHappens: "We naturally count starting at 1 in daily life, but computer memory offsets start at 0.",
    fixTip: "Use my_list[0] for the first item and my_list[1] for the second item.",
    hintCode: "fruits = ['Apple', 'Banana', 'Cherry']\n# First item is at index 0:\nfirst = fruits[0]  # 'Apple'",
    nextTopics: [
      { name: "List indexing & negative indices", time: "4 mins" },
      { name: "List slicing [start:stop]", time: "6 mins" },
      { name: "Handling IndexError boundaries", time: "5 mins" },
    ],
  },
  33: {
    title: "Range Loop Upper Boundary",
    shortDesc: "range(1, n) stops right before reaching n. To include n, write range(1, n + 1).",
    whyItHappens: "Python range() stops before the upper limit so range(0, 5) gives exactly 5 elements.",
    fixTip: "Add + 1 to your end value when you want the loop to reach that final number.",
    hintCode: "# Loops all the way through n:\nfor i in range(1, n + 1):\n    total += i",
    nextTopics: [
      { name: "range() start, stop, and step", time: "5 mins" },
      { name: "Loop accumulators and sums", time: "5 mins" },
      { name: "For loops vs While loops", time: "6 mins" },
    ],
  },
  22: {
    title: "Equality '==' vs Assignment '='",
    shortDesc: "Use double '==' to check if values match. A single '=' assigns or changes a variable.",
    whyItHappens: "Typing a single '=' is a common habit, but Python treats '=' as setting a value.",
    fixTip: "Change single '=' to double '==' inside your if condition.",
    hintCode: "score = 100\n# Use == to check equality:\nif score == 100:\n    print('You reached maximum score!')",
    nextTopics: [
      { name: "If, elif, and else conditionals", time: "4 mins" },
      { name: "Comparison operators in Python", time: "4 mins" },
      { name: "Boolean logic (and / or / not)", time: "5 mins" },
    ],
  },
  31: {
    title: "Clean Return Statement",
    shortDesc: "In Python, return statements do not need parentheses around the value being returned.",
    whyItHappens: "Math formulas and other programming languages often wrap return values in parentheses.",
    fixTip: "Simply write return followed by a space and your value (e.g. return total).",
    hintCode: "def add(a, b):\n    # Clean Python return:\n    return a + b",
    nextTopics: [
      { name: "Function return values", time: "4 mins" },
      { name: "Returning multiple values (tuples)", time: "5 mins" },
      { name: "Local scope vs function outputs", time: "6 mins" },
    ],
  },
  11: {
    title: "Return vs print()",
    shortDesc: "print() outputs text for humans to see, while return hands data back to your program.",
    whyItHappens: "Seeing text appear in the console feels like a complete answer, but other functions cannot read printed text.",
    fixTip: "Use return when caller code or tests need to store and verify the result.",
    hintCode: "def calculate_total(a, b):\n    # Return passes the answer back:\n    return a + b",
    nextTopics: [
      { name: "When to return vs when to print", time: "4 mins" },
      { name: "Storing function outputs in variables", time: "5 mins" },
      { name: "Writing reusable functions", time: "6 mins" },
    ],
  },
  41: {
    title: "List Copying vs Aliasing",
    shortDesc: "Writing b = a makes both variables point to the exact same list, modifying both together.",
    whyItHappens: "In Python, lists are mutable objects. Simple assignment only copies the reference, not the data.",
    fixTip: "Use b = a.copy() or b = list(a) to make a completely independent duplicate.",
    hintCode: "original = [1, 2, 3]\n# Make an independent copy:\nbackup = original.copy()\nbackup.append(4)  # original remains [1, 2, 3]",
    nextTopics: [
      { name: "Mutable vs immutable objects", time: "5 mins" },
      { name: "Shallow copies vs deep copies", time: "6 mins" },
      { name: "List methods and mutations", time: "5 mins" },
    ],
  },
  4: {
    title: "Loop Accumulator Initialization",
    shortDesc: "Initialize running sum or total variables before starting your loop, not inside it.",
    whyItHappens: "Putting total = 0 inside the loop resets the score on every single iteration.",
    fixTip: "Move total = 0 above the for/while loop header.",
    hintCode: "total = 0  # Initialized outside the loop\nfor num in numbers:\n    total += num",
    nextTopics: [
      { name: "Loop accumulators and counters", time: "5 mins" },
      { name: "Scope of variables inside loops", time: "5 mins" },
      { name: "Built-in sum() helper", time: "4 mins" },
    ],
  },
  5: {
    title: "While Loop Progress Step",
    shortDesc: "Ensure your while loop increments or updates its counter on every repetition.",
    whyItHappens: "Forgetting i += 1 means the condition stays True forever, creating an infinite loop.",
    fixTip: "Add i += 1 inside the loop block so it moves towards the stop condition.",
    hintCode: "i = 0\nwhile i < len(items):\n    print(items[i])\n    i += 1  # Move to next index",
    nextTopics: [
      { name: "Preventing infinite while loops", time: "4 mins" },
      { name: "When to use for loops instead", time: "5 mins" },
      { name: "Loop control with break", time: "5 mins" },
    ],
  },
  16: {
    title: "List Slice Boundary [start:stop]",
    shortDesc: "In Python slicing list[start:stop], the stop index is excluded.",
    whyItHappens: "It's easy to assume list[0:3] includes index 3, but it stops before index 3 (items 0, 1, and 2).",
    fixTip: "To include the item at index 3, slice up to index 4 (e.g. list[0:4]).",
    hintCode: "numbers = [10, 20, 30, 40, 50]\n# Takes items at indices 0, 1, 2:\nfirst_three = numbers[0:3]",
    nextTopics: [
      { name: "List slicing syntax & step", time: "5 mins" },
      { name: "Omitting start or stop in slices", time: "4 mins" },
      { name: "String slicing fundamentals", time: "5 mins" },
    ],
  },
  28: {
    title: "Premature Return in Loop",
    shortDesc: "Your return statement runs on the very first loop iteration before checking other items.",
    whyItHappens: "Placing return inside the loop body without a conditional check exits the function immediately.",
    fixTip: "Move the final return statement outside the loop after all iterations complete.",
    hintCode: "def check_all_positive(numbers):\n    for n in numbers:\n        if n <= 0:\n            return False  # Early exit on failure\n    return True  # Returned after checking ALL items",
    nextTopics: [
      { name: "Function exit points and control flow", time: "5 mins" },
      { name: "Search algorithms and early returns", time: "6 mins" },
      { name: "Loop else clauses in Python", time: "5 mins" },
    ],
  },
  29: {
    title: "List append() Modifies in Place",
    shortDesc: "list.append() updates the list directly and returns None. Do not write a = a.append(x).",
    whyItHappens: "Many beginners expect append() to return a new list, causing the variable to become None.",
    fixTip: "Call a.append(x) on its own line without reassigning.",
    hintCode: "items = ['sword', 'shield']\n# Append modifies items directly:\nitems.append('potion')\n# items is now ['sword', 'shield', 'potion']",
    nextTopics: [
      { name: "In-place mutations vs new objects", time: "5 mins" },
      { name: "List methods: append vs extend vs +", time: "6 mins" },
      { name: "Common NoneType errors", time: "5 mins" },
    ],
  },
};

const DEFAULT_CONCEPT: HumanConcept = {
  title: "Python Code Flow & Logic",
  shortDesc: "Review your variable assignments, indentation, and step-by-step logic.",
  whyItHappens: "Small syntax details or variable naming differences can shift how Python executes your code.",
  fixTip: "Read your logic line-by-line and check that every variable holds what you expect.",
  hintCode: "# Trace your variables with clear steps:\nprint('Current value:', my_variable)",
  nextTopics: [
    { name: "Basic Python syntax & variables", time: "4 mins" },
    { name: "Tracing code line-by-line", time: "5 mins" },
    { name: "Common beginner syntax tips", time: "5 mins" },
  ],
};

const SAMPLE_PROGRAMS = [
  {
    name: "List Indexing (1-based)",
    problem: "Retrieve the first item from the party inventory",
    code: `def get_first_item(items):\n    # Trying to grab the first item:\n    first = items[1]\n    return first\n\nprint(get_first_item(["Sword", "Shield", "Potion"]))`,
  },
  {
    name: "Range Sum Off-by-One",
    problem: "Add all numbers from 1 up to N inclusive",
    code: `def sum_to_n(n):\n    total = 0\n    # Sum numbers 1 through n:\n    for i in range(1, n):\n        total += i\n    return total\n\nprint(sum_to_n(5))`,
  },
  {
    name: "Condition with Single =",
    problem: "Check if the player's health reached zero",
    code: `hp = 0\n\nif hp = 0:\n    print("Hero needs revival!")`,
  },
  {
    name: "List Copying (Aliasing)",
    problem: "Create a copy of player stats and modify it",
    code: `original_scores = [10, 20, 30]\n# Trying to duplicate the list:\nnew_scores = original_scores\nnew_scores.append(40)\n\nprint("Original:", original_scores)`,
  },
  {
    name: "Verified Clean Code",
    problem: "Find the maximum number in a list",
    code: `def find_max(numbers):\n    if not numbers:\n        return None\n    highest = numbers[0]\n    for num in numbers:\n        if num > highest:\n            highest = num\n    return highest\n\nprint(find_max([12, 45, 23, 89, 34]))`,
  },
];

export function IslandOracleDialog({ onClose, onRewardCoins }: Props) {
  const [problemStatement, setProblemStatement] = useState("Inspect logic and detect misconceptions");
  const [code, setCode] = useState(SAMPLE_PROGRAMS[0].code);
  const [diagnosis, setDiagnosis] = useState<MLDiagnoseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pyodide live output runner
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const runnerRef = useRef<PythonCodeRunner | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const editorId = useId();

  useEffect(() => {
    let mounted = true;
    const runner = createPythonCodeRunner();
    runnerRef.current = runner;
    return () => {
      mounted = false;
      runner.terminate();
    };
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleRunCode = async () => {
    if (!code.trim() || !runnerRef.current) return;
    setRunning(true);
    setOutput(null);
    try {
      const res = await runnerRef.current.run({
        code,
        testCases: [{ expected: null, args: [] }],
      });
      const firstCase = res.cases[0];
      if (firstCase?.error) {
        setOutput(`❌ Error:\n${firstCase.error}`);
      } else {
        const text = firstCase?.actual !== null && firstCase?.actual !== undefined
          ? String(firstCase.actual)
          : "(Code executed cleanly with no return value)";
        setOutput(`▶ Output:\n${text}`);
      }
    } catch (err) {
      setOutput(`❌ Execution error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunning(false);
    }
  };

  const handleDiagnose = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await diagnoseCode(code);
      setDiagnosis(res);
      if (onRewardCoins) onRewardCoins(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The Oracle is momentarily resting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadExample = () => {
    const nextIdx = (SAMPLE_PROGRAMS.findIndex((p) => p.code === code) + 1) % SAMPLE_PROGRAMS.length;
    const sample = SAMPLE_PROGRAMS[nextIdx];
    setCode(sample.code);
    setProblemStatement(sample.problem);
    setDiagnosis(null);
    setOutput(null);
    setError(null);
  };

  const handleClear = () => {
    setCode("");
    setDiagnosis(null);
    setOutput(null);
    setError(null);
    if (textareaRef.current) textareaRef.current.focus();
  };

  // Determine misconception details
  const misconceptionId =
    diagnosis?.top_prediction?.id ??
    diagnosis?.misconception_id ??
    null;

  const isVerifiedClean =
    diagnosis !== null &&
    (diagnosis.misconception === "No misconception detected" ||
      diagnosis.top_prediction?.misconception === "No misconception detected" ||
      misconceptionId === 0);

  const conceptInfo: HumanConcept = misconceptionId && HUMAN_CATALOG[misconceptionId]
    ? HUMAN_CATALOG[misconceptionId]
    : {
        ...DEFAULT_CONCEPT,
        title: diagnosis?.top_prediction?.misconception || diagnosis?.misconception || DEFAULT_CONCEPT.title,
        shortDesc: diagnosis?.evidence || diagnosis?.intervention?.explanation || DEFAULT_CONCEPT.shortDesc,
      };

  const modelScore = diagnosis?.top_prediction?.score;

  return (
    <div className={styles.dialogScrim} role="presentation" onMouseDown={onClose}>
      <section
        className={`${styles.dialog} ${styles.challengeDialog}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="oracle-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "min(1080px, calc(100vw - 48px))",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header - Matching Island RPG Dialogs */}
        <div className={styles.challengeHeader}>
          <div>
            <span>ISLAND AI ORACLE</span>
            <h2 id="oracle-dialog-title">Spell &amp; Code Diagnoser</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close diagnoser">
            ×
          </button>
        </div>

        {/* Main Content Grid */}
        <div
          className={styles.challengeGrid}
          style={{
            gridTemplateColumns: "1.15fr 0.85fr",
            minHeight: "480px",
            maxHeight: "calc(90vh - 80px)",
            overflow: "hidden",
          }}
        >
          {/* LEFT: Code Testing & Execution Panel */}
          <div
            className={styles.challengeEditor}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              padding: "18px 22px",
              overflowY: "auto",
              background: "#16251a",
            }}
          >
            {/* Optional Problem Statement */}
            <div>
              <label
                htmlFor={`${editorId}-problem`}
                style={{
                  display: "block",
                  color: "var(--moss)",
                  fontSize: "0.52rem",
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                Problem Statement (Optional)
              </label>
              <input
                id={`${editorId}-problem`}
                type="text"
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="Describe your coding task (e.g. Find sum of list)..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "2px solid #324a37",
                  borderRadius: "2px",
                  background: "#0c150e",
                  color: "#d8dfd3",
                  fontSize: "0.72rem",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
            </div>

            {/* Monaco-style Monospace Editor */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "220px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "var(--moss)",
                  fontSize: "0.52rem",
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                <span>Python Code Editor</span>
                <span style={{ color: "#718071" }}>{code.split("\n").length} lines</span>
              </div>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                placeholder="# Type or paste Python code here..."
                disabled={loading || running}
                style={{
                  flex: 1,
                  minHeight: "210px",
                  width: "100%",
                  padding: "12px 14px",
                  border: "2px solid #38523d",
                  borderRadius: "2px",
                  background: "#09110b",
                  color: "#a3e635",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: "0.82rem",
                  lineHeight: 1.6,
                  resize: "none",
                  outline: "none",
                  boxShadow: "inset 2px 2px 0 rgba(0,0,0,0.5)",
                }}
              />
            </div>

            {/* Live Output Log */}
            {output && (
              <div
                style={{
                  background: "#08100b",
                  border: "1px solid #273e2c",
                  borderRadius: "2px",
                  padding: "8px 12px",
                  maxHeight: "100px",
                  overflowY: "auto",
                  fontFamily: "monospace",
                  fontSize: "0.72rem",
                  color: output.startsWith("❌") ? "#ff8c82" : "var(--lime)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {output}
              </div>
            )}

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
                marginTop: "2px",
              }}
            >
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={handleLoadExample}
                  style={{ padding: "0 12px", minHeight: "36px", fontSize: "0.6rem" }}
                  title="Cycle to another example snippet"
                >
                  Load Example
                </button>
                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={handleClear}
                  style={{ padding: "0 10px", minHeight: "36px", fontSize: "0.6rem" }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={running || !code.trim()}
                  style={{
                    minHeight: "36px",
                    padding: "0 12px",
                    background: "#1c3222",
                    border: "1px solid #456149",
                    color: "var(--lime)",
                    fontSize: "0.6rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    cursor: running ? "wait" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {running ? "▶ Running..." : "▶ Run Code"}
                </button>
              </div>

              <button
                type="button"
                className={styles.primaryAction}
                onClick={handleDiagnose}
                disabled={loading || !code.trim()}
                style={{
                  minHeight: "38px",
                  padding: "0 16px",
                  cursor: loading ? "wait" : "pointer",
                  fontSize: "0.65rem",
                }}
              >
                {loading ? "🔮 Consulting..." : "🔮 Diagnose My Code"}
              </button>
            </div>

            {error && (
              <p className={styles.challengeError} style={{ margin: "4px 0 0", fontSize: "0.68rem" }}>
                {error}
              </p>
            )}
          </div>

          {/* RIGHT: Classic Re:Learn Four Stacked Advice Cards */}
          <div
            className={styles.scoutFeedback}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              padding: "18px 20px",
              overflowY: "auto",
              background: "#18251b",
            }}
          >
            {/* Header / Intro if not yet diagnosed */}
            {!diagnosis && !loading && (
              <div>
                <span>ORACLE MENTOR</span>
                <p style={{ marginTop: "10px", fontSize: "0.72rem", color: "#c6d0c3", lineHeight: 1.6 }}>
                  “Write or load a Python snippet and click <strong>🔮 Diagnose My Code</strong>. I will inspect your logic, spot misconceptions, and guide you with clear, human-friendly insights.”
                </p>
              </div>
            )}

            {loading && (
              <div style={{ padding: "16px", textAlign: "center", color: "var(--lime)" }}>
                <span style={{ fontSize: "1.4rem", display: "inline-block", animation: "pulse 1.2s infinite" }}>
                  🔮
                </span>
                <p style={{ marginTop: "8px", fontSize: "0.74rem", color: "#d5dfd1" }}>
                  The Oracle is reading your spell structure...
                </p>
              </div>
            )}

            {diagnosis && !loading && (
              <>
                {/* Card 1: Code Status */}
                <div
                  className={isVerifiedClean ? styles.challengeSuccess : styles.classifierFeedback}
                  style={{ margin: 0, padding: "12px 14px", borderRadius: "2px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <small style={{ color: isVerifiedClean ? "var(--lime)" : "#ff9f6f", fontWeight: 950 }}>
                      {isVerifiedClean ? "CODE VERIFIED" : "POSSIBLE PATTERN"}
                    </small>
                    <span
                      style={{
                        fontSize: "0.55rem",
                        fontWeight: 900,
                        padding: "2px 6px",
                        background: isVerifiedClean ? "rgba(184, 211, 78, 0.2)" : "rgba(255, 140, 130, 0.2)",
                        color: isVerifiedClean ? "var(--lime)" : "#ffa299",
                        border: `1px solid ${isVerifiedClean ? "#52753a" : "#7d3a33"}`,
                      }}
                    >
                      {isVerifiedClean ? "TESTED" : "MODEL SUGGESTION"}
                    </span>
                  </div>
                  <strong style={{ fontSize: "0.76rem", color: "#ffffff", marginTop: "2px" }}>
                    {isVerifiedClean ? "Great job! No misconception detected." : conceptInfo.title}
                  </strong>
                </div>

                {/* The legacy classifier emits decision scores, not calibrated probabilities. */}
                <div
                  style={{
                    background: "#213426",
                    border: "2px solid #456149",
                    padding: "12px 14px",
                    borderRadius: "2px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ color: "var(--moss)", fontSize: "0.52rem", fontWeight: 950, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      CLASSIFIER SUGGESTION
                    </span>
                    <span style={{ color: "var(--gold)", fontSize: "0.6rem", fontWeight: 900 }}>
                      {typeof modelScore === "number" ? `Decision score ${modelScore.toFixed(3)}` : "Uncalibrated result"}
                    </span>
                  </div>

                  <strong style={{ display: "block", color: "#f3f6f0", fontSize: "0.74rem", marginBottom: "4px" }}>
                    {isVerifiedClean ? "Pattern Logic Verified" : conceptInfo.title}
                  </strong>
                  <p style={{ margin: 0, color: "#c4cec1", fontSize: "0.68rem", lineHeight: 1.5 }}>
                    {isVerifiedClean
                      ? "Your snippet follows clear Python syntax, correctly structures variables, and avoids common algorithmic traps."
                      : conceptInfo.shortDesc}
                  </p>
                </div>

                {/* Card 3: Personalized Learning Hint */}
                <div
                  style={{
                    background: "#213426",
                    border: "2px solid #456149",
                    padding: "12px 14px",
                    borderRadius: "2px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ color: "var(--gold)", fontSize: "0.56rem", fontWeight: 950, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    💡 PERSONALIZED LEARNING HINT
                  </div>

                  <p style={{ margin: 0, color: "#c4cec1", fontSize: "0.68rem", lineHeight: 1.5 }}>
                    {isVerifiedClean
                      ? "Keep writing modular, readable functions as you explore higher level challenges!"
                      : `${conceptInfo.whyItHappens} ${conceptInfo.fixTip}`}
                  </p>

                  <pre className={styles.islandCode} style={{ margin: "4px 0 0", padding: "8px 10px", fontSize: "0.64rem" }}>
                    <code>{conceptInfo.hintCode}</code>
                  </pre>
                </div>

                {/* Card 4: Recommended Practice Topics */}
                <div
                  style={{
                    background: "#213426",
                    border: "2px solid #456149",
                    padding: "12px 14px",
                    borderRadius: "2px",
                  }}
                >
                  <div style={{ color: "var(--moss)", fontSize: "0.52rem", fontWeight: 950, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>
                    RECOMMENDED PRACTICE TOPICS
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {conceptInfo.nextTopics.map((topic, i) => (
                      <div
                        key={topic.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "#142018",
                          border: "1px solid #304533",
                          padding: "5px 8px",
                          fontSize: "0.64rem",
                          color: "#d8dfd3",
                        }}
                      >
                        <span>
                          <strong style={{ color: "var(--lime)", marginRight: "6px" }}>{i + 1}.</strong>
                          {topic.name}
                        </span>
                        <span style={{ color: "#8b9c8a", fontSize: "0.58rem" }}>⏱️ {topic.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
