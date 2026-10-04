import type { ExerciseTestCase, TestCaseResult, TestResults } from "@/types/learning";

export interface PythonRunRequest {
  code: string;
  testCases: ExerciseTestCase[];
  timeoutMs?: number;
}

export interface PythonCodeRunner {
  initialize(): Promise<void>;
  run(request: PythonRunRequest): Promise<TestResults>;
  terminate(): void;
}

/**
 * Creates a PythonCodeRunner backed by public/pyodide-worker.js.
 *
 * The worker loads Pyodide from /pyodide/ (local, served by Next.js) with a
 * CDN fallback. Learner code is executed entirely inside the worker thread and
 * NEVER touches the Next.js server or FastAPI.
 *
 * Security contract:
 *  - Learner code never leaves the browser.
 *  - The worker is force-killed after timeoutMs to kill infinite loops.
 *  - eval() and Function() are not used anywhere in the runner.
 */
export function createPythonCodeRunner(): PythonCodeRunner {
  let worker: Worker | null = null;
  let messageCounter = 0;

  function ensureWorker(): Worker {
    if (typeof window === "undefined") {
      throw new Error("PythonCodeRunner can only be used in browser environments.");
    }
    if (!worker) {
      worker = new Worker("/pyodide-worker.js");
    }
    return worker;
  }

  function terminateWorker() {
    if (worker) {
      worker.terminate();
      worker = null;
    }
  }

  return {
    async initialize(): Promise<void> {
      if (typeof window === "undefined") return;
      const w = ensureWorker();
      const id = ++messageCounter;

      return new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          resolve();
        }, 15_000);

        const handler = (event: MessageEvent) => {
          if (event.data?.id === id) {
            clearTimeout(timeout);
            w.removeEventListener("message", handler);
            resolve();
          }
        };
        w.addEventListener("message", handler);
        w.postMessage({ id, type: "INIT" });
      });
    },

    async run(request: PythonRunRequest): Promise<TestResults> {
      const { code, testCases, timeoutMs = 8000 } = request;
      const w = ensureWorker();
      const id = ++messageCounter;

      return new Promise<TestResults>((resolve, reject) => {
        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
          terminateWorker();
          reject(
            new Error(
              `Execution timed out after ${timeoutMs}ms. Please check for infinite loops.`
            )
          );
        }, timeoutMs);

        const handler = (event: MessageEvent) => {
          if (event.data?.id === id) {
            if (timedOut) return;
            clearTimeout(timer);
            w.removeEventListener("message", handler);

            if (event.data.success) {
              resolve(event.data.results as TestResults);
            } else {
              const cases: TestCaseResult[] = testCases.map((tc) => ({
                input: tc.input,
                args: tc.args,
                expected: tc.expected,
                actual: null,
                passed: false,
                error: event.data.error,
              }));
              resolve({ passed: 0, failed: testCases.length, cases });
            }
          }
        };

        w.addEventListener("message", handler);
        w.postMessage({ id, type: "RUN", code, testCases });
      });
    },

    terminate() {
      terminateWorker();
    },
  };
}
