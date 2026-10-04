"use client";

import { useEffect, useRef } from "react";
import map from "@/lib/game/church-interior-map.json";
import wallsFloor from "@/2d_assets/Church/PNG/Walls_floor.png";
import interiorCracks from "@/2d_assets/Church/PNG/Decorative_cracks_interior.png";
import spikes from "@/2d_assets/Church/PNG/Spikes.png";
import fire from "@/2d_assets/Church/PNG/Fire_animation.png";
import blades from "@/2d_assets/Church/PNG/blades_trap.png";
import cultist4 from "@/2d_assets/Church/PNG/Cultist4_Pray.png";
import cultist3 from "@/2d_assets/Church/PNG/Cultist3_Pray.png";
import cultist2 from "@/2d_assets/Church/PNG/Cultist2_Pray.png";
import cultist1 from "@/2d_assets/Church/PNG/Cultist1_Pray.png";
import cultist6 from "@/2d_assets/Church/PNG/Cultist6_Pray.png";
import cultist5 from "@/2d_assets/Church/PNG/Cultist5_Pray.png";
import objects from "@/2d_assets/Church/PNG/Objects_interior.png";
import ghost from "@/2d_assets/Church/PNG/Ghost.png";
import chest from "@/2d_assets/Church/PNG/-íhest.png";
import lever from "@/2d_assets/Church/PNG/Lever.png";
import leaderSummon from "@/2d_assets/Church/PNG/Leader_summon.png";

const sheets: Record<string, string> = {
  "Walls_floor.png": wallsFloor.src,
  "Decorative_cracks_interior.png": interiorCracks.src,
  "Spikes.png": spikes.src,
  "Fire_animation.png": fire.src,
  "blades_trap.png": blades.src,
  "Cultist4_Pray.png": cultist4.src,
  "Cultist3_Pray.png": cultist3.src,
  "Cultist2_Pray.png": cultist2.src,
  "Cultist1_Pray.png": cultist1.src,
  "Cultist6_Pray.png": cultist6.src,
  "Cultist5_Pray.png": cultist5.src,
  "Objects_interior.png": objects.src,
  "Ghost.png": ghost.src,
  "chest.png": chest.src,
  "Lever.png": lever.src,
  "Leader_summon.png": leaderSummon.src,
};

type ChurchMapCanvasProps = { className?: string };

export function ChurchMapCanvas({ className }: ChurchMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    canvas.width = map.width * map.tileWidth;
    canvas.height = map.height * map.tileHeight;
    context.imageSmoothingEnabled = false;
    context.fillStyle = "#171913";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const images = new Map<string, HTMLImageElement>();
    let disposed = false;
    const paint = () => {
      if (disposed) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#171913";
      context.fillRect(0, 0, canvas.width, canvas.height);

      for (const layer of map.layers) {
        for (const [mapX, mapY, gid] of layer.tiles) {
          const tileset = [...map.tilesets].reverse().find((item) => gid >= item.firstGid);
          if (!tileset) continue;
          const image = images.get(tileset.image);
          if (!image?.complete || !image.naturalWidth) continue;
          const localId = gid - tileset.firstGid;
          const sourceX = (localId % tileset.columns) * map.tileWidth;
          const sourceY = Math.floor(localId / tileset.columns) * map.tileHeight;
          const destX = (mapX - map.minX) * map.tileWidth;
          const destY = (mapY - map.minY) * map.tileHeight;
          context.drawImage(image, sourceX, sourceY, map.tileWidth, map.tileHeight, destX, destY, map.tileWidth, map.tileHeight);
        }
      }

    };

    for (const [name, src] of Object.entries(sheets)) {
      const image = new Image();
      images.set(name, image);
      image.onload = paint;
      image.src = src;
    }
    paint();

    return () => {
      disposed = true;
      for (const image of images.values()) image.onload = null;
    };
  }, []);

  return <canvas ref={canvasRef} className={className} role="img" aria-label="The ruined church interior, rendered from its original tile map" />;
}
