import type { Learner } from "@/types/learning";

// Keep browser requests same-origin in development. Next proxies this path to FastAPI,
// which avoids CORS and localhost/127.0.0.1 mismatches between browsers.
export const accountApiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "/relearn-api").replace(/\/+$/, "");
let activeLearner: Learner | null = null;
export const setActiveLearner = (learner: Learner | null) => { activeLearner = learner; };
export function currentLearnerId() {
  if (!activeLearner) throw new Error("Sign in to continue.");
  return activeLearner.id;
}
export async function accountRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${accountApiBase}/api/v1/auth${path}`, { ...init, credentials: "include", cache: "no-store", headers: { "Content-Type": "application/json", ...(activeLearner ? { "X-Learner-Id": activeLearner.id } : {}), ...init?.headers } });
  } catch {
    throw new Error("The Re:Learn server is offline. Start the full app with npm run dev:full, then try again.");
  }
  const data = await response.json();
  if (response.status === 401 && path !== "/login" && typeof window !== "undefined") window.dispatchEvent(new Event("relearn:session-expired"));
  if (!response.ok) throw new Error(typeof data.message === "string" ? data.message : "Unable to complete your request.");
  return data;
}
