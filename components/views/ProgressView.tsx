"use client";

import { useEffect, useState } from "react";
import { getLearnerProgress, getLearningPlan } from "@/lib/api";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdventureJournal } from "@/components/dashboard/AdventureJournal";
import { useAccount } from "@/components/auth/AccountProvider";
import type { Learner, LearnerConceptState, LearningModule } from "@/types/learning";

export function ProgressView() {
  const account = useAccount();
  const [learner, setLearner] = useState<Learner>(account.learner);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [concepts, setConcepts] = useState<LearnerConceptState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function fetchLiveProgress() {
      setIsLoading(true);
      try {
        const [plan, liveConcepts] = await Promise.all([
          getLearningPlan(),
          getLearnerProgress(),
        ]);
        if (isMounted) {
          if (plan) {
            setLearner(plan.learner);
            setModules(plan.modules);
          }
          if (liveConcepts && liveConcepts.length > 0) {
            setConcepts(liveConcepts);
          }
        }
      } catch {
        if (isMounted) setLoadError("Unable to load your progress. Refresh to retry.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchLiveProgress();
    return () => {
      isMounted = false;
    };
  }, []);

  const completed = modules.filter((item) => item.status === "completed").length;
  const loopConcept =
    concepts.find((c) => c.id.includes("boundaries") || c.concept.toLowerCase().includes("loop")) ??
    concepts[2] ??
    undefined;
  const loopMastery = loopConcept ? loopConcept.mastery : 0;

  const masteredCount = concepts.filter((c) => c.state === "resolved").length;
  const improvingCount = concepts.filter((c) => c.state === "improving").length;
  const aheadCount = concepts.filter((c) => c.state === "untested" || c.state === "needs-practice").length;

  const averageMastery =
    concepts.length > 0
      ? Math.round(concepts.reduce((acc, c) => acc + c.mastery, 0) / concepts.length)
      : 0;

  return (
    <main className="route-page progress-page">
      {loadError && <p role="alert">{loadError}</p>}
      <PageHeader
        eyebrow="YOUR PROGRESS"
        title="Growth you can see"
        description="Mastery reflects repeated evidence across new questions—not a single perfect answer."
      />

      <AdventureJournal />
      <h2>Code-challenge mastery</h2>
      <section className="progress-hero">
        <div className="mastery-orbit" aria-label={`${loopMastery} percent loop mastery`}>
          <div>
            <strong>{loopMastery}%</strong>
            <span>loop mastery</span>
          </div>
        </div>
        <div className="progress-hero-copy">
          <span className="page-eyebrow">CURRENT MILESTONE</span>
          <h2>Boundary explorer</h2>
          <p>Your progress grows as you complete challenges and demonstrate understanding.</p>
          <div className="milestone-track">
            <i />
            <i />
            <i className="current" />
            <i />
            <i />
          </div>
          <small>
            {masteredCount} concepts mastered · {improvingCount} improving · {aheadCount} ahead
          </small>
        </div>
        <div className="reward-stack">
          <div>
            <Icon name="bolt" />
            <span>
              <strong>{learner.xp.toLocaleString()}</strong>Total XP
            </span>
          </div>
          <div>
            <Icon name="flame" />
            <span>
              <strong>{learner.streak} days</strong>Current streak
            </span>
          </div>
          <div>
            <Icon name="trophy" />
            <span>
              <strong>{completed}</strong>Levels complete
            </span>
          </div>
        </div>
      </section>

      <div className="progress-grid">
        <section className="surface-card mastery-list">
          <div className="section-heading">
            <div>
              <span>CONCEPT MASTERY</span>
              <h2>Python foundations</h2>
            </div>
            <strong>{averageMastery}%</strong>
          </div>
          {isLoading ? (
            <div style={{ color: "var(--muted)", fontSize: "0.8rem", marginBottom: 12 }}>Refreshing mastery...</div>
          ) : null}
          {concepts.map((concept) => (
            <article key={concept.id}>
              <div>
                <strong>{concept.concept}</strong>
                <span>{concept.mastery}%</span>
              </div>
              <p>{concept.friendlyDescription}</p>
              <div className={`mastery-line state-${concept.state}`}>
                <i style={{ width: `${concept.mastery}%` }} />
              </div>
            </article>
          ))}
        </section>

        <section className="surface-card practice-history">
          <div className="section-heading">
            <div>
              <span>THIS WEEK</span>
              <h2>Practice rhythm</h2>
            </div>
            <strong>{concepts.length} concepts explored</strong>
          </div>
          <p>Your completed challenges will build evidence of understanding here.</p>
          <p className="history-note">
            <Icon name="flame" />
            Practice-time tracking is not available yet.
          </p>
        </section>
      </div>
    </main>
  );
}
