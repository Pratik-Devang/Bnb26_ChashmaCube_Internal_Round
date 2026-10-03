import type { Diagnosis } from "@/types/learning";
import { Icon } from "@/components/ui/Icon";

export function ActiveGameCard({ diagnosis, running, onToggle }: { diagnosis: Diagnosis; running: boolean; onToggle: () => void }) {
  return (
    <section className={`game-card ${running ? "is-running" : ""}`} aria-labelledby="game-title">
      <div className="game-copy">
        <span className="section-kicker">YOUR NEXT MINI-GAME · 2 MIN</span>
        <h2 id="game-title">{diagnosis.title} <span aria-hidden="true">🪲</span></h2>
        <p>{diagnosis.explanation}</p>
        <code>{diagnosis.example}</code>
        <button className="primary-button" onClick={onToggle}>
          <Icon name={running ? "pause" : "play"} />
          {running ? "Pause mini-game" : "Start mini-game"}
        </button>
      </div>
      <div className="range-game" aria-label="range one to five visits one, two, three and four, then stops before five">
        <div className="byte-character" aria-hidden="true">{running ? "🤖" : "💡"}</div>
        <div className="step-row">
          {diagnosis.steps.map((step, index) => (
            <span key={step} className={index === diagnosis.steps.length - 1 ? "excluded" : running ? "visited" : ""}>
              {step}{index === diagnosis.steps.length - 1 ? <small>stop</small> : null}
            </span>
          ))}
        </div>
        <div className="range-caption">{running ? "Byte visits 1, 2, 3, 4… and stops!" : "Press start to walk the range."}</div>
      </div>
    </section>
  );
}
