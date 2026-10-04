import Image from "next/image";
import Link from "next/link";
import { learningWorlds } from "@/lib/game/worlds";
import { PixelSprite } from "@/components/ui/PixelSprite";
import styles from "./LearnMap.module.css";

export function LearnMap() {
  return (
    <main className={styles.atlas}>
      <header className={styles.heading} data-scroll-reveal>
        <div>
          <span className={styles.eyebrow}>RE:LEARN / THE WORLD ATLAS</span>
          <h1>Where will you <em>wander?</em></h1>
          <p>A quiet shore. A forgotten sanctuary. A new idea waiting in each.</p>
        </div>
        <div className={styles.worldCount}><strong>{String(learningWorlds.length).padStart(2, "0")}</strong><span>worlds open<br />for discovery</span></div>
      </header>
      <section aria-label="Choose a learning world">
        <div className={styles.sectionHeading}><span>CHOOSE YOUR DESTINATION</span><span>YOUR ADVENTURE, YOUR PACE</span></div>
        <ol className={styles.destinations}>
          {learningWorlds.map((world, index) => (
            <li key={world.id} className={styles.destination} data-scroll-reveal>
              <Link href={world.href} className={`${styles.worldLink} ${world.art === "church" ? styles.church : styles.island}`}>
                <div className={styles.landscape} aria-hidden="true">
                  <Image src={world.image} alt="" unoptimized className={styles.mapArt} />
                  <div className={styles.shade} />
                  <span className={styles.worldNumber}>WORLD <b>{String(index + 1).padStart(2, "0")}</b></span>
                  <span className={styles.location}>{world.art === "church" ? "ANCIENT RUINS / WOODLAND" : "SUNLIT SHORES / WILDERNESS"}</span>
                  <span className={styles.motes}><i /><i /><i /><i /></span>
                </div>
                <div className={styles.plaque}>
                  <span className={styles.chapter}>{world.art === "church" ? "BEYOND THE TEMPLE GATES" : "EVERY JOURNEY BEGINS SOMEWHERE"}</span>
                  <h2>{world.name}</h2>
                  <p>{world.description}</p>
                  <div className={styles.details}><span>{world.topic}</span><i aria-hidden="true">◆</i><span>{world.label}</span></div>
                  <div className={styles.departure}>
                    <span className={styles.guide}><PixelSprite character={world.art === "church" ? "scout" : "explorer"} /><span>Meet your guides.<br /><strong>Find your next idea.</strong></span></span>
                    <span className={styles.action}>Choose topic <b aria-hidden="true">↗</b></span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </section>
      <footer className={styles.fieldNote}>
        <span className={styles.noteMark} aria-hidden="true">✦</span>
        <div><strong>A note for the curious</strong><p>Choose a world, pick a Python topic, then set your difficulty. Your guides will take it from there.</p></div>
        <span className={styles.noteEnd} aria-hidden="true">EXPLORE · LEARN · RETURN</span>
      </footer>
    </main>
  );
}
