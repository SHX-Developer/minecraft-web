import { CHUNK_SIZE_X, CHUNK_SIZE_Z } from "./constants.js";

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

export function floorDiv(value, divisor) {
  return Math.floor(value / divisor);
}

export function mod(value, divisor) {
  const result = value % divisor;
  return result < 0 ? result + divisor : result;
}

export function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}

export function worldToChunkCoords(worldX, worldZ) {
  const x = Math.floor(worldX);
  const z = Math.floor(worldZ);
  const cx = floorDiv(x, CHUNK_SIZE_X);
  const cz = floorDiv(z, CHUNK_SIZE_Z);
  const lx = mod(x, CHUNK_SIZE_X);
  const lz = mod(z, CHUNK_SIZE_Z);
  return { cx, cz, lx, lz };
}

export function chunkToWorldCoords(cx, cz, lx, lz) {
  return {
    x: cx * CHUNK_SIZE_X + lx,
    z: cz * CHUNK_SIZE_Z + lz,
  };
}
