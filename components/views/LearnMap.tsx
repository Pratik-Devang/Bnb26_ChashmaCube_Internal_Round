"use client";

import { useMemo, useState } from "react";
import { learningModules } from "@/lib/mock-data";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";

export function LearnMap() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("loop-boundaries");
  const modules = useMemo(() => learningModules.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())), [query]);
  const active = learningModules.find((item) => item.id === selected) ?? learningModules[2];

  return (
    <main className="route-page learn-page">
      <PageHeader
        eyebrow="PYTHON FOUNDATIONS"
        title="Your learning path"
        description="Move one concept at a time. Completed ideas stay visible, and the next useful step is always clear."
        action={<label className="route-search"><Icon name="search" /><span className="sr-only">Search lessons</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a concept" /></label>}
      />

      <div className="learn-layout">
        <section className="learning-map" aria-label="Python concept path">
          <div className="map-line" aria-hidden="true" />
          {modules.map((module, index) => (
            <button key={module.id} className={`map-stop stop-${module.status} ${selected === module.id ? "selected" : ""}`} onClick={() => setSelected(module.id)} disabled={module.status === "locked"}>
              <span className="map-node">{module.status === "completed" ? "✓" : module.status === "locked" ? <Icon name="lock" /> : index + 1}</span>
              <span className={`map-card tone-${module.accent}`}>
                <i>{module.icon}</i>
                <span><small>{module.status}</small><strong>{module.title}</strong><em>{module.description}</em></span>
                <b>{module.progress ? `${module.progress}%` : `+${module.xpReward} XP`}</b>
              </span>
            </button>
          ))}
          {!modules.length ? <div className="map-empty">No concepts match that search.</div> : null}
        </section>

        <aside className="lesson-focus">
          <span className="focus-icon">{active.icon}</span>
          <span className="page-eyebrow">SELECTED CONCEPT</span>
          <h2>{active.title}</h2>
          <p>{active.beginnerNote}</p>
          <div className="focus-meter"><span><i style={{ width: `${active.progress}%` }} /></span><strong>{active.progress}%</strong></div>
          <dl><div><dt>Reward</dt><dd>+{active.xpReward} XP</dd></div><div><dt>Format</dt><dd>{active.status === "active" ? "Mini-game" : "Lesson"}</dd></div><div><dt>Time</dt><dd>8 min</dd></div></dl>
          <button className="solid-action" disabled={active.status === "locked"}><Icon name={active.status === "locked" ? "lock" : "play"} />{active.status === "locked" ? "Finish earlier stops" : active.status === "completed" ? "Practice again" : "Start this lesson"}</button>
          {active.status === "active" ? <div className="gentle-note"><Icon name="brain" /><span><strong>Why this lesson?</strong>Your last answer suggests the final step of a range deserves a closer look.</span></div> : null}
        </aside>
      </div>
    </main>
  );
}
