"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { conceptStates as defaultConcepts, diagnosis } from "@/lib/mock-data";
import { getLearnerProgress } from "@/lib/api";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { PixelSprite } from "@/components/ui/PixelSprite";
import type { LearnerConceptState } from "@/types/learning";

const labels: Record<string, string> = {
  resolved: "Resolved",
  improving: "Improving",
  "needs-practice": "Needs practice",
  untested: "Not explored yet",
};

export function InsightsView() {
  const [concepts, setConcepts] = useState<LearnerConceptState[]>(defaultConcepts);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchProgress() {
      setIsLoading(true);
      try {
        const live = await getLearnerProgress("learner-demo");
        if (isMounted && live && live.length > 0) {
          setConcepts(live);
        }
      } catch {
        // Fall back gracefully to default seed state
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchProgress();
    return () => {
      isMounted = false;
    };
  }, []);

  const resolvedCount = concepts.filter((c) => c.state === "resolved").length;
  const improvingCount = concepts.filter((c) => c.state === "improving").length;
  const practiceCount = concepts.filter((c) => c.state === "needs-practice").length;
  const checkedCount = concepts.filter((c) => c.state !== "untested").length;

  return (
    <main className="route-page insights-page">
      <PageHeader
        eyebrow="LEARNING INSIGHTS"
        title="Mistakes with meaning"
        description="Re:Learn looks for the idea behind an answer, then shows the smallest useful next step."
      />

      <section className="insight-summary" aria-label="Misconception summary">
        <article className="summary-main">
          <span>CONCEPTS CHECKED</span>
          <strong>{checkedCount}</strong>
          <p>Enough evidence to personalize your loop path.</p>
        </article>
        <article>
          <span className="metric-icon mint">✓</span>
          <div>
            <strong>{resolvedCount}</strong>
            <p>Resolved</p>
          </div>
        </article>
        <article>
          <span className="metric-icon cyan">↗</span>
          <div>
            <strong>{improvingCount}</strong>
            <p>Improving</p>
          </div>
        </article>
        <article>
          <span className="metric-icon yellow">◎</span>
          <div>
            <strong>{practiceCount}</strong>
            <p>Practice next</p>
          </div>
        </article>
      </section>

      <div className="insights-grid">
        <section className="surface-card concept-insights">
          <div className="section-heading">
            <div>
              <span>CONCEPT MAP</span>
              <h2>What your attempts show</h2>
            </div>
            {isLoading ? <small style={{ color: "var(--muted)" }}>Refreshing...</small> : null}
          </div>
          <div className="insight-list">
            {concepts.map((concept) => (
              <article key={concept.id}>
                <div className={`state-symbol state-${concept.state}`}>
                  {concept.state === "resolved" ? "✓" : concept.state === "improving" ? "↗" : concept.state === "needs-practice" ? "◎" : "·"}
                </div>
                <div>
                  <h3>{concept.concept}</h3>
                  <p>{concept.friendlyDescription}</p>
                </div>
                <span className={`state-label state-${concept.state}`}>
                  {labels[concept.state] ?? concept.state}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="diagnosis-spotlight">
          <span className="page-eyebrow">LATEST INSIGHT</span>
          <div className="spotlight-title">
            <span><PixelSprite character="scout" /></span>
            <div>
              <h2>{diagnosis.title}</h2>
              <p>It’s a common first-loop idea—not a failure.</p>
            </div>
          </div>
          <p>{diagnosis.explanation}</p>
          <code>{diagnosis.example}</code>
          <div className="evidence-path">
            {diagnosis.steps.map((step, index) => (
              <span key={step} className={index === diagnosis.steps.length - 1 ? "excluded" : "included"}>
                {step}
                <small>{index === diagnosis.steps.length - 1 ? "not visited" : "visited"}</small>
              </span>
            ))}
          </div>
          <div className="next-insight">
            <Icon name="target" />
            <div>
              <strong>Recommended next step</strong>
              <span>Play the two-minute boundary game, then try the same idea with a list.</span>
            </div>
            <Link href="/learn/inclusive-sum-01" className="solid-action" style={{ marginLeft: "auto" }}>
              <Icon name="play" /> Start
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
