"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { learningWorlds } from "@/lib/game/worlds";
import { PixelSprite } from "@/components/ui/PixelSprite";
import type { FirstIslandProgress } from "@/types/game";
import { adventureHref, topicNames, type AdventureProgress } from "@/lib/game/curriculum";

// Small bitmap lettering keeps the title crisp without an external font request.
const glyphs: Record<string, string[]> = {
  L: ["10000","10000","10000","10000","10000","10000","11111"],
  E: ["11111","10000","10000","11110","10000","10000","11111"],
  A: ["01110","10001","10001","11111","10001","10001","10001"],
  R: ["11110","10001","10001","11110","10100","10010","10001"],
  N: ["10001","11001","11001","10101","10011","10011","10001"],
  X: ["10001","10001","01010","00100","01010","10001","10001"],
  P: ["11110","10001","10001","11110","10000","10000","10000"],
  O: ["01110","10001","10001","10001","10001","10001","01110"],
  V: ["10001","10001","10001","10001","10001","01010","00100"],
  U: ["10001","10001","10001","10001","10001","10001","01110"],
  ".": ["00000","00000","00000","00000","00000","00110","00110"],
};

function PixelLine({ text }: { text: string }) {
  return <svg viewBox={`0 0 ${text.length * 6 - 1} 7`} aria-hidden="true" shapeRendering="crispEdges">
    {Array.from(text).flatMap((letter, index) => (glyphs[letter] ?? []).flatMap((row, y) =>
      Array.from(row).map((pixel, x) => pixel === "1" ? <rect key={`${index}-${y}-${x}`} x={index * 6 + x} y={y} width="1" height="1" fill="currentColor" /> : null),
    ))}
  </svg>;
}

export function AdventureHero({ name, progress, loading, recentAdventure }: { name: string; progress: FirstIslandProgress; loading: boolean; recentAdventure?: AdventureProgress | null }) {
  const [selection, setSelection] = useState<number | null>(null);
  const complete = progress.completedLessonIds.length === 6 && progress.challengeCompleted;
  const selected = selection ?? (recentAdventure ? recentAdventure.world === "first-island" ? 0 : 1 : complete ? 1 : 0);
  const world = learningWorlds[selected];
  const resume = recentAdventure && selected === (recentAdventure.world === "first-island" ? 0 : 1) ? recentAdventure : null;
  return <section className="adventure-hero" aria-label="Your next adventure">
    <Image key={world.id} src={world.image} alt="" fill sizes="100vw" unoptimized priority className={`adventure-scene adventure-scene-${world.art}`} />
    <div className="adventure-vignette" />
    <div className="adventure-hero-top"><span>THE PYTHON CHRONICLES</span><span>WORLD {String(selected + 1).padStart(2, "0")} / 02</span></div>
    <div className="adventure-hero-copy">
      <span className="adventure-welcome">WELCOME BACK, {name.toUpperCase()}</span>
      <h1 aria-label="Learn. Explore. Level up."><PixelLine text="LEARN. EXPLORE." /><PixelLine text="LEVEL UP." /></h1>
      <p>A little curiosity. A world of discovery.<br />Learn Python, meet your guides, and turn every mistake into your next move.</p>
      <Link href={resume ? adventureHref(resume) : world.href} className="solid-action adventure-play"><span aria-hidden="true">▶</span>{resume ? resume.completed ? "Revisit adventure" : "Resume adventure" : "Choose topic & difficulty"}<span aria-hidden="true">↗</span></Link>
      <span className="adventure-save-status">{loading ? "Loading your journey…" : resume ? `${topicNames[resume.track.split("-")[0]]} · ${resume.track.split("-")[1]} · ${resume.coinsEarned} coins` : "5 topics · 3 difficulty levels · Your own pace"}</span>
    </div>
    <div className="adventure-guide"><span className="adventure-guide-sprite"><PixelSprite character={selected === 0 ? "explorer" : "scout"} /></span><span>YOUR NEXT DESTINATION<strong>{world.name}</strong></span></div>
    <div className="adventure-selector" aria-label="Preview a world">
      {learningWorlds.map((item, index) => <button key={item.id} type="button" aria-pressed={selected === index} onClick={() => setSelection(index)} className={selected === index ? "selected" : ""}>
        <Image src={item.image} alt="" unoptimized sizes="200px" />
        <span><small>0{index + 1} / {item.topic}</small><strong>{item.name}</strong></span>
      </button>)}
    </div>
  </section>;
}
