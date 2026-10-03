"use client";

import { useEffect, useState } from "react";
import {
  conceptStates as defaultConcepts,
  learner as defaultLearner,
  learningModules as defaultModules,
} from "@/lib/mock-data";
import { getLearnerProgress, getLearningPlan } from "@/lib/api";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Learner, LearnerConceptState, LearningModule } from "@/types/learning";

export function ProgressView() {
  const [learner, setLearner] = useState<Learner>(defaultLearner);
  const [modules, setModules] = useState<LearningModule[]>(defaultModules);
  const [concepts, setConcepts] = useState<LearnerConceptState[]>(defaultConcepts);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchLiveProgress() {
      setIsLoading(true);
      try {
        const [plan, liveConcepts] = await Promise.all([
          getLearningPlan("learner-demo"),
          getLearnerProgress("learner-demo"),
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
        // Fall back gracefully to default seed state
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
    defaultConcepts[2];
  const loopMastery = loopConcept ? loopConcept.mastery : 64;

  const masteredCount = concepts.filter((c) => c.state === "resolved").length;
  const improvingCount = concepts.filter((c) => c.state === "improving").length;
  const aheadCount = concepts.filter((c) => c.state === "untested" || c.state === "needs-practice").length;

  const averageMastery =
    concepts.length > 0
      ? Math.round(concepts.reduce((acc, c) => acc + c.mastery, 0) / concepts.length)
      : 64;

  return (
    <main className="route-page progress-page">
      <PageHeader
        eyebrow="YOUR PROGRESS"
        title="Growth you can see"
        description="Mastery reflects repeated evidence across new questions—not a single perfect answer."
      />

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
          <p>You’ve mastered the foundations and are building reliable loop intuition.</p>
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
            <strong>92 min</strong>
          </div>
          <div className="history-bars">
            {[22, 48, 30, 64, 42, 78, 14].map((value, index) => (
              <div key={index}>
                <span>{value}m</span>
                <i style={{ height: `${value}%` }} className={index === 5 ? "highlight" : ""} />
                <small>{["M", "T", "W", "T", "F", "S", "S"][index]}</small>
              </div>
            ))}
          </div>
          <p className="history-note">
            <Icon name="flame" />
            Saturday was your strongest focused session.
          </p>
        </section>
      </div>
    </main>
  );
}
