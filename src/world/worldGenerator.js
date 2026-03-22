import {
  CHUNK_SIZE_X,
  CHUNK_SIZE_Y,
  CHUNK_SIZE_Z,
  WATER_LEVEL,
  WORLD_SEED,
} from "../utils/constants.js";
import { clamp, lerp, smoothstep } from "../utils/helpers.js";
import { BLOCK } from "./blockTypes.js";

function hash2D(x, z, seed) {
  const ax = Math.imul(x, 374761393);
  const az = Math.imul(z, 668265263);
  const as = Math.imul(seed, 1274126177);
  let h = ax ^ az ^ as;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function valueNoise2D(x, z, scale, seed) {
  const fx = x / scale;
  const fz = z / scale;

  const x0 = Math.floor(fx);
  const z0 = Math.floor(fz);
  const tx = smoothstep(fx - x0);
  const tz = smoothstep(fz - z0);

  const n00 = hash2D(x0, z0, seed);
  const n10 = hash2D(x0 + 1, z0, seed);
  const n01 = hash2D(x0, z0 + 1, seed);
  const n11 = hash2D(x0 + 1, z0 + 1, seed);

  const nx0 = lerp(n00, n10, tx);
  const nx1 = lerp(n01, n11, tx);
  return lerp(nx0, nx1, tz);
}

export class WorldGenerator {
  constructor(seed = WORLD_SEED) {
    this.seed = seed;
  }

  getSurfaceHeight(worldX, worldZ) {
    const broad = (valueNoise2D(worldX, worldZ, 64, this.seed + 11) - 0.5) * 10;
    const medium = (valueNoise2D(worldX, worldZ, 28, this.seed + 47) - 0.5) * 6;
    const detail = (valueNoise2D(worldX, worldZ, 12, this.seed + 91) - 0.5) * 3;
    const rawHeight = 14 + broad + medium + detail;
    return clamp(Math.floor(rawHeight), 2, CHUNK_SIZE_Y - 6);
  }

  generateChunk(chunk) {
    for (let lx = 0; lx < CHUNK_SIZE_X; lx += 1) {
      for (let lz = 0; lz < CHUNK_SIZE_Z; lz += 1) {
        const wx = chunk.cx * CHUNK_SIZE_X + lx;
        const wz = chunk.cz * CHUNK_SIZE_Z + lz;
        const surfaceY = this.getSurfaceHeight(wx, wz);

        this.fillTerrainColumn(chunk, lx, lz, surfaceY);

        if (this.shouldPlaceTree(wx, wz, surfaceY, lx, lz)) {
          this.placeTree(chunk, lx, lz, surfaceY, wx, wz);
        }
      }
    }
  }

  fillTerrainColumn(chunk, lx, lz, surfaceY) {
    chunk.set(lx, 0, lz, BLOCK.BEDROCK);

    for (let y = 1; y <= surfaceY; y += 1) {
      let blockId = BLOCK.STONE;
      if (y === surfaceY) {
        blockId = surfaceY <= WATER_LEVEL + 1 ? BLOCK.SAND : BLOCK.GRASS;
      } else if (y >= surfaceY - 2) {
        blockId = BLOCK.DIRT;
      }
      chunk.set(lx, y, lz, blockId);
    }

    if (surfaceY < WATER_LEVEL) {
      for (let y = surfaceY + 1; y <= WATER_LEVEL; y += 1) {
        chunk.set(lx, y, lz, BLOCK.WATER);
      }
    }
  }

  shouldPlaceTree(wx, wz, surfaceY, lx, lz) {
    if (surfaceY <= WATER_LEVEL + 1) {
      return false;
    }
    if (lx < 2 || lx > CHUNK_SIZE_X - 3 || lz < 2 || lz > CHUNK_SIZE_Z - 3) {
      return false;
    }
    const chance = hash2D(wx, wz, this.seed + 701);
    return chance > 0.99;
  }

  placeTree(chunk, lx, lz, surfaceY, wx, wz) {
    const trunkHeight = hash2D(wx, wz, this.seed + 991) > 0.5 ? 5 : 4;
    if (surfaceY + trunkHeight + 4 >= CHUNK_SIZE_Y) {
      return;
    }

    for (let i = 1; i <= trunkHeight; i += 1) {
      chunk.set(lx, surfaceY + i, lz, BLOCK.LOG);
    }

    const leavesStartY = surfaceY + trunkHeight - 1;
    for (let oy = 0; oy <= 3; oy += 1) {
      const y = leavesStartY + oy;
      const radius = oy === 3 ? 1 : 2;
      for (let ox = -radius; ox <= radius; ox += 1) {
        for (let oz = -radius; oz <= radius; oz += 1) {
          const distance = Math.abs(ox) + Math.abs(oz);
          if (distance > radius + 1) {
            continue;
          }
          this.setIfReplaceable(chunk, lx + ox, y, lz + oz, BLOCK.LEAVES);
        }
      }
    }

    this.setIfReplaceable(chunk, lx, leavesStartY + 4, lz, BLOCK.LEAVES);
  }

  setIfReplaceable(chunk, lx, y, lz, id) {
    if (
      lx < 0 ||
      lx >= CHUNK_SIZE_X ||
      y < 0 ||
      y >= CHUNK_SIZE_Y ||
      lz < 0 ||
      lz >= CHUNK_SIZE_Z
    ) {
      return;
    }
    const current = chunk.get(lx, y, lz);
    if (current === BLOCK.AIR || current === BLOCK.WATER) {
      chunk.set(lx, y, lz, id);
    }
  }
}
