import { demoExercises, misconceptionCatalog, demoScenarios } from "@/lib/demo-content";

const typeLabel = { practice: "STARTER", "near-transfer": "NEAR TRANSFER", "far-transfer": "FAR TRANSFER" };

export function ExerciseLibrary() {
  return (
    <section className="exercise-library" id="exercises" aria-labelledby="exercises-title">
      <header className="exercise-library__header">
        <div><span className="section-kicker">DEMO CONTENT</span><h2 id="exercises-title">Practice & transfer</h2><p>Six starter exercises, followed by paired questions that check whether an idea travels.</p></div>
        <span className="exercise-count">{demoExercises.length} exercises</span>
      </header>
      <div className="exercise-grid">
        {demoExercises.map((item) => (
          <article className="exercise-card" key={item.id}>
            <div className="exercise-card__meta"><span>{typeLabel[item.exerciseType]}</span><code>{item.id}</code></div>
            <h3>{item.title}</h3><p>{item.prompt}</p>
            <details><summary>Starter code, tests & hint</summary>
              <pre><code>{item.starterCode}</code></pre>
              <p className="exercise-hint"><strong>Hint:</strong> {item.friendlyHint}</p>
              {item.expectedMisconception ? <p className="exercise-hint"><strong>Expected signal:</strong> {item.expectedMisconception}</p> : null}
              <div className="test-list"><strong>Browser test cases</strong>{item.testCases.map((test, index) => <code key={index}>{JSON.stringify(test.input)} → {JSON.stringify(test.expected)}</code>)}</div>
            </details>
          </article>
        ))}
      </div>
      <div className="catalog-grid">
        <section className="catalog-card"><span className="section-kicker">TARGETED GAMES</span><h3>Misconception interventions</h3>
          {misconceptionCatalog.map((item) => <details className="catalog-row" key={item.code}><summary>{item.displayName}<small>{item.intervention.title}</small></summary><p>{item.description}</p><ol>{item.intervention.instructions.map((step) => <li key={step}>{step}</li>)}</ol><small>Reassess with {item.nearTransferId}, then {item.farTransferId}.</small></details>)}
        </section>
        <section className="catalog-card"><span className="section-kicker">DETERMINISTIC DEMO</span><h3>End-to-end scenarios</h3>
          {demoScenarios.map((scenario) => <article className="scenario-row" key={scenario.id}><strong>{scenario.id.replaceAll("-", " ")}</strong><p>{scenario.steps.join(" → ")}</p><span>Expected: {scenario.expectedState}</span></article>)}
          <p className="scenario-note">Ambiguous evidence keeps the previous state. Quest completion is idempotent, so repeat requests award no extra XP.</p>
        </section>
      </div>
    </section>
  );
}
