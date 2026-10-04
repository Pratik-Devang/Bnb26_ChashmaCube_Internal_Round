import type { CSSProperties } from "react";
import explorer from "@/2d_assets/First Island/Characters/Character_1/Idle.png";
import scout from "@/2d_assets/First Island/Characters/Character_8/Idle.png";
import fox from "@/2d_assets/First Island/Characters/Character_6/Idle.png";

const sprites = { explorer, scout, fox };

export function PixelSprite({ character = "explorer", className = "" }: { character?: keyof typeof sprites; className?: string }) {
  const sheet = sprites[character];
  const frames = sheet.width / sheet.height;
  return <span aria-hidden="true" className={`pixel-character ${className}`} style={{ backgroundImage: `url(${sheet.src})`, "--frames": frames, "--sheet-end": `${-64 * frames}px`, animationTimingFunction: `steps(${frames})` } as CSSProperties} />;
}
