import type { LearningModule } from "@/types/learning";
import { LearningCard } from "./LearningCard";

interface Props {
  modules: LearningModule[];
  expandedIds: string[];
  gameRunning: boolean;
  onToggleDetails: (id: string) => void;
  onToggleGame: () => void;
}

export function LearningPath({ modules, expandedIds, gameRunning, onToggleDetails, onToggleGame }: Props) {
  if (!modules.length) {
    return <div className="empty-state"><span>🔎</span><h2>No lessons found</h2><p>Try a broader search — your path is still here.</p></div>;
  }

  return (
    <section className="path-section" aria-label="Python learning path">
      <div className="path-title"><div><span className="section-kicker">YOUR ROUTE</span><h2>Learning path</h2></div><span>{modules.length} stops</span></div>
      <div className="learning-path">
        <div className="dotted-path" aria-hidden="true" />
        {modules.map((module) => (
          <LearningCard
            key={module.id}
            module={module}
            expanded={expandedIds.includes(module.id)}
            gameRunning={gameRunning}
            onToggleDetails={() => onToggleDetails(module.id)}
            onToggleGame={onToggleGame}
          />
        ))}
      </div>
    </section>
  );
}
