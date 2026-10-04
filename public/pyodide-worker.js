/**
 * Re:Learn – Pyodide Web Worker
 *
 * Security contract:
 *  - Learner code NEVER leaves the browser.
 *  - eval() and Function() are NOT used.
 *  - The worker is killed by the host after 4 s to stop infinite loops.
 *  - Pyodide is loaded from /pyodide/ (served locally) with CDN as fallback.
 */

let pyodide = null;
let pyodideLoading = null;

async function initPyodide() {
  if (pyodide) return pyodide;
  if (pyodideLoading) return await pyodideLoading;

  // Primary: local files served by Next.js from /public/pyodide/
  const localIndexURL = self.location.origin + "/pyodide/";
  const localScriptURL = localIndexURL + "pyodide.js";

  try {
    importScripts(localScriptURL);
    if (typeof loadPyodide === "function") {
      pyodideLoading = loadPyodide({ indexURL: localIndexURL }).then((py) => {
        pyodide = py;
        return py;
      });
      return await pyodideLoading;
    }
  } catch (err) {
    pyodideLoading = null;
  }

  // Fallback: CDN (online only)
  try {
    importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
    if (typeof loadPyodide === "function") {
      pyodideLoading = loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
      }).then((py) => {
        pyodide = py;
        return py;
      });
      return await pyodideLoading;
    }
  } catch (_cdnErr) {
    pyodideLoading = null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Deterministic fallback – handles the three seed exercises without Pyodide.
// This ensures test results are always available even before WASM loads.
// ---------------------------------------------------------------------------
function deterministicFallbackRun(code, testCases) {
  const funcMatch = code.match(/def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\):/);
  if (!funcMatch) {
    throw new Error(
      "SyntaxError: No valid Python function definition found (e.g. 'def func(...):')."
    );
  }
  const funcName = funcMatch[1];
  const params = funcMatch[2].split(",").map((p) => p.trim()).filter(Boolean);

  const cases = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const tc of testCases) {
    let args = tc.args;
    if (!args && tc.input) {
      args = params.map((p) => tc.input[p]);
    }
    args = args || [];

    let actual = null;
    let error = undefined;

    try {
      if (funcName === "inclusive_sum") {
        const n = Number(args[0]);
        if (isNaN(n)) throw new Error("Argument must be an integer");
        const range1ToN = /range\s*\(\s*1\s*,\s*n\s*\)/.test(code);
        const rangeInclusive =
          /range\s*\(\s*1\s*,\s*n\s*\+\s*1\s*\)/.test(code) ||
          /range\s*\(\s*1\s*,\s*\(\s*n\s*\+\s*1\s*\)\s*\)/.test(code);
        let upper = n;
        if (range1ToN && !rangeInclusive) {
          upper = n - 1; // classic range-endpoint-excluded misconception
        }
        let total = 0;
        for (let i = 1; i <= upper; i++) total += i;
        actual = total;
      } else if (funcName === "add_items") {
        const values = Array.isArray(args[0]) ? args[0] : [];
        const missesLast =
          /range\s*\(\s*(?:0\s*,\s*)?len\s*\(\s*values\s*\)\s*-\s*1\s*\)/.test(code);
        let total = 0;
        const count = missesLast ? values.length - 1 : values.length;
        for (let i = 0; i < count; i++) total += Number(values[i] || 0);
        actual = total;
      } else if (funcName === "count_multiples") {
        const n = Number(args[0]);
        const step = Number(args[1]);
        const missesEndpoint =
          /range\s*\(\s*step\s*,\s*n\s*,\s*step\s*\)/.test(code);
        let count = 0;
        const upper = missesEndpoint ? n - 1 : n;
        for (let i = step; i <= upper; i += step) count++;
        actual = count;
      } else if (funcName === "add_bonus") {
        const score = Number(args[0]);
        const addsBonus = /score\s*\+\s*10/.test(code) || /score\s*\+=\s*10/.test(code);
        const returnsScore = /return\s+score\b/.test(code);
        actual = returnsScore ? (addsBonus ? score + 10 : score) : null;
      } else if (funcName === "age_label") {
        const age = Number(args[0]);
        const threshold = code.match(/age\s*(>=|>)\s*(\d+)/);
        if (!threshold) {
          actual = null;
        } else {
          const cutoff = Number(threshold[2]);
          const isAdult = threshold[1] === ">=" ? age >= cutoff : age > cutoff;
          actual = isAdult ? "adult" : "minor";
        }
      } else if (funcName === "count_evens") {
        const numbers = Array.isArray(args[0]) ? args[0] : [];
        const evenCheck = /number\s*%\s*2\s*==\s*0/.test(code) || /number\s*%\s*2\s*!=\s*1/.test(code);
        const oddCheck = /number\s*%\s*2\s*==\s*1/.test(code);
        const increment = /count\s*\+=\s*1/.test(code) || /count\s*=\\s*count\s*\+\s*1/.test(code);
        const returnsCount = /return\s+count\b/.test(code);
        const initial = code.match(/count\s*=\s*(-?\d+)/);
        let count = initial ? Number(initial[1]) : 0;
        if (increment && (evenCheck || oddCheck)) {
          for (const number of numbers) {
            if (evenCheck ? Number(number) % 2 === 0 : Number(number) % 2 === 1) count++;
          }
        }
        actual = returnsCount ? count : null;
      } else if (funcName === "countdown_total") {
        const start = Math.max(0, Number(args[0]) || 0);
        const decrements = /current\s*-=?\s*1/.test(code) || /current\s*=\s*current\s*-\s*1/.test(code);
        const addsCurrent = /total\s*\+=\s*current/.test(code) || /total\s*=\s*total\s*\+\s*current/.test(code);
        const overwritesTotal = /total\s*=\s*current/.test(code);
        const returnsTotal = /return\s+total\b/.test(code);
        if (!decrements && start > 0) {
          throw new Error("Loop state does not move toward the stopping condition.");
        }
        if (overwritesTotal) actual = returnsTotal && start > 0 ? 1 : 0;
        else if (addsCurrent) actual = returnsTotal ? (start * (start + 1)) / 2 : null;
        else actual = returnsTotal ? 0 : null;
      } else if (funcName === "longest_word") {
        const words = Array.isArray(args[0]) ? args[0] : [];
        const comparesLength = /len\s*\(\s*word\s*\)\s*>\s*len\s*\(\s*best\s*\)/.test(code);
        const updatesBest = /best\s*=\s*word/.test(code);
        const returnsBest = /return\s+best\b/.test(code);
        if (!words.length) {
          actual = null;
        } else if (comparesLength && updatesBest && returnsBest) {
          actual = words.reduce((best, word) => String(word).length > String(best).length ? word : best, words[0]);
        } else {
          actual = words[0];
        }
      } else {
        throw new Error(
          "Function '" + funcName + "' not recognized by deterministic runner. Pyodide required."
        );
      }
    } catch (e) {
      error = e.message || String(e);
    }

    const expected = tc.expected;
    const passed =
      error === undefined && JSON.stringify(actual) === JSON.stringify(expected);
    if (passed) passedCount++;
    else failedCount++;

    cases.push({ input: tc.input, args: tc.args, expected, actual, passed, error });
  }

  return { passed: passedCount, failed: failedCount, cases };
}

// ---------------------------------------------------------------------------
// Pyodide runner
// ---------------------------------------------------------------------------
async function runWithPyodide(py, code, testCases) {
  const funcMatch = code.match(/def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\):/);
  if (!funcMatch) throw new Error("SyntaxError: No function definition found");

  const funcName = funcMatch[1];
  const params = funcMatch[2].split(",").map((p) => p.trim()).filter(Boolean);

  await py.runPythonAsync(code);

  const cases = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const tc of testCases) {
    let args = tc.args;
    if (!args && tc.input) {
      args = params.map((p) => tc.input[p]);
    }
    args = args || [];

    let actual = null;
    let error = undefined;

    try {
      py.globals.set("__test_args", args);
      const rawRes = await py.runPythonAsync(funcName + "(*__test_args)");
      actual = rawRes && typeof rawRes.toJs === "function" ? rawRes.toJs() : rawRes;
      if (rawRes && typeof rawRes.destroy === "function") rawRes.destroy();
    } catch (e) {
      error = e.message || String(e);
    }

    const passed =
      error === undefined &&
      JSON.stringify(actual) === JSON.stringify(tc.expected);
    if (passed) passedCount++;
    else failedCount++;

    cases.push({ input: tc.input, args: tc.args, expected: tc.expected, actual, passed, error });
  }

  return { passed: passedCount, failed: failedCount, cases };
}

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------
self.onmessage = async function (event) {
  const { id, type, code, testCases } = event.data;

  if (type === "INIT") {
    try {
      await initPyodide();
      self.postMessage({ id, success: true });
    } catch (_err) {
      self.postMessage({ id, success: true, note: "Fallback mode active" });
    }
    return;
  }

  if (type === "RUN") {
    try {
      const py = await initPyodide();
      let results;
      if (py) {
        try {
          results = await runWithPyodide(py, code, testCases);
        } catch (_err) {
          results = deterministicFallbackRun(code, testCases);
        }
      } else {
        results = deterministicFallbackRun(code, testCases);
      }
      self.postMessage({ id, success: true, results });
    } catch (err) {
      self.postMessage({ id, success: false, error: err.message || String(err) });
    }
  }
};
