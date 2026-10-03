"use client";

import Link from "next/link";
import { useState } from "react";
import { learner, learningModules, quests as initialQuests } from "@/lib/mock-data";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";

export function HomeOverview() {
  const [quests, setQuests] = useState(initialQuests);
  const activeLesson = learningModules.find((item) => item.status === "active")!;
  const completed = quests.filter((quest) => quest.status === "completed").length;

  return (
    <main className="route-page home-page">
      <PageHeader
        eyebrow="SATURDAY · YOUR NEXT SMALL WIN"
        title={`Good afternoon, ${learner.name}`}
        description="Keep your momentum with one focused Python idea. No rushing, no penalty for another try."
        action={<Link className="quiet-action" href="/insights">View today’s insight</Link>}
      />

      <section className="home-hero" aria-label="Current learning focus">
        <div className="hero-copy">
          <span className="hero-label">CONTINUE LEARNING · 8 MIN</span>
          <h2>{activeLesson.title}</h2>
          <p>{activeLesson.description}</p>
          <div className="hero-progress"><span><i style={{ width: `${activeLesson.progress}%` }} /></span><strong>{activeLesson.progress}%</strong></div>
          <Link href="/learn" className="solid-action"><Icon name="play" />Continue lesson</Link>
        </div>
        <div className="boundary-preview" aria-label="Range one to five stops before five">
          <span className="preview-code">range(1, 5)</span>
          <div className="preview-steps">
            {[1, 2, 3, 4, 5].map((step) => <span key={step} className={step === 5 ? "stop" : "visited"}>{step}{step === 5 ? <small>stop</small> : null}</span>)}
          </div>
          <p>Four steps visited. One boundary idea to unlock.</p>
        </div>
      </section>

      <section className="metric-row" aria-label="Learning snapshot">
        <article><span className="metric-icon mint"><Icon name="bolt" /></span><div><strong>{learner.xp.toLocaleString()}</strong><p>Total XP</p></div><small>+180 this week</small></article>
        <article><span className="metric-icon yellow"><Icon name="flame" /></span><div><strong>{learner.streak}</strong><p>Day streak</p></div><small>Best: 9 days</small></article>
        <article><span className="metric-icon lilac"><Icon name="target" /></span><div><strong>64%</strong><p>Loop mastery</p></div><small>Improving steadily</small></article>
      </section>

      <div className="home-grid">
        <section className="surface-card weekly-card">
          <div className="section-heading"><div><span>LEARNING RHYTHM</span><h2>Five focused sessions</h2></div><strong>92 min</strong></div>
          <div className="week-chart" aria-label="Minutes practiced this week">
            {[42, 68, 36, 82, 57, 94, 24].map((height, index) => <div key={index}><i style={{ height: `${height}%` }} className={index === 5 ? "today" : ""} /><span>{["M", "T", "W", "T", "F", "S", "S"][index]}</span></div>)}
          </div>
        </section>

        <section className="surface-card quest-overview">
          <div className="section-heading"><div><span>DAILY QUESTS</span><h2>{completed}/{quests.length} complete</h2></div><span className="round-count">{quests.length - completed} left</span></div>
          <div className="home-quests">
            {quests.map((quest) => (
              <button key={quest.id} className={quest.status === "completed" ? "done" : ""} onClick={() => setQuests((items) => items.map((item) => item.id === quest.id ? { ...item, status: "completed" } : item))} disabled={quest.status === "completed"}>
                <span>{quest.status === "completed" ? "✓" : quest.icon}</span>
                <div><strong>{quest.title}</strong><small>+{quest.xpReward} XP</small></div>
                <i>{quest.status === "completed" ? "Done" : "Mark done"}</i>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
