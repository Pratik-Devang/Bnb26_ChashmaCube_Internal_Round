"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PixelText } from "@/components/ui/PixelText";
import { adventureHref, loadAdventureJournal, loadCurriculum, topicNames, type AdventureProgress, type CurriculumTrack } from "@/lib/game/curriculum";
import opening from "@/2d_assets/Book/PNG/Open_book.png";
import closing from "@/2d_assets/Book/PNG/Close_book.png";
import forward from "@/2d_assets/Book/PNG/Turning_pages_left.png";
import backward from "@/2d_assets/Book/PNG/Turning_pages_right.png";
import icon1 from "@/2d_assets/Book/PNG/Icons/Icon1_big.png";
import icon2 from "@/2d_assets/Book/PNG/Icons/Icon2_big.png";
import icon3 from "@/2d_assets/Book/PNG/Icons/Icon3_big.png";
import icon4 from "@/2d_assets/Book/PNG/Icons/Icon4_big.png";
import icon5 from "@/2d_assets/Book/PNG/Icons/Icon5_big.png";
import icon6 from "@/2d_assets/Book/PNG/Icons/Icon6_big.png";
import icon7 from "@/2d_assets/Book/PNG/Icons/Icon7_big.png";
import icon8 from "@/2d_assets/Book/PNG/Icons/Icon8_big.png";
import icon9 from "@/2d_assets/Book/PNG/Icons/Icon9_big.png";
import icon10 from "@/2d_assets/Book/PNG/Icons/Icon10_big.png";
import icon11 from "@/2d_assets/Book/PNG/Icons/Icon11_big.png";
import icon12 from "@/2d_assets/Book/PNG/Icons/Icon12_big.png";
import icon13 from "@/2d_assets/Book/PNG/Icons/Icon13_big.png";
import icon14 from "@/2d_assets/Book/PNG/Icons/Icon14_big.png";
import icon15 from "@/2d_assets/Book/PNG/Icons/Icon15_big.png";
import icon16 from "@/2d_assets/Book/PNG/Icons/Icon16_big.png";
import icon17 from "@/2d_assets/Book/PNG/Icons/Icon17_big.png";
import icon18 from "@/2d_assets/Book/PNG/Icons/Icon18_big.png";
import icon19 from "@/2d_assets/Book/PNG/Icons/Icon19_big.png";
import icon20 from "@/2d_assets/Book/PNG/Icons/Icon20_big.png";
import styles from "./SkillBook.module.css";

const icons = [icon1, icon2, icon3, icon4, icon5, icon6, icon7, icon8, icon9, icon10, icon11, icon12, icon13, icon14, icon15, icon16, icon17, icon18, icon19, icon20];
const topics = Object.keys(topicNames);
const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
const moduleNotes: Record<string, { description: string; application: string }> = {
  variables: { description: "Give information a name, understand its type, and follow how values change as your program runs.", application: "Use variables to remember a player's score, store a name, or update a running total. Check the type of each value before combining it with another." },
  conditions: { description: "Turn rules into decisions with comparisons, Boolean logic, and branches that choose what happens next.", application: "Use conditions to check a password, decide whether a player can enter a room, or handle an empty input. Try inputs on both sides of a condition, including the boundary." },
  loops: { description: "Repeat work deliberately: trace each iteration, update values, and know exactly when repetition stops.", application: "Use loops to process a collection or repeat an action until a condition changes. Trace the first and last iteration, and check that a while loop can reach its stopping condition." },
  lists: { description: "Organize several values together, retrieve the right item, and understand how collections change.", application: "Use lists for an inventory, a set of scores, or a queue of tasks. Check which index you need and whether an operation changes the original list." },
  functions: { description: "Package a task into reusable code, pass in the information it needs, and return a useful result.", application: "Use functions when a calculation or action needs to be reused. Identify the inputs, trace the function body, and distinguish a returned value from text printed to the screen." },
};
type Skill = CurriculumTrack["lessons"][number] & {
  key: string; track: string; topic: string; difficulty: CurriculumTrack["difficulty"]; unlocked: boolean; icon: number;
};
type Motion = "closed" | "opening" | "open" | "next" | "previous" | "closing";

export function SkillBook() {
  const [skills, setSkills] = useState<Record<string, Skill[]>>({});
  const [saves, setSaves] = useState<AdventureProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [page, setPage] = useState(0);
  const [motion, setMotion] = useState<Motion>("closed");
  const [frame, setFrame] = useState(0);
  const [selected, setSelected] = useState<Skill | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const pendingPage = useRef(0);
  const trigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let active = true;
    let request = 0;
    async function refresh() {
      const current = ++request;
      setLoading(true);
      try {
        const [catalog, journal] = await Promise.all([loadCurriculum(), loadAdventureJournal()]);
        const learned = new Set(journal.saves.flatMap(save =>
          save.completedLessonIds.map(id => save.track + ":" + id)));
        const result: Record<string, Skill[]> = {};
        topics.forEach((topic, topicIndex) => {
          result[topic] = catalog.filter(track => track.topic === topic)
            .sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty])
            .flatMap(track => track.lessons.map(lesson => ({
              ...lesson, key: track.id + ":" + lesson.id, track: track.id, topic, difficulty: track.difficulty,
              unlocked: learned.has(track.id + ":" + lesson.id), icon: 0,
            }))).map((skill, index) => ({ ...skill, icon: (topicIndex * 4 + index % 4) % icons.length }));
        });
        if (active && current === request) { setSkills(result); setSaves(journal.saves); setError(""); }
      } catch {
        if (active && current === request) setError("Your skills could not be loaded. Retry to reconnect to your saved progress.");
      } finally {
        if (active && current === request) setLoading(false);
      }
    }
    void refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("relearn:account-updated", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("relearn:account-updated", refresh);
    };
  }, [retry]);

  useEffect(() => {
    // Preload all animation sheets before their first frame is needed.
    [opening, closing, forward, backward].forEach(asset => {
      const image = new window.Image(); image.src = asset.src;
    });
  }, []);

  useEffect(() => {
    if (motion === "closed" || motion === "open") return;
    const lastFrame = motion === "opening" || motion === "closing" ? 11 : 14;
    const finish = () => {
      setPage(pendingPage.current);
      setMotion(motion === "closing" ? "closed" : "open");
      setFrame(0);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    let current = 0;
    const timer = window.setInterval(() => {
      current += 1;
      if (current > lastFrame) { window.clearInterval(timer); finish(); }
      else setFrame(current);
    }, 65);
    return () => window.clearInterval(timer);
  }, [motion]);

  useEffect(() => {
    if (selected) dialog.current?.showModal();
    else if (dialog.current?.open) dialog.current.close();
  }, [selected]);

  const busy = motion !== "open" && motion !== "closed";
  const currentSkills = skills[topics[page]] ?? [];
  const allSkills = Object.values(skills).flat();
  const learned = allSkills.filter(skill => skill.unlocked).length;
  const ready = !loading && !error && allSkills.length > 0;
  const percent = allSkills.length ? Math.round(learned / allSkills.length * 100) : 0;
  const moduleLearned = currentSkills.filter(skill => skill.unlocked).length;
  const modulesComplete = topics.filter(topic => skills[topic]?.length && skills[topic].every(skill => skill.unlocked)).length;
  const validTracks = new Set(allSkills.map(skill => skill.track));
  const completedTracks = new Set(saves.filter(save => save.completed && validTracks.has(save.track)).map(save => save.track));
  const nextSkill = currentSkills.find(skill => !skill.unlocked);
  const nextTopic = topics.findIndex(topic => skills[topic]?.some(skill => !skill.unlocked));
  function destination(track: string) {
    const recentSave = saves.filter(save => save.track === track)
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))[0];
    return adventureHref({ track, world: recentSave?.world ?? "first-island" });
  }
  const sheet = motion === "closing" ? closing : motion === "next" ? forward : motion === "previous" ? backward : opening;
  const rows = motion === "next" || motion === "previous" ? 4 : 3;
  const spriteFrame = motion === "open" ? 11 : motion === "closed" ? 0 : frame;

  function animate(next: Motion, target = page) {
    if (busy) return;
    pendingPage.current = target;
    setFrame(0);
    setMotion(next);
  }
  function turn(target: number) {
    if (motion !== "open" || target < 0 || target >= topics.length || target === page) return;
    animate(target > page ? "next" : "previous", target);
  }
  function dismiss() {
    setSelected(null);
    trigger.current?.focus();
  }

  return <section className={styles.library} aria-labelledby="skill-book-heading">
    <header className={styles.header}>
      <div><span className={styles.eyebrow}>YOUR PERSONAL GRIMOIRE</span>
        <h1 id="skill-book-heading"><PixelText text="The book of Python." /></h1>
        <p>Your learning record: revisit skills you have learned, see what remains, and choose your next lesson.</p></div>
      <div className={styles.counter} aria-live="polite">
        <strong>{loading ? "…" : error ? "—" : learned}</strong>
        <span>lessons learned<br />{ready && `of ${allSkills.length} across ${topics.length} modules`}</span>
      </div>
    </header>
    {error && <div className={styles.error} role="alert">{error} <button onClick={() => setRetry(value => value + 1)}>Retry</button></div>}
    <section className={styles.progressSummary} aria-label="Your learning progress">
      <div className={styles.overallProgress}>
        <span className={styles.eyebrow}>LESSON COMPLETION</span>
        <strong>{ready ? `${percent}%` : "—"}</strong>
        <progress aria-label="Overall lesson completion" value={ready ? learned : 0} max={allSkills.length || 1} />
        <p>{ready ? `${learned} learned · ${allSkills.length - learned} still to discover` : loading ? "Loading your saved progress…" : "Progress unavailable until your journal loads."}</p>
      </div>
      <div><strong>{ready ? `${modulesComplete} / ${topics.length}` : "—"}</strong><span>Modules fully read</span><p>All easy, medium, and hard lessons completed in a module.</p></div>
      <div><strong>{ready ? `${completedTracks.size} / ${validTracks.size}` : "—"}</strong><span>Adventure tracks completed</span><p>Topic + difficulty tracks finished on at least one map.</p></div>
      <p className={styles.progressNote}>Learned means you completed a lesson. It does not mean you have mastered it. Challenge mastery and your attempt history remain available below the book.</p>
    </section>
    {ready && <nav className={styles.moduleIndex} aria-label="Module progress">
      {topics.map((topic, index) => {
        const entries = skills[topic] ?? [];
        const count = entries.filter(skill => skill.unlocked).length;
        return <button key={topic} disabled={busy} aria-current={page === index ? "page" : undefined}
          onClick={() => motion === "closed" ? animate("opening", index) : turn(index)}>
          <span>0{index + 1} / {topicNames[topic]}</span><strong>{count}/{entries.length}</strong>
          <small>{count === 0 ? "Not started" : count === entries.length ? "All lessons learned" : "In progress"}</small>
        </button>;
      })}
    </nav>}
    <div className={styles.desk}>
      <div className={styles.deskHeading}><span>✦ THE SKILL ARCHIVE</span><span>PYTHON / VOL. 01</span></div>
      <div className={styles.motes} aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</div>
      <div className={styles.scroll}>
        <div className={styles.book} aria-busy={busy}>
          <div className={`${styles.sprite} ${motion === "closed" ? styles.closed : ""}`} aria-hidden="true" style={{
            backgroundImage: `url("${sheet.src}")`,
            backgroundSize: `400% ${rows * 100}%`,
            backgroundPosition: `${(spriteFrame % 4) / 3 * 100}% ${Math.floor(spriteFrame / 4) / (rows - 1) * 100}%`,
          }} />
          {motion === "closed" && <button className={styles.coverButton} onClick={() => animate("opening")} aria-label="Open your Python skill book"><span>Click to open your book <b>↗</b></span></button>}
          {motion === "open" && <>
            <button className={`${styles.edge} ${styles.leftEdge}`} aria-label="Previous module" disabled={page === 0} onClick={() => turn(page - 1)}>‹</button>
            <button className={`${styles.edge} ${styles.rightEdge}`} aria-label="Next module" disabled={page === topics.length - 1} onClick={() => turn(page + 1)}>›</button>
            <div key={page} className={styles.spread}>
              {[0, 1].map(side => <section key={side} className={styles.paper} onClick={event => {
                // The page itself turns; skill tiles keep their own interaction.
                if ((event.target as HTMLElement).closest("button")) return;
                turn(page + (side === 0 ? -1 : 1));
              }}>
                <header><span>{side === 0 ? `CHAPTER 0${page + 1}` : "YOUR COLLECTION"}</span>
                  <h2><PixelText text={side === 0 ? topicNames[topics[page]] : "Advanced skills"} /></h2>
                  <p>{side === 0 ? "Build your foundation · Easy & medium" : "Extend your understanding · Hard"}</p>
                </header>
                {loading || error ? <p className={styles.paperStatus}>{loading ? "Reading your journal…" : "Waiting for your journal…"}</p> :
                  <div className={styles.grid}>
                    {currentSkills.slice(side * 6, side * 6 + 6).map(skill => <button
                      key={skill.key} disabled={!skill.unlocked} className={styles.skill}
                      title={skill.unlocked ? skill.title : `Locked: complete “${skill.title}” (${skill.difficulty}) on either map.`}
                      aria-label={`${skill.title}, ${skill.difficulty}, ${skill.unlocked ? "learned: view description" : "locked"}`}
                      onClick={event => { trigger.current = event.currentTarget; setSelected(skill); }}>
                      <span className={styles.iconFrame}><Image src={icons[skill.icon]} alt="" unoptimized /><i>{skill.unlocked ? "✓" : "⌑"}</i></span>
                      <span className={styles.skillName}><PixelText text={skill.title} /></span><small>{skill.difficulty} · {skill.unlocked ? "Learned" : "Locked"}</small>
                    </button>)}
                    {Array.from({ length: Math.max(0, 6 - currentSkills.slice(side * 6, side * 6 + 6).length) }, (_, index) =>
                      <div key={index} className={styles.emptySlot} aria-hidden="true">✧</div>)}
                  </div>}
                <footer>{page * 2 + side + 1}</footer>
              </section>)}
            </div>
          </>}
        </div>
      </div>
      <div className={styles.controls}>
        {motion !== "closed" ? <>
          <button disabled={busy || page === 0} onClick={() => turn(page - 1)}>← Previous</button>
          <span aria-live="polite">{topicNames[topics[page]]} · {page + 1} / {topics.length}</span>
          <button disabled={busy || page === topics.length - 1} onClick={() => turn(page + 1)}>Next →</button>
        </> : <p>Open the book to review your skills, or choose a module above.</p>}
      </div>
    </div>
    {ready && <section className={styles.moduleReport} aria-label={`${topicNames[topics[page]]} progress`}>
      <div className={styles.moduleDescription}><span className={styles.eyebrow}>CHAPTER 0{page + 1} / YOUR PROGRESS</span>
        <h2><PixelText text={topicNames[topics[page]]} /></h2><p>{moduleNotes[topics[page]].description}</p>
        <strong>{moduleLearned} of {currentSkills.length} lessons learned</strong>
        <progress aria-label={`${topicNames[topics[page]]} lesson completion`} value={moduleLearned} max={currentSkills.length || 1} />
        <div className={styles.difficultyProgress}>{(["easy", "medium", "hard"] as const).map(difficulty => {
          const entries = currentSkills.filter(skill => skill.difficulty === difficulty);
          return <div key={difficulty}><span>{difficulty}</span><strong>{entries.filter(skill => skill.unlocked).length}/{entries.length}</strong></div>;
        })}</div>
      </div>
      <div className={styles.nextStep}><span className={styles.eyebrow}>{nextSkill ? "NEXT LESSON TO UNLOCK" : "ALL LESSONS LEARNED"}</span>
        <h3><PixelText text={nextSkill ? nextSkill.title : "Put these skills into practice."} /></h3>
        <p>{nextSkill ? `${nextSkill.body} Complete this ${nextSkill.difficulty} lesson on either map to unlock its entry in your book.` : "You have completed every lesson in this module. Revisit an unlocked skill to refresh your memory, then use an adventure challenge to check your understanding."}</p>
        {nextSkill ? <Link href={destination(nextSkill.track)}>Continue {nextSkill.difficulty} adventure →</Link> : <>
          <Link href={currentSkills[0] ? destination(currentSkills[0].track) : "/learn"}>Practice this module →</Link>
          {nextTopic >= 0 && <button disabled={busy} onClick={() => motion === "closed" ? animate("opening", nextTopic) : turn(nextTopic)}>View {topicNames[topics[nextTopic]]} →</button>}
        </>}
      </div>
    </section>}
    <div className={styles.legend}><p>✦ Select a bright skill to review its explanation and example. Locked skills unlock by completing that exact lesson and difficulty on either map. Replaying a lesson does not increase the count.</p>
      {motion === "open" && <button onClick={() => animate("closing")}>Close book</button>}
      <Link href="/learn">Learn a new skill →</Link>
    </div>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="skill-description-title" onCancel={dismiss} onClose={dismiss}
      onClick={event => { if (event.target === event.currentTarget) dismiss(); }}>
      {selected && <article>
        <button className={styles.dismiss} aria-label="Close skill description" onClick={dismiss} autoFocus>×</button>
        <header><Image src={icons[selected.icon]} alt="" width={72} height={72} unoptimized />
          <div><span>{selected.difficulty} · LEARNED</span><h2 id="skill-description-title"><PixelText text={selected.title} /></h2></div></header>
        <h3>What this skill means</h3><p>{selected.body}</p>
        <h3>Where you will use it</h3><p>{moduleNotes[selected.topic].application}</p>
        {selected.code && <><h3>Trace this Python example</h3><pre><code>{selected.code}</code></pre></>}
        <p className={styles.takeaway}><strong>What to notice</strong><br />{selected.takeaway}</p>
        <h3>Check your understanding</h3><p>Without running the example, explain what each line does. Change one value or input, predict what will happen, and then check your prediction in the adventure.</p>
        <footer>✓ Lesson completed · {completedTracks.has(selected.track) ? "Adventure track completed on at least one map." : "Adventure track not yet completed."} Lesson completion is not a mastery score.</footer>
        <Link className={styles.practiceLink} href={destination(selected.track)}>Practice this {selected.difficulty} track →</Link>
      </article>}
    </dialog>
  </section>;
}

