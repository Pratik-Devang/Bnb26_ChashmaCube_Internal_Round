import type { Quest } from "@/types/learning";
import { Icon } from "@/components/ui/Icon";

export function QuestPanel({ quests, streak, onComplete }: { quests: Quest[]; streak: number; onComplete: (quest: Quest) => void }) {
  const done = quests.filter((quest) => quest.status === "completed").length;

  return (
    <aside className="quest-panel" id="quests" aria-labelledby="quests-title">
      <div className="quest-panel__header"><div><span className="section-kicker">DAILY BOOST</span><h2 id="quests-title">Today’s Quests <span aria-hidden="true">🧭</span></h2></div><span className="quest-count">{done}/{quests.length}</span></div>
      <div className="streak-card">
        <span className="streak-fire">🔥</span>
        <div><strong>{streak}-day streak!</strong><p>Learn today to keep your spark glowing.</p></div>
        <div className="week-dots" aria-label={`${streak} day learning streak`}>{["M", "T", "W", "T", "F"].map((day) => <span key={day}>{day}</span>)}</div>
      </div>
      <div className="quest-list">
        {quests.map((quest, index) => (
          <article key={quest.id} className={`quest-card accent-${quest.accent} ${index === 1 ? "tilted" : ""} ${quest.status === "completed" ? "is-complete" : ""}`}>
            <div className="quest-icon" aria-hidden="true">{quest.status === "completed" ? "✓" : quest.icon}</div>
            <div><span className="quest-type">{quest.status === "completed" ? "QUEST COMPLETE" : `QUEST 0${index + 1}`}</span><h3>{quest.title}</h3><p>{quest.description}</p></div>
            <footer><span>⚡ +{quest.xpReward} XP</span><button onClick={() => onComplete(quest)} disabled={quest.status === "completed"}>{quest.status === "completed" ? "Done" : "Complete"}{quest.status === "completed" ? <Icon name="check" /> : null}</button></footer>
          </article>
        ))}
      </div>
      <div className="quest-note"><Icon name="sparkles" /><p><strong>Small wins count.</strong><br />Completing one quest is enough to move forward today.</p></div>
    </aside>
  );
}
