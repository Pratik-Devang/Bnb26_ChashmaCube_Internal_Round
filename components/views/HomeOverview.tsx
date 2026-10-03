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
        eyebrow={`GOOD AFTERNOON, ${learner.name.toUpperCase()}`}
        title="Your learning plan"
        description="Saturday, 3 October · Python foundations"
        action={<Link className="quiet-action" href="/insights">View today’s insight</Link>}
      />

      <div className="dashboard-grid">
        <section className="plan-workspace" aria-label="Learning plan">
          <div className="plan-toolbar">
            <div><span className="page-eyebrow">CURRENT MODULE</span><h2>Loops & iteration</h2></div>
            <div className="compact-stats" aria-label="Learning snapshot">
              <span><strong>6</strong> lessons</span><span><strong>2</strong> mastered</span><span><strong>64%</strong> mastery</span>
            </div>
          </div>

          <article className="featured-lesson">
            <div className="featured-copy">
              <span className="lesson-kicker"><i /> READY · 8 MIN</span>
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
              <p>Four values run. The stop value stays outside.</p>
            </div>
          </article>

          <div className="mini-path" aria-label="Next lessons">
            {learningModules.slice(0, 4).map((module, index) => (
              <article key={module.id} className={`mini-path-card tone-${module.accent}`}>
                <span>{module.status === "completed" ? "✓" : index + 1}</span>
                <div><small>{module.status}</small><strong>{module.title}</strong></div>
                <b>{module.progress ? `${module.progress}%` : `+${module.xpReward}`}</b>
              </article>
            ))}
          </div>

          <div className="home-support-grid">
            <Link href="/insights" className="misconception-signal">
              <span className="support-icon"><Icon name="brain" /></span>
              <div><small>LATEST LEARNING SIGNAL</small><strong>Range stops before the final value</strong><p>Your last answer shows exactly what to practice next.</p></div>
              <b>Review</b>
            </Link>
            <section className="practice-pulse" aria-label="Practice rhythm">
              <div><small>FOCUS RHYTHM</small><strong>5 sessions this week</strong></div>
              <div className="pulse-bars">{[38, 62, 28, 74, 53, 88, 18].map((height, index) => <i key={index} className={index === 5 ? "peak" : ""} style={{ height: `${height}%` }} />)}</div>
              <span>92 min</span>
            </section>
          </div>
        </section>

        <aside className="today-panel" aria-label="Today">
          <div className="today-heading"><div><span className="page-eyebrow">SATURDAY</span><h2>Today</h2></div><span className="date-badge">03</span></div>

          <article className="day-streak-card"><Icon name="flame" /><div><strong>{learner.streak} day streak</strong><span>One focused session keeps it going.</span></div></article>

          <section className="quest-overview">
            <div className="section-heading"><div><span>DAILY QUESTS</span><h2>{completed}/{quests.length} complete</h2></div><span className="round-count">{quests.length - completed}</span></div>
            <div className="home-quests">
              {quests.map((quest) => (
                <button key={quest.id} className={quest.status === "completed" ? "done" : ""} onClick={() => setQuests((items) => items.map((item) => item.id === quest.id ? { ...item, status: "completed" } : item))} disabled={quest.status === "completed"}>
                  <span>{quest.status === "completed" ? "✓" : quest.icon}</span>
                  <div><strong>{quest.title}</strong><small>+{quest.xpReward} XP</small></div>
                  <i>{quest.status === "completed" ? "Done" : "Mark"}</i>
                </button>
              ))}
            </div>
          </section>

          <section className="week-strip" aria-label="Practice this week">
            <div><span className="page-eyebrow">THIS WEEK</span><strong>92 min</strong></div>
            <div className="week-dots">{[1, 1, 1, 1, 1, 1, 0].map((done, index) => <span key={index} className={done ? "done" : ""}>{["M", "T", "W", "T", "F", "S", "S"][index]}</span>)}</div>
          </section>
        </aside>
      </div>
    </main>
  );
}
