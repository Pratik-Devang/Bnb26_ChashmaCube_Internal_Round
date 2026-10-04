"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "@/components/auth/AccountProvider";
import { getLearnerProgress, getLearningPlan } from "@/lib/api";
import { adventureHref, loadAdventureJournal, topicNames, type AdventureJournal } from "@/lib/game/curriculum";
import elderTalk from "@/2d_assets/Dialogue_person/NPC_1/Talk.png";
import elderCalm from "@/2d_assets/Dialogue_person/NPC_1/Calm.png";
import keeperTalk from "@/2d_assets/Dialogue_person/NPC_2/Talk.png";
import keeperCalm from "@/2d_assets/Dialogue_person/NPC_2/Calm.png";
import rangerTalk from "@/2d_assets/Dialogue_person/NPC_3/Talk.png";
import rangerCalm from "@/2d_assets/Dialogue_person/NPC_3/Calm.png";
import scoutTalk from "@/2d_assets/Dialogue_person/NPC_4/Talk.png";
import scoutCalm from "@/2d_assets/Dialogue_person/NPC_4/Calm.png";
import type { LearnerConceptState, LearningModule } from "@/types/learning";
import styles from "./GuideView.module.css";

type Portrait = "elder" | "keeper" | "ranger" | "scout";
type GuideQuestion = {
  id: string;
  category: "Your journey" | "Quick recaps" | "Using Re:Learn";
  label: string;
  portrait: Portrait;
};
type Reply = { speaker: string; portrait: Portrait; lines: string[]; href?: string; action?: string };
type LiveState = {
  modules: LearningModule[];
  concepts: LearnerConceptState[];
  journal: AdventureJournal | null;
  loading: boolean;
  error: boolean;
};

const portraits: Record<Portrait, { calm: StaticImageData; talk: StaticImageData; speaker: string }> = {
  elder: { calm: elderCalm, talk: elderTalk, speaker: "Archive Sage" },
  keeper: { calm: keeperCalm, talk: keeperTalk, speaker: "Chapel Keeper" },
  ranger: { calm: rangerCalm, talk: rangerTalk, speaker: "Trail Guide" },
  scout: { calm: scoutCalm, talk: scoutTalk, speaker: "Island Scout" },
};

const portraitKeys = Object.keys(portraits) as Portrait[];

function shuffledPortraits(previous?: Portrait) {
  const deck = [...portraitKeys];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  if (previous && deck[0] === previous) {
    const swapIndex = deck.findIndex(portrait => portrait !== previous);
    [deck[0], deck[swapIndex]] = [deck[swapIndex], deck[0]];
  }
  return deck;
}

const questions: GuideQuestion[] = [
  { id: "progress", category: "Your journey", label: "How am I doing right now?", portrait: "ranger" },
  { id: "next", category: "Your journey", label: "What should I learn next?", portrait: "scout" },
  { id: "practice", category: "Your journey", label: "What should I practise again?", portrait: "keeper" },
  { id: "completed", category: "Your journey", label: "Which adventures have I completed?", portrait: "ranger" },
  { id: "variables", category: "Quick recaps", label: "Give me a variables recap", portrait: "elder" },
  { id: "conditions", category: "Quick recaps", label: "Give me a conditions recap", portrait: "elder" },
  { id: "loops", category: "Quick recaps", label: "Give me a loops recap", portrait: "elder" },
  { id: "lists", category: "Quick recaps", label: "Give me a lists recap", portrait: "elder" },
  { id: "functions", category: "Quick recaps", label: "Give me a functions recap", portrait: "elder" },
  { id: "mastery", category: "Using Re:Learn", label: "What does mastery mean here?", portrait: "keeper" },
  { id: "review", category: "Using Re:Learn", label: "How does code review work?", portrait: "scout" },
  { id: "unlock", category: "Using Re:Learn", label: "How do I unlock skills?", portrait: "ranger" },
];

const recap: Record<string, string[]> = {
  variables: [
    "A variable gives a value a reusable name. Python evaluates the right side of an assignment first, then stores that result under the name on the left.",
    "Remember that values have types. 3 + 2 performs arithmetic, while \"3\" + \"2\" joins text. Reassignment replaces the value a name currently remembers.",
  ],
  conditions: [
    "A condition asks a yes-or-no question. Python runs the first if or elif branch whose expression is true; else catches everything that did not match.",
    "Check boundaries carefully. Decide what should happen below, at, and above the boundary, then test all three cases.",
  ],
  loops: [
    "A loop repeats a block of work. A for loop walks through a sequence; a while loop continues while its condition remains true.",
    "Trace the first and last iteration. range(start, stop) includes start but stops before stop, and a while loop must update something that can eventually make its condition false.",
  ],
  lists: [
    "A list stores several values in order. Python indexes from zero, so the first item is list[0], and the final valid index is one less than the list length.",
    "Methods such as append change the existing list. Slices create a selected range and, like range, exclude their upper boundary.",
  ],
  functions: [
    "A function packages a reusable task. Parameters receive inputs, the body performs the work, and return sends a result back to the caller.",
    "print only displays something. If another part of the program needs the computed value, the function must return it.",
  ],
};

export function GuideView() {
  const { learner } = useAccount();
  const selectedForLearner = useRef<string | null>(null);
  const [host, setHost] = useState<Portrait>("scout");
  const [live, setLive] = useState<LiveState>({ modules: [], concepts: [], journal: null, loading: true, error: false });
  const [reply, setReply] = useState<Reply>({
    speaker: "Island Scout", portrait: "scout",
    lines: [
      `Welcome, ${learner.name}. This is your field guide. Choose a question and one of us will help you inspect your journey or refresh a Python idea.`,
      "Progress answers come from your saved account. Concept recaps are curated notes, so you can return to them whenever you need a quick reminder.",
    ],
  });
  const [line, setLine] = useState(0);
  const [letters, setLetters] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const text = reply.lines[line] ?? "";
  const revealed = reduceMotion || letters >= text.length;

  useEffect(() => {
    const learnerKey = String(learner.id);
    if (selectedForLearner.current === learnerKey) return;
    selectedForLearner.current = learnerKey;

    const storageKey = `relearn:guide-portrait-deck:${learnerKey}`;
    let remaining: Portrait[] = [];
    let previous: Portrait | undefined;

    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null") as {
        remaining?: unknown;
        previous?: unknown;
      } | null;
      if (saved && portraitKeys.includes(saved.previous as Portrait)) previous = saved.previous as Portrait;
      if (saved && Array.isArray(saved.remaining)) {
        remaining = saved.remaining.filter((value, index, values): value is Portrait =>
          portraitKeys.includes(value as Portrait) && value !== previous && values.indexOf(value) === index
        );
      }
    } catch {
      // A damaged rotation record should never prevent the guide from opening.
    }

    const deck = remaining.length ? [...remaining] : shuffledPortraits(previous);
    const nextHost = deck.shift() ?? "scout";
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ remaining: deck, previous: nextHost }));
    } catch {
      // The random guide still works when browser storage is unavailable.
    }

    const guide = portraits[nextHost];
    setHost(nextHost);
    setReply({
      speaker: guide.speaker,
      portrait: nextHost,
      lines: [
        `Welcome, ${learner.name}. I’m ${guide.speaker}, your guide for this visit. Choose a question and I’ll help you inspect your journey or refresh a Python idea.`,
        "Progress answers come from your saved account. Concept recaps are curated notes, so you can return to them whenever you need a quick reminder.",
      ],
    });
    setLine(0);
    setLetters(0);
  }, [learner.id, learner.name]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([getLearningPlan(), getLearnerProgress(), loadAdventureJournal()]).then(([plan, concepts, journal]) => {
      if (!active) return;
      setLive({
        modules: plan.status === "fulfilled" ? plan.value.modules : [],
        concepts: concepts.status === "fulfilled" ? concepts.value : [],
        journal: journal.status === "fulfilled" ? journal.value : null,
        loading: false,
        error: [plan, concepts, journal].some(result => result.status === "rejected"),
      });
    });
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => { active = false; media.removeEventListener("change", update); };
  }, []);

  useEffect(() => {
    setLetters(0);
    if (reduceMotion) return;
    const timer = window.setInterval(() => setLetters(count => Math.min(count + 2, text.length)), 22);
    return () => window.clearInterval(timer);
  }, [text, reduceMotion]);

  const categories = useMemo(() => Array.from(new Set(questions.map(question => question.category))), []);

  function liveUnavailable(portrait: Portrait): Reply {
    return {
      speaker: portraits[portrait].speaker, portrait,
      lines: ["I could not open every page of your live journal just now. Your saved work is unchanged. Restart the full app or refresh, then ask me again."],
    };
  }

  function answer(question: GuideQuestion): Reply {
    if (question.id in recap) return {
      speaker: portraits[question.portrait].speaker, portrait: question.portrait,
      lines: recap[question.id], href: `/topics/${question.id}`, action: `Open the ${question.id} lesson`,
    };
    if (question.id === "mastery") return {
      speaker: "Chapel Keeper", portrait: "keeper",
      lines: [
        "Completing a lesson means you encountered and practised an idea. It is useful progress, but it is not the same as mastery.",
        "Re:Learn treats mastery as repeated evidence: solving a challenge, applying the idea to a different problem, and no longer repeating the same misconception.",
      ], href: "/progress", action: "Open my progress book",
    };
    if (question.id === "review") return {
      speaker: "Island Scout", portrait: "scout",
      lines: [
        "In a coding trial, your program first runs against predefined tests. Those results and supported rules provide the trusted diagnosis.",
        "The detailed review explains what worked, what to inspect, and one useful next step. Gemini may improve the wording when configured, but it cannot change your test result, diagnosis, or progress.",
      ], href: "/game", action: "Visit a coding trial",
    };
    if (question.id === "unlock") return {
      speaker: "Trail Guide", portrait: "ranger",
      lines: [
        "Each bright icon in the progress book represents a lesson you completed at a specific difficulty. Locked icons become available after you finish that exact lesson on either world.",
        "Opening an icon lets you revisit the explanation and example. Replaying it can strengthen your understanding, but it does not create a duplicate completion.",
      ], href: "/progress", action: "Open the skill book",
    };

    if (live.loading) return {
      speaker: portraits[question.portrait].speaker, portrait: question.portrait,
      lines: ["Your journal is still opening. Give the pages a moment, then choose this question again."],
    };
    if (!live.journal && !live.modules.length && !live.concepts.length) return liveUnavailable(question.portrait);

    const saves = live.journal?.saves ?? [];
    const completed = saves.filter(save => save.completed);
    const lessonCount = saves.reduce((sum, save) => sum + save.completedLessonIds.length, 0);
    const checkCount = saves.reduce((sum, save) => sum + save.passedQuestionIds.length, 0);

    if (question.id === "progress") {
      const activeModules = live.modules.filter(module => module.status === "active").length;
      return {
        speaker: "Trail Guide", portrait: "ranger",
        lines: [
          `You are a level ${learner.level} explorer with ${learner.xp.toLocaleString()} XP and a ${learner.streak}-day streak. Across your topic adventures, you have completed ${lessonCount} lesson checkpoints and passed ${checkCount} challenge checks.`,
          `${completed.length} adventure track${completed.length === 1 ? " is" : "s are"} complete, and ${activeModules} concept module${activeModules === 1 ? " is" : "s are"} currently developing. These are activity signals; mastery still requires successful transfer evidence.`,
          ...(live.error ? ["Some journal sources were unavailable, so these totals may be incomplete."] : []),
        ], href: "/progress", action: "See the full progress book",
      };
    }

    if (question.id === "completed") {
      if (!completed.length) return {
        speaker: "Trail Guide", portrait: "ranger",
        lines: ["You have started writing your journey, but no complete topic-and-difficulty adventure is recorded yet.", "Finish its three guide lessons and both checks to complete an adventure track."],
        href: "/learn", action: "Choose an adventure",
      };
      return {
        speaker: "Trail Guide", portrait: "ranger",
        lines: [
          `You have completed ${completed.length} adventure track${completed.length === 1 ? "" : "s"}: ${completed.slice(0, 5).map(save => {
            const [topic, difficulty] = save.track.split("-");
            return `${topicNames[topic] ?? topic} (${difficulty}, ${save.world === "first-island" ? "First Island" : "Chapel"})`;
          }).join("; ")}${completed.length > 5 ? "; and more" : ""}.`,
          "A completed adventure shows that you finished its guided practice and checks. Revisit it whenever you want another run.",
        ], href: "/progress", action: "Review completed tracks",
      };
    }

    if (question.id === "practice") {
      const practice = [...live.concepts]
        .filter(concept => concept.state === "needs-practice" || concept.state === "improving")
        .sort((a, b) => a.mastery - b.mastery)[0];
      if (practice) return {
        speaker: "Chapel Keeper", portrait: "keeper",
        lines: [
          `Your journal suggests revisiting ${practice.concept}. It is marked ${practice.state.replace("-", " ")} at ${practice.mastery}% evidence strength.`,
          `${practice.friendlyDescription} Review the smallest relevant idea, then attempt a new problem instead of memorising the previous answer.`,
        ], href: "/insights", action: "Open learning insights",
      };
      return {
        speaker: "Chapel Keeper", portrait: "keeper",
        lines: ["Your journal does not show a confirmed recurring misconception yet.", "Choose a fresh coding challenge. New test evidence will give us something meaningful to compare rather than guessing what you need."],
        href: "/learn", action: "Choose fresh practice",
      };
    }

    const recent = live.journal?.recent;
    const recentSave = recent ? saves.find(save => save.world === recent.world && save.track === recent.track) : undefined;
    const nextSave = recentSave && !recentSave.completed ? recentSave : saves.find(save => !save.completed);
    if (nextSave) {
      const [topic, difficulty] = nextSave.track.split("-");
      const nextStage = nextSave.completedLessonIds.length < 3
        ? `guide lesson ${nextSave.completedLessonIds.length + 1} of 3`
        : `challenge check ${nextSave.passedQuestionIds.length + 1} of 2`;
      return {
        speaker: "Island Scout", portrait: "scout",
        lines: [
          `Continue ${topicNames[topic] ?? topic} at ${difficulty} difficulty. You are ready for ${nextStage} in ${nextSave.world === "first-island" ? "The First Island" : "The Chapel of Choices"}.`,
          "Finishing an adventure already in progress is the clearest next step because it preserves the context from your previous lessons.",
        ], href: adventureHref(nextSave), action: "Continue this adventure",
      };
    }
    const upcoming = live.modules.find(module => module.status !== "completed");
    return {
      speaker: "Island Scout", portrait: "scout",
      lines: upcoming
        ? [`Your next available concept is ${upcoming.title}. ${upcoming.description}`, "Choose the topic and a comfortable difficulty. Easy builds the model; medium makes you trace it; hard asks you to transfer it."]
        : ["You have completed the currently planned modules. Revisit the lowest-confidence insight or choose a hard transfer challenge to test whether the understanding holds."],
      href: upcoming ? "/learn" : "/insights",
      action: upcoming ? "Choose topic and difficulty" : "Review my insights",
    };
  }

  function choose(question: GuideQuestion) {
    const response = answer(question);
    setReply({ ...response, speaker: portraits[host].speaker, portrait: host });
    setLine(0);
    setLetters(0);
  }

  function advance() {
    if (!revealed) setLetters(text.length);
    else if (line < reply.lines.length - 1) setLine(value => value + 1);
  }

  const portrait = portraits[reply.portrait];
  return <main className={`route-page ${styles.page}`}>
    <header className={styles.heading}>
      <span>THE EXPLORER&apos;S FIELD GUIDE</span>
      <h1>Ask the guides.</h1>
      <p>Choose a question for a quick Python refresher or an answer grounded in your current learning journal.</p>
    </header>

    <section className={styles.conversation} aria-labelledby="guide-speaker">
      <div className={styles.portrait} aria-hidden="true">
        <div className={styles.halo} />
        <Image src={portrait.calm} alt="" unoptimized priority />
        <Image src={portrait.talk} alt="" unoptimized priority className={styles.talking} style={{ opacity: revealed ? 0 : 1 }} />
      </div>
      <div className={styles.dialogue}>
        <div className={styles.nameplate} id="guide-speaker">{reply.speaker}</div>
        <span className={styles.answerLabel}>GUIDE RESPONSE · {line + 1}/{reply.lines.length}</span>
        <p className={styles.srOnly} aria-live="polite">{text}</p>
        <p aria-hidden="true">{revealed ? text : text.slice(0, letters)}<i>{revealed ? "" : "▌"}</i></p>
        <footer>
          <div className={styles.pages}>{reply.lines.map((_, index) => <b key={index} className={index === line ? styles.current : ""} />)}</div>
          <div>
            {reply.href && revealed && line === reply.lines.length - 1 ? <Link href={reply.href}>{reply.action ?? "Open"} ↗</Link> : null}
            {line < reply.lines.length - 1 || !revealed ? <button onClick={advance}>{revealed ? "Continue" : "Show answer"} ▾</button> : null}
          </div>
        </footer>
      </div>
    </section>

    <section className={styles.questionBoard} aria-labelledby="guide-questions">
      <div className={styles.boardHeading}><span>CHOOSE A QUESTION</span><h2 id="guide-questions">What can we help with?</h2>
        <p>{live.loading ? "Opening your live journal…" : live.error ? "Live answers may be incomplete; recap questions are ready." : "Live journal connected."}</p></div>
      <div className={styles.categories}>{categories.map(category => <section key={category}>
        <h3>{category}</h3>
        <div>{questions.filter(question => question.category === category).map(question =>
          <button key={question.id} onClick={() => choose(question)}>
            <span>{question.label}</span><b aria-hidden="true">→</b>
          </button>)}</div>
      </section>)}</div>
    </section>
  </main>;
}

