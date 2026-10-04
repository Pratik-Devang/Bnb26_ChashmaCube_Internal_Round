"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getLearnerProgress } from "@/lib/api";
import { orderedFirstIslandLessons } from "@/lib/game/first-island/content";
import { emptyFirstIslandProgress, loadFirstIslandProgress } from "@/lib/game/first-island/progress";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { PixelSprite } from "@/components/ui/PixelSprite";
import { AdventureJournal } from "@/components/dashboard/AdventureJournal";
import type { FirstIslandProgress } from "@/types/game";
import type { LearnerConceptState, Misconception } from "@/types/learning";

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
  const [islandProgress, setIslandProgress] = useState<FirstIslandProgress>(emptyFirstIslandProgress);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    Promise.all([getLearnerProgress(), loadFirstIslandProgress()])
      .then(([concepts, progress]) => {
        if (!isMounted) return;
        setLiveConcepts(concepts);
        setIslandProgress(progress);
      })
      .catch(() => {
        if (isMounted) setLoadError("Unable to load your insights. Refresh to retry.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const completedIslandLessons = islandProgress.completedLessonIds.length;
  const islandStarted = completedIslandLessons > 0 || islandProgress.challengeCompleted;
  const variablesEvidence = liveConcepts.find((concept) => concept.id === "concept-variables");

  const concepts = useMemo(() => {
    if (variablesEvidence || !islandStarted) return liveConcepts;

    const derivedVariables: LearnerConceptState = {
      id: "concept-variables",
      concept: "Variables & values",
      state: islandProgress.challengeCompleted ? "improving" : completedIslandLessons > 0 ? "learned" : "untested",
      mastery: islandProgress.challengeCompleted ? 55 : 0,
      friendlyDescription: islandProgress.challengeCompleted
        ? `Completed all ${orderedFirstIslandLessons.length} island lessons and passed the Scout’s trial. A new transfer challenge is needed to confirm mastery.`
        : `${completedIslandLessons}/${orderedFirstIslandLessons.length} First Island lessons completed. Complete the Scout’s trial to add code-challenge evidence.`,
      misconception: "CORRECT",
    };
    return [derivedVariables, ...liveConcepts];
  }, [completedIslandLessons, islandProgress.challengeCompleted, islandStarted, liveConcepts, variablesEvidence]);

  const resolvedCount = concepts.filter((concept) => concept.state === "resolved").length;
  const improvingCount = concepts.filter((concept) => concept.state === "improving").length;
  const practiceCount = concepts.filter((concept) => concept.state === "needs-practice").length;
  const checkedCount = concepts.filter((concept) => concept.state !== "untested" && concept.state !== "learned").length;
  const practiceConcept = concepts.find((concept) => concept.state === "needs-practice");
  const guidance = practiceConcept ? misconceptionGuidance[practiceConcept.misconception] : undefined;
  const nextTeacher = orderedFirstIslandLessons.find(
    (actor) => actor.lesson && !islandProgress.completedLessonIds.includes(actor.lesson.id),
  );

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

      {!islandStarted && concepts.length === 0 && !isLoading ? <p className="insights-empty-note">No code-challenge evidence yet. Topic-adventure progress is tracked separately above.</p> : null}

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
                <span className={`state-label state-${concept.state}`}>{concept.state === "learned" && completedIslandLessons === orderedFirstIslandLessons.length ? "Lessons complete" : labels[concept.state] ?? concept.state}</span>
              </article>
            ))}
          </div>
        </section>

        <section className={`diagnosis-spotlight${practiceConcept ? " needs-practice-spotlight" : ""}`} aria-label="Latest learning insight">
          <span className="page-eyebrow">{practiceConcept ? "YOUR LATEST CODE EVIDENCE" : islandProgress.challengeCompleted ? "YOUR LATEST ACHIEVEMENT" : "YOUR ISLAND JOURNAL"}</span>
          <div className="spotlight-title">
            <span><PixelSprite character="scout" /></span>
            <div>
              <h2>{practiceConcept ? guidance?.title ?? "One idea needs another look" : islandProgress.challengeCompleted ? "The Scout’s trial is complete" : islandStarted ? "Your trail is taking shape" : "Begin with The First Island"}</h2>
              <p>{practiceConcept ? practiceConcept.concept : islandProgress.challengeCompleted ? "Variables & values · challenge passed" : `${completedIslandLessons}/${orderedFirstIslandLessons.length} island lessons found`}</p>
            </div>
          </div>

          <p>{practiceConcept
            ? guidance?.explanation ?? practiceConcept.friendlyDescription
            : islandProgress.challengeCompleted
              ? "You completed every island lesson and passed a working-code challenge. Re:Learn marks the concept as improving until you apply it successfully in a different problem."
              : islandStarted
                ? `${nextTeacher?.name ?? "The Island Scout"} is your next stop. Complete the trail to unlock the final code challenge.`
                : "Meet the island teachers, learn how variables hold values, and finish with the Scout’s code challenge."
          }</p>

          {islandStarted ? <div className="evidence-path island-evidence-path">
            {orderedFirstIslandLessons.map((actor, index) => {
              const complete = actor.lesson ? islandProgress.completedLessonIds.includes(actor.lesson.id) : false;
              return <span key={actor.id} className={complete ? "included" : "excluded"}>{index + 1}<small>{complete ? "learned" : "not found"}</small></span>;
            })}
          </div> : null}

          <div className="next-insight">
            <Icon name="target" />
            <div>
              <strong>Recommended next step</strong>
              <span>{practiceConcept ? guidance?.next ?? "Return to the challenge and try a revised solution." : islandProgress.challengeCompleted ? "Continue to the Chapel of Choices and apply your learning in a new setting." : "Continue along the First Island trail."}</span>
            </div>
            <Link href={islandProgress.challengeCompleted ? "/game/church" : "/game"} className="solid-action" style={{ marginLeft: "auto" }}><Icon name="play" /> {islandProgress.challengeCompleted ? "Next world" : islandStarted ? "Continue" : "Start"}</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
