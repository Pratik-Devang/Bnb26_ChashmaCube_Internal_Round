import Image from "next/image";
import Link from "next/link";
import island from "@/2d_assets/First Island/Tiled/Tiled_map.png";
import church from "@/2d_assets/Church/Maps/Ruined_temple_exterior.png";
import { PixelSprite } from "@/components/ui/PixelSprite";

export function WorldDestinations() {
  return (
    <section className="world-destinations" aria-label="Explore learning worlds">
      <Link href="/game" className="world-postcard island-postcard">
        <Image src={island} alt="Forests and beaches of the First Island" unoptimized className="world-postcard-art" />
        <div className="world-postcard-copy"><span className="world-number">01 / VARIABLES & VALUES</span><h2>The First Island</h2><p>Meet your teachers. Learn by exploring.</p><span className="world-enter">Enter the island <span aria-hidden="true">↗</span></span></div>
        <PixelSprite character="scout" className="postcard-scout" />
      </Link>
      <Link href="/game/church" className="world-postcard church-postcard">
        <Image src={church} alt="The overgrown grounds of the Ruined Church" unoptimized className="world-postcard-art" />
        <div className="world-postcard-copy"><span className="world-number">02 / CONDITIONS · MAP PREVIEW</span><h2>The Ruined Church</h2><p>A new path through the forgotten sanctuary.</p><span className="world-enter">Explore the grounds <span aria-hidden="true">↗</span></span></div>
      </Link>
    </section>
  );
}
