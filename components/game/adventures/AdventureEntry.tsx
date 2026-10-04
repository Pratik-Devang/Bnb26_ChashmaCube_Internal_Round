"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { learningWorlds } from "@/lib/game/worlds";
import { adventureHref, difficultyDescriptions, loadAdventureJournal, loadCurriculum, startAdventure, topicNames, worldPath, type AdventureJournal, type AdventureProgress, type AdventureWorld, type CurriculumTrack, type Difficulty } from "@/lib/game/curriculum";
import { TopicAdventureWorld } from "./TopicAdventureWorld";
import styles from "./Adventure.module.css";

export function AdventureEntry({ world, trackId }: { world: AdventureWorld; trackId?: string }) {
  const [catalog, setCatalog] = useState<CurriculumTrack[]>([]);
  const [journal, setJournal] = useState<AdventureJournal>({ recent: null, saves: [] });
  const [topic, setTopic] = useState(world === "first-island" ? "variables" : "conditions");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [progress, setProgress] = useState<AdventureProgress | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const destination = learningWorlds[world === "first-island" ? 0 : 1];

  useEffect(() => {
    let active = true;
    setReady(false); setError(""); setProgress(null);
    Promise.all([loadCurriculum(), loadAdventureJournal()]).then(async ([tracks, saves]) => {
      if (!active) return;
      setCatalog(tracks); setJournal(saves);
      if (trackId) {
        if (!tracks.some((track) => track.id === trackId)) throw new Error("That lesson selection is unavailable. Choose a topic below.");
        const saved = await startAdventure({ world, track: trackId });
        if (active) setProgress(saved);
      }
      if (active) setReady(true);
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Could not open your adventure."); });
    return () => { active = false; };
  }, [world, trackId, retry]);

  const selectedTrack = catalog.find((track) => track.id === (trackId ?? `${topic}-${difficulty}`));
  if (trackId && selectedTrack && progress && ready) return <TopicAdventureWorld key={`${world}:${trackId}`} world={world} track={selectedTrack} initialProgress={progress} />;
  const saved = journal.saves.find((item) => item.world === world && item.track === `${topic}-${difficulty}`);

  return <main className={styles.setup}>
    <div className={styles.setupArt}><Image src={destination.image} alt="" fill unoptimized sizes="45vw" /><div><small>CHOOSE YOUR ADVENTURE</small><h1>{destination.name}</h1><p>One world. Many things to discover.</p><Link href="/learn">← Back to world map</Link></div></div>
    <section className={styles.setupForm}>
      <small>PREPARE FOR THE JOURNEY</small><h2>What will you learn today?</h2><p>Your guides and trial will follow your chosen topic and difficulty.</p>
      {error && <div role="alert" className={styles.error}>{error} <button onClick={() => setRetry((value) => value + 1)}>Retry</button>{trackId && <Link href={worldPath(world)}>Choose another topic</Link>}</div>}
      {!ready && !error && <p role="status">Opening your learning journal…</p>}
      <fieldset disabled={!ready}><legend>01 / Choose a topic</legend><div className={styles.topicGrid}>{Object.entries(topicNames).map(([id, name]) => <label key={id} className={topic === id ? styles.selected : ""}><input type="radio" name="topic" value={id} checked={topic === id} onChange={() => setTopic(id)} /><span>{name}</span></label>)}</div></fieldset>
      <fieldset disabled={!ready}><legend>02 / Choose your difficulty</legend><div className={styles.difficulties}>{(["easy", "medium", "hard"] as const).map((level) => <label key={level} className={difficulty === level ? styles.selected : ""}><input type="radio" name="difficulty" value={level} checked={difficulty === level} onChange={() => setDifficulty(level)} /><strong>{level}</strong><span>{difficultyDescriptions[level]}</span></label>)}</div></fieldset>
      <div className={styles.selectionSummary}><strong>{topicNames[topic]} · {difficulty}</strong><p>3 guide lessons · 1 trial + 1 transfer check · up to 80 coins</p><p>{saved ? `${saved.completedLessonIds.length}/3 lessons · ${saved.passedQuestionIds.length}/2 checks completed` : "A fresh journal for this topic and difficulty."}</p></div>
      {ready && <Link className={styles.primary} href={adventureHref({ world, track: `${topic}-${difficulty}` })}>{saved?.completed ? "Revisit adventure" : saved ? "Resume adventure" : "Enter the world"} →</Link>}
      <p className={styles.note}>Each map, topic, and difficulty has its own save. Earlier adventures remain available.</p>
      <Link className={styles.legacy} href={`${worldPath(world)}?legacy=1`}>Open the original {world === "first-island" ? "Variables" : "Conditions"} adventure</Link>
    </section>
  </main>;
}
