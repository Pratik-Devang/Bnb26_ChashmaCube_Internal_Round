"use client";

import { useEffect, useRef } from "react";
import map from "@/lib/game/church-exterior-map.json";
import tiles from "@/2d_assets/Church/PNG/Tiles_exterior.png";
import cracks from "@/2d_assets/Church/PNG/Decorative_cracks_exterior.png";
import spots from "@/2d_assets/Church/PNG/Spots.png";
import objects from "@/2d_assets/Church/PNG/Exterior_objects.png";
import coasts from "@/2d_assets/Church/PNG/Water_coasts.png";
import water from "@/2d_assets/Church/PNG/water_detilazation_v2.png";
import trees from "@/2d_assets/Church/PNG/Trees_grass_alternative_fit.png";
import explorerWriting from "@/2d_assets/Church/PNG/Discoverer1_writing.png";
import explorerIdle from "@/2d_assets/Church/PNG/Discoverer2_Idle.png";

const sheets: Record<string, string> = {
  "Tiles_exterior.png": tiles.src,
  "Decorative_cracks_exterior.png": cracks.src,
  "Spots.png": spots.src,
  "Exterior_objects.png": objects.src,
  "Water_coasts.png": coasts.src,
  "water_detilazation_v2.png": water.src,
  "Trees_grass_alternative_fit.png": trees.src,
  "Discoverer1_writing.png": explorerWriting.src,
  "Discoverer2_Idle.png": explorerIdle.src,
};

type Props = { className?: string };

export function ChurchExteriorCanvas({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    canvas.width = map.width * map.tileWidth;
    canvas.height = map.height * map.tileHeight;
    context.imageSmoothingEnabled = false;

    const images = new Map<string, HTMLImageElement>();
    let disposed = false;
    const paint = () => {
      if (disposed) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#6a9272";
      context.fillRect(0, 0, canvas.width, canvas.height);

      for (const layer of map.layers) {
        for (const [mapX, mapY, rawGid] of layer.tiles) {
          const encodedGid = Number(rawGid);
          const gid = encodedGid & 0x1fffffff;
          const tileset = [...map.tilesets].reverse().find((item) => gid >= item.firstGid);
          if (!tileset) continue;
          const image = images.get(tileset.image);
          if (!image?.complete || !image.naturalWidth) continue;

          const localId = gid - tileset.firstGid;
          const sourceX = (localId % tileset.columns) * map.tileWidth;
          const sourceY = Math.floor(localId / tileset.columns) * map.tileHeight;
          const destX = (mapX - map.minX) * map.tileWidth;
          const destY = (mapY - map.minY) * map.tileHeight;
          const flipH = (encodedGid & 0x80000000) !== 0;
          const flipV = (encodedGid & 0x40000000) !== 0;
          const flipD = (encodedGid & 0x20000000) !== 0;

          context.save();
          context.translate(destX + map.tileWidth / 2, destY + map.tileHeight / 2);
          if (flipD) {
            context.rotate(Math.PI / 2);
            context.scale(flipH ? -1 : 1, flipV ? -1 : 1);
          } else {
            context.scale(flipH ? -1 : 1, flipV ? -1 : 1);
          }
          context.drawImage(image, sourceX, sourceY, map.tileWidth, map.tileHeight,
            -map.tileWidth / 2, -map.tileHeight / 2, map.tileWidth, map.tileHeight);
          context.restore();
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

  return <canvas ref={canvasRef} className={className} role="img" aria-label="The ruined temple exterior, rendered from its original tile map" />;
}
