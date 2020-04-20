// TODO: Figure out how to avoid duplicate identifier in model.near

import { storage } from "near-sdk-as";


const CHUNK_SIZE = 16;
const CHUNK_COUNT = 5;
const START_COLOR = "FFFFFF";

@nearBindgen
export class Chunk {
  nonce: i32;
  rgb: string[][];

  constructor() {
    this.rgb = new Array<Array<string>>(CHUNK_SIZE);
    for (let i = 0; i < CHUNK_SIZE; i++) {
      this.rgb[i] = new Array<string>(CHUNK_SIZE);
      for (let j = 0; j < CHUNK_SIZE; j++) {
        this.rgb[i][j] = START_COLOR;
      }
    }
  }

  static key(x: i32, y: i32): string {
    checkBounds(x, y);
    let cx = x / CHUNK_SIZE;
    let cy = y / CHUNK_SIZE;
    return 'chunk:' + cx.toString() + ':' + cy.toString();
  }

  setPixel(x: i32, y: i32, rgb: string): void {
    checkBounds(x, y);
    let ox = x % CHUNK_SIZE;
    let oy = y % CHUNK_SIZE;
    this.nonce++;
    this.rgb[ox][oy] = rgb;
    this.set(x, y);
  }

  set(x: i32, y: i32): void {
    storage.set(Chunk.key(x, y), this);
  }

  static get(x: i32, y: i32): Chunk {
    let chunk =  storage.get<Chunk>(Chunk.key(x, y));
    if (chunk == null) {
      return new Chunk();
    }
    return chunk;
  }
}

let _map: ChunkMap | null = null;

@nearBindgen
export class ChunkMap {
  chunks: i32[][];

  constructor() {
    this.chunks = new Array<Array<i32>>();
    for (let i = 0; i < CHUNK_COUNT; i++) {
      this.chunks[i] = new Array<i32>(CHUNK_COUNT);
      for (let j = 0; j < CHUNK_COUNT; j++) {
        this.chunks[i][j] = 0;
      }
    }
  }

  setChunk(x: i32, y: i32, chunk: Chunk): void {
    checkBounds(x, y);
    let cx = x / CHUNK_SIZE;
    let cy = y / CHUNK_SIZE;
    this.chunks[cx][cy] = chunk.nonce;
    ChunkMap.map = this;
  }


  static get map(): ChunkMap {
    if (_map == null) {
      let res = storage.get<ChunkMap>(nameof<ChunkMap>());
      if (res != null) {
        _map = res;
      } else {
        _map = new ChunkMap();
      }
    }
    return <ChunkMap>_map;
  }

  static set map(map: ChunkMap) {
    _map = map;
    storage.set(nameof<ChunkMap>(), _map);
  }
}

function checkBounds(x: i32, y: i32): void {
  assert(x < CHUNK_COUNT * CHUNK_SIZE && x >= 0, 'x out of bounds');
  assert(y < CHUNK_COUNT * CHUNK_SIZE && y >= 0, 'y out of bounds');
}