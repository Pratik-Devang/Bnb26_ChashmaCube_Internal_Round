"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import firstIslandMap from "@/2d_assets/First Island/Tiled/Tiled_map.png";
import ruinedChurchMap from "@/2d_assets/Church/Maps/Ruined_temple_exterior.png";
import { useAccount } from "@/components/auth/AccountProvider";
import { WorldDestinations } from "@/components/dashboard/WorldDestinations";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { getLearningPlan } from "@/lib/api";
import { firstIsland, orderedFirstIslandLessons } from "@/lib/game/first-island/content";
import { emptyFirstIslandProgress, loadFirstIslandProgress } from "@/lib/game/first-island/progress";
import type { FirstIslandProgress } from "@/types/game";
import type { Learner } from "@/types/learning";

const totalLessons = orderedFirstIslandLessons.length;

export function HomeOverview() {
  const account = useAccount();
  const [learner, setLearner] = useState<Learner>(account.learner);
  const [islandProgress, setIslandProgress] = useState<FirstIslandProgress>(emptyFirstIslandProgress);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    Promise.all([getLearningPlan(), loadFirstIslandProgress()])
      .then(([plan, progress]) => {
        if (!isMounted) return;
        setLearner(plan.learner);
        setIslandProgress(progress);
      })
      .catch(() => {
        if (isMounted) setError("Your adventure progress could not be loaded. Please refresh to try again.");
      })
      .finally(() => {
        if (isMounted) setLoadingProgress(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const completedLessons = islandProgress.completedLessonIds.length;
  const hasStarted = completedLessons > 0 || islandProgress.challengeCompleted;
  const islandComplete = completedLessons === totalLessons && islandProgress.challengeCompleted;
  const completedSteps = completedLessons + (islandProgress.challengeCompleted ? 1 : 0);
  const journeyPercent = Math.round((completedSteps / (totalLessons + 1)) * 100);
  const nextTeacher = orderedFirstIslandLessons.find(
    (actor) => actor.lesson && !islandProgress.completedLessonIds.includes(actor.lesson.id),
  );
  const nextLesson = nextTeacher?.lesson;

  const objectives = [
    {
      label: "Meet the Beach Cartographer",
      detail: "Learn why programs give information a name.",
      done: islandProgress.completedLessonIds.includes("variable-names"),
      status: islandProgress.completedLessonIds.includes("variable-names") ? "Done" : "Start here",
    },
    {
      label: "Learn from all six island teachers",
      detail: `${completedLessons}/${totalLessons} lessons discovered`,
      done: completedLessons === totalLessons,
      status: `${completedLessons}/${totalLessons}`,
    },
    {
      label: "Pass the Island Scout’s trial",
      detail: "Use what you learned in a code challenge.",
      done: islandProgress.challengeCompleted,
      status: islandProgress.challengeCompleted ? "Done" : completedLessons === totalLessons ? "Ready" : "Locked",
    },
  ];

  return (
    <main className="route-page home-page">
      {error && <p className="action-error-banner" role="alert">{error}</p>}
      <PageHeader
        eyebrow={`WELCOME, ${learner.name.toUpperCase()} / ${firstIsland.chapter.toUpperCase()}`}
        title={hasStarted ? "Continue your island journey." : "Your first adventure is ready."}
        description={hasStarted
          ? "Pick up at your next island guide. Everything you discover is saved to this account."
          : "Begin on The First Island, meet its teachers, and learn how Python remembers values."}
        action={<Link className="quiet-action" href={islandComplete ? "/game/church" : "/game"}>{islandComplete ? "Enter the next world" : hasStarted ? "Return to the island" : "Explore the first island"}</Link>}
      />

      <WorldDestinations firstIslandProgress={islandProgress} />

      <div className="dashboard-grid">
        <section className="plan-workspace" aria-label="Current adventure">
          <div className="plan-toolbar">
            <div><span className="page-eyebrow">CURRENT ADVENTURE</span><h2>Variables &amp; values</h2></div>
            <div className="compact-stats" aria-label="Island progress snapshot">
              <span><strong>{totalLessons}</strong> guides</span>
              <span><strong>{completedLessons}</strong> learned</span>
              <span><strong>{journeyPercent}%</strong> journey</span>
            </div>
          </div>

          <article className="featured-lesson island-feature">
            <div className="featured-copy">
              <span className="lesson-kicker"><i /> {islandComplete ? "ISLAND COMPLETE" : hasStarted ? "ADVENTURE IN PROGRESS" : "START HERE · FIRST WORLD"}</span>
              <h2>{firstIsland.name}</h2>
              <p>{islandComplete
                ? "You completed every lesson and passed the Scout’s trial. Your next world awaits."
                : nextLesson
                  ? `${nextTeacher?.name} is waiting to teach you: ${nextLesson.title}.`
                  : firstIsland.objective}
              </p>
              <div className="hero-progress" aria-label={`${journeyPercent}% of The First Island complete`}>
                <span><i style={{ width: `${journeyPercent}%` }} /></span>
                <strong>{journeyPercent}%</strong>
              </div>
              <Link href={islandComplete ? "/game/church" : "/game"} className="solid-action"><Icon name="play" />{islandComplete ? "Enter the ruined church" : hasStarted ? "Continue adventure" : "Enter the first island"}</Link>
            </div>

            <Link href={islandComplete ? "/game/church" : "/game"} className={`island-dashboard-preview${islandComplete ? " next-world-preview" : ""}`} aria-label={islandComplete ? "Open The Ruined Church" : "Open The First Island"}>
              <Image src={islandComplete ? ruinedChurchMap : firstIslandMap} alt={islandComplete ? "The Ruined Church learning map" : "The First Island learning map"} unoptimized priority />
              <span><small>{islandComplete ? "NEXT WORLD" : "NEXT GUIDE"}</small><strong>{islandComplete ? "The Ruined Church" : nextTeacher?.name ?? "Island Scout"}</strong></span>
            </Link>
          </article>

          <div className="mini-path" aria-label="First Island lesson trail">
            {orderedFirstIslandLessons.slice(0, 4).map((actor, index) => {
              const lesson = actor.lesson!;
              const done = islandProgress.completedLessonIds.includes(lesson.id);
              const current = nextLesson?.id === lesson.id;
              return (
                <article key={lesson.id} className={`mini-path-card${done ? " done" : current ? " current" : ""}`}>
                  <span>{done ? "✓" : index + 1}</span>
                  <div><small>{done ? "learned" : current ? "next guide" : "upcoming"}</small><strong>{actor.name}</strong></div>
                  <b>{done ? "Done" : "+10 coins"}</b>
                </article>
              );
            })}
          </div>

          <div className="home-support-grid">
            <Link href="/insights" className="misconception-signal">
              <span className="support-icon"><Icon name="brain" /></span>
              <div><small>YOUR LEARNING JOURNAL</small><strong>{hasStarted ? "Review what your answers reveal" : "Your journal is ready"}</strong><p>{hasStarted ? "See the ideas you understand and the ones worth revisiting." : "Insights will appear as you learn and attempt challenges."}</p></div>
              <b>Review</b>
            </Link>
            <section className="practice-pulse" aria-label="Adventure rewards">
              <div><small>YOUR ADVENTURE</small><strong>{completedLessons} of {totalLessons} lessons learned</strong></div>
              <span>{islandProgress.coinsEarned} coins</span>
            </section>
          </div>
        </section>

        <aside className="today-panel" aria-label="First Island objectives">
          <div className="today-heading"><div><span className="page-eyebrow">THE NOTICE BOARD</span><h2>Island objectives</h2></div><span className="date-badge" aria-hidden="true">✦</span></div>

          <article className="day-streak-card"><Icon name="flame" /><div><strong>{learner.streak} day streak</strong><span>{hasStarted ? "Return to the trail to keep it going." : "Your first lesson starts the streak."}</span></div></article>

          <section className="quest-overview">
            <div className="section-heading">
              <div><span>FIRST ISLAND</span><h2>{objectives.filter((objective) => objective.done).length}/{objectives.length} complete</h2></div>
              <span className="round-count">{objectives.filter((objective) => !objective.done).length}</span>
            </div>
            <div className="home-quests island-objectives">
              {objectives.map((objective, index) => (
                <article key={objective.label} className={objective.done ? "done" : ""}>
                  <span>{objective.done ? "✓" : index + 1}</span>
                  <div><strong>{objective.label}</strong><small>{objective.detail}</small></div>
                  <i>{objective.status}</i>
                </article>
              ))}
            </div>
          </section>

          <section className="week-strip" aria-label="Account adventure status">
            <div><span className="page-eyebrow">YOUR ACCOUNT</span><strong>Level {learner.level}</strong></div>
            <p>{loadingProgress ? "Opening your adventure journal…" : islandComplete ? "The First Island is complete." : "The First Island is your next destination."}</p>
            <Link href={islandComplete ? "/game/church" : "/game"} className="notice-board-link">{islandComplete ? "Enter the ruined church →" : hasStarted ? "Continue island →" : "Begin adventure →"}</Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
