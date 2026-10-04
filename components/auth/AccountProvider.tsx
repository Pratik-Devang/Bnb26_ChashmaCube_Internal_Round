"use client";

import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { accountRequest, setActiveLearner } from "@/lib/account";
import type { Learner } from "@/types/learning";
import { PixelSprite } from "@/components/ui/PixelSprite";

const AccountContext = createContext<{ learner: Learner; logout: () => Promise<void> } | null>(null);
export function useAccount() {
  const account = useContext(AccountContext);
  if (!account) throw new Error("AccountProvider is required.");
  return account;
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [learner, setLearner] = useState<Learner | null>(null);
  const [loading, setLoading] = useState(true);
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function signedIn(user: Learner | null) { setActiveLearner(user); setLearner(user); }
  useEffect(() => {
    accountRequest<Learner>("/me").then(signedIn).catch(() => signedIn(null)).finally(() => setLoading(false));
    const expired = () => signedIn(null);
    const refresh = () => { accountRequest<Learner>("/me").then(signedIn).catch(() => {}); };
    window.addEventListener("relearn:session-expired", expired);
    window.addEventListener("relearn:account-updated", refresh);
    return () => {
      window.removeEventListener("relearn:session-expired", expired);
      window.removeEventListener("relearn:account-updated", refresh);
    };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const values = new FormData(event.currentTarget);
    try {
      const user = await accountRequest<Learner>(register ? "/register" : "/login", { method: "POST", body: JSON.stringify({ name: values.get("name"), email: values.get("email"), password: values.get("password") }) });
      signedIn(user);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to sign in."); }
    finally { setBusy(false); }
  }
  async function logout() {
    await accountRequest("/logout", { method: "POST" });
    signedIn(null);
  }
  if (loading) return <main className="account-screen"><p role="status">Opening your journal…</p></main>;
  if (learner) return <AccountContext.Provider value={{ learner, logout }}><div key={learner.id}>{children}</div></AccountContext.Provider>;
  return <main className="account-screen"><section className="account-panel">
    <PixelSprite /><span className="account-kicker">RE:LEARN / YOUR OWN ADVENTURE</span>
    <h1>{register ? "Begin your journey." : "Welcome back, explorer."}</h1>
    <p>Your worlds, progress, and discoveries belong to you.</p>
    <form onSubmit={submit}>
      {register && <label>Explorer name<input name="name" autoComplete="name" maxLength={120} required /></label>}
      <label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label>Password<input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} minLength={10} maxLength={128} required /></label>
      {register && <small>Use at least 10 characters.</small>}
      {error && <p className="account-error" role="alert">{error}</p>}
      <button disabled={busy} type="submit">{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button>
    </form>
    <button className="account-switch" disabled={busy} onClick={() => { setRegister(!register); setError(""); }}>{register ? "Already have an account? Sign in" : "New here? Create an account"}</button>
  </section></main>;
}
