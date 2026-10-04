"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import islandMap from "@/2d_assets/First Island/Tiled/Tiled_map.png";
import explorer from "@/2d_assets/First Island/Characters/Character_1/Idle.png";
import explorerWalk from "@/2d_assets/First Island/Characters/Character_1/Walk.png";
import traveler from "@/2d_assets/First Island/Characters/Character_2/Idle.png";
import boar from "@/2d_assets/First Island/Characters/Character_5/Idle.png";
import fox from "@/2d_assets/First Island/Characters/Character_6/Idle.png";
import scout from "@/2d_assets/First Island/Characters/Character_8/Idle.png";
import slime from "@/2d_assets/First Island/Characters/Character_3/Idle.png";
import emberbug from "@/2d_assets/First Island/Characters/Character_4/Idle.png";
import mossling from "@/2d_assets/First Island/Characters/Character_7/Idle.png";
import caveKeeper from "@/2d_assets/First Island/Characters/Character_9/Idle.png";
import { firstIslandActors } from "@/lib/game/first-island/content";
import { chapelViewports } from "@/lib/game/chapel-viewport";
import { ChurchMapCanvas } from "../ChurchMapCanvas";
import { ChurchExteriorCanvas } from "../ChurchExteriorCanvas";
import { answerAdventureQuestion, finishAdventureLesson, topicNames, worldPath, type AdventureProgress, type AdventureWorld, type CurriculumTrack } from "@/lib/game/curriculum";
import styles from "./Adventure.module.css";

type Position = { x: number; y: number };
type Guide = Position & { name: string; lesson: number; sprite: typeof traveler };
const distance = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.y - b.y);
const ambientSprites = { traveler, slime, emberbug, bristleback: boar, fox, mossling, scout, caveKeeper };
const spriteStyle = (sheet: typeof traveler): CSSProperties => ({
  backgroundImage: `url(${sheet.src})`, backgroundSize: `${sheet.width / sheet.height * 48}px 48px`,
  "--sprite-end": `${-48 * sheet.width / sheet.height}px`, "--frames": sheet.width / sheet.height,
} as CSSProperties);
const islandGuides: Guide[] = [
  { name: "Beach Cartographer", lesson: 0, x: 38, y: 84, sprite: traveler },
  { name: "Bristleback", lesson: 1, x: 45, y: 57, sprite: boar },
  { name: "Trail Fox", lesson: 2, x: 40, y: 29, sprite: fox },
  { name: "Island Scout", lesson: 3, x: 78, y: 34, sprite: scout },
];
const chapelGuides: Guide[] = [
  { name: "Grounds Guide", lesson: 0, x: 34, y: 70, sprite: traveler },
  { name: "Lever Guide", lesson: 1, x: 72, y: 60, sprite: traveler },
  { name: "Treasure Guide", lesson: 2, x: 35, y: 60, sprite: traveler },
  { name: "Chapel Keeper", lesson: 3, x: 52, y: 42, sprite: scout },
];

export function TopicAdventureWorld({ world, track, initialProgress }: { world: AdventureWorld; track: CurriculumTrack; initialProgress: AdventureProgress }) {
  const chapel = world === "chapel-of-choices";
  const [inside, setInside] = useState(false);
  const viewport = chapelViewports[inside ? "interior" : "exterior"];
  const [position, setPosition] = useState<Position>(chapel ? { x: 50, y: 80 } : { x: 41, y: 88 });
  const [moving, setMoving] = useState(false);
  const [progress, setProgress] = useState(initialProgress);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("Follow the numbered guides. Move with WASD or arrows, then press E to interact.");
  const dialog = useRef<HTMLDialogElement>(null);
  const movementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guides = chapel ? chapelGuides.filter((item) => inside ? item.lesson !== 0 : item.lesson === 0) : islandGuides;
  const nextIndex = progress.completedLessonIds.length;
  const nextGuide = (chapel ? chapelGuides : islandGuides)[Math.min(nextIndex, 3)];
  const lesson = guide && guide.lesson < 3 ? track.lessons[guide.lesson] : null;
  const question = track.questions[progress.passedQuestionIds.length];
  const selection = { world, track: track.id };

  const closeDialog = () => { if (!busy) { setGuide(null); setFeedback(""); setChoice(null); } };
  const interact = (target: Guide) => {
    if (busy || guide) return;
    if (distance(position, target) > 11) { setMessage(`Walk closer to ${target.name}, then press E.`); return; }
    if (target.lesson > nextIndex) { setMessage(`${target.name}: First visit ${nextGuide.name} for “${track.lessons[nextIndex]?.title}”.`); return; }
    setChoice(null); setFeedback(""); setError(""); setGuide(target);
  };

  useEffect(() => {
    if (guide && !dialog.current?.open) dialog.current?.showModal();
    else if (!guide) dialog.current?.close();
  }, [guide]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (guide || busy || (event.target as HTMLElement)?.closest("input,textarea,select,a")) return;
      const key = event.key.toLowerCase();
      if (key === "e") {
        event.preventDefault();
        if (chapel && distance(position, { x: 50, y: inside ? 70 : 54 }) < 9) {
          if (!inside && nextIndex === 0) { setMessage("Meet the Grounds Guide before entering the temple."); return; }
          setInside(!inside); setPosition({ x: 50, y: 68 }); setMessage(inside ? "You returned to the grounds." : "Find the numbered guides inside the temple."); return;
        }
        const nearest = [...guides].sort((a, b) => distance(position, a) - distance(position, b))[0];
        if (nearest) interact(nearest);
        return;
      }
      const moves: Record<string, Position> = { w: { x: 0, y: -1.2 }, arrowup: { x: 0, y: -1.2 }, s: { x: 0, y: 1.2 }, arrowdown: { x: 0, y: 1.2 }, a: { x: -1.2, y: 0 }, arrowleft: { x: -1.2, y: 0 }, d: { x: 1.2, y: 0 }, arrowright: { x: 1.2, y: 0 } };
      if (!moves[key]) return;
      event.preventDefault();
      const delta = moves[key];
      const bounds = chapel ? viewport.bounds : { left: 5, right: 95, top: 5, bottom: 94 };
      const next = { x: Math.max(bounds.left, Math.min(bounds.right, position.x + delta.x)), y: Math.max(bounds.top, Math.min(bounds.bottom, position.y + delta.y)) };
      if (chapel && !inside && nextIndex > 0 && distance(next, { x: 50, y: 54 }) < 5) {
        setInside(true); setPosition({ x: 50, y: 68 }); setMessage("You entered the temple. Find the Lever Guide.");
      } else setPosition(next);
      setMoving(true);
      if (movementTimer.current) clearTimeout(movementTimer.current);
      movementTimer.current = setTimeout(() => setMoving(false), 150);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  useEffect(() => () => { if (movementTimer.current) clearTimeout(movementTimer.current); }, []);

  async function finishLesson() {
    if (!lesson || busy) return;
    setBusy(true); setError("");
    try {
      const saved = await finishAdventureLesson(selection, lesson.id);
      setProgress(saved); setGuide(null);
      const next = (chapel ? chapelGuides : islandGuides)[Math.min(saved.completedLessonIds.length, 3)];
      setMessage(chapel && !inside ? "Walk to the temple gates to enter, or press E near the entrance." : `Saved. Next, find ${next.name}.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save. Try again."); }
    finally { setBusy(false); }
  }

  async function submitAnswer() {
    if (choice === null || !question || busy) return;
    setBusy(true); setError("");
    try {
      const result = await answerAdventureQuestion(selection, question.id, choice);
      setProgress(result.progress); setChoice(null);
      setFeedback(`${result.correct ? "Correct." : "Try again."} ${result.feedback}${result.correct && !result.progress.completed ? " Now apply the idea in a different context below." : ""}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not check your answer. Try again."); }
    finally { setBusy(false); }
  }

  return <main className={styles.world}>
    <header className={styles.hud}><Link href={worldPath(world)}>← Change topic</Link><div><small>{chapel ? "CHAPEL OF CHOICES" : "THE FIRST ISLAND"}</small><strong>{topicNames[track.topic]} / {track.difficulty}</strong></div><span>{progress.coinsEarned} coins</span><Link href="/">Dashboard</Link></header>
    <div className={styles.objective}><span>{progress.completed ? "ADVENTURE COMPLETE" : `NEXT: ${nextGuide.name}`}</span><strong>{progress.completedLessonIds.length}/3 lessons · {progress.passedQuestionIds.length}/2 checks</strong></div>
    <section className={`${styles.map} ${chapel ? styles.chapelMap : ""}`} style={chapel ? { aspectRatio: viewport.ratio, width: `min(100%, calc(max(520px, 100dvh - 190px) * ${viewport.ratio}))` } : undefined} aria-label="Learning adventure map" tabIndex={0}>
      <div className={chapel ? styles.scenePlane : styles.islandPlane} style={chapel ? viewport.plane : undefined}>
      {chapel ? inside ? <ChurchMapCanvas className={styles.canvas} /> : <ChurchExteriorCanvas className={styles.canvas} /> : <Image src={islandMap} alt="Island with forests, a beach, and a hilltop camp" className={styles.mapImage} unoptimized priority />}
      {guides.map((item) => <button type="button" key={item.name} onClick={() => interact(item)} className={styles.actor} style={{ ...spriteStyle(item.sprite), left: `${item.x}%`, top: `${item.y}%` }} aria-label={`Talk to ${item.name}`}><b>{item.lesson < nextIndex || progress.completed ? "✓" : item.lesson === 3 ? "!" : item.lesson + 1}</b><span>{item.name}</span></button>)}
      {!chapel && firstIslandActors.filter((actor) => !islandGuides.some((item) => item.name === actor.name)).map((actor) => <span key={actor.id} className={styles.ambient} style={{ ...spriteStyle(ambientSprites[actor.sprite]), left: `${actor.position.x}%`, top: `${actor.position.y}%` }} aria-hidden="true" />)}
      {chapel && !inside && nextIndex > 0 && <span className={styles.gateMarker} style={{ left: "50%", top: "54%" }}>ENTER ↓</span>}
      <div className={styles.player} style={{ ...spriteStyle(moving ? explorerWalk : explorer), left: `${position.x}%`, top: `${position.y}%` }}><span>YOU</span></div>
      </div>
    </section>
    <footer className={styles.worldFooter}><p role="status">{message}</p><span>WASD / arrows · E to interact{chapel && inside ? " · E at the lower doorway to exit" : ""}</span></footer>
    <dialog ref={dialog} className={styles.dialog} onCancel={(event) => { event.preventDefault(); closeDialog(); }}>
      <header><small>{guide?.name} / {track.difficulty}</small><button disabled={busy} onClick={closeDialog} aria-label="Close lesson">×</button></header>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {lesson ? <><h2>{lesson.title}</h2><p>{lesson.body}</p><pre><code>{lesson.code}</code></pre><aside>{lesson.takeaway}</aside><button className={styles.primary} disabled={busy} onClick={finishLesson}>{busy ? "Saving…" : progress.completedLessonIds.includes(lesson.id) ? "Return to the trail" : "Finish lesson · +10 coins"}</button></> : progress.completed ? <><h2>Adventure complete!</h2><p>You finished the lessons and both checks for {topicNames[track.topic]} ({track.difficulty}).</p><p>80 coins earned in this adventure. This is practice evidence; lasting understanding takes more than one session.</p>{feedback && <p role="status">{feedback}</p>}<Link className={styles.primary} href={worldPath(world)}>Choose another topic or difficulty →</Link></> : question ? <><small>{question.kind === "transfer" ? "TRANSFER CHECK / A NEW CONTEXT" : "FINAL TRIAL"}</small><h2>{question.prompt}</h2>{feedback && <aside role="status">{feedback}</aside>}<pre><code>{question.code}</code></pre><fieldset disabled={busy}><legend>Choose your answer</legend>{question.options.map((answer, index) => <label className={`${styles.answer} ${choice === index ? styles.selected : ""}`} key={`${question.id}-${index}`}><input type="radio" name="answer" checked={choice === index} onChange={() => setChoice(index)} />{answer}</label>)}</fieldset><button className={styles.primary} disabled={busy || choice === null} onClick={submitAnswer}>{busy ? "Checking…" : "Check answer"}</button></> : null}
    </dialog>
  </main>;
}
