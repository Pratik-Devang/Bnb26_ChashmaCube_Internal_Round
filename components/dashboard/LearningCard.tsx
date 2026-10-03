import type { LearningModule } from "@/types/learning";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";

interface Props {
  module: LearningModule;
  expanded: boolean;
  gameRunning: boolean;
  onToggleDetails: () => void;
  onToggleGame: () => void;
}

export function LearningCard({ module, expanded, gameRunning, onToggleDetails, onToggleGame }: Props) {
  const isActive = module.status === "active";
  const isLocked = module.status === "locked";

  return (
    <article className={`learning-card accent-${module.accent} card-${module.status}`}>
      <div className="path-node" aria-hidden="true">{module.status === "completed" ? "✓" : isLocked ? <Icon name="lock" /> : ""}</div>
      <div className="card-heading">
        <span className="module-icon" aria-hidden="true">{module.icon}</span>
        <StatusPill status={module.status} />
      </div>
      <h3>{module.title}</h3>
      <p>{module.description}</p>
      {isActive ? (
        <div className="module-progress">
          <div><span>Lesson progress</span><strong>{module.progress}%</strong></div>
          <span className="progress-track"><i style={{ width: `${module.progress}%` }} /></span>
        </div>
      ) : null}
      {expanded ? <div className="lesson-detail"><span>Try this idea</span>{module.beginnerNote}</div> : null}
      <footer>
        <button className="text-button" onClick={onToggleDetails} aria-expanded={expanded}>
          {expanded ? "Hide tip" : "Quick tip"}<Icon name="chevron" />
        </button>
        <span className="xp-reward">+{module.xpReward} XP</span>
        {isActive ? (
          <button className="play-button" onClick={onToggleGame} aria-label={gameRunning ? "Pause Loop Boundaries lesson" : "Start Loop Boundaries lesson"}>
            <Icon name={gameRunning ? "pause" : "play"} />
          </button>
        ) : null}
      </footer>
    </article>
  );
}
