"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  learningModules as defaultModules,
  statistics as defaultStatistics,
} from "@/lib/mock-data";
import { completeQuest, getLearningPlan } from "@/lib/api";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { WorldDestinations } from "@/components/dashboard/WorldDestinations";
import { useAccount } from "@/components/auth/AccountProvider";
import type { DashboardStatistics, Learner, LearningModule, Quest } from "@/types/learning";

export function HomeOverview() {
  const account = useAccount();
  const [learner, setLearner] = useState<Learner>(account.learner);
  const [modules, setModules] = useState<LearningModule[]>(defaultModules.map((item) => ({ ...item, progress: 0, status: "upcoming" })));
  const [quests, setQuests] = useState<Quest[]>([]);
  const [statistics, setStatistics] = useState<DashboardStatistics>({ ...defaultStatistics, mastered: 0, inProgress: 0 });
  const [error, setError] = useState("");
  const [completingQuestId, setCompletingQuestId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchPlan() {
      try {
        const plan = await getLearningPlan();
        if (isMounted && plan) {
          setLearner(plan.learner);
          setModules(plan.modules);
          setQuests(plan.quests);
          setStatistics(plan.statistics);
        }
      } catch {
        if (isMounted) setError("Your progress could not be loaded. Please refresh to try again.");
      }
    }
    fetchPlan();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleQuestClick = async (questId: string) => {
    if (completingQuestId) return;
    setCompletingQuestId(questId);
    try {
      const result = await completeQuest(questId, learner.id);
      setQuests((items) =>
        items.map((item) => (item.id === questId ? { ...item, status: "completed" } : item))
      );
      setLearner((prev) => ({
        ...prev,
        xp: result.learnerXp,
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to claim this quest.");
    } finally {
      setCompletingQuestId(null);
    }
  };

  const activeLesson = modules.find((item) => item.status === "active") ?? modules[2] ?? defaultModules[2];
  const completedCount = quests.filter((quest) => quest.status === "completed").length;
  const loopMastery = activeLesson.progress ?? 0;

  return (
    <main className="route-page home-page">
      {error && <p role="alert">{error}</p>}
      <PageHeader
        eyebrow={`WELCOME BACK, ${learner.name.toUpperCase()} / PYTHON FOUNDATIONS`}
        title="Your next adventure awaits."
        description="Explore a world. Untangle an idea. Come back a little wiser."
        action={<Link className="quiet-action" href="/insights">View today’s insight</Link>}
      />

      <WorldDestinations />
      <div className="dashboard-grid">
        <section className="plan-workspace" aria-label="Learning plan">
          <div className="plan-toolbar">
            <div><span className="page-eyebrow">CURRENT MODULE</span><h2>Loops & iteration</h2></div>
            <div className="compact-stats" aria-label="Learning snapshot">
              <span><strong>{statistics.totalConcepts}</strong> lessons</span>
              <span><strong>{statistics.mastered}</strong> mastered</span>
              <span><strong>{loopMastery}%</strong> mastery</span>
            </div>
          </div>

          <article className="featured-lesson">
            <div className="featured-copy">
              <span className="lesson-kicker"><i /> READY · 8 MIN</span>
              <h2>{activeLesson.title}</h2>
              <p>{activeLesson.description}</p>
              <div className="hero-progress">
                <span><i style={{ width: `${activeLesson.progress}%` }} /></span>
                <strong>{activeLesson.progress}%</strong>
              </div>
              <Link href="/learn/inclusive-sum-01" className="solid-action"><Icon name="play" />Continue lesson</Link>
            </div>
            <div className="boundary-preview" aria-label="Range one to five stops before five">
              <span className="preview-code">range(1, 5)</span>
              <div className="preview-steps">
                {[1, 2, 3, 4, 5].map((step) => <span key={step} className={step === 5 ? "stop" : "visited"}>{step}{step === 5 ? <small>stop</small> : null}</span>)}
              </div>
              <p>Four values run. The stop value stays outside.</p>
            </div>
          </article>

          <div className="mini-path" aria-label="Next lessons">
            {modules.slice(0, 4).map((module, index) => (
              <article key={module.id} className={`mini-path-card tone-${module.accent || "lilac"}`}>
                <span>{module.status === "completed" ? "✓" : index + 1}</span>
                <div><small>{module.status}</small><strong>{module.title}</strong></div>
                <b>{module.progress ? `${module.progress}%` : `+${module.xpReward || 100}`}</b>
              </article>
            ))}
          </div>

          <div className="home-support-grid">
            <Link href="/insights" className="misconception-signal">
              <span className="support-icon"><Icon name="brain" /></span>
              <div><small>YOUR LEARNING JOURNAL</small><strong>Discover what your answers reveal</strong><p>Review understanding across your own attempts.</p></div>
              <b>Review</b>
            </Link>
            <section className="practice-pulse" aria-label="Practice rhythm">
              <div><small>YOUR ADVENTURE</small><strong>{statistics.mastered} concepts mastered</strong></div>
              <span>{learner.xp} XP</span>
            </section>
          </div>
        </section>

        <aside className="today-panel" aria-label="Today">
          <div className="today-heading"><div><span className="page-eyebrow">THE NOTICE BOARD</span><h2>Daily quests</h2></div><span className="date-badge" aria-hidden="true">✦</span></div>

          <article className="day-streak-card"><Icon name="flame" /><div><strong>{learner.streak} day streak</strong><span>One focused session keeps it going.</span></div></article>

          <section className="quest-overview">
            <div className="section-heading">
              <div><span>DAILY QUESTS</span><h2>{completedCount}/{quests.length} complete</h2></div>
              <span className="round-count">{quests.length - completedCount}</span>
            </div>
            <div className="home-quests">
              {quests.map((quest) => {
                const isDone = quest.status === "completed";
                const isPending = completingQuestId === quest.id;
                return (
                  <button
                    key={quest.id}
                    className={isDone ? "done" : ""}
                    onClick={() => handleQuestClick(quest.id)}
                    disabled={isDone || isPending}
                    aria-label={`Claim quest: ${quest.title}`}
                  >
                    <span>{isDone ? "✓" : quest.icon || "📘"}</span>
                    <div><strong>{quest.title}</strong><small>+{quest.xpReward} XP</small></div>
                    <i>{isDone ? "Done" : isPending ? "Claiming..." : "Claim"}</i>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="week-strip" aria-label="Practice this week">
            <div><span className="page-eyebrow">YOUR ACCOUNT</span><strong>Level {learner.level}</strong></div>
            <p>Explore a world to continue your personal journey.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
