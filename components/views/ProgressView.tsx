import { conceptStates, learner, learningModules } from "@/lib/mock-data";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";

export function ProgressView() {
  const completed = learningModules.filter((item) => item.status === "completed").length;

  return (
    <main className="route-page progress-page">
      <PageHeader
        eyebrow="YOUR PROGRESS"
        title="Growth you can see"
        description="Mastery reflects repeated evidence across new questions—not a single perfect answer."
      />

      <section className="progress-hero">
        <div className="mastery-orbit" aria-label="64 percent loop mastery"><div><strong>64%</strong><span>loop mastery</span></div></div>
        <div className="progress-hero-copy"><span className="page-eyebrow">CURRENT MILESTONE</span><h2>Boundary explorer</h2><p>You’ve mastered the foundations and are building reliable loop intuition.</p><div className="milestone-track"><i /><i /><i className="current" /><i /><i /></div><small>2 concepts mastered · 1 improving · 3 ahead</small></div>
        <div className="reward-stack"><div><Icon name="bolt" /><span><strong>{learner.xp.toLocaleString()}</strong>Total XP</span></div><div><Icon name="flame" /><span><strong>{learner.streak} days</strong>Current streak</span></div><div><Icon name="trophy" /><span><strong>{completed}</strong>Levels complete</span></div></div>
      </section>

      <div className="progress-grid">
        <section className="surface-card mastery-list">
          <div className="section-heading"><div><span>CONCEPT MASTERY</span><h2>Python foundations</h2></div><strong>64%</strong></div>
          {conceptStates.map((concept) => (
            <article key={concept.id}>
              <div><strong>{concept.concept}</strong><span>{concept.mastery}%</span></div>
              <p>{concept.friendlyDescription}</p>
              <div className={`mastery-line state-${concept.state}`}><i style={{ width: `${concept.mastery}%` }} /></div>
            </article>
          ))}
        </section>

        <section className="surface-card practice-history">
          <div className="section-heading"><div><span>THIS WEEK</span><h2>Practice rhythm</h2></div><strong>92 min</strong></div>
          <div className="history-bars">
            {[22, 48, 30, 64, 42, 78, 14].map((value, index) => <div key={index}><span>{value}m</span><i style={{ height: `${value}%` }} className={index === 5 ? "highlight" : ""} /><small>{["M", "T", "W", "T", "F", "S", "S"][index]}</small></div>)}
          </div>
          <p className="history-note"><Icon name="flame" />Saturday was your strongest focused session.</p>
        </section>
      </div>
    </main>
  );
}
