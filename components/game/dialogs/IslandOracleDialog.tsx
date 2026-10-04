"use client";

import { useEffect, useRef, useState } from "react";
import { diagnoseCode } from "@/lib/api";
import type { MLDiagnoseResponse } from "@/types/learning";
import styles from "../GameWorld.module.css";

type Props = {
  onClose: () => void;
  onRewardCoins?: (amount: number) => void;
};

// Curated misconception insights for specific, student-friendly feedback
const CONCEPT_KNOWLEDGE: Record<
  number,
  {
    title: string;
    explanation: string;
    patternHint: string;
    actionTip: string;
  }
> = {
  15: {
    title: "Zero-Based List Indexing",
    explanation: "In Python, sequence indexing starts at 0. The first item is at [0], the second is at [1].",
    patternHint: "first_item = items[0]   # Index 0 retrieves the very first element",
    actionTip: "Use index 0 instead of index 1 to access the beginning of any list or string.",
  },
  33: {
    title: "Range Upper Bound is Exclusive",
    explanation: "range(1, n) stops before n. To include the number n in your loop, use range(1, n + 1).",
    patternHint: "for i in range(1, n + 1):  # Goes from 1 up to n (inclusive)",
    actionTip: "Add + 1 to the range stop value so the loop executes through the final target number.",
  },
  31: {
    title: "Clean Return Statement",
    explanation: "In Python, 'return' is a keyword statement, not a function — parentheses are unnecessary.",
    patternHint: "return a + b            # No parentheses around return expression",
    actionTip: "Write return value directly without surrounding parentheses.",
  },
  16: {
    title: "Equality Comparison vs Assignment",
    explanation: "Use '==' to test equality in if/while conditions. A single '=' assigns a value.",
    patternHint: "if score == 10:          # Use == to compare values in conditions",
    actionTip: "Replace '=' with '==' inside conditional expressions.",
  },
  22: {
    title: "Function Calls Use Parentheses",
    explanation: "Functions are called with parentheses (), while square brackets [] are only for indexing.",
    patternHint: "result = solve(10)       # Call functions with (), not []",
    actionTip: "Change square brackets to parentheses when invoking functions.",
  },
  11: {
    title: "Return Values vs Console Print",
    explanation: "print() only outputs to the screen. Functions should return values so callers can use them.",
    patternHint: "return total             # Returns value to caller instead of print(total)",
    actionTip: "Use return so the computed result can be stored and used in subsequent operations.",
  },
  41: {
    title: "Copying Mutable Lists & References",
    explanation: "Assigning b = a creates a shared reference. Use a.copy() or a[:] for an independent copy.",
    patternHint: "backup = original.copy() # Creates a separate, independent duplicate list",
    actionTip: "Use .copy() or slice [:] when you need an independent duplicate of a list.",
  },
  5: {
    title: "Loop Step & Counter Update",
    explanation: "A while loop requires its control counter to advance inside the body to prevent infinite loops.",
    patternHint: "i += 1                   # Always update counter on each iteration",
    actionTip: "Ensure your loop variable increments so the loop terminates cleanly.",
  },
  4: {
    title: "Accumulator Initialization",
    explanation: "Sum accumulators start at 0, while product accumulators start at 1 before loop iterations.",
    patternHint: "total = 0                # Start sum accumulator at 0",
    actionTip: "Initialize your total before entering the loop body.",
  },
  46: {
    title: "Block Indentation Structure",
    explanation: "Python uses 4-space indentation to determine which code belongs inside loops and functions.",
    patternHint: "def calculate(n):\n    total = 0         # Indented inside function",
    actionTip: "Align indentation consistently so each statement belongs to the right parent block.",
  },
};

const SAMPLE_BUGS = [
  {
    code: "def get_first(items):\n    # Trying to get the first element:\n    first = items[1]\n    return first\n\nprint(get_first([10, 20, 30]))",
  },
  {
    code: "def calculate_sum(n):\n    total = 0\n    # Sum from 1 up to n:\n    for i in range(1, n):\n        total += i\n    return total\n\nprint(calculate_sum(5))",
  },
  {
    code: "score = 10\nbonus = 5\ntotal = score + bonus\nif total = 15:\n    print(\"Target reached!\")",
  },
  {
    code: "def add_numbers(a, b):\n    return(a + b)\n\nprint(add_numbers(5, 3))",
  },
];

// Run arbitrary Python code via a sandboxed worker and capture stdout
function runPythonFreeform(code: string, timeoutMs = 5000): Promise<string> {
  return new Promise((resolve) => {
    const workerSrc = `
      let pyodide = null;
      async function init() {
        try {
          importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
          pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/" });
        } catch(e) { pyodide = null; }
      }
      const ready = init();
      self.onmessage = async (e) => {
        await ready;
        const code = e.data;
        if (!pyodide) {
          self.postMessage({ output: "", error: "Pyodide unavailable. Check internet connection for live runner." });
          return;
        }
        const lines = [];
        pyodide.globals.set("__oracle_output__", lines);
        try {
          let stdout = "";
          pyodide.setStdout({ batched: (s) => { stdout += s + "\\n"; } });
          pyodide.setStderr({ batched: (s) => { stdout += "\\u26a0\\ufe0f " + s + "\\n"; } });
          pyodide.runPython(code);
          self.postMessage({ output: stdout.trim(), error: null });
        } catch(err) {
          self.postMessage({ output: "", error: String(err) });
        }
      };
    `;

    const blob = new Blob([workerSrc], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    const timer = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve("⏱️ Execution timed out (5s limit).");
    }, timeoutMs);

    worker.onmessage = (e) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      const { output, error } = e.data as { output: string; error: string | null };
      if (error) {
        resolve(`❌ ${error}`);
      } else if (output) {
        resolve(output);
      } else {
        resolve("(Code ran successfully — no print output returned)");
      }
    };

    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(`❌ Worker error: ${e.message}`);
    };

    worker.postMessage(code);
  });
}

export function IslandOracleDialog({ onClose, onRewardCoins }: Props) {
  const [sampleIndex, setSampleIndex] = useState(0);
  const [code, setCode] = useState<string>(SAMPLE_BUGS[0].code);
  const [diagnosis, setDiagnosis] = useState<MLDiagnoseResponse | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"diagnosis" | "output">("diagnosis");
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasConsulted, setHasConsulted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Run initial diagnosis on default sample
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const result = await diagnoseCode(SAMPLE_BUGS[0].code);
        if (isMounted) setDiagnosis(result);
      } catch {
        // silent initial fallback
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDiagnose = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setActiveTab("diagnosis");
    try {
      const result = await diagnoseCode(code);
      setDiagnosis(result);
      if (!hasConsulted) {
        setHasConsulted(true);
        onRewardCoins?.(10);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "The Oracle could not be reached.");
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    if (!code.trim()) return;
    setRunning(true);
    setOutput(null);
    setActiveTab("output");
    const result = await runPythonFreeform(code);
    setOutput(result);
    setRunning(false);
  };

  const handleLoadSample = () => {
    const nextIndex = (sampleIndex + 1) % SAMPLE_BUGS.length;
    setSampleIndex(nextIndex);
    setCode(SAMPLE_BUGS[nextIndex].code);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = code.substring(0, start) + "    " + code.substring(end);
      setCode(next);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      });
    }
  };

  // Resolve clean specific details for current diagnosis
  const conceptId = diagnosis?.misconception_id ?? diagnosis?.top_prediction?.id ?? 15;
  const curated = CONCEPT_KNOWLEDGE[conceptId];
  const conceptTitle = curated?.title || `Concept #${conceptId}`;
  const conceptDesc =
    diagnosis?.misconception ??
    diagnosis?.top_prediction?.misconception ??
    curated?.explanation ??
    "Pattern analyzed by the trained ML misconception classifier.";

  const isRawSVMDebug = (str?: string) =>
    !str || str.toLowerCase().includes("svm model") || str.toLowerCase().includes("classes)");

  const patternHint =
    !isRawSVMDebug(diagnosis?.evidence) && diagnosis?.evidence
      ? diagnosis.evidence
      : curated?.patternHint || "# Follow standard Python conventions for this pattern";

  const actionTip =
    curated?.actionTip || "Verify this line against standard Python documentation and adjust your implementation.";

  return (
    <div className={styles.dialogScrim} role="presentation" onMouseDown={onClose}>
      <section
        className={`${styles.dialog} ${styles.challengeDialog}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="island-oracle-title"
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          maxWidth: "960px",
          width: "min(960px, calc(100vw - 48px))",
          background: "#112016",
          border: "2px solid #284732",
          borderRadius: "12px",
          padding: 0,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(74, 222, 128, 0.08)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.2rem 1.5rem 1rem",
            borderBottom: "1px solid #1f3827",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            background: "linear-gradient(180deg, #162a1e 0%, #112016 100%)",
          }}
        >
          <div>
            <span
              style={{
                color: "#a3e635",
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              ISLAND AI ORACLE
            </span>
            <h2
              id="island-oracle-title"
              style={{
                color: "#f9fafb",
                fontSize: "1.45rem",
                fontWeight: 800,
                margin: 0,
                letterSpacing: "-0.015em",
              }}
            >
              Spell &amp; Code Diagnoser
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close Oracle dialog"
            style={{
              background: "#192e21",
              border: "1px solid #33593f",
              color: "#9ca3af",
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "1.2rem",
              lineHeight: 1,
              transition: "color 0.15s, background 0.15s",
            }}
          >
            ×
          </button>
        </div>

        {/* Two-column body */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: "1.5rem",
            padding: "1.5rem",
            minHeight: "380px",
          }}
        >
          {/* LEFT COLUMN — code input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <p style={{ color: "#9ca3af", fontSize: "0.85rem", lineHeight: 1.45, margin: 0 }}>
              Test any Python snippet below. The Island’s AI ML model will inspect your syntax, variables, and logic to spot misconceptions:
            </p>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Python code"
              spellCheck={false}
              style={{
                flex: 1,
                minHeight: "220px",
                background: "#08130c",
                border: "1px solid #23422d",
                borderRadius: "8px",
                color: "#f3f4f6",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "0.88rem",
                lineHeight: 1.6,
                padding: "0.9rem",
                resize: "none",
                outline: "none",
                boxShadow: "inset 0 2px 6px rgba(0, 0, 0, 0.4)",
              }}
              disabled={loading || running}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  style={{
                    background: "#16271c",
                    border: "1px solid #284732",
                    color: "#9ca3af",
                    fontSize: "0.8rem",
                    padding: "0.55rem 0.85rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                >
                  Load Sample Bug
                </button>
                <button
                  type="button"
                  onClick={handleRun}
                  disabled={running || loading || !code.trim()}
                  style={{
                    background: "#13311e",
                    border: "1px solid #376343",
                    color: "#86efac",
                    fontSize: "0.8rem",
                    padding: "0.55rem 0.85rem",
                    borderRadius: "6px",
                    cursor: running ? "wait" : "pointer",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  {running ? "▶ Running..." : "▶ Output"}
                </button>
              </div>
              <button
                type="button"
                onClick={handleDiagnose}
                disabled={loading || running || !code.trim()}
                style={{
                  background: "#bef264",
                  color: "#0f1f14",
                  border: "1px solid #a3e635",
                  fontSize: "0.825rem",
                  padding: "0.55rem 1.1rem",
                  borderRadius: "6px",
                  fontWeight: 700,
                  cursor: loading ? "wait" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  boxShadow: "0 2px 8px rgba(190, 242, 100, 0.25)",
                }}
              >
                {loading ? "Inspecting..." : "Consult the AI Oracle ✨"}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN — oracle diagnosis & output */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* View Selector Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #1f3827", paddingBottom: "0.4rem", gap: "1.2rem" }}>
              <button
                type="button"
                onClick={() => setActiveTab("diagnosis")}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0 0 0.35rem 0",
                  color: activeTab === "diagnosis" ? "#a3e635" : "#6b7280",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  borderBottom: activeTab === "diagnosis" ? "2px solid #a3e635" : "2px solid transparent",
                  transition: "color 0.15s",
                }}
              >
                ORACLE DIAGNOSIS
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("output")}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0 0 0.35rem 0",
                  color: activeTab === "output" ? "#86efac" : "#6b7280",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  borderBottom: activeTab === "output" ? "2px solid #86efac" : "2px solid transparent",
                  transition: "color 0.15s",
                }}
              >
                CODE OUTPUT
              </button>
            </div>

            {/* DIAGNOSIS TAB */}
            {activeTab === "diagnosis" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {/* Top Concept Box */}
                <div
                  style={{
                    background: "linear-gradient(180deg, #132419 0%, #0e1b13 100%)",
                    border: "1px solid #23442e",
                    borderRadius: "8px",
                    padding: "1rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <small
                      style={{
                        color: "#86efac",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      DETECTED CONCEPT
                    </small>
                    <span
                      style={{
                        background: "rgba(163, 230, 53, 0.12)",
                        border: "1px solid rgba(163, 230, 53, 0.25)",
                        color: "#bef264",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      #{conceptId}
                    </span>
                  </div>
                  <h3
                    style={{
                      color: "#f9fafb",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      margin: "0 0 0.35rem 0",
                      lineHeight: 1.3,
                    }}
                  >
                    {conceptTitle}
                  </h3>
                  <p
                    style={{
                      color: "#d1d5db",
                      fontSize: "0.8rem",
                      lineHeight: 1.45,
                      margin: 0,
                    }}
                  >
                    {conceptDesc}
                  </p>
                </div>

                {/* Bottom Pattern Hint Box */}
                <div
                  style={{
                    background: "linear-gradient(180deg, #122016 0%, #0d1710 100%)",
                    border: "1px solid #203c28",
                    borderRadius: "8px",
                    padding: "0.9rem 1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  <div
                    style={{
                      color: "#fde047",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <span>💡</span> Oracle’s Pattern Hint:
                  </div>
                  <div
                    style={{
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      fontSize: "0.76rem",
                      color: "#86efac",
                      background: "#060d08",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "6px",
                      border: "1px solid #1a3221",
                      lineHeight: 1.45,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {patternHint}
                  </div>
                  <div
                    style={{
                      color: "#93c5fd",
                      fontSize: "0.74rem",
                      fontStyle: "italic",
                      lineHeight: 1.4,
                    }}
                  >
                    👉 {actionTip}
                  </div>
                </div>

                {error ? (
                  <p style={{ color: "#f87171", fontSize: "0.75rem", margin: 0 }}>{error}</p>
                ) : null}
              </div>
            ) : null}

            {/* OUTPUT TAB */}
            {activeTab === "output" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div
                  style={{
                    background: "#060d08",
                    border: "1px solid #1a3221",
                    borderRadius: "8px",
                    padding: "0.9rem",
                    minHeight: "220px",
                    maxHeight: "280px",
                    overflowY: "auto",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: "0.8rem",
                    lineHeight: 1.6,
                    color: output?.startsWith("❌")
                      ? "#f87171"
                      : output?.startsWith("⏱️")
                      ? "#fbbf24"
                      : "#86efac",
                    whiteSpace: "pre-wrap",
                    boxShadow: "inset 0 2px 6px rgba(0, 0, 0, 0.4)",
                  }}
                >
                  {running ? (
                    <span style={{ color: "#fde047" }}>⏳ Executing Python in sandbox...</span>
                  ) : output ? (
                    output
                  ) : (
                    <span style={{ color: "#6b7280" }}>
                      Click <strong>▶ Output</strong> to run your Python code in the browser and see printed output.
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
