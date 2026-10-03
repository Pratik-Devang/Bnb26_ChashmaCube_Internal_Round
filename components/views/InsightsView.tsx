import { conceptStates, diagnosis } from "@/lib/mock-data";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";

const labels = {
  resolved: "Resolved",
  improving: "Improving",
  "needs-practice": "Needs practice",
  untested: "Not explored yet",
};

export function InsightsView() {
  return (
    <main className="route-page insights-page">
      <PageHeader
        eyebrow="LEARNING INSIGHTS"
        title="Mistakes with meaning"
        description="Re:Learn looks for the idea behind an answer, then shows the smallest useful next step."
      />

      <section className="insight-summary" aria-label="Misconception summary">
        <article className="summary-main"><span>CONCEPTS CHECKED</span><strong>3</strong><p>Enough evidence to personalize your loop path.</p></article>
        <article><span className="metric-icon mint">✓</span><div><strong>1</strong><p>Resolved</p></div></article>
        <article><span className="metric-icon cyan">↗</span><div><strong>1</strong><p>Improving</p></div></article>
        <article><span className="metric-icon yellow">◎</span><div><strong>1</strong><p>Practice next</p></div></article>
      </section>

      <div className="insights-grid">
        <section className="surface-card concept-insights">
          <div className="section-heading"><div><span>CONCEPT MAP</span><h2>What your attempts show</h2></div></div>
          <div className="insight-list">
            {conceptStates.map((concept) => (
              <article key={concept.id}>
                <div className={`state-symbol state-${concept.state}`}>{concept.state === "resolved" ? "✓" : concept.state === "improving" ? "↗" : concept.state === "needs-practice" ? "◎" : "·"}</div>
                <div><h3>{concept.concept}</h3><p>{concept.friendlyDescription}</p></div>
                <span className={`state-label state-${concept.state}`}>{labels[concept.state]}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="diagnosis-spotlight">
          <span className="page-eyebrow">LATEST INSIGHT</span>
          <div className="spotlight-title"><span>🪲</span><div><h2>{diagnosis.title}</h2><p>It’s a common first-loop idea—not a failure.</p></div></div>
          <p>{diagnosis.explanation}</p>
          <code>{diagnosis.example}</code>
          <div className="evidence-path">
            {diagnosis.steps.map((step, index) => <span key={step} className={index === diagnosis.steps.length - 1 ? "excluded" : "included"}>{step}<small>{index === diagnosis.steps.length - 1 ? "not visited" : "visited"}</small></span>)}
          </div>
          <div className="next-insight"><Icon name="target" /><span><strong>Recommended next step</strong>Play the two-minute boundary game, then try the same idea with a list.</span></div>
        </section>
      </div>
    </main>
  );
}
