import type { ExerciseTestCase, TestResults } from "@/types/learning";

export interface PythonRunRequest {
  code: string;
  testCases: ExerciseTestCase[];
  timeoutMs: number;
}

export interface PythonCodeRunner {
  initialize(): Promise<void>;
  run(request: PythonRunRequest): Promise<TestResults>;
  terminate(): void;
}

/**
 * Future browser-only adapter point for Pyodide running in a Web Worker.
 * The worker must enforce a time limit and receive only predefined tests.
 * Learner code must never be forwarded to an application server for execution.
 */
export function createPythonCodeRunner(): PythonCodeRunner {
  return {
    async initialize() {
      throw new Error("Pyodide worker is not connected in the frontend scaffold.");
    },
    async run(_request) {
      throw new Error("Python execution will be implemented with a restricted Pyodide Web Worker.");
    },
    terminate() {
      // The future adapter will terminate its dedicated Worker here.
    },
  };
}
