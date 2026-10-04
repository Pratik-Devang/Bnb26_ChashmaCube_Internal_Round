import Image from "next/image";
import Link from "next/link";
import { learningWorlds } from "@/lib/game/worlds";
import styles from "./LearnMap.module.css";

export function LearnMap() {
  const height = Math.max(740, learningWorlds.length * 300 + 160);
  const stops = learningWorlds.map((world, index) => ({ world, x: index % 2 === 0 ? 29 : 72, y: 240 + index * 300 }));
  return (
    <main className={styles.atlas}>
      <header className={styles.heading} data-scroll-reveal>
        <div><span>THE RE:LEARN ATLAS</span><h1>A world of discovery.</h1><p>Pick an island. Let curiosity lead the way.</p></div>
        <span className={styles.worldCount}>{String(learningWorlds.length).padStart(2, "0")} <small>WORLDS TO EXPLORE</small></span>
      </header>
      <section className={styles.ocean} aria-label="Learning worlds" style={{ height }}>
        <div className={styles.chartTitle}><span>PYTHON ARCHIPELAGO</span><small>Choose a destination to begin your journey</small></div>
        <div className={styles.compass} aria-hidden="true"><span>N</span>✥</div>
        <svg className={styles.routes} viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" aria-hidden="true">
          {stops.slice(1).map((stop, index) => {
            const previous = stops[index];
            return <path key={stop.world.id} d={`M ${previous.x * 10} ${previous.y} C ${previous.x * 10} ${previous.y - 200}, ${stop.x * 10} ${stop.y + 200}, ${stop.x * 10} ${stop.y}`} />;
          })}
        </svg>
        <span className={styles.seaLabel} aria-hidden="true">THE SEA OF POSSIBILITIES</span>
        <ol className={styles.destinations}>
          {stops.map(({ world, x, y }, index) => (
            <li key={world.id} className={styles.destination} data-scroll-reveal style={{ left: `${x}%`, top: y }}>
              <Link href={world.href} className={styles.worldLink} aria-label={`Enter ${world.name}. ${world.label}`}>
                <div className={`${styles.landscape} ${world.art === "church" ? styles.church : styles.island}`}><Image src={world.image} alt="" unoptimized className={styles.mapArt} /></div>
                <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
                <div className={styles.plaque}><small>{world.topic}</small><h2>{world.name}</h2><span>{world.label}</span><b>EXPLORE WORLD <span aria-hidden="true">→</span></b></div>
              </Link>
            </li>
          ))}
        </ol>
        <div className={styles.chartFooter}><span aria-hidden="true">✦</span> Your next chapter begins on shore.</div>
      </section>
    </main>
  );
}
