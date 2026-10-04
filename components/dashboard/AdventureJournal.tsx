"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adventureHref, loadAdventureJournal, topicNames, type AdventureProgress } from "@/lib/game/curriculum";

export function AdventureSummary({ progress }: { progress: AdventureProgress }) {
  const [topic, difficulty] = progress.track.split("-");
  const percent = (progress.completedLessonIds.length + progress.passedQuestionIds.length) * 20;
  return <section className="surface-card adventure-journal-card">
    <div><span className="page-eyebrow">{progress.world === "first-island" ? "THE FIRST ISLAND" : "CHAPEL OF CHOICES"} / {difficulty.toUpperCase()}</span><h2>{topicNames[topic] ?? topic}</h2><p>{progress.completed ? "Lessons and both checks completed. Revisit this adventure or choose another challenge." : "Your selected adventure is saved. Continue with the next guide or check."}</p></div>
    <div className="hero-progress"><span><i style={{ width: `${percent}%` }} /></span><strong>{percent}%</strong></div>
    <div className="adventure-journal-stats"><span>{progress.completedLessonIds.length}/3 lessons</span><span>{progress.passedQuestionIds.length}/2 checks</span><span>{progress.coinsEarned} coins</span><span>{progress.attemptCount} attempts · {progress.mistakeCount} incorrect</span></div>
    <p className="adventure-evidence-note">{progress.completed ? "Practice completed, including a transfer check. This does not yet establish lasting mastery or a resolved misconception." : "Guide completion records reading; challenge answers provide separate practice evidence."}</p>
    <Link className="solid-action" href={adventureHref(progress)}>{progress.completed ? "Revisit adventure" : "Resume adventure"} →</Link>
  </section>;
}

export function AdventureJournal() {
  const [saves, setSaves] = useState<AdventureProgress[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    loadAdventureJournal().then((journal) => { if (active) setSaves(journal.saves); }).catch(() => { if (active) setError("Could not load your topic-adventure progress. Refresh to retry."); });
    return () => { active = false; };
  }, []);
  if (!saves.length && !error) return null;
  return <section className="adventure-journal" aria-label="Topic adventure progress"><h2>Your topic adventures</h2>{error && <p role="alert">{error}</p>}<div>{saves.map((save) => <AdventureSummary key={`${save.world}:${save.track}`} progress={save} />)}</div></section>;
}
