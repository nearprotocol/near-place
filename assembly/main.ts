import { Chunk, ChunkMap } from "./model";

// --- contract code goes below


export function setPixel(x: i32, y: i32, rgb: string): void {
  let chunk = getChunk(x, y);
  chunk.setPixel(x, y, rgb);
  ChunkMap.map.setChunk(x, y, chunk);
}

export function getChunk(x: i32, y: i32): Chunk {
  return Chunk.get(x, y);
}

export function getMap(): i32[][] {
  return ChunkMap.map.chunks;
}
