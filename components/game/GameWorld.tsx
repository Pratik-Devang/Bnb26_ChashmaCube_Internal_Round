"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import mapImage from "../../2d assets/Tiled/Tiled_map.png";
import playerIdle from "../../2d assets/Characters/Character_1/Idle.png";
import travelerIdle from "../../2d assets/Characters/Character_2/Idle.png";
import slimeIdle from "../../2d assets/Characters/Character_3/Idle.png";
import emberbugIdle from "../../2d assets/Characters/Character_4/Idle.png";
import bristlebackIdle from "../../2d assets/Characters/Character_5/Idle.png";
import foxIdle from "../../2d assets/Characters/Character_6/Idle.png";
import mosslingIdle from "../../2d assets/Characters/Character_7/Idle.png";
import scoutIdle from "../../2d assets/Characters/Character_8/Idle.png";
import caveKeeperIdle from "../../2d assets/Characters/Character_9/Idle.png";
import { ambientActors, learningLandmarks, starterIsland } from "@/lib/game/world-data";
import type { AmbientActor, LearningLandmark } from "@/types/game";
import styles from "./GameWorld.module.css";

const actorSprites = {
  traveler: travelerIdle,
  slime: slimeIdle,
  emberbug: emberbugIdle,
  bristleback: bristlebackIdle,
  fox: foxIdle,
  mossling: mosslingIdle,
  scout: scoutIdle,
  caveKeeper: caveKeeperIdle,
};

function CompassIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m14.8 9.2-1.6 4-4 1.6 1.6-4 4-1.6Z" />
    </svg>
  );
}

function SoundIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 10v4h3l4 3V7L8 10H5Z" />
      <path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7.4 7.4 0 0 1 0 10" />
    </svg>
  );
}

function LearningDialog({ landmark, onClose }: { landmark: LearningLandmark; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className={styles.dialogScrim} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="landmark-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.dialogArt} aria-hidden="true">
          <span className={styles.beaconCore} />
          <span className={styles.beaconRing} />
          <small>NEW DISCOVERY</small>
        </div>

        <div className={styles.dialogBody}>
          <div className={styles.dialogTopline}>
            <span>{landmark.eyebrow}</span>
            <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close learning activity">
              ×
            </button>
          </div>

          <h2 id="landmark-title">{landmark.title}</h2>
          <p>{landmark.description}</p>

          <div className={styles.missionBrief}>
            <span>Mission</span>
            <strong>{landmark.objective}</strong>
          </div>

          <div className={styles.dialogMeta}>
            <span><small>DIFFICULTY</small><strong>{landmark.difficulty}</strong></span>
            <span><small>EST. TIME</small><strong>5 minutes</strong></span>
            <span><small>REWARD</small><strong className={styles.rewardText}>● {landmark.reward}</strong></span>
          </div>

          <div className={styles.dialogActions}>
            <button type="button" className={styles.secondaryAction} onClick={onClose}>Not now</button>
            <Link className={styles.primaryAction} href={`/learn/${landmark.exerciseId}`}>
              Begin activity <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function GameWorld() {
  const [selectedLandmark, setSelectedLandmark] = useState<LearningLandmark | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeActorId, setActiveActorId] = useState<string | null>(null);

  const toggleActor = (actor: AmbientActor) => {
    setActiveActorId((currentId) => currentId === actor.id ? null : actor.id);
  };

  return (
    <main className={styles.gameRoot}>
      <div className={styles.ambientGlow} aria-hidden="true" />

      <header className={styles.topBar}>
        <Link href="/" className={styles.gameBrand} aria-label="Return to Re:Learn dashboard">
          <span className={styles.brandMark}>R</span>
          <span><strong>Re:Learn</strong><small>ADVENTURES</small></span>
        </Link>

        <div className={styles.locationPill}>
          <CompassIcon />
          <span><small>{starterIsland.chapter}</small><strong>{starterIsland.name}</strong></span>
        </div>

        <div className={styles.topActions}>
          <div className={styles.coinWallet} aria-label={`${starterIsland.coins} coins`}>
            <span className={styles.coin}>●</span>
            <strong>{starterIsland.coins}</strong>
          </div>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setSoundEnabled((enabled) => !enabled)}
            aria-label={soundEnabled ? "Mute game sounds" : "Enable game sounds"}
            aria-pressed={soundEnabled}
          >
            <SoundIcon />
            {!soundEnabled && <i aria-hidden="true" />}
          </button>
          <Link href="/" className={styles.exitButton}>Exit world</Link>
        </div>
      </header>

      <section className={styles.worldShell} aria-label="Starter Island game world">
        <aside className={styles.objectiveCard}>
          <span className={styles.objectiveNumber}>01</span>
          <div>
            <small>CURRENT QUEST</small>
            <strong>First Signal</strong>
            <p>{starterIsland.objective}</p>
          </div>
        </aside>

        <div className={styles.mapViewport}>
          <Image
            src={mapImage}
            alt="A pixel-art island with cliffs, forest, beaches, and a hilltop campsite"
            priority
            sizes="(max-width: 1400px) 90vw, 1280px"
            className={styles.mapImage}
          />

          <div
            className={styles.player}
            style={{ backgroundImage: `url(${playerIdle.src})` }}
            aria-label="Your explorer"
          >
            <span className={styles.playerName}>YOU</span>
          </div>

          {ambientActors.map((actor) => {
            const active = activeActorId === actor.id;
            return (
              <button
                key={actor.id}
                type="button"
                className={`${styles.ambientActor} ${styles[`actorFrames${actor.frames}`]}${active ? ` ${styles.actorActive}` : ""}`}
                style={{
                  left: `${actor.position.x}%`,
                  top: `${actor.position.y}%`,
                  transform: `translate(-50%, -50%) scale(${actor.scale ?? 1})`,
                  backgroundImage: `url(${actorSprites[actor.sprite].src})`,
                }}
                onClick={() => toggleActor(actor)}
                aria-label={`Talk to ${actor.name}`}
                aria-pressed={active}
              >
                <span className={styles.actorName}>{actor.name}</span>
                <span className={styles.actorReaction} role="status">{actor.reaction}</span>
              </button>
            );
          })}

          {learningLandmarks.map((landmark) => (
            <button
              key={landmark.id}
              type="button"
              className={styles.landmark}
              style={{ left: `${landmark.position.x}%`, top: `${landmark.position.y}%` }}
              onClick={() => setSelectedLandmark(landmark)}
              aria-label={`Open learning activity: ${landmark.title}`}
            >
              <span className={styles.landmarkPulse} aria-hidden="true" />
              <span className={styles.landmarkIcon} aria-hidden="true"><b>!</b></span>
              <span className={styles.landmarkLabel}>
                <small>NEW ACTIVITY</small>
                <strong>{landmark.title}</strong>
                <i>Interact</i>
              </span>
            </button>
          ))}

          <div className={styles.mapHint}>
            <span>TIP</span>
            Select the glowing marker to investigate
          </div>
        </div>

        <aside className={styles.discoveryCard}>
          <span>ISLAND DISCOVERED</span>
          <strong>12%</strong>
          <div><i /></div>
        </aside>
      </section>

      <footer className={styles.gameFooter}>
        <span>Prototype world · Progress is not saved yet</span>
        <span><kbd>Click</kbd> to interact <i /> <kbd>Esc</kbd> to close</span>
      </footer>

      {selectedLandmark && (
        <LearningDialog landmark={selectedLandmark} onClose={() => setSelectedLandmark(null)} />
      )}
    </main>
  );
}
