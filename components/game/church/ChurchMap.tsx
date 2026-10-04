"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import churchExterior from "@/2d_assets/Church/Maps/Ruined_temple_exterior.png";
import churchInterior from "@/2d_assets/Church/Maps/Ruined_temple_interior.png";
import playerIdle from "@/2d_assets/First Island/Characters/Character_1/Idle.png";
import playerWalk from "@/2d_assets/First Island/Characters/Character_1/Walk.png";
import styles from "./ChurchMap.module.css";

type ChurchScene = "exterior" | "interior";
type Position = { x: number; y: number };

const scenes: Record<ChurchScene, {
  map: StaticImageData;
  name: string;
  objective: string;
  start: Position;
  bounds: { left: number; right: number; top: number; bottom: number };
}> = {
  exterior: {
    map: churchExterior,
    name: "Church Grounds",
    objective: "Follow the broken path to the temple gates.",
    start: { x: 50, y: 60 },
    bounds: { left: 16, right: 88, top: 15, bottom: 65 },
  },
  interior: {
    map: churchInterior,
    name: "Forgotten Sanctuary",
    objective: "The sanctuary is ready for its future Conditions lessons.",
    start: { x: 50, y: 70 },
    bounds: { left: 26, right: 81, top: 29, bottom: 73 },
  },
};

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

export function ChurchMap() {
  const [scene, setScene] = useState<ChurchScene>("exterior");
  const [playerPosition, setPlayerPosition] = useState<Position>(scenes.exterior.start);
  const [isMoving, setIsMoving] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const movementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentScene = scenes[scene];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, button, a") || isTransitioning) return;
      const movement: Record<string, Position> = {
        arrowup: { x: 0, y: -1.25 }, w: { x: 0, y: -1.25 },
        arrowdown: { x: 0, y: 1.25 }, s: { x: 0, y: 1.25 },
        arrowleft: { x: -1.25, y: 0 }, a: { x: -1.25, y: 0 },
        arrowright: { x: 1.25, y: 0 }, d: { x: 1.25, y: 0 },
      };
      const delta = movement[event.key.toLowerCase()];
      if (!delta) return;

      event.preventDefault();
      const next = {
        x: clamp(playerPosition.x + delta.x, currentScene.bounds.left, currentScene.bounds.right),
        y: clamp(playerPosition.y + delta.y, currentScene.bounds.top, currentScene.bounds.bottom),
      };
      setPlayerPosition(next);
      if (scene === "exterior" && next.x >= 44 && next.x <= 56 && next.y <= 43) {
        setIsTransitioning(true);
        window.setTimeout(() => {
          setScene("interior");
          setPlayerPosition(scenes.interior.start);
          setIsTransitioning(false);
        }, 380);
      }
      setIsMoving(true);
      if (movementTimer.current) clearTimeout(movementTimer.current);
      movementTimer.current = setTimeout(() => setIsMoving(false), 130);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentScene.bounds, isTransitioning, playerPosition, scene]);

  useEffect(() => () => {
    if (movementTimer.current) clearTimeout(movementTimer.current);
  }, []);

  return (
    <main className={styles.scene}>
      <header className={styles.header}>
        <div>
          <span>WORLD 02</span>
          <h1>The Ruined Church</h1>
        </div>
        <div className={styles.location}><small>LOCATION</small><strong>{currentScene.name}</strong></div>
        <Link href="/learn">Return to learning path</Link>
      </header>

      <section className={styles.mapFrame} aria-label="The exterior grounds of the ruined church">
        <aside className={styles.objective}>
          <span>01</span>
          <div><small>CURRENT OBJECTIVE</small><strong>{currentScene.objective}</strong></div>
        </aside>
        <Image
          src={currentScene.map}
          alt={scene === "exterior" ? "A ruined church surrounded by forest, water, statues, and two explorers" : "The interior of a ruined sanctuary occupied by a mysterious gathering"}
          priority
          className={styles.map}
          sizes="min(92vw, 1100px)"
        />
        <div
          className={`${styles.player}${isMoving ? ` ${styles.playerWalking}` : ""}`}
          style={{ left: `${playerPosition.x}%`, top: `${playerPosition.y}%`, backgroundImage: `url(${isMoving ? playerWalk.src : playerIdle.src})` }}
          aria-label="Your explorer"
        >
          <span>YOU</span>
        </div>
        {scene === "exterior" ? <div className={styles.gateHint}>TEMPLE GATES</div> : null}
        <div className={styles.controls}><kbd>WASD</kbd> or arrow keys to move</div>
        <div className={`${styles.transition}${isTransitioning ? ` ${styles.transitionActive}` : ""}`} aria-hidden="true" />
      </section>
    </main>
  );
}
