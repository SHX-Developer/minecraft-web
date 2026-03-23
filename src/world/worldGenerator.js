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

function hash3D(x, y, z, seed) {
  const ax = Math.imul(x, 374761393);
  const ay = Math.imul(y, 668265263);
  const az = Math.imul(z, 2147483647);
  const as = Math.imul(seed, 1274126177);
  let h = ax ^ ay ^ az ^ as;
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

  getBaseTerrainHeight(worldX, worldZ) {
    const base = (valueNoise2D(worldX, worldZ, 92, this.seed + 11) - 0.5) * 7;
    const hills = (valueNoise2D(worldX, worldZ, 34, this.seed + 47) - 0.5) * 13;

    const mountainMask = clamp((valueNoise2D(worldX, worldZ, 148, this.seed + 83) - 0.42) * 3.1, 0, 1);
    const mountainShapeA = valueNoise2D(worldX, worldZ, 24, this.seed + 91);
    const mountainShapeB = valueNoise2D(worldX, worldZ, 12, this.seed + 113);
    const mountainShape = mountainShapeA * 0.62 + mountainShapeB * 0.38;
    const mountain = mountainMask * mountainShape * mountainShape * 42;
    const mountainPlateau = mountainMask * (valueNoise2D(worldX, worldZ, 46, this.seed + 137) - 0.5) * 6;

    return 16 + base + hills + mountain + mountainPlateau;
  }

  getTerrainData(worldX, worldZ) {
    const baseTerrain = this.getBaseTerrainHeight(worldX, worldZ);

    const lakeMacro = valueNoise2D(worldX, worldZ, 86, this.seed + 301);
    const lakeDetail = valueNoise2D(worldX, worldZ, 24, this.seed + 347);
    const puddleMacro = valueNoise2D(worldX, worldZ, 20, this.seed + 397);
    const puddleDetail = valueNoise2D(worldX, worldZ, 9, this.seed + 433);

    const lakeMask = lakeMacro * 0.72 + lakeDetail * 0.28;
    const puddleMask = puddleMacro * 0.66 + puddleDetail * 0.34;
    const lakeStrength = clamp((lakeMask - 0.54) / 0.46, 0, 1);
    const puddleStrength = clamp((puddleMask - 0.7) / 0.3, 0, 1) * (1 - lakeStrength * 0.68);

    let basinDepth = 0;
    if (lakeStrength > 0) {
      basinDepth += 2.6 + lakeStrength * 7.6;
    }
    if (puddleStrength > 0) {
      basinDepth += 0.7 + puddleStrength * 2.1;
    }

    const rawHeight = baseTerrain - basinDepth;
    const surfaceY = clamp(Math.floor(rawHeight), 2, CHUNK_SIZE_Y - 6);
    // Clamp water under estimated local rim so lake surface never pops above surrounding terrain.
    const rimNeighborMin = Math.min(
      baseTerrain,
      this.getBaseTerrainHeight(worldX + 1, worldZ),
      this.getBaseTerrainHeight(worldX - 1, worldZ),
      this.getBaseTerrainHeight(worldX, worldZ + 1),
      this.getBaseTerrainHeight(worldX, worldZ - 1)
    );
    const basinRimLevel = Math.floor(rimNeighborMin) - 1;
    const localWaterLevel = clamp(Math.min(WATER_LEVEL - 1, basinRimLevel), 1, CHUNK_SIZE_Y - 2);
    const hasWaterBasin = basinDepth > 0.85 && surfaceY + 1 <= localWaterLevel;

    const moisture = valueNoise2D(worldX, worldZ, 52, this.seed + 514);
    const temperature = valueNoise2D(worldX, worldZ, 180, this.seed + 637);

    return {
      surfaceY,
      waterLevel: localWaterLevel,
      hasWaterBasin,
      basinDepth,
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
          terrain.basinDepth,
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

  fillTerrainColumn(
    chunk,
    lx,
    lz,
    wx,
    wz,
    surfaceY,
    localWaterLevel,
    hasWaterBasin,
    basinDepth,
    moisture,
    temperature
  ) {
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
      } else {
        blockId = this.getUndergroundBlock(wx, y, wz, deepBlock);
      }
      chunk.set(lx, y, lz, blockId);
    }

    // Fill only carved basins. This prevents floating water shelves above nearby ground.
    const shouldFillWater = hasWaterBasin && basinDepth > 0.85 && surfaceY < localWaterLevel;

    if (shouldFillWater) {
      const fillTo = localWaterLevel;
      for (let y = surfaceY + 1; y <= fillTo; y += 1) {
        if (chunk.get(lx, y, lz) === BLOCK.AIR) {
          chunk.set(lx, y, lz, BLOCK.WATER);
        }
      }
    }
  }

  getUndergroundBlock(wx, y, wz, fallbackBlock) {
    if (y <= 2) {
      return fallbackBlock;
    }
    const oreRoll = hash3D(wx, y, wz, this.seed + 1201);
    if (y <= 13 && oreRoll > 0.992) {
      return BLOCK.DIAMOND_ORE;
    }
    if (y <= 17 && oreRoll > 0.989) {
      return BLOCK.GOLD_ORE;
    }
    if (y <= 24 && oreRoll > 0.984) {
      return BLOCK.IRON_ORE;
    }
    if (y <= 34 && oreRoll > 0.976) {
      return BLOCK.COAL_ORE;
    }
    return fallbackBlock;
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
