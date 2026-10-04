"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import playerIdle from "@/2d_characters/Wizard/Idle.png";
import playerWalk from "@/2d_characters/Wizard/Walk.png";
import guideIdle from "@/2d_characters/Archer/Idle.png";
import { ChurchMapCanvas } from "./ChurchMapCanvas";
import { ChurchExteriorCanvas } from "./ChurchExteriorCanvas";
import { IslandOracleDialog } from "./dialogs/IslandOracleDialog";
import styles from "./ChurchWorld.module.css";

type Position = { x: number; y: number };
type ObjectiveTarget = "lever" | "treasure" | "keeper";
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const exteriorEntrance: Position = { x: 50, y: 54 };
const interiorExit: Position = { x: 50, y: 68 };
const exteriorGuide: Position = { x: 34, y: 70 };
const objectiveTargets: Record<ObjectiveTarget, Position> = {
  lever: { x: 69, y: 42 },
  treasure: { x: 34, y: 42 },
  keeper: { x: 52, y: 42 },
};
const objectiveGuidePositions: Record<ObjectiveTarget, Position> = {
  lever: { x: 72, y: 60 },
  treasure: { x: 35, y: 60 },
  keeper: { x: 47, y: 65 },
};

type GuidePage = { heading: string; explanation: string; code?: string; output?: string };
type GuideLesson = { title: string; pages: GuidePage[] };

const guideLessons: Record<"intro" | ObjectiveTarget, GuideLesson> = {
  intro: {
    title: "A first look at Python conditions",
    pages: [
      { heading: "Programs can make choices", explanation: "A condition is a question a program can answer with True or False. Python checks the condition, then chooses which indented block to run. This lets one program respond differently to different values, like opening a gate only when a player has a key." },
      { heading: "The if and else paths", explanation: "Use if for the path that should run when a condition is True. Use else for the alternative path when it is False. The colon begins each block, and indentation shows which instructions belong to it.", code: `has_key = True\n\nif has_key:\n    print("The temple opens")\nelse:\n    print("Find a key first")`, output: "The temple opens" },
      { heading: "Compare values", explanation: "Conditions can compare numbers or text. Common comparison operators are == (equal), != (not equal), <, <=, >, and >=. Remember: == asks whether two values are equal; a single = assigns a value to a variable.", code: `age = 16\n\nif age >= 18:\n    print("adult")\nelse:\n    print("under 18")`, output: "under 18" },
      { heading: "More than two choices with elif", explanation: "When there are several outcomes, add elif between if and else. Python checks the conditions from top to bottom and runs only the first matching block. Put higher thresholds first so a value does not match a broad condition too early.", code: `score = 82\n\nif score >= 90:\n    grade = "A"\nelif score >= 70:\n    grade = "B"\nelse:\n    grade = "keep practicing"\n\nprint(grade)`, output: "B" },
      { heading: "A few habits to remember", explanation: "Every if or elif needs a condition and a colon. The statements inside a branch must be indented consistently. An else branch has no condition because it catches anything that did not match above it. Try changing the values in the examples and predict the output before running them." },
    ],
  },
  lever: {
    title: "Key idea: if and else",
    pages: [
      { heading: "Two possible paths", explanation: "The lever uses an if/else decision. If the explorer has a key, the condition is True and the lever moves. If not, Python takes the else path. Only one of the two blocks runs." },
      { heading: "Example 1: check a Boolean", explanation: "Here has_key is True, so the first branch assigns the value pulled. The final print displays the value stored in lever.", code: `has_key = True\n\nif has_key:\n    lever = "pulled"\nelse:\n    lever = "still"\n\nprint(lever)`, output: "pulled" },
      { heading: "Example 2: compare a number", explanation: "The condition asks whether coins is at least 5. Since 2 is not at least 5, the condition is False and the else block assigns keep exploring.", code: `coins = 2\n\nif coins >= 5:\n    reward = "treasure"\nelse:\n    reward = "keep exploring"\n\nprint(reward)`, output: "keep exploring" },
    ],
  },
  treasure: {
    title: "Key idea: if, elif, and else",
    pages: [
      { heading: "A ladder of choices", explanation: "An if/elif/else ladder handles three or more possibilities. Python tests each condition in order, stops at the first True condition, and runs that branch. The else block is the fallback when every earlier condition is False." },
      { heading: "Example 1: choose a chest", explanation: "With 7 coins, the first test (at least 10) is False. The next test (at least 5) is True, so the chest is open. Python skips the final else branch.", code: `coins = 7\n\nif coins >= 10:\n    chest = "royal"\nelif coins >= 5:\n    chest = "open"\nelse:\n    chest = "locked"\n\nprint(chest)`, output: "open" },
      { heading: "Example 2: assign a grade", explanation: "A score of 82 is below 90, so the first branch is skipped. It is at least 70, so the elif branch assigns B and the last branch is skipped.", code: `score = 82\n\nif score >= 90:\n    grade = "A"\nelif score >= 70:\n    grade = "B"\nelse:\n    grade = "keep practicing"\n\nprint(grade)`, output: "B" },
    ],
  },
  keeper: {
    title: "Key idea: match and case",
    pages: [
      { heading: "Match a value to a case", explanation: "Python 3.10 and later supports match/case for choosing between distinct values. match names the value to inspect. Each case gives one possible value; Python runs the matching case block. Use case _ as the fallback for anything not listed." },
      { heading: "Example 1: follow the route", explanation: "The route value is keeper, so the third case matches and stores speak in message. The underscore case is not reached.", code: `route = "keeper"\n\nmatch route:\n    case "lever":\n        message = "pull"\n    case "treasure":\n        message = "unlock"\n    case "keeper":\n        message = "speak"\n    case _:\n        message = "wait"\n\nprint(message)`, output: "speak" },
      { heading: "Example 2: use the fallback", explanation: "The command value is not one of the listed cases, so case _ handles it and assigns the fallback action.", code: `command = "look"\n\nmatch command:\n    case "open":\n        action = "open the door"\n    case "leave":\n        action = "leave the room"\n    case _:\n        action = "inspect the room"\n\nprint(action)`, output: "inspect the room" },
    ],
  },
};

export function ChurchWorld() {
  const [insideTemple, setInsideTemple] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 50, y: 78 });
  const [moving, setMoving] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [message, setMessage] = useState("Find the guide outside and press E to learn about Python conditions.");
  const [introComplete, setIntroComplete] = useState(false);
  const [guideTalkedStep, setGuideTalkedStep] = useState(-1);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideTopic, setGuideTopic] = useState<keyof typeof guideLessons | null>(null);
  const [guidePage, setGuidePage] = useState(0);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [objectiveStep, setObjectiveStep] = useState(0);
  const [activeProblem, setActiveProblem] = useState<ObjectiveTarget | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [oracleOpen, setOracleOpen] = useState(false);
  const movementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const directions: Record<string, Position> = {
        w: { x: 0, y: -1.8 }, arrowup: { x: 0, y: -1.8 },
        s: { x: 0, y: 1.8 }, arrowdown: { x: 0, y: 1.8 },
        a: { x: -1.8, y: 0 }, arrowleft: { x: -1.8, y: 0 },
        d: { x: 1.8, y: 0 }, arrowright: { x: 1.8, y: 0 },
      };
      const direction = directions[event.key.toLowerCase()];
      if (event.key.toLowerCase() === "escape") {
        setLessonOpen(false);
        setGuideOpen(false);
        setCompletionOpen(false);
        return;
      }
      if (event.key.toLowerCase() === "e") {
        if (lessonOpen || guideOpen || completionOpen) return;
        if (!insideTemple) {
          if (Math.hypot(position.x - exteriorGuide.x, position.y - exteriorGuide.y) < 12 && !introComplete) {
            setGuideTopic("intro");
            setGuidePage(0);
            setGuideOpen(true);
            return;
          }
          if (Math.hypot(position.x - exteriorEntrance.x, position.y - exteriorEntrance.y) < 12) {
            if (!introComplete) {
              setMessage("Talk with the guide first to learn how Python conditions work.");
            } else {
              setInsideTemple(true);
              setPosition(interiorExit);
              setMessage("You entered the temple. Find the guide near the lever and press E to learn about if/else.");
            }
          } else {
            setMessage(introComplete ? "Walk to the temple entrance and press E to go inside." : "Find the guide outside the temple and press E to learn about Python conditions.");
          }
          return;
        }
        const currentTarget: ObjectiveTarget | null = objectiveStep === 0 ? "lever" : objectiveStep === 1 ? "treasure" : objectiveStep === 2 ? "keeper" : null;
        const currentGuidePosition = currentTarget ? objectiveGuidePositions[currentTarget] : null;
        if (currentGuidePosition && guideTalkedStep !== objectiveStep && Math.hypot(position.x - currentGuidePosition.x, position.y - currentGuidePosition.y) < 12) {
          setGuideTopic(currentTarget);
          setGuidePage(0);
          setGuideOpen(true);
          return;
        }
        if (Math.hypot(position.x - interiorExit.x, position.y - interiorExit.y) < 10) {
          setInsideTemple(false);
          setPosition({ x: 50, y: 68 });
          setMessage("You are outside the temple. Walk to the entrance and press E to return inside.");
          return;
        }
        if (objectiveStep === 0 && Math.hypot(position.x - objectiveTargets.treasure.x, position.y - objectiveTargets.treasure.y) < 11) {
          setMessage("The lever is the first objective. Go to it on the right, then return to the treasure chest.");
          return;
        }
        const target: ObjectiveTarget | null = objectiveStep === 0 ? "lever" : objectiveStep === 1 ? "treasure" : objectiveStep === 2 ? "keeper" : null;
        if (!target) {
          setMessage("The chapel quest is complete. You can explore the room or return to the learning path.");
          return;
        }
        const targetPosition = objectiveTargets[target];
        if (Math.hypot(position.x - targetPosition.x, position.y - targetPosition.y) < 11) {
          if (guideTalkedStep !== objectiveStep) {
            setMessage("Find the guide nearby and press E to learn this idea before trying the objective.");
            return;
          }
          setActiveProblem(target);
          setChoice(null);
          setLessonOpen(true);
          if (target === "keeper") setMessage("You found the Chapel Keeper. Press on to finish the quest.");
          else setMessage(`You reached the ${target}. Solve its conditions problem to continue.`);
        } else {
          const labels: Record<ObjectiveTarget, string> = { lever: "lever on the right", treasure: "treasure chest on the left", keeper: "Chapel Keeper near the altar" };
          setMessage(`Walk closer to the ${labels[target]}, then press E.`);
        }
        return;
      }
      if (lessonOpen || guideOpen || completionOpen) return;
      if (!direction) return;
      event.preventDefault();
      const next = {
        x: clamp(position.x + direction.x, insideTemple ? 19 : 9, insideTemple ? 84 : 91),
        y: clamp(position.y + direction.y, insideTemple ? 29 : 18, insideTemple ? 72 : 86),
      };
      if (direction.x !== 0) setFacingLeft(direction.x < 0);
      setPosition(next);
      setMoving(true);
      if (movementTimer.current) clearTimeout(movementTimer.current);
      movementTimer.current = setTimeout(() => setMoving(false), 150);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [completionOpen, guideOpen, guideTalkedStep, insideTemple, introComplete, lessonOpen, objectiveStep, position]);

  useEffect(() => () => {
    if (movementTimer.current) clearTimeout(movementTimer.current);
  }, []);

  const targetForStep: ObjectiveTarget | null = objectiveStep === 0 ? "lever" : objectiveStep === 1 ? "treasure" : objectiveStep === 2 ? "keeper" : null;
  const targetPosition = targetForStep ? objectiveTargets[targetForStep] : null;
  const problem = activeProblem ?? "lever";
  const correctChoice = problem === "lever" ? "pulled" : problem === "treasure" ? "open" : "speak";
  const problemTitle = problem === "lever" ? "The lever's condition" : problem === "treasure" ? "The treasure's conditions" : "The Keeper's signal code";
  const problemIntro = problem === "lever"
    ? "The lever only responds when the explorer has a key. This if/else statement chooses whether the lever moves."
    : problem === "treasure"
      ? "The treasure has three states. Follow the if/elif/else ladder from the top: the first true condition determines what happens."
      : "The Chapel Keeper uses Python 3.10+'s switch-like match/case statement to choose a response for each route. The underscore case is the fallback.";
  const problemCode = problem === "lever"
    ? `has_key = True\n\nif has_key:\n    lever = "pulled"\nelse:\n    lever = "still"`
    : problem === "treasure"
      ? `coins = 7\n\nif coins >= 10:\n    chest = "royal"\nelif coins >= 5:\n    chest = "open"\nelse:\n    chest = "locked"`
      : `route = "keeper"\n\nmatch route:\n    case "lever":\n        message = "pull"\n    case "treasure":\n        message = "unlock"\n    case "keeper":\n        message = "speak"\n    case _:\n        message = "wait"`;
  const problemQuestion = problem === "lever"
    ? "What is the value of lever?"
    : problem === "treasure"
      ? "What is the value of chest when coins is 7?"
      : "What is the value of message when route is keeper?";
  const answerOptions = problem === "lever"
    ? ["pulled", "still"]
    : problem === "treasure"
      ? ["royal", "open", "locked"]
      : ["pull", "unlock", "speak", "wait"];
  const targetForGuide: ObjectiveTarget | null = objectiveStep === 0 ? "lever" : objectiveStep === 1 ? "treasure" : objectiveStep === 2 ? "keeper" : null;
  const guidePosition = insideTemple && targetForGuide ? objectiveGuidePositions[targetForGuide] : exteriorGuide;
  const guideLesson = guideTopic ? guideLessons[guideTopic] : null;
  const currentGuidePage = guideLesson?.pages[guidePage];
  const guidePageCount = guideLesson?.pages.length ?? 0;
  const objectiveNeedsGuide = !insideTemple || (targetForGuide !== null && guideTalkedStep !== objectiveStep);
  const markerPosition = !insideTemple ? (introComplete ? exteriorEntrance : exteriorGuide) : objectiveNeedsGuide ? guidePosition : targetPosition;
  const finishGuideLesson = () => {
    if (guideTopic === "intro") {
      setIntroComplete(true);
      setMessage("Great! Now walk to the temple entrance and press E. Your guide will meet you inside.");
    } else {
      setGuideTalkedStep(objectiveStep);
      setMessage("The guide has explained the idea. Go to the highlighted objective and press E when you are ready.");
    }
    setGuideOpen(false);
  };

  return (
    <main className={styles.root}>
      <header className={styles.header}>
        <Link href="/learn" className={styles.brand}><span>R</span><strong>Re:Learn <small>· CONDITIONS QUEST</small></strong></Link>
        <div className={styles.location}><span>✦</span><div><small>LOCATION</small><strong>{insideTemple ? "Inside the Temple" : "Temple Grounds"}</strong></div></div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            type="button"
            className={styles.oracleButton}
            onClick={() => setOracleOpen(true)}
            title="Consult AI Oracle (Spell & Code Diagnoser)"
            aria-label="Consult AI Oracle"
          >
            ✨
          </button>
          <Link href="/game" className={styles.back}>← First Island</Link>
        </div>
      </header>

      <section className={styles.frame} aria-label={insideTemple ? "Explore inside the ruined temple" : "Explore the ruined temple grounds"}>
        <div className={styles.quest}><small>{insideTemple ? "CONDITIONS" : "TEMPLE GROUNDS"} · OBJECTIVE</small><strong>{!insideTemple ? introComplete ? "Enter the temple" : "Meet the guide" : objectiveStep === 0 ? "1 · Pull the lever" : objectiveStep === 1 ? "2 · Open the treasure" : objectiveStep === 2 ? "3 · Meet the Chapel Keeper" : "Quest complete"}</strong><p>{!insideTemple ? introComplete ? "Walk to the temple entrance and press E to enter." : "Talk with the guide to learn about Python conditions." : objectiveStep === 0 ? "Talk with the guide, then solve the lever problem on the right." : objectiveStep === 1 ? "Talk with the guide, then go to the treasure chest on the left." : objectiveStep === 2 ? "Talk with the guide, then meet the Chapel Keeper beside the altar." : "You completed all three Conditions objectives."}</p></div>
        <div className={styles.scene}>
          {insideTemple ? <ChurchMapCanvas className={styles.mapCanvas} /> : <ChurchExteriorCanvas className={styles.mapCanvas} />}
          {insideTemple && !objectiveNeedsGuide && targetPosition ? <span className={styles.objectiveMarker} style={{ left: `${targetPosition.x}%`, top: `${targetPosition.y}%` }} aria-hidden="true">!</span> : null}
          {((!insideTemple && !introComplete) || (insideTemple && targetForGuide !== null)) ? <div className={styles.guideCharacter} style={{ left: `${guidePosition.x}%`, top: `${guidePosition.y}%`, backgroundImage: `url(${guideIdle.src})` }} aria-label="Python guide" role="img"><span>GUIDE · E</span></div> : null}
          {markerPosition && objectiveNeedsGuide ? <span className={styles.objectiveMarker} style={{ left: `${markerPosition.x}%`, top: `${markerPosition.y}%` }} aria-hidden="true">E</span> : null}
          {insideTemple && objectiveStep >= 1 ? <span className={styles.treasureBadge} style={{ left: `${objectiveTargets.lever.x}%`, top: `${objectiveTargets.lever.y}%` }}>LEVER PULLED</span> : null}
          {insideTemple && objectiveStep >= 2 ? <span className={styles.treasureBadge} style={{ left: `${objectiveTargets.treasure.x}%`, top: `${objectiveTargets.treasure.y}%` }}>TREASURE FOUND</span> : null}
          <div className={`${styles.player}${moving ? ` ${styles.walking}` : ""}${facingLeft ? ` ${styles.facingLeft}` : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%`, backgroundImage: `url(${moving ? playerWalk.src : playerIdle.src})` }} aria-label="Your Wizard explorer" role="img"><span>YOU</span></div>
          <div className={styles.controls}><b>MOVE</b> WASD / ARROWS <i /> <b>INTERACT</b> E {insideTemple ? "with guide / objective / entrance" : introComplete ? "at temple entrance" : "with guide"}</div>
        </div>
        <aside className={styles.status}><span>{insideTemple ? `CONDITIONS · OBJECTIVE ${Math.min(objectiveStep + 1, 3)} OF 3` : "TEMPLE GROUNDS"}</span><strong>{!insideTemple ? introComplete ? "Enter the temple" : "Find the guide" : objectiveStep === 0 ? "Pull the lever" : objectiveStep === 1 ? "Open the treasure" : objectiveStep === 2 ? "Meet the Chapel Keeper" : "Quest complete"}</strong><p>{message}</p><button onClick={() => setMessage(!insideTemple ? introComplete ? "Walk to the temple entrance and press E." : "Find the guide outside and press E to start the lesson." : objectiveStep === 0 ? "The lever is on the right side of the room. Talk to the guide first." : objectiveStep === 1 ? "The treasure chest is on the left. Talk to the guide first." : objectiveStep === 2 ? "Talk to the guide, then meet the Chapel Keeper." : "You completed every Conditions objective.")}>{objectiveStep < 3 ? "Where to go" : "Well done"}</button></aside>
      </section>
      <footer className={styles.footer}><span>Use <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to move</span><span>Press <kbd>E</kbd> near the {insideTemple ? "guide, objective, or entrance" : introComplete ? "temple entrance" : "guide"}</span></footer>
      {guideOpen && guideLesson ? <div className={styles.scrim} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setGuideOpen(false); }}>
        <section className={styles.lesson} role="dialog" aria-modal="true" aria-labelledby="guide-title">
          <div className={styles.lessonHeading}><div><small>THE TEMPLE GUIDE · PYTHON CONDITIONS · PAGE {guidePage + 1} OF {guidePageCount}</small><h1 id="guide-title">{guideLesson.title}</h1></div><button type="button" aria-label="Close guide lesson" onClick={() => setGuideOpen(false)}>×</button></div>
          {currentGuidePage ? <><h2 className={styles.exampleHeading}>{currentGuidePage.heading}</h2><p>{currentGuidePage.explanation}</p>
            {currentGuidePage.code ? <pre><code>{currentGuidePage.code}</code></pre> : null}
            {currentGuidePage.output ? <div className={styles.expectedOutput}><strong>Expected output</strong><code>{currentGuidePage.output}</code></div> : null}</> : null}
          <div className={styles.guidePagination}>
            <button type="button" className={styles.closeLesson} disabled={guidePage === 0} onClick={() => setGuidePage((page) => Math.max(0, page - 1))}>Previous</button>
            <span aria-live="polite">Page {guidePage + 1} of {guidePageCount}</span>
            {guidePage < guidePageCount - 1
              ? <button type="button" className={styles.finishLesson} onClick={() => setGuidePage((page) => Math.min(guidePageCount - 1, page + 1))}>Next</button>
              : <button type="button" className={styles.finishLesson} onClick={finishGuideLesson}>{guideTopic === "intro" ? "I'm ready to enter" : "I'm ready to try"}</button>}
          </div>
        </section>
      </div> : null}
      {lessonOpen ? <div className={styles.scrim} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLessonOpen(false); }}>
        <section className={styles.lesson} role="dialog" aria-modal="true" aria-labelledby="conditions-title">
          <div className={styles.lessonHeading}><div><small>THE CHAPEL OF CHOICES · CONDITIONS</small><h1 id="conditions-title">{problemTitle}</h1></div><button type="button" aria-label="Close objective" onClick={() => setLessonOpen(false)}>×</button></div>
          <p>{problemIntro}</p>
          <pre><code>{problemCode}</code></pre>
          <div className={styles.challengePrompt}><strong>{problemQuestion}</strong>
            <div className={styles.answers}>
              {answerOptions.map((answer) => <button key={answer} type="button" className={choice === answer ? styles.answerSelected : ""} onClick={() => setChoice(answer)}>{answer}</button>)}
            </div>
          </div>
          {choice ? <div className={choice === correctChoice ? styles.correct : styles.tryAgain} role="status">{choice === correctChoice ? problem === "keeper" ? "Correct! The keeper route matches its case, so the response is speak." : "Correct! Python runs the matching branch and skips the remaining ones." : "Try again. Trace the condition or match each case against the given value."}</div> : null}
          <div className={styles.lessonActions}><button type="button" className={styles.closeLesson} onClick={() => setLessonOpen(false)}>Keep exploring</button>{choice === correctChoice ? <button type="button" className={styles.finishLesson} onClick={() => {
            setLessonOpen(false);
            setChoice(null);
            if (problem === "lever") { setObjectiveStep(1); setMessage("Lever pulled! Go to the treasure chest on the left and press E to solve its problem."); }
            else if (problem === "treasure") { setObjectiveStep(2); setMessage("Treasure unlocked! Go to the Chapel Keeper beside the altar and press E to finish."); }
            else { setObjectiveStep(3); setMessage("You completed all three Conditions objectives. The Chapel Keeper is proud of your reasoning."); setCompletionOpen(true); }
          }}>{problem === "keeper" ? "Finish quest" : problem === "lever" ? "Pull the lever" : "Unlock treasure"}</button> : null}</div>
        </section>
      </div> : null}
      {completionOpen ? <div className={styles.scrim} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCompletionOpen(false); }}>
        <section className={`${styles.lesson} ${styles.completionDialog}`} role="dialog" aria-modal="true" aria-labelledby="chapel-complete-title">
          <button className={styles.completionClose} type="button" onClick={() => setCompletionOpen(false)} aria-label="Close quest completion">×</button>
          <span className={styles.completionIcon} aria-hidden="true">✓</span>
          <small className={styles.completionEyebrow}>THE CHAPEL OF CHOICES · CONDITIONS</small>
          <h1 id="chapel-complete-title">Quest completed!</h1>
          <p>You solved every chapel objective and met the Keeper. Choose where you want to go next.</p>
          <div className={styles.completionActions}>
            <Link href="/topics/loop-boundaries?mode=lesson" className={styles.completionNext}>Next learning path: Loop Boundaries <span aria-hidden="true">→</span></Link>
            <Link href="/game" className={styles.completionSecondary}>Previous path: First Island</Link>
            <Link href="/learn" className={styles.completionSecondary}>View all learning paths</Link>
            <button type="button" className={styles.completionSecondary} onClick={() => setCompletionOpen(false)}>Keep exploring the chapel</button>
          </div>
        </section>
      </div> : null}
      {oracleOpen ? <IslandOracleDialog onClose={() => setOracleOpen(false)} /> : null}
    </main>
  );
}
