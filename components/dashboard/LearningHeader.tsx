import type { DashboardStatistics } from "@/types/learning";
import { Icon } from "@/components/ui/Icon";

export function LearningHeader({ search, onSearch, statistics }: { search: string; onSearch: (value: string) => void; statistics: DashboardStatistics }) {
  return (
    <section className="learning-header">
      <div>
        <span className="eyebrow">LEVEL 4 · PYTHON EXPLORER</span>
        <h1>Your Python Adventure <span aria-hidden="true">🐍</span></h1>
        <p>Hey Maya! One tiny idea at a time — your next breakthrough is ready.</p>
      </div>
      <label className="search-box">
        <Icon name="search" />
        <span className="sr-only">Search lessons</span>
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Find a lesson" />
        <kbd>⌘ K</kbd>
      </label>
      <div className="stats" aria-label="Learning statistics">
        <div className="stat stat-cyan"><strong>{statistics.totalConcepts}</strong><span>Total concepts</span></div>
        <div className="stat stat-mint"><strong>{statistics.mastered}</strong><span>Mastered</span></div>
        <div className="stat stat-lilac"><strong>{statistics.inProgress}</strong><span>In progress</span></div>
      </div>
    </section>
  );
}
