import type { ConceptState, LearnerConceptState } from "@/types/learning";
import { ProgressRing } from "@/components/ui/ProgressRing";

const stateLabels: Record<ConceptState, string> = {
  resolved: "Resolved",
  improving: "Improving",
  "needs-practice": "Needs practice",
  learned: "Learning",
  untested: "Untested",
};

export function ProgressOverview({ concepts }: { concepts: LearnerConceptState[] }) {
  const average = Math.round(concepts.reduce((total, item) => total + item.mastery, 0) / concepts.length);

  return (
    <section className="progress-overview" id="progress" aria-labelledby="progress-title">
      <div className="progress-summary">
        <div><span className="section-kicker">GROWTH, NOT GRADES</span><h2 id="progress-title">Your concept garden <span aria-hidden="true">🌱</span></h2><p>Each try gives us a clue about what to practice next.</p></div>
        <ProgressRing value={average} label="growing" />
      </div>
      <div className="concept-list">
        {concepts.map((concept) => (
          <article key={concept.id} className={`concept-state state-${concept.state}`}>
            <header><div><h3>{concept.concept}</h3><p>{concept.friendlyDescription}</p></div><span>{stateLabels[concept.state]}</span></header>
            <div className="mastery-bar" aria-label={`${concept.concept} mastery ${concept.mastery}%`}><i style={{ width: `${concept.mastery}%` }} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}
