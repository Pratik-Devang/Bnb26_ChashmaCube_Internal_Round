"use client";

import { useState } from "react";
import { learner } from "@/lib/mock-data";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { PixelSprite } from "@/components/ui/PixelSprite";

export function ProfileView() {
  const [sound, setSound] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [goal, setGoal] = useState("15");

  return (
    <main className="route-page profile-page">
      <PageHeader eyebrow="YOUR EXPLORER" title="Character & camp settings" description="A place for your achievements, your routine, and the way you like to learn." />

      <div className="profile-layout">
        <aside className="profile-card">
          <div className="large-avatar"><PixelSprite /></div>
          <span className="level-pill">LEVEL {learner.level}</span>
          <h2>{learner.name}</h2>
          <p>Python explorer</p>
          <div className="profile-stats"><div><strong>{learner.xp.toLocaleString()}</strong><span>XP</span></div><div><strong>{learner.streak}</strong><span>Day streak</span></div><div><strong>2</strong><span>Mastered</span></div></div>
          <div className="profile-message"><Icon name="sparkles" /><span>Your strength is returning consistently. Keep the sessions small.</span></div>
        </aside>

        <div className="settings-stack">
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
            <div><span className="setting-icon"><Icon name="user" /></span><span><strong>Demo learner</strong><small>Progress currently uses local mock data</small></span></div>
            <button>Manage data</button>
          </section>
        </div>
      </div>
    </main>
  );
}
