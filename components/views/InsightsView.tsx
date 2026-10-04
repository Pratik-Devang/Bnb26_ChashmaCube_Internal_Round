"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLearnerProgress } from "@/lib/api";
import { adventureHref, loadAdventureJournal, topicNames } from "@/lib/game/curriculum";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { PixelSprite } from "@/components/ui/PixelSprite";
import { AdventureJournal } from "@/components/dashboard/AdventureJournal";
import type { AdventureJournal as AdventureJournalData, AdventureProgress } from "@/lib/game/curriculum";
import type { LearnerConceptState, Misconception } from "@/types/learning";

const emptyJournal: AdventureJournalData = { recent: null, saves: [], incorrectReviews: [] };
const adventureSteps = ["Lesson 1", "Lesson 2", "Lesson 3", "Check 1", "Code check"];

const labels: Record<string, string> = {
  resolved: "Resolved",
  improving: "Improving",
  "needs-practice": "Needs practice",
  learned: "Learning",
  untested: "Not checked yet",
};

const misconceptionGuidance: Partial<Record<Misconception, { title: string; explanation: string; next: string }>> = {
  RANGE_ENDPOINT_EXCLUDED: {
    title: "Loop boundaries need another look",
    explanation: "Your latest attempt may stop one step before the value the problem needs.",
    next: "Trace the first and final values before running the loop again.",
  },
  WRONG_INITIALIZATION: {
    title: "The starting value matters",
    explanation: "Your latest attempt suggests the variable begins with a value that changes the final result.",
    next: "Ask what the total or counter should mean before the first update.",
  },
  ACCUMULATOR_OVERWRITTEN: {
    title: "Keep the running result",
    explanation: "A value that should grow across steps may be getting replaced instead.",
    next: "Update the existing value rather than starting it again.",
  },
  WRONG_OR_MISSING_UPDATE: {
    title: "Follow how the value changes",
    explanation: "The latest attempt may be missing an update or moving in the wrong direction.",
    next: "Trace the variable after each line and check that it moves toward the goal.",
  },
  VARIABLE_ROLE_CONFUSION: {
    title: "Give each variable one clear job",
    explanation: "The latest attempt may be mixing an input, a changing value, and the final answer.",
    next: "Name each variable for the single role it plays.",
  },
  UNCERTAIN: {
    title: "The Scout needs one more clue",
    explanation: "The attempt did not match a strong misconception pattern yet.",
    next: "Explain what each line should do, then submit another attempt.",
  },
};

export function InsightsView() {
  const [liveConcepts, setLiveConcepts] = useState<LearnerConceptState[]>([]);
  const [journal, setJournal] = useState<AdventureJournalData>(emptyJournal);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([getLearnerProgress(), loadAdventureJournal()])
      .then(([conceptResult, journalResult]) => {
        if (!isMounted) return;
        if (conceptResult.status === "fulfilled") setLiveConcepts(conceptResult.value);
        if (journalResult.status === "fulfilled") setJournal(journalResult.value);
        if (conceptResult.status === "rejected" || journalResult.status === "rejected") {
          setLoadError("Some progress could not be loaded. Refresh to retry.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const concepts = liveConcepts;
  const recentProgress = journal.recent
    ? journal.saves.find((save) => save.world === journal.recent?.world && save.track === journal.recent?.track)
    : undefined;
  const activeProgress: AdventureProgress | undefined = recentProgress
    ?? [...journal.saves].sort((left, right) => (right.updatedAt ?? "").localeCompare(left.updatedAt ?? ""))[0];
  const [activeTopic = "variables", activeDifficulty = "easy"] = activeProgress?.track.split("-") ?? [];
  const activeTopicName = topicNames[activeTopic] ?? activeTopic;
  const activeWorldName = activeProgress?.world === "chapel-of-choices" ? "Chapel of Choices" : "The First Island";
  const completedLessons = activeProgress?.completedLessonIds.length ?? 0;
  const completedChecks = activeProgress?.passedQuestionIds.length ?? 0;
  const completedStepCount = completedLessons + completedChecks;
  const adventureStarted = Boolean(activeProgress);

  const resolvedCount = concepts.filter((concept) => concept.state === "resolved").length;
  const improvingCount = concepts.filter((concept) => concept.state === "improving").length;
  const practiceCount = concepts.filter((concept) => concept.state === "needs-practice").length;
  const checkedCount = concepts.filter((concept) => concept.state !== "untested" && concept.state !== "learned").length;
  const practiceConcept = concepts.find((concept) => concept.state === "needs-practice");
  const guidance = practiceConcept ? misconceptionGuidance[practiceConcept.misconception] : undefined;
  const nextIncomplete = journal.saves.find((save) => !save.completed);
  const recommendation = activeProgress && !activeProgress.completed ? activeProgress : nextIncomplete;
  const recommendationHref = recommendation ? adventureHref(recommendation) : "/learn";

  return (
    <main className="route-page insights-page">
      {loadError && <p className="action-error-banner" role="alert">{loadError}</p>}
      <PageHeader
        eyebrow="LEARNING INSIGHTS"
        title="Mistakes with meaning"
        description="This journal uses your own island progress and code attempts—never another learner’s example results."
      />

      <AdventureJournal />
      <h2>Code-challenge evidence</h2>
      <p>These diagnosis counts come from submitted code challenges. Topic-adventure reading and question checks appear above.</p>
      <section className="insight-summary" aria-label="Learner evidence summary">
        <article className="summary-main">
          <span>CONCEPTS CHECKED</span>
          <strong>{checkedCount}</strong>
          <p>Concepts with evidence from your own completed challenges.</p>
        </article>
        <article><span className="metric-icon mint">✓</span><div><strong>{resolvedCount}</strong><p>Resolved</p></div></article>
        <article><span className="metric-icon cyan">↗</span><div><strong>{improvingCount}</strong><p>Improving</p></div></article>
        <article><span className="metric-icon yellow">◎</span><div><strong>{practiceCount}</strong><p>Practice next</p></div></article>
      </section>

      {concepts.length === 0 && !isLoading ? <p className="insights-empty-note">No code-challenge evidence yet. Topic-adventure progress is tracked separately above.</p> : null}

      <div className="insights-grid">
        <section className="surface-card concept-insights">
          <div className="section-heading">
            <div><span>CONCEPT MAP</span><h2>What your progress shows</h2></div>
            {isLoading ? <small style={{ color: "var(--muted)" }}>Refreshing...</small> : null}
          </div>
          <div className="insight-list">
            {concepts.map((concept) => (
              <article key={concept.id}>
                <div className={`state-symbol state-${concept.state}`}>{concept.state === "resolved" || concept.state === "learned" ? "✓" : concept.state === "improving" ? "↗" : concept.state === "needs-practice" ? "◎" : "·"}</div>
                <div><h3>{concept.concept}</h3><p>{concept.friendlyDescription}</p></div>
                <span className={`state-label state-${concept.state}`}>{labels[concept.state] ?? concept.state}</span>
              </article>
            ))}
          </div>
        </section>

        <section className={`diagnosis-spotlight${practiceConcept ? " needs-practice-spotlight" : ""}`} aria-label="Latest learning insight">
          <span className="page-eyebrow">{practiceConcept ? "YOUR LATEST CODE EVIDENCE" : activeProgress?.completed ? "YOUR LATEST ACHIEVEMENT" : "YOUR ADVENTURE JOURNAL"}</span>
          <div className="spotlight-title">
            <span><PixelSprite character="scout" /></span>
            <div>
              <h2>{practiceConcept ? guidance?.title ?? "One idea needs another look" : activeProgress?.completed ? `${activeTopicName} adventure complete` : adventureStarted ? `Continue ${activeTopicName}` : "Choose your first adventure"}</h2>
              <p>{practiceConcept ? practiceConcept.concept : adventureStarted ? `${activeWorldName} · ${activeDifficulty} · ${completedLessons}/3 lessons · ${completedChecks}/2 checks` : "Select a topic, difficulty, and world"}</p>
            </div>
          </div>

          <p>{practiceConcept
            ? guidance?.explanation ?? practiceConcept.friendlyDescription
            : activeProgress?.completed
              ? `You completed all lessons and both checks for ${activeTopicName} at ${activeDifficulty} difficulty in ${activeWorldName}. Choose another track or revisit this one to practise.`
              : adventureStarted
                ? `Your saved ${activeTopicName} journey is ${completedStepCount * 20}% complete. Resume it to continue from the next unfinished lesson or check.`
                : "Choose what you want to learn, select a difficulty, and begin on either available world. Your lessons and checks will appear here automatically."
          }</p>

          {adventureStarted ? <div className="evidence-path island-evidence-path">
            {adventureSteps.map((step, index) => {
              const complete = index < completedStepCount;
              return <span key={step} className={complete ? "included" : "excluded"}>{index + 1}<small>{complete ? "complete" : step}</small></span>;
            })}
          </div> : null}

          <div className="next-insight">
            <Icon name="target" />
            <div>
              <strong>Recommended next step</strong>
              <span>{practiceConcept ? guidance?.next ?? "Return to the challenge and try a revised solution." : recommendation ? `Resume ${topicNames[recommendation.track.split("-")[0]] ?? recommendation.track} where you left off.` : "Choose a new topic and difficulty to begin your next adventure."}</span>
            </div>
            <Link href={recommendationHref} className="solid-action" style={{ marginLeft: "auto" }}><Icon name="play" /> {recommendation ? "Resume" : adventureStarted ? "New adventure" : "Choose"}</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
