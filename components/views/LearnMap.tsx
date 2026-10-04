"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { learningModules } from "@/lib/mock-data";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import islandScout from "@/2d_assets/First Island/Characters/Character_8/Idle.png";
import Image from "next/image";
import islandMap from "@/2d_assets/First Island/Tiled/Tiled_map.png";
import churchMap from "@/2d_assets/Church/Maps/Ruined_temple_exterior.png";

export function LearnMap() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("loop-boundaries");
  const modules = useMemo(() => learningModules.filter((item) => `${item.title} ${item.description} ${item.id}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const active = learningModules.find((item) => item.id === selected) ?? learningModules[2];
  const isFirstIsland = active.id === "variables";
  const isChurch = active.id === "conditions";

  return (
    <main className="route-page learn-page">
      <PageHeader
        eyebrow="PYTHON FOUNDATIONS"
        title="Chart your learning journey."
        description="Move one concept at a time. Completed ideas stay visible, and the next useful step is always clear."
        action={<label className="route-search"><Icon name="search" /><span className="sr-only">Search lessons</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a concept" /></label>}
      />

      <div className="learn-layout">
        <section className="learning-map" aria-label="Python concept path">
          <div className="map-line" aria-hidden="true" />
          {modules.map((module, index) => {
            const islandCard = module.id === "variables";
            const conditionsCard = module.id === "conditions";
            return (
              <button key={module.id} className={`map-stop stop-${module.status} ${islandCard ? "first-island-stop" : ""} ${selected === module.id ? "selected" : ""}`} onClick={() => setSelected(module.id)} disabled={module.status === "locked"}>
                <span className={`map-node ${islandCard ? "first-island-node" : ""}`}>{islandCard ? "01" : module.status === "completed" ? "✓" : module.status === "locked" ? <Icon name="lock" /> : index + 1}</span>
                <span className={`map-card tone-${module.accent} ${islandCard ? "first-island-card" : ""}`}>
                  <i className={islandCard ? "island-scout-portrait" : ""}>{islandCard ? <span className="island-scout-sprite" style={{ backgroundImage: `url(${islandScout.src})` }} /> : conditionsCard ? <Image className="church-map-thumbnail" src={churchMap} alt="" unoptimized /> : module.icon}</i>
                  <span><small>{islandCard ? "WORLD 01 · VARIABLES & VALUES" : conditionsCard ? "WORLD 02 · CHAPEL OF CHOICES" : module.status}</small><strong>{conditionsCard ? "The Chapel of Choices" : module.title}</strong><em>{module.description}</em></span>
                  <b>{islandCard || conditionsCard ? "ENTER →" : module.progress ? `${module.progress}%` : `+${module.xpReward} XP`}</b>
                </span>
              </button>
            );
          })}
          {!modules.length ? <div className="map-empty">No concepts match that search.</div> : null}
        </section>

        <aside className={`lesson-focus ${isFirstIsland ? "first-island-focus" : ""}`}>
          {isFirstIsland || isChurch ? <div className="selected-world-art"><Image src={isFirstIsland ? islandMap : churchMap} alt={isFirstIsland ? "The First Island" : "The Ruined Church"} unoptimized /></div> : null}
          <span className={`focus-icon ${isFirstIsland ? "island-scout-portrait" : ""}`}>{isFirstIsland ? <span className="island-scout-sprite" style={{ backgroundImage: `url(${islandScout.src})` }} /> : active.icon}</span>
          <span className="page-eyebrow">SELECTED CONCEPT</span>
          <h2>{active.title}</h2>
          <p>{active.beginnerNote}</p>
          <div className="focus-meter"><span><i style={{ width: `${active.progress}%` }} /></span><strong>{active.progress}%</strong></div>
          <dl><div><dt>Reward</dt><dd>+{active.xpReward} XP</dd></div><div><dt>Format</dt><dd>{isFirstIsland ? "Island journey" : isChurch ? "World map" : active.status === "active" ? "Mini-game" : "Lesson"}</dd></div><div><dt>Time</dt><dd>{isFirstIsland ? "15 min" : isChurch ? "Coming next" : "8 min"}</dd></div></dl>
          {active.status === "locked" ? <button className="solid-action" disabled><Icon name="lock" />Finish earlier stops</button> : (
            <div className="lesson-actions">
              {isFirstIsland ? (
                <Link className="solid-action" href="/game"><Icon name="play" />Enter The First Island</Link>
              ) : isChurch ? (
                <Link className="solid-action" href="/game/church"><Icon name="play" />Enter the Chapel of Choices</Link>
              ) : (
                <>
                  <Link className="solid-action" href={`/topics/${active.id}?mode=lesson`}><Icon name="play" />{active.status === "completed" ? "Review this lesson" : "Start this lesson"}</Link>
                  <Link className="quiet-action" href={`/topics/${active.id}?mode=practice`}><Icon name="target" />Practice again</Link>
                </>
              )}
            </div>
          )}
          {active.status === "active" ? <div className="gentle-note"><Icon name="brain" /><span><strong>Why this lesson?</strong>Your last answer suggests the final step of a range deserves a closer look.</span></div> : null}
        </aside>
      </div>
    </main>
  );
}
