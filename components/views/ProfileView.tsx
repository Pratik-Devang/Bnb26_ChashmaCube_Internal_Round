"use client";

import { useEffect, useState } from "react";
import { accountRequest } from "@/lib/account";
import { useAccount } from "@/components/auth/AccountProvider";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { PixelSprite } from "@/components/ui/PixelSprite";

export function ProfileView() {
  const { learner, logout } = useAccount();
  const [accountError, setAccountError] = useState("");
  const [sound, setSound] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [goal, setGoal] = useState("15");
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  useEffect(() => {
    let active = true;
    accountRequest<{ sound: boolean; reminders: boolean; goal: number }>("/preferences").then((data) => {
      if (active) { setSound(data.sound); setReminders(data.reminders); setGoal(String(data.goal)); setPreferencesReady(true); }
    }).catch(() => { if (active) setAccountError("Could not load your preferences. Refresh to try again."); });
    return () => { active = false; };
  }, []);
  async function savePreferences() {
    setSavingPreferences(true); setAccountError(""); setSavedMessage("");
    try { await accountRequest("/preferences", { method: "PUT", body: JSON.stringify({ sound, reminders, goal: Number(goal) }) }); setSavedMessage("Preferences saved."); }
    catch { setAccountError("Could not save your preferences. Please try again."); }
    finally { setSavingPreferences(false); }
  }

  return (
    <main className="route-page profile-page">
      <PageHeader eyebrow="YOUR EXPLORER" title="Character & camp settings" description="A place for your achievements, your routine, and the way you like to learn." />

      <div className="profile-layout">
        <aside className="profile-card">
          <div className="large-avatar"><PixelSprite /></div>
          <span className="level-pill">LEVEL {learner.level}</span>
          <h2>{learner.name}</h2>
          <p>Python explorer</p>
          <div className="profile-stats"><div><strong>{learner.xp.toLocaleString()}</strong><span>XP</span></div><div><strong>{learner.streak}</strong><span>Day streak</span></div><div><strong>{learner.level}</strong><span>Level</span></div></div>
          <div className="profile-message"><Icon name="sparkles" /><span>Your strength is returning consistently. Keep the sessions small.</span></div>
        </aside>

        <div className="settings-stack">
          <button className="solid-action" disabled={!preferencesReady || savingPreferences} onClick={savePreferences}>{savingPreferences ? "Saving…" : "Save preferences"}</button>
          {savedMessage && <p role="status">{savedMessage}</p>}
          <section className="surface-card settings-card">
            <div className="section-heading"><div><span>LEARNING ROUTINE</span><h2>Daily goal</h2></div></div>
            <label className="goal-setting"><span><strong>Focused minutes</strong><small>A manageable target for each day</small></span><select value={goal} onChange={(event) => setGoal(event.target.value)}><option value="10">10 minutes</option><option value="15">15 minutes</option><option value="20">20 minutes</option><option value="30">30 minutes</option></select></label>
          </section>

          <section className="surface-card settings-card">
            <div className="section-heading"><div><span>EXPERIENCE</span><h2>Lesson preferences</h2></div></div>
            <button className="setting-row" onClick={() => setSound((value) => !value)} aria-pressed={sound}><span className="setting-icon">♫</span><span><strong>Game sounds</strong><small>Audio feedback during mini-games</small></span><i className={sound ? "on" : ""}><b /></i></button>
            <button className="setting-row" onClick={() => setReminders((value) => !value)} aria-pressed={reminders}><span className="setting-icon">◷</span><span><strong>Gentle reminders</strong><small>One reminder when your streak needs attention</small></span><i className={reminders ? "on" : ""}><b /></i></button>
          </section>

          <section className="surface-card account-card">
            <div><span className="setting-icon"><Icon name="user" /></span><span><strong>{learner.name}</strong><small>Your personal learning account</small></span></div>
            <button onClick={() => { logout().catch(() => setAccountError("Could not sign out. Please try again.")); }}>Sign out</button>
            {accountError && <p role="alert">{accountError}</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
