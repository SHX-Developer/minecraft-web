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

  getTerrainData(worldX, worldZ) {
    const base = (valueNoise2D(worldX, worldZ, 92, this.seed + 11) - 0.5) * 8;
    const hills = (valueNoise2D(worldX, worldZ, 36, this.seed + 47) - 0.5) * 11;

    const mountainMask = clamp((valueNoise2D(worldX, worldZ, 156, this.seed + 83) - 0.56) * 2.75, 0, 1);
    const mountainShape = valueNoise2D(worldX, worldZ, 18, this.seed + 91);
    const mountain = mountainMask * mountainShape * mountainShape * 24;

    const baseTerrain = 16 + base + hills + mountain;

    const lakeMask = valueNoise2D(worldX, worldZ, 118, this.seed + 301);
    const puddleMask = valueNoise2D(worldX, worldZ, 24, this.seed + 397);

    let basinDepth = 0;
    let localWaterLevel = WATER_LEVEL;
    let hasWaterBasin = false;

    if (lakeMask > 0.8) {
      const t = (lakeMask - 0.8) / 0.2;
      basinDepth += 4 + t * 10;
      localWaterLevel = WATER_LEVEL + 1 + t * 2;
      hasWaterBasin = true;
    }

    if (puddleMask > 0.93) {
      const t = (puddleMask - 0.93) / 0.07;
      basinDepth += 1.2 + t * 2.5;
      localWaterLevel = Math.max(localWaterLevel, WATER_LEVEL + t);
      hasWaterBasin = true;
    }

    let rawHeight = baseTerrain - basinDepth;
    const surfaceY = clamp(Math.floor(rawHeight), 2, CHUNK_SIZE_Y - 6);
    localWaterLevel = clamp(Math.floor(localWaterLevel), WATER_LEVEL - 1, WATER_LEVEL + 3);

    const moisture = valueNoise2D(worldX, worldZ, 52, this.seed + 514);
    const temperature = valueNoise2D(worldX, worldZ, 180, this.seed + 637);

    return {
      surfaceY,
      waterLevel: localWaterLevel,
      hasWaterBasin,
      moisture,
      temperature,
    };
  }

  getSurfaceHeight(worldX, worldZ) {
    return this.getTerrainData(worldX, worldZ).surfaceY;
  }

  generateChunk(chunk) {
    for (let lx = 0; lx < CHUNK_SIZE_X; lx += 1) {
      for (let lz = 0; lz < CHUNK_SIZE_Z; lz += 1) {
        const wx = chunk.cx * CHUNK_SIZE_X + lx;
        const wz = chunk.cz * CHUNK_SIZE_Z + lz;
        const terrain = this.getTerrainData(wx, wz);

        this.fillTerrainColumn(
          chunk,
          lx,
          lz,
          wx,
          wz,
          terrain.surfaceY,
          terrain.waterLevel,
          terrain.hasWaterBasin,
          terrain.moisture,
          terrain.temperature
        );

        if (
          this.shouldPlaceTree(
            wx,
            wz,
            terrain.surfaceY,
            terrain.waterLevel,
            terrain.hasWaterBasin,
            terrain.temperature,
            lx,
            lz
          )
        ) {
          this.placeTree(chunk, lx, lz, terrain.surfaceY, wx, wz);
        }
      }
    }
  }

  getSurfaceBlock(surfaceY, waterLevel, hasWaterBasin, moisture, temperature) {
    if (surfaceY >= 31 && temperature < 0.43) {
      return BLOCK.SNOW;
    }
    if (surfaceY <= waterLevel + 1) {
      if (moisture > 0.75) {
        return BLOCK.CLAY;
      }
      if (moisture < 0.35) {
        return BLOCK.GRAVEL;
      }
      return BLOCK.SAND;
    }
    if (hasWaterBasin && surfaceY <= waterLevel + 2) {
      return moisture > 0.6 ? BLOCK.CLAY : BLOCK.SAND;
    }
    return BLOCK.GRASS;
  }

  fillTerrainColumn(chunk, lx, lz, wx, wz, surfaceY, localWaterLevel, hasWaterBasin, moisture, temperature) {
    chunk.set(lx, 0, lz, BLOCK.BEDROCK);

    const topBlock = this.getSurfaceBlock(surfaceY, localWaterLevel, hasWaterBasin, moisture, temperature);
    const midBlock = topBlock === BLOCK.SAND || topBlock === BLOCK.CLAY ? topBlock : BLOCK.DIRT;
    const deepStoneVariant = valueNoise2D(wx, wz, 26, this.seed + 881) > 0.72;
    const deepBlock = deepStoneVariant ? BLOCK.COBBLESTONE : BLOCK.STONE;

    for (let y = 1; y <= surfaceY; y += 1) {
      let blockId = deepBlock;
      if (y === surfaceY) {
        blockId = topBlock;
      } else if (y >= surfaceY - 2) {
        blockId = midBlock;
      }
      chunk.set(lx, y, lz, blockId);
    }

    // Fill water only for low basins; avoids random water layers above normal terrain.
    if (hasWaterBasin && surfaceY < localWaterLevel) {
      for (let y = surfaceY + 1; y <= localWaterLevel; y += 1) {
        if (chunk.get(lx, y, lz) === BLOCK.AIR) {
          chunk.set(lx, y, lz, BLOCK.WATER);
        }
      }
    }
  }

  shouldPlaceTree(wx, wz, surfaceY, localWaterLevel, hasWaterBasin, temperature, lx, lz) {
    if (hasWaterBasin || surfaceY <= localWaterLevel + 2) {
      return false;
    }
    if (surfaceY >= 32 && temperature < 0.45) {
      return false;
    }
    if (lx < 2 || lx > CHUNK_SIZE_X - 3 || lz < 2 || lz > CHUNK_SIZE_Z - 3) {
      return false;
    }
    const chance = hash2D(wx, wz, this.seed + 701);
    return chance > 0.992;
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

