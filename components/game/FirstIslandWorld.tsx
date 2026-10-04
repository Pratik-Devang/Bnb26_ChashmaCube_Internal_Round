"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapImage from "@/2d_assets/First Island/Tiled/Tiled_map.png";
import playerIdle from "@/2d_assets/First Island/Characters/Character_1/Idle.png";
import playerWalk from "@/2d_assets/First Island/Characters/Character_1/Walk.png";
import travelerIdle from "@/2d_assets/First Island/Characters/Character_2/Idle.png";
import slimeIdle from "@/2d_assets/First Island/Characters/Character_3/Idle.png";
import emberbugIdle from "@/2d_assets/First Island/Characters/Character_4/Idle.png";
import bristlebackIdle from "@/2d_assets/First Island/Characters/Character_5/Idle.png";
import foxIdle from "@/2d_assets/First Island/Characters/Character_6/Idle.png";
import mosslingIdle from "@/2d_assets/First Island/Characters/Character_7/Idle.png";
import scoutIdle from "@/2d_assets/First Island/Characters/Character_8/Idle.png";
import caveKeeperIdle from "@/2d_assets/First Island/Characters/Character_9/Idle.png";
import { firstIsland, firstIslandActors, orderedFirstIslandLessons } from "@/lib/game/first-island/content";
import { emptyFirstIslandProgress, loadFirstIslandProgress, saveFirstIslandProgress } from "@/lib/game/first-island/progress";
import type { FirstIslandProgress, GameSpriteKey, IslandActor, MapPosition } from "@/types/game";
import { IslandLessonDialog } from "./dialogs/IslandLessonDialog";
import { IslandScoutChallenge } from "./dialogs/IslandScoutChallenge";
import styles from "./GameWorld.module.css";

const actorSprites: Record<GameSpriteKey, { src: string }> = {
  traveler: travelerIdle, slime: slimeIdle, emberbug: emberbugIdle, bristleback: bristlebackIdle,
  fox: foxIdle, mossling: mosslingIdle, scout: scoutIdle, caveKeeper: caveKeeperIdle,
};

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));
const distanceBetween = (left: MapPosition, right: MapPosition) => Math.hypot(left.x - right.x, left.y - right.y);

function CompassIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m14.8 9.2-1.6 4-4 1.6 1.6-4 4-1.6Z" /></svg>;
}

export function FirstIslandWorld() {
  const [playerPosition, setPlayerPosition] = useState<MapPosition>(firstIsland.playerStart);
  const [progress, setProgress] = useState<FirstIslandProgress>(emptyFirstIslandProgress);
  const [selectedActor, setSelectedActor] = useState<IslandActor | null>(null);
  const [lockedMessage, setLockedMessage] = useState<string | undefined>();
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [activeAmbientId, setActiveAmbientId] = useState<string | null>(null);
  const [guidance, setGuidance] = useState("Use WASD or the arrow keys to reach the Beach Cartographer.");
  const [isMoving, setIsMoving] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const movementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveReady, setSaveReady] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    loadFirstIslandProgress().then((saved) => { if (active) { setProgress(saved); setSaveReady(true); } }).catch(() => { if (active) setSaveError("Could not load your island save. Refresh to try again."); });
    return () => { active = false; };
  }, []);

  const nextTeacher = useMemo(
    () => orderedFirstIslandLessons.find((actor) => actor.lesson && !progress.completedLessonIds.includes(actor.lesson.id)),
    [progress.completedLessonIds]
  );
  const totalStops = orderedFirstIslandLessons.length + 1;
  const completedStops = progress.completedLessonIds.length + (progress.challengeCompleted ? 1 : 0);
  const discovery = Math.round((completedStops / totalStops) * 100);

  const updateProgress = useCallback(async (next: FirstIslandProgress) => {
    setSaving(true);
    try {
      const saved = await saveFirstIslandProgress(next);
      setProgress(saved);
      setSaveError("");
    } catch { setSaveError("Your progress was not saved. Please retry this lesson or challenge."); }
    finally { setSaving(false); }
  }, []);

  const interactWithActor = useCallback((actor: IslandActor) => {
    if (distanceBetween(playerPosition, actor.position) > firstIsland.interactionRadius) {
      setGuidance(`${actor.name} is too far away. Walk closer before interacting.`);
      return;
    }
    if (actor.role === "ambient") {
      setActiveAmbientId((current) => current === actor.id ? null : actor.id);
      setGuidance(actor.reaction);
      return;
    }
    if (actor.role === "teacher" && actor.lesson) {
      const done = progress.completedLessonIds.includes(actor.lesson.id);
      setLockedMessage(!done && nextTeacher && nextTeacher.id !== actor.id
        ? `${actor.name} says: “First find ${nextTeacher.name}. That lesson comes before mine.”`
        : undefined);
      setSelectedActor(actor);
      return;
    }
    if (actor.role === "challenge") {
      if (nextTeacher) {
        setLockedMessage(`The Island Scout says: “You are not ready yet. Find ${nextTeacher.name} and complete lesson ${nextTeacher.lesson?.order}.”`);
        setSelectedActor(actor);
      } else {
        setChallengeOpen(true);
      }
    }
  }, [nextTeacher, playerPosition, progress.completedLessonIds]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("textarea, input, select, button") || selectedActor || challengeOpen || !saveReady || saving) return;
      const key = event.key.toLowerCase();
      const movement: Record<string, MapPosition> = {
        arrowup: { x: 0, y: -1.25 }, w: { x: 0, y: -1.25 }, arrowdown: { x: 0, y: 1.25 }, s: { x: 0, y: 1.25 },
        arrowleft: { x: -1.25, y: 0 }, a: { x: -1.25, y: 0 }, arrowright: { x: 1.25, y: 0 }, d: { x: 1.25, y: 0 },
      };
      if (movement[key]) {
        event.preventDefault();
        const delta = movement[key];
        setPlayerPosition((current) => ({ x: clamp(current.x + delta.x, 4, 96), y: clamp(current.y + delta.y, 5, 94) }));
        setIsMoving(true);
        if (movementTimer.current) clearTimeout(movementTimer.current);
        movementTimer.current = setTimeout(() => setIsMoving(false), 130);
      } else if (key === "e") {
        const nearest = [...firstIslandActors].sort((a, b) => distanceBetween(playerPosition, a.position) - distanceBetween(playerPosition, b.position))[0];
        if (nearest) interactWithActor(nearest);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [challengeOpen, interactWithActor, playerPosition, selectedActor, saveReady, saving]);

  useEffect(() => () => { if (movementTimer.current) clearTimeout(movementTimer.current); }, []);

  const completeSelectedLesson = () => {
    if (!selectedActor?.lesson) return;
    const wasCompleted = progress.completedLessonIds.includes(selectedActor.lesson.id);
    const completedLessonIds = wasCompleted ? progress.completedLessonIds : [...progress.completedLessonIds, selectedActor.lesson.id];
    updateProgress({ ...progress, completedLessonIds, coinsEarned: progress.coinsEarned + (wasCompleted ? 0 : 10) });
    setSelectedActor(null);
    setLockedMessage(undefined);
    const upcoming = orderedFirstIslandLessons.find((actor) => actor.lesson && !completedLessonIds.includes(actor.lesson.id));
    setGuidance(upcoming ? `Lesson complete. Continue to ${upcoming.name}.` : "Every lesson is complete. Find the Island Scout for your code challenge.");
  };

  const completeChallenge = () => {
    if (progress.challengeCompleted) return;
    updateProgress({ ...progress, challengeCompleted: true, coinsEarned: progress.coinsEarned + firstIsland.challenge.reward });
    setGuidance("The First Island is complete. Your variables foundation is secure.");
  };

  const currentObjective = nextTeacher
    ? `Find ${nextTeacher.name} · Lesson ${nextTeacher.lesson?.order} of ${orderedFirstIslandLessons.length}`
    : progress.challengeCompleted ? "The First Island is complete" : "Report to the Island Scout for the final trial";

  if (!saveReady) return <main className={styles.gameRoot}><p role="status">{saveError || "Loading your island journal…"}</p><Link href="/learn">Return to learning path</Link></main>;

  return (
    <main className={styles.gameRoot}>
      {saveError && <p role="alert">{saveError}</p>}
      {saving && <p role="status">Saving your progress…</p>}
      <div className={styles.ambientGlow} aria-hidden="true" />
      <header className={styles.topBar}>
        <Link href="/learn" className={styles.gameBrand} aria-label="Return to learning path"><span className={styles.brandMark}>R</span><span><strong>Re:Learn</strong><small>THE FIRST ISLAND</small></span></Link>
        <div className={styles.locationPill}><CompassIcon /><span><small>{firstIsland.chapter}</small><strong>{firstIsland.name}</strong></span></div>
        <div className={styles.topActions}>
          <div className={styles.coinWallet} aria-label={`${progress.coinsEarned} coins`}><span className={styles.coin}>●</span><strong>{progress.coinsEarned}</strong></div>
          <button type="button" className={styles.iconButton} onClick={() => setSoundEnabled((value) => !value)} aria-label={soundEnabled ? "Mute game sounds" : "Enable game sounds"} aria-pressed={soundEnabled}><span aria-hidden="true">♪</span>{!soundEnabled && <i aria-hidden="true" />}</button>
          <Link href="/learn" className={styles.exitButton}>Learning path</Link>
        </div>
      </header>

      <section className={styles.worldShell} aria-label="The First Island learning world">
        <aside className={styles.objectiveCard}><span className={styles.objectiveNumber}>{String(Math.min(completedStops + 1, totalStops)).padStart(2, "0")}</span><div><small>CURRENT OBJECTIVE</small><strong>Variables & values</strong><p>{currentObjective}</p></div></aside>
        <div className={styles.mapViewport}>
          <Image src={mapImage} alt="The First Island, with forests, cliffs, beaches, teachers, and a hilltop camp" priority sizes="(max-width: 1400px) 90vw, 1280px" className={styles.mapImage} />
          <div className={`${styles.player}${isMoving ? ` ${styles.playerWalking}` : ""}`} style={{ left: `${playerPosition.x}%`, top: `${playerPosition.y}%`, backgroundImage: `url(${isMoving ? playerWalk.src : playerIdle.src})` }} aria-label="Your explorer"><span className={styles.playerName}>YOU</span></div>
          {firstIslandActors.map((actor) => {
            const nearby = distanceBetween(playerPosition, actor.position) <= firstIsland.interactionRadius;
            const completed = Boolean(actor.lesson && progress.completedLessonIds.includes(actor.lesson.id));
            const active = activeAmbientId === actor.id;
            return (
              <button key={actor.id} type="button" className={`${styles.ambientActor} ${styles[`actorFrames${actor.frames}`]}${active ? ` ${styles.actorActive}` : ""}${nearby ? ` ${styles.actorNearby}` : ""}`} style={{ left: `${actor.position.x}%`, top: `${actor.position.y}%`, transform: `translate(-50%, -50%) scale(${actor.scale ?? 1})`, backgroundImage: `url(${actorSprites[actor.sprite].src})` }} onClick={() => interactWithActor(actor)} aria-label={`${nearby ? "Interact with" : "Move closer to"} ${actor.name}`}>
                {actor.lesson ? <span className={`${styles.teacherBadge}${completed ? ` ${styles.teacherComplete}` : ""}`}>{completed ? "✓" : actor.lesson.order}</span> : null}
                {actor.role === "challenge" ? <span className={styles.challengeBadge}>!</span> : null}
                <span className={styles.actorName}>{actor.name}</span>
                {active ? <span className={styles.actorReaction} role="status">{actor.reaction}</span> : null}
              </button>
            );
          })}
          <div className={styles.mapHint}><span>MOVE</span> WASD / arrows <i /> <span>INTERACT</span> click or E</div>
        </div>
        <aside className={styles.discoveryCard}><span>ISLAND PROGRESS</span><strong>{discovery}%</strong><div><i style={{ width: `${discovery}%` }} /></div></aside>
      </section>

      <footer className={styles.gameFooter}><span>{guidance}</span><span><kbd>WASD</kbd> move <i /> <kbd>E</kbd> interact</span></footer>
      {selectedActor ? <IslandLessonDialog actor={selectedActor} lockedMessage={lockedMessage} completed={Boolean(selectedActor.lesson && progress.completedLessonIds.includes(selectedActor.lesson.id))} onClose={() => { setSelectedActor(null); setLockedMessage(undefined); }} onComplete={completeSelectedLesson} /> : null}
      {challengeOpen ? <IslandScoutChallenge exerciseId={firstIsland.challenge.exerciseId} title={firstIsland.challenge.title} reward={firstIsland.challenge.reward} alreadyCompleted={progress.challengeCompleted} onClose={() => setChallengeOpen(false)} onComplete={completeChallenge} /> : null}
    </main>
  );
}
