import Image from "next/image";
import Link from "next/link";
import { learningWorlds } from "@/lib/game/worlds";

export function WorldDestinations() {
  return <section className="world-destinations" aria-label="Explore learning worlds">
    {learningWorlds.map((world, index) => <Link key={world.id} href={world.href} className={`world-postcard ${world.art}-postcard`}>
      <Image src={world.image} alt={world.name} unoptimized className="world-postcard-art" />
      <div className="world-postcard-copy"><span className="world-number">{String(index + 1).padStart(2, "0")} / {world.topic.toUpperCase()}</span><h2>{world.name}</h2><p>{world.description}</p><span className="world-enter">Explore world <span aria-hidden="true">↗</span></span></div>
    </Link>)}
  </section>;
}
