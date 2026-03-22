import * as THREE from "three";
import {
  CHUNK_SIZE_X,
  CHUNK_SIZE_Y,
  CHUNK_SIZE_Z,
  WATER_LEVEL,
  WORLD_RENDER_RADIUS,
  WORLD_UNLOAD_RADIUS,
} from "../utils/constants.js";
import { chunkKey, worldToChunkCoords } from "../utils/helpers.js";
import { BLOCK, isBlockReplaceable } from "./blockTypes.js";
import { Chunk } from "./chunk.js";
import { buildChunkMeshes } from "./chunkMesh.js";
import { WorldGenerator } from "./worldGenerator.js";

export class World {
  constructor(scene, atlasTexture) {
    this.scene = scene;
    this.generator = new WorldGenerator();
    this.chunks = new Map();
    this.lastCenterChunkKey = null;

    this.opaqueMaterial = new THREE.MeshLambertMaterial({
      map: atlasTexture,
    });
    this.transparentMaterial = new THREE.MeshLambertMaterial({
      map: atlasTexture,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  update(playerPosition) {
    const center = worldToChunkCoords(playerPosition.x, playerPosition.z);
    const centerKey = chunkKey(center.cx, center.cz);
    if (centerKey === this.lastCenterChunkKey) {
      return;
    }
    this.lastCenterChunkKey = centerKey;

    for (let dz = -WORLD_RENDER_RADIUS; dz <= WORLD_RENDER_RADIUS; dz += 1) {
      for (let dx = -WORLD_RENDER_RADIUS; dx <= WORLD_RENDER_RADIUS; dx += 1) {
        this.ensureChunk(center.cx + dx, center.cz + dz);
      }
    }

    this.unloadFarChunks(center.cx, center.cz);
  }

  ensureChunk(cx, cz) {
    const key = chunkKey(cx, cz);
    const existing = this.chunks.get(key);
    if (existing) {
      return existing;
    }

    const chunk = new Chunk(cx, cz);
    this.generator.generateChunk(chunk);

    const group = new THREE.Group();
    group.position.set(cx * CHUNK_SIZE_X, 0, cz * CHUNK_SIZE_Z);
    this.scene.add(group);

    const entry = {
      cx,
      cz,
      chunk,
      group,
      opaqueMesh: null,
      transparentMesh: null,
    };
    this.chunks.set(key, entry);
    this.rebuildChunk(cx, cz);

    // Rebuild neighbors so shared borders can cull now-hidden faces.
    this.rebuildChunk(cx - 1, cz);
    this.rebuildChunk(cx + 1, cz);
    this.rebuildChunk(cx, cz - 1);
    this.rebuildChunk(cx, cz + 1);
    return entry;
  }

  getChunkEntry(cx, cz) {
    return this.chunks.get(chunkKey(cx, cz)) || null;
  }

  getBlock(worldX, y, worldZ) {
    if (y < 0 || y >= CHUNK_SIZE_Y) {
      return BLOCK.AIR;
    }
    const { cx, cz, lx, lz } = worldToChunkCoords(worldX, worldZ);
    const entry = this.getChunkEntry(cx, cz);
    if (!entry) {
      return BLOCK.AIR;
    }
    return entry.chunk.get(lx, y, lz);
  }

  setBlock(worldX, y, worldZ, id) {
    if (y < 0 || y >= CHUNK_SIZE_Y) {
      return false;
    }

    const { cx, cz, lx, lz } = worldToChunkCoords(worldX, worldZ);
    let entry = this.getChunkEntry(cx, cz);

    if (!entry && id !== BLOCK.AIR) {
      entry = this.ensureChunk(cx, cz);
    }
    if (!entry) {
      return false;
    }

    const current = entry.chunk.get(lx, y, lz);
    if (current === id) {
      return false;
    }

    entry.chunk.set(lx, y, lz, id);
    this.rebuildChunk(cx, cz);
    this.rebuildChunkBorders(cx, cz, lx, lz);
    return true;
  }

  isReplaceable(worldX, y, worldZ) {
    return isBlockReplaceable(this.getBlock(worldX, y, worldZ));
  }

  rebuildChunkBorders(cx, cz, lx, lz) {
    if (lx === 0) {
      this.rebuildChunk(cx - 1, cz);
    } else if (lx === CHUNK_SIZE_X - 1) {
      this.rebuildChunk(cx + 1, cz);
    }

    if (lz === 0) {
      this.rebuildChunk(cx, cz - 1);
    } else if (lz === CHUNK_SIZE_Z - 1) {
      this.rebuildChunk(cx, cz + 1);
    }
  }

  rebuildChunk(cx, cz) {
    const entry = this.getChunkEntry(cx, cz);
    if (!entry) {
      return;
    }

    if (entry.opaqueMesh) {
      entry.group.remove(entry.opaqueMesh);
      entry.opaqueMesh.geometry.dispose();
      entry.opaqueMesh = null;
    }
    if (entry.transparentMesh) {
      entry.group.remove(entry.transparentMesh);
      entry.transparentMesh.geometry.dispose();
      entry.transparentMesh = null;
    }

    const meshes = buildChunkMeshes(entry.chunk, this);
    if (meshes.opaqueGeometry) {
      const opaqueMesh = new THREE.Mesh(meshes.opaqueGeometry, this.opaqueMaterial);
      opaqueMesh.frustumCulled = true;
      entry.group.add(opaqueMesh);
      entry.opaqueMesh = opaqueMesh;
    }

    if (meshes.transparentGeometry) {
      const transparentMesh = new THREE.Mesh(meshes.transparentGeometry, this.transparentMaterial);
      transparentMesh.frustumCulled = true;
      transparentMesh.renderOrder = 2;
      entry.group.add(transparentMesh);
      entry.transparentMesh = transparentMesh;
    }
  }

  unloadFarChunks(centerCx, centerCz) {
    for (const [key, entry] of this.chunks.entries()) {
      const outOfRangeX = Math.abs(entry.cx - centerCx) > WORLD_UNLOAD_RADIUS;
      const outOfRangeZ = Math.abs(entry.cz - centerCz) > WORLD_UNLOAD_RADIUS;
      if (!outOfRangeX && !outOfRangeZ) {
        continue;
      }
      this.disposeChunkEntry(entry);
      this.chunks.delete(key);
    }
  }

  disposeChunkEntry(entry) {
    if (entry.opaqueMesh) {
      entry.opaqueMesh.geometry.dispose();
    }
    if (entry.transparentMesh) {
      entry.transparentMesh.geometry.dispose();
    }
    this.scene.remove(entry.group);
  }

  getSpawnPoint() {
    const worldX = 8;
    const worldZ = 8;
    const groundY = this.generator.getSurfaceHeight(worldX, worldZ);
    const spawnY = Math.max(groundY + 4, WATER_LEVEL + 4);
    return new THREE.Vector3(worldX + 0.5, spawnY, worldZ + 0.5);
  }

  getCurrentChunkCoords(worldX, worldZ) {
    const { cx, cz } = worldToChunkCoords(worldX, worldZ);
    return { cx, cz };
  }

  getActiveChunkCount() {
    return this.chunks.size;
  }
}
