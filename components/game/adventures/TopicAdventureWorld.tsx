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
import { useAccount } from "@/components/auth/AccountProvider";
import { CharacterDialogue, type CharacterConversation, type DialoguePortrait } from "../dialogs/CharacterDialogue";
import { answerAdventureQuestion, finishAdventureLesson, topicNames, worldPath, type AdventureProgress, type AdventureWorld, type CurriculumTrack } from "@/lib/game/curriculum";
import { examplesForLesson } from "@/lib/game/lesson-examples";
import styles from "./Adventure.module.css";

type Position = { x: number; y: number };
type Guide = Position & { name: string; lesson: number; sprite: typeof traveler };
type ChapelObject = "lever" | "treasure";
const portraitFor = (name: string): DialoguePortrait => name === "Beach Cartographer" ? "elder" : name.includes("Keeper") ? "keeper" : name === "Grounds Guide" || name === "Treasure Guide" ? "ranger" : "scout";
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
const islandVisitors: Guide[] = firstIslandActors
  .filter((actor) => actor.sprite === "caveKeeper")
  .map((actor) => ({ name: actor.name, lesson: -1, ...actor.position, sprite: caveKeeper }));
const chapelGuides: Guide[] = [
  { name: "Grounds Guide", lesson: 0, x: 34, y: 70, sprite: traveler },
  { name: "Lever Guide", lesson: 1, x: 72, y: 60, sprite: traveler },
  { name: "Treasure Guide", lesson: 2, x: 35, y: 60, sprite: traveler },
  { name: "Chapel Keeper", lesson: 3, x: 52, y: 42, sprite: scout },
];
const chapelObjects: Record<ChapelObject, Position> = {
  lever: { x: 69, y: 42 },
  treasure: { x: 34, y: 42 },
};

export function TopicAdventureWorld({ world, track, initialProgress }: { world: AdventureWorld; track: CurriculumTrack; initialProgress: AdventureProgress }) {
  const { learner } = useAccount();
  const chapel = world === "chapel-of-choices";
  const [inside, setInside] = useState(false);
  const viewport = chapelViewports[inside ? "interior" : "exterior"];
  const [position, setPosition] = useState<Position>(chapel ? { x: 50, y: 80 } : { x: 41, y: 88 });
  const [moving, setMoving] = useState(false);
  const [progress, setProgress] = useState(initialProgress);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [conversation, setConversation] = useState<(CharacterConversation & { target?: Guide }) | null>(() => ({
    speaker: chapel ? "Grounds Guide" : "Beach Cartographer", portrait: chapel ? "ranger" : "elder", label: "Begin exploring",
    lines: initialProgress.completedLessonIds.length ? [
      `Welcome back, ${learner.name}. Your ${topicNames[track.topic]} journey at ${track.difficulty} difficulty is right where you left it.`,
      initialProgress.completed ? "You have finished this adventure. Revisit the guides to refresh what you learned, or choose another topic from the top bar." : `You have learned from ${initialProgress.completedLessonIds.length} of our three guides. Follow the next numbered marker, then bring what you learn to ${chapel ? "the Chapel Keeper" : "the Island Scout"}.`,
      "Move with WASD or the arrow keys. Come close to a guide and press E, or click them. You can always return to a lesson.",
    ] : [
      `Welcome, ${learner.name}, to ${chapel ? "the Chapel of Choices" : "The First Island"}. Every explorer here has something to teach you. Today, your journey is about ${topicNames[track.topic]}, at ${track.difficulty} difficulty.`,
      `Meet the three numbered guides in order. Each will share one idea. ${chapel ? "Start with me on the grounds; then walk to the temple gates to enter the sanctuary." : "Start with me on the beach, then find Bristleback in the clearing and the Trail Fox farther north."}`,
      `After the lessons, ${chapel ? "the Chapel Keeper" : "the Island Scout"} will give you a trial and a new situation to think through. A wrong answer is a clue: read the explanation and try again.`,
      "Use WASD or the arrow keys to move. Walk close to a guide and press E or click them to talk. Lessons earn 10 coins each; finish both checks for 50 more. Your journal is saved to your account.",
    ],
  }));
  const [choice, setChoice] = useState<number | null>(null);
  const [quizAt, setQuizAt] = useState<ChapelObject | null>(null);
  const [lessonPage, setLessonPage] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("Follow the numbered guides. Move with WASD or arrows, then press E to interact.");
  const dialog = useRef<HTMLDialogElement>(null);
  const movementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guides = chapel ? chapelGuides.filter((item) => inside ? item.lesson !== 0 : item.lesson === 0) : [...islandGuides, ...islandVisitors];
  const nextIndex = progress.completedLessonIds.length;
  const nextGuide = (chapel ? chapelGuides : islandGuides)[Math.min(nextIndex, 3)];
  const lesson = guide && guide.lesson < 3 ? track.lessons[guide.lesson] : null;
  const lessonExamples = guide && guide.lesson < 3 ? examplesForLesson(track.topic, guide.lesson) : [];
  const lessonPageCount = 1 + lessonExamples.length;
  const workedExample = lessonPage > 0 ? lessonExamples[lessonPage - 1] : undefined;
  const question = track.questions[progress.passedQuestionIds.length];
  const selection = { world, track: track.id };

  const closeDialog = () => { if (!busy) { setGuide(null); setQuizAt(null); setFeedback(""); setChoice(null); } };
  const interactWithChapelObject = (target: ChapelObject) => {
    if (busy || guide || quizAt || conversation) return;
    const targetPosition = chapelObjects[target];
    if (distance(position, targetPosition) > 11) {
      setMessage(`Walk closer to the ${target === "lever" ? "lever" : "treasure chest"}, then press E.`);
      return;
    }
    const requiredLessons = target === "lever" ? Math.min(2, track.lessons.length) : track.lessons.length;
    if (progress.completedLessonIds.length < requiredLessons) {
      const next = (chapelGuides)[progress.completedLessonIds.length];
      setMessage(`Visit ${next?.name ?? "the next guide"} first. Then answer the ${target === "lever" ? "lever" : "treasure"} question about ${topicNames[track.topic]}.`);
      return;
    }
    if (target === "lever" && progress.passedQuestionIds.length > 0) {
      setMessage("The lever is already pulled. Go to the treasure chest for your next question.");
      return;
    }
    if (target === "treasure" && progress.passedQuestionIds.length === 0) {
      setMessage("The chest is still locked. Pull the lever on the right first.");
      return;
    }
    if (progress.completed) {
      setMessage("The treasure is open and this adventure is complete. Visit the Chapel Keeper to review your progress.");
      return;
    }
    setChoice(null); setFeedback(""); setError(""); setQuizAt(target);
  };
  const interact = (target: Guide) => {
    if (busy || guide || quizAt || conversation) return;
    if (distance(position, target) > 11) { setMessage(`Walk closer to ${target.name}, then press E.`); return; }
    if (target.lesson < 0) {
      setConversation({ speaker: target.name, portrait: "keeper", label: "Return to exploring", lines: [
        `A visitor! I’m ${target.name}. These cliffs have seen plenty of explorers get stuck. The ones who return with questions are the ones who find their way.`,
        progress.completed ? "You’ve finished this trail. Visit a guide again whenever an idea feels hazy, or choose a new topic for your next journey." : `Your next stop is ${nextGuide.name}. ${nextIndex < 3 ? `Ask about “${track.lessons[nextIndex].title}”.` : "The final trial is waiting."} Follow the numbered trail and take one idea at a time.`,
      ] });
      return;
    }
    const human = chapel || target.sprite === traveler || target.sprite === scout;
    if (target.lesson > nextIndex) {
      const direction = `First visit ${nextGuide.name} for “${track.lessons[nextIndex]?.title}”. That idea will help you understand what comes next. I’ll be here when you’re ready.`;
      if (human) setConversation({ speaker: target.name, portrait: portraitFor(target.name), lines: [direction], label: "Find the earlier guide" });
      else setMessage(`${target.name}: ${direction}`);
      return;
    }
    if (chapel && target.lesson === 3) {
      setConversation({ speaker: target.name, portrait: "keeper", target: progress.completed ? target : undefined, label: progress.completed ? "Review adventure" : "Return to the lever", lines: [
        progress.completed
          ? `You solved both ${topicNames[track.topic]} checks and opened the treasure. Your work is safely recorded in the journal.`
          : progress.passedQuestionIds.length === 0
            ? `The lever on the right holds the first ${topicNames[track.topic]} question. Answer it correctly, then return here or follow the marker to the treasure chest on the left.`
            : `The lever is pulled. Now reach the treasure chest on the left and answer the second ${topicNames[track.topic]} question to open it.`,
      ] });
      return;
    }
    if (human) {
      setConversation({ speaker: target.name, portrait: portraitFor(target.name), target, label: target.lesson === 3 ? progress.completed ? "Review adventure" : "Begin the trial" : "Open lesson", lines: target.lesson === 3 ? [
        progress.completed ? "Your trial is already complete. It’s good to see you return with a curious mind." : `You have met every guide. Now let’s see how you use ${topicNames[track.topic]} for yourself.`,
        "We’ll start with one question, then change the situation for a second check. Take your time. If you stumble, I’ll explain the idea so you can try again.",
      ] : [
        `Hello, ${learner.name}. I’m ${target.name}. ${progress.completedLessonIds.includes(track.lessons[target.lesson].id) ? "Back for another look? You’re always welcome." : "You’ve come to the right place."}`,
        `Let’s explore “${track.lessons[target.lesson].title}”. ${track.lessons[target.lesson].body}`,
      ] });
      return;
    }
    setChoice(null); setFeedback(""); setError(""); setLessonPage(0); setGuide(target);
  };

  useEffect(() => {
    if ((guide || quizAt) && !dialog.current?.open) dialog.current?.showModal();
    else if (!guide && !quizAt) dialog.current?.close();
  }, [guide, quizAt]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (guide || quizAt || conversation || busy || (event.target as HTMLElement)?.closest("input,textarea,select,a")) return;
      const key = event.key.toLowerCase();
      if (key === "e") {
        event.preventDefault();
        if (chapel && distance(position, { x: 50, y: inside ? 70 : 54 }) < 9) {
          if (!inside && nextIndex === 0) { setMessage("Meet the Grounds Guide before entering the temple."); return; }
          setInside(!inside); setPosition({ x: 50, y: 68 }); setMessage(inside ? "You returned to the grounds." : "Find the numbered guides inside the temple."); return;
        }
        if (chapel && inside) {
          const nearbyObject = (Object.keys(chapelObjects) as ChapelObject[]).find((target) => distance(position, chapelObjects[target]) < 11);
          if (nearbyObject) { interactWithChapelObject(nearbyObject); return; }
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
      setProgress(saved); setGuide(null); setLessonPage(0);
      const next = (chapel ? chapelGuides : islandGuides)[Math.min(saved.completedLessonIds.length, 3)];
      setMessage(chapel && !inside
        ? "Walk to the temple gates to enter, or press E near the entrance."
        : chapel && saved.completedLessonIds.length === 2
          ? "Saved. Walk to the lever on the right and press E for your first topic question."
          : chapel && saved.completedLessonIds.length === 3
            ? "Saved. Go to the treasure chest on the left and press E for your second topic question."
            : `Saved. Next, find ${next.name}.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save. Try again."); }
    finally { setBusy(false); }
  }

  async function submitAnswer() {
    if (choice === null || !question || busy) return;
    setBusy(true); setError("");
    try {
      const result = await answerAdventureQuestion(selection, question.id, choice);
      setProgress(result.progress); setChoice(null);
      if (result.correct && quizAt) {
        setQuizAt(null); setFeedback("");
        setMessage(quizAt === "lever" ? "Correct! The lever is pulled. Find the Treasure Guide, then go to the chest on the left for your second question." : "Correct! The treasure chest opens. Your Chapel of Choices checks are complete.");
      } else {
        setFeedback(`${result.correct ? "Correct." : "Try again."} ${result.feedback}${result.correct && !result.progress.completed ? " Now apply the idea in a different context below." : ""}`);
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not check your answer. Try again."); }
    finally { setBusy(false); }
  }

  return <main className={styles.world}>
    <header className={styles.hud}><Link href={worldPath(world)}>← Change topic</Link><div><small>{chapel ? "CHAPEL OF CHOICES" : "THE FIRST ISLAND"}</small><strong>{topicNames[track.topic]} / {track.difficulty}</strong></div><span>{progress.coinsEarned} coins</span><Link href="/">Dashboard</Link></header>
    <div className={styles.objective}><span>{progress.completed ? "ADVENTURE COMPLETE" : `NEXT: ${nextGuide.name}`}</span><strong>{progress.completedLessonIds.length}/3 lessons · {progress.passedQuestionIds.length}/2 checks</strong></div>
    <section className={`${styles.map} ${chapel ? styles.chapelMap : ""}`} style={chapel ? { aspectRatio: viewport.ratio, width: `min(100%, calc(max(520px, 100dvh - 190px) * ${viewport.ratio}))` } : undefined} aria-label="Learning adventure map" tabIndex={0}>
      <div className={chapel ? styles.scenePlane : styles.islandPlane} style={chapel ? viewport.plane : undefined}>
      {chapel ? inside ? <ChurchMapCanvas className={styles.canvas} /> : <ChurchExteriorCanvas className={styles.canvas} /> : <Image src={islandMap} alt="Island with forests, a beach, and a hilltop camp" className={styles.mapImage} unoptimized priority />}
      {guides.map((item) => <button type="button" key={item.name} onClick={() => interact(item)} className={styles.actor} style={{ ...spriteStyle(item.sprite), left: `${item.x}%`, top: `${item.y}%` }} aria-label={`Talk to ${item.name}`}><b>{item.lesson < 0 ? "…" : item.lesson < nextIndex || progress.completed ? "✓" : item.lesson === 3 ? "!" : item.lesson + 1}</b><span>{item.name}</span></button>)}
      {chapel && inside && (Object.keys(chapelObjects) as ChapelObject[]).map((target) => {
        const solved = target === "lever" ? progress.passedQuestionIds.length > 0 : progress.passedQuestionIds.length > 1;
        return <button type="button" key={target} className={styles.objectTarget} style={{ left: `${chapelObjects[target].x}%`, top: `${chapelObjects[target].y}%` }} onClick={() => interactWithChapelObject(target)} aria-label={`Interact with the ${target === "lever" ? "lever" : "treasure chest"}`}>
          {target === "lever" ? "LEVER" : "CHEST"} · {solved ? "✓" : "E"}
        </button>;
      })}
      {!chapel && firstIslandActors.filter((actor) => !guides.some((item) => item.name === actor.name)).map((actor) => <span key={actor.id} className={styles.ambient} style={{ ...spriteStyle(ambientSprites[actor.sprite]), left: `${actor.position.x}%`, top: `${actor.position.y}%` }} aria-hidden="true" />)}
      {chapel && !inside && nextIndex > 0 && <span className={styles.gateMarker} style={{ left: "50%", top: "54%" }}>ENTER ↓</span>}
      <div className={styles.player} style={{ ...spriteStyle(moving ? explorerWalk : explorer), left: `${position.x}%`, top: `${position.y}%` }}><span>YOU</span></div>
      </div>
    </section>
    <footer className={styles.worldFooter}><p role="status">{message}</p><span>WASD / arrows · E to interact{chapel && inside ? " · E at the lower doorway to exit" : ""}</span></footer>
    {conversation && <CharacterDialogue conversation={conversation} onDismiss={() => setConversation(null)} onComplete={() => {
      const target = conversation.target;
      setConversation(null);
      if (target) { setChoice(null); setFeedback(""); setError(""); setLessonPage(0); setGuide(target); }
    }} />}
    <dialog ref={dialog} className={styles.dialog} onCancel={(event) => { event.preventDefault(); closeDialog(); }}>
      <header><small>{guide?.name ?? (quizAt === "lever" ? "Lever" : quizAt === "treasure" ? "Treasure" : "Adventure")} / {track.difficulty}</small><button disabled={busy} onClick={closeDialog} aria-label="Close lesson">×</button></header>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {quizAt && question ? <><small>{quizAt === "lever" ? "LEVER CHECK · FIRST QUESTION" : "TREASURE CHECK · SECOND QUESTION"} / {topicNames[track.topic]}</small><h2>{question.prompt}</h2>{feedback && <aside role="status">{feedback}</aside>}<pre><code>{question.code}</code></pre><fieldset disabled={busy}><legend>Choose your answer</legend>{question.options.map((answer, index) => <label className={`${styles.answer} ${choice === index ? styles.selected : ""}`} key={`${question.id}-${index}`}><input type="radio" name="answer" checked={choice === index} onChange={() => setChoice(index)} />{answer}</label>)}</fieldset><button className={styles.primary} disabled={busy || choice === null} onClick={submitAnswer}>{busy ? "Checking…" : quizAt === "lever" ? "Check and pull lever" : "Check and open treasure"}</button></> : lesson ? <><small>{topicNames[track.topic]} · GUIDE {guide!.lesson + 1} · PAGE {lessonPage + 1} / {lessonPageCount}</small>{workedExample ? <><h2>{workedExample.title}</h2><p>{workedExample.prompt}</p><pre><code>{workedExample.code}</code></pre><aside className={styles.exampleAnswer}><strong>Answer</strong><span>{workedExample.answer}</span><p>{workedExample.explanation}</p></aside></> : <><h2>{lesson.title}</h2><p>{lesson.body}</p><pre><code>{lesson.code}</code></pre><aside>{lesson.takeaway}</aside></>}<div className={styles.lessonPager}><button type="button" className={styles.pageButton} disabled={lessonPage === 0 || busy} onClick={() => setLessonPage((page) => Math.max(0, page - 1))}>Previous</button><span aria-live="polite">Page {lessonPage + 1} of {lessonPageCount}</span>{lessonPage < lessonPageCount - 1 ? <button type="button" className={styles.pageButton} disabled={busy} onClick={() => setLessonPage((page) => Math.min(lessonPageCount - 1, page + 1))}>Next page</button> : <button type="button" className={styles.primary} disabled={busy} onClick={finishLesson}>{busy ? "Saving…" : progress.completedLessonIds.includes(lesson.id) ? "Return to the trail" : "Finish lesson · +10 coins"}</button>}</div></> : progress.completed ? <><h2>Adventure complete!</h2><p>You finished the lessons and both checks for {topicNames[track.topic]} ({track.difficulty}).</p><p>80 coins earned in this adventure. This is practice evidence; lasting understanding takes more than one session.</p>{feedback && <p role="status">{feedback}</p>}<Link className={styles.primary} href={worldPath(world)}>Choose another topic or difficulty →</Link></> : question ? <><small>{question.kind === "transfer" ? "TRANSFER CHECK / A NEW CONTEXT" : "FINAL TRIAL"}</small><h2>{question.prompt}</h2>{feedback && <aside role="status">{feedback}</aside>}<pre><code>{question.code}</code></pre><fieldset disabled={busy}><legend>Choose your answer</legend>{question.options.map((answer, index) => <label className={`${styles.answer} ${choice === index ? styles.selected : ""}`} key={`${question.id}-${index}`}><input type="radio" name="answer" checked={choice === index} onChange={() => setChoice(index)} />{answer}</label>)}</fieldset><button className={styles.primary} disabled={busy || choice === null} onClick={submitAnswer}>{busy ? "Checking…" : "Check answer"}</button></> : null}
    </dialog>
  </main>;
}
