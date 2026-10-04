import exterior from "@/lib/game/church-exterior-map.json";
import interior from "@/lib/game/church-interior-map.json";

type TileMap = { width: number; height: number; minX: number; minY: number; layers: { tiles: number[][] }[] };

// Tile exports contain unused editor space. Crop the camera, not world coordinates,
// so the artwork, NPCs, player, and interactions share one undistorted plane.
function viewport(map: TileMap) {
  const points = map.layers.flatMap((layer) => layer.tiles);
  const left = Math.min(...points.map(([x]) => x)) - map.minX;
  const top = Math.min(...points.map(([, y]) => y)) - map.minY;
  const width = Math.max(...points.map(([x]) => x)) - map.minX - left + 1;
  const height = Math.max(...points.map(([, y]) => y)) - map.minY - top + 1;
  return {
    ratio: width / height,
    plane: { width: `${map.width / width * 100}%`, height: `${map.height / height * 100}%`, left: `${-left / width * 100}%`, top: `${-top / height * 100}%` },
    bounds: { left: left / map.width * 100 + 2, right: (left + width) / map.width * 100 - 2, top: top / map.height * 100 + 2, bottom: (top + height) / map.height * 100 - 2 },
  };
}

export const chapelViewports = { exterior: viewport(exterior), interior: viewport(interior) };
