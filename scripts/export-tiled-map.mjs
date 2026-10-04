import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [, , sourceFile, outputFile] = process.argv;

if (!sourceFile || !outputFile) {
  throw new Error("Usage: node scripts/export-tiled-map.mjs <source.tmx> <output.png>");
}

const xml = await fs.readFile(sourceFile, "utf8");
const sourceDirectory = path.dirname(sourceFile);
const mapTag = xml.match(/<map\b([^>]*)>/)?.[1] ?? "";
const tileWidth = Number(mapTag.match(/tilewidth="(\d+)"/)?.[1] ?? 16);
const tileHeight = Number(mapTag.match(/tileheight="(\d+)"/)?.[1] ?? 16);

const tilesets = [];
for (const match of xml.matchAll(/<tileset\b([^>]*)>([\s\S]*?)<\/tileset>/g)) {
  const attributes = match[1];
  const body = match[2];
  const firstGid = Number(attributes.match(/firstgid="(\d+)"/)?.[1]);
  const columns = Number(attributes.match(/columns="(\d+)"/)?.[1]);
  const imageSource = body.match(/<image\b[^>]*source="([^"]+)"/)?.[1];
  if (!firstGid || !columns || !imageSource) continue;

  let imagePath = path.join(sourceDirectory, imageSource);
  try {
    await fs.access(imagePath);
  } catch {
    const fallback = (await fs.readdir(sourceDirectory)).find((file) => file.toLowerCase().endsWith(imageSource.slice(-8).toLowerCase()));
    if (!fallback) throw new Error(`Missing tileset image: ${imageSource}`);
    imagePath = path.join(sourceDirectory, fallback);
  }
  const { data, info } = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  tilesets.push({ firstGid, columns, data, width: info.width });
}
tilesets.sort((a, b) => a.firstGid - b.firstGid);

const chunks = [];
for (const layerMatch of xml.matchAll(/<layer\b[^>]*>([\s\S]*?)<\/layer>/g)) {
  for (const chunkMatch of layerMatch[1].matchAll(/<chunk\b([^>]*)>([\s\S]*?)<\/chunk>/g)) {
    const attributes = chunkMatch[1];
    chunks.push({
      x: Number(attributes.match(/\bx="(-?\d+)"/)?.[1]),
      y: Number(attributes.match(/\by="(-?\d+)"/)?.[1]),
      width: Number(attributes.match(/width="(\d+)"/)?.[1]),
      height: Number(attributes.match(/height="(\d+)"/)?.[1]),
      gids: chunkMatch[2].split(",").map((value) => Number(value.trim())).filter((value) => Number.isFinite(value)),
    });
  }
}

const minTileX = Math.min(...chunks.map((chunk) => chunk.x));
const minTileY = Math.min(...chunks.map((chunk) => chunk.y));
const maxTileX = Math.max(...chunks.map((chunk) => chunk.x + chunk.width));
const maxTileY = Math.max(...chunks.map((chunk) => chunk.y + chunk.height));
const outputWidth = (maxTileX - minTileX) * tileWidth;
const outputHeight = (maxTileY - minTileY) * tileHeight;
const output = Buffer.alloc(outputWidth * outputHeight * 4);

function blendPixel(source, sourceIndex, destinationIndex) {
  const sourceAlpha = source[sourceIndex + 3] / 255;
  if (sourceAlpha === 0) return;
  const destinationAlpha = output[destinationIndex + 3] / 255;
  const alpha = sourceAlpha + destinationAlpha * (1 - sourceAlpha);
  for (let channel = 0; channel < 3; channel += 1) {
    output[destinationIndex + channel] = Math.round((source[sourceIndex + channel] * sourceAlpha + output[destinationIndex + channel] * destinationAlpha * (1 - sourceAlpha)) / alpha);
  }
  output[destinationIndex + 3] = Math.round(alpha * 255);
}

for (const chunk of chunks) {
  chunk.gids.forEach((encodedGid, index) => {
    const unsignedGid = encodedGid >>> 0;
    const gid = unsignedGid & 0x1fffffff;
    if (!gid) return;

    const tileset = [...tilesets].reverse().find((candidate) => gid >= candidate.firstGid);
    if (!tileset) return;
    const localId = gid - tileset.firstGid;
    const tileSourceX = (localId % tileset.columns) * tileWidth;
    const tileSourceY = Math.floor(localId / tileset.columns) * tileHeight;
    const tileX = chunk.x + (index % chunk.width) - minTileX;
    const tileY = chunk.y + Math.floor(index / chunk.width) - minTileY;
    const flipHorizontal = Boolean(unsignedGid & 0x80000000);
    const flipVertical = Boolean(unsignedGid & 0x40000000);
    const flipDiagonal = Boolean(unsignedGid & 0x20000000);

    for (let y = 0; y < tileHeight; y += 1) {
      for (let x = 0; x < tileWidth; x += 1) {
        let sourceX = x;
        let sourceY = y;
        if (flipDiagonal) [sourceX, sourceY] = [sourceY, sourceX];
        if (flipHorizontal) sourceX = tileWidth - 1 - sourceX;
        if (flipVertical) sourceY = tileHeight - 1 - sourceY;
        const sourceIndex = ((tileSourceY + sourceY) * tileset.width + tileSourceX + sourceX) * 4;
        const destinationIndex = (((tileY * tileHeight + y) * outputWidth) + tileX * tileWidth + x) * 4;
        blendPixel(tileset.data, sourceIndex, destinationIndex);
      }
    }
  });
}

await fs.mkdir(path.dirname(outputFile), { recursive: true });
await sharp(output, { raw: { width: outputWidth, height: outputHeight, channels: 4 } }).png().toFile(outputFile);
console.log(`Exported ${outputWidth}x${outputHeight} map to ${outputFile}`);
