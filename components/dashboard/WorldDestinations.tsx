import Image from "next/image";
import Link from "next/link";
import { learningWorlds } from "@/lib/game/worlds";
import type { FirstIslandProgress } from "@/types/game";

export function WorldDestinations({ firstIslandProgress }: { firstIslandProgress?: FirstIslandProgress }) {
  const firstIslandStarted = Boolean(firstIslandProgress?.completedLessonIds.length || firstIslandProgress?.challengeCompleted);
  return <section className="world-destinations" aria-label="Explore learning worlds">
    {learningWorlds.map((world, index) => {
      const progressLabel = world.id === "first-island"
        ? firstIslandProgress?.challengeCompleted
          ? "WORLD COMPLETE"
          : firstIslandStarted
            ? `${firstIslandProgress?.completedLessonIds.length ?? 0}/6 LESSONS FOUND`
            : "START YOUR JOURNEY HERE"
        : firstIslandProgress?.challengeCompleted ? world.label.toUpperCase() : "NEXT WORLD";

      return <Link key={world.id} href={world.href} className={`world-postcard ${world.art}-postcard`}>
        <Image src={world.image} alt={world.name} unoptimized className="world-postcard-art" />
        <div className="world-postcard-copy"><span className="world-number">{String(index + 1).padStart(2, "0")} / {world.topic.toUpperCase()}</span><span className="world-progress-label">{progressLabel}</span><h2>{world.name}</h2><p>{world.description}</p><span className="world-enter">Explore world <span aria-hidden="true">↗</span></span></div>
      </Link>;
    })}
  </section>;
}
