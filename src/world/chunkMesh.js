import * as THREE from "three";
import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from "../utils/constants.js";
import {
  BLOCK,
  getAtlasUV,
  getBlockType,
  getFaceTile,
  isBlockCube,
  isTorchBlock,
} from "./blockTypes.js";

const FACES = [
  {
    name: "right",
    dir: [1, 0, 0],
    normal: [1, 0, 0],
    corners: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 1],
    ],
  },
  {
    name: "left",
    dir: [-1, 0, 0],
    normal: [-1, 0, 0],
    corners: [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
      [0, 0, 0],
    ],
  },
  {
    name: "top",
    dir: [0, 1, 0],
    normal: [0, 1, 0],
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
  },
  {
    name: "bottom",
    dir: [0, -1, 0],
    normal: [0, -1, 0],
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
  },
  {
    name: "front",
    dir: [0, 0, 1],
    normal: [0, 0, 1],
    corners: [
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
      [0, 0, 1],
    ],
  },
  {
    name: "back",
    dir: [0, 0, -1],
    normal: [0, 0, -1],
    corners: [
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
  },
];

function createBuffers() {
  return {
    positions: [],
    normals: [],
    uvs: [],
    indices: [],
    vertexCount: 0,
  };
}

function shouldRenderFace(blockType, blockId, neighborId) {
  if (neighborId === BLOCK.AIR) {
    return true;
  }

  const neighborType = getBlockType(neighborId);
  if (!neighborType.render) {
    return true;
  }

  if (blockId === BLOCK.WATER) {
    if (neighborId === BLOCK.WATER) {
      return false;
    }
    // Water against opaque solids is hidden; all other transitions stay visible.
    return neighborType.transparent || !neighborType.solid;
  }

  if (blockType.transparent) {
    if (neighborId === blockId) {
      return false;
    }
    return neighborType.transparent || !neighborType.solid;
  }
  return neighborType.transparent;
}

function pushFaceWithBounds(buffers, min, max, face, uv) {
  const baseIndex = buffers.vertexCount;

  for (let i = 0; i < 4; i += 1) {
    const corner = face.corners[i];
    const vx = min[0] + (max[0] - min[0]) * corner[0];
    const vy = min[1] + (max[1] - min[1]) * corner[1];
    const vz = min[2] + (max[2] - min[2]) * corner[2];
    buffers.positions.push(vx, vy, vz);
    buffers.normals.push(face.normal[0], face.normal[1], face.normal[2]);
  }

  buffers.uvs.push(
    uv.u1,
    uv.v0,
    uv.u1,
    uv.v1,
    uv.u0,
    uv.v1,
    uv.u0,
    uv.v0
  );

  buffers.indices.push(
    baseIndex,
    baseIndex + 1,
    baseIndex + 2,
    baseIndex,
    baseIndex + 2,
    baseIndex + 3
  );
  buffers.vertexCount += 4;
}

function pushFace(buffers, lx, y, lz, face, uv) {
  const baseIndex = buffers.vertexCount;

  for (let i = 0; i < 4; i += 1) {
    const corner = face.corners[i];
    buffers.positions.push(lx + corner[0], y + corner[1], lz + corner[2]);
    buffers.normals.push(face.normal[0], face.normal[1], face.normal[2]);
  }

  buffers.uvs.push(
    uv.u1,
    uv.v0,
    uv.u1,
    uv.v1,
    uv.u0,
    uv.v1,
    uv.u0,
    uv.v0
  );

  buffers.indices.push(
    baseIndex,
    baseIndex + 1,
    baseIndex + 2,
    baseIndex,
    baseIndex + 2,
    baseIndex + 3
  );
  buffers.vertexCount += 4;
}

function pushTorch(buffers, lx, y, lz, blockId) {
  const tile = getFaceTile(blockId, "top");
  const uv = getAtlasUV(tile);

  let minX = lx + 0.43;
  let maxX = lx + 0.57;
  let minY = y + 0.03;
  let maxY = y + 0.74;
  let minZ = lz + 0.43;
  let maxZ = lz + 0.57;

  if (blockId === BLOCK.TORCH_WEST) {
    minX = lx + 0.12;
    maxX = lx + 0.26;
    minY = y + 0.24;
    maxY = y + 0.92;
  } else if (blockId === BLOCK.TORCH_EAST) {
    minX = lx + 0.74;
    maxX = lx + 0.88;
    minY = y + 0.24;
    maxY = y + 0.92;
  } else if (blockId === BLOCK.TORCH_NORTH) {
    minZ = lz + 0.12;
    maxZ = lz + 0.26;
    minY = y + 0.24;
    maxY = y + 0.92;
  } else if (blockId === BLOCK.TORCH_SOUTH) {
    minZ = lz + 0.74;
    maxZ = lz + 0.88;
    minY = y + 0.24;
    maxY = y + 0.92;
  }

  for (let i = 0; i < FACES.length; i += 1) {
    pushFaceWithBounds(
      buffers,
      [minX, minY, minZ],
      [maxX, maxY, maxZ],
      FACES[i],
      uv
    );
  }

  const flameMinX = (minX + maxX) * 0.5 - 0.09;
  const flameMaxX = (minX + maxX) * 0.5 + 0.09;
  const flameMinY = maxY - 0.03;
  const flameMaxY = maxY + 0.17;
  const flameMinZ = (minZ + maxZ) * 0.5 - 0.09;
  const flameMaxZ = (minZ + maxZ) * 0.5 + 0.09;

  for (let i = 0; i < FACES.length; i += 1) {
    pushFaceWithBounds(
      buffers,
      [flameMinX, flameMinY, flameMinZ],
      [flameMaxX, flameMaxY, flameMaxZ],
      FACES[i],
      uv
    );
  }
}

function toGeometry(buffers) {
  if (buffers.indices.length === 0) {
    return null;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(buffers.positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(buffers.normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(buffers.uvs, 2));
  geometry.setIndex(buffers.indices);
  geometry.computeBoundingSphere();
  return geometry;
}

export function buildChunkMeshes(chunk, world) {
  const opaqueBuffers = createBuffers();
  const transparentBuffers = createBuffers();

  const chunkWorldX = chunk.cx * CHUNK_SIZE_X;
  const chunkWorldZ = chunk.cz * CHUNK_SIZE_Z;

  for (let y = 0; y < CHUNK_SIZE_Y; y += 1) {
    for (let lz = 0; lz < CHUNK_SIZE_Z; lz += 1) {
      for (let lx = 0; lx < CHUNK_SIZE_X; lx += 1) {
        const blockId = chunk.get(lx, y, lz);
        if (blockId === BLOCK.AIR) {
          continue;
        }

        const blockType = getBlockType(blockId);
        if (!blockType.render) {
          continue;
        }

        const buffers = blockType.transparent ? transparentBuffers : opaqueBuffers;

        if (isTorchBlock(blockId) || !isBlockCube(blockId)) {
          pushTorch(opaqueBuffers, lx, y, lz, blockId);
          continue;
        }

        const wx = chunkWorldX + lx;
        const wz = chunkWorldZ + lz;

        for (let i = 0; i < FACES.length; i += 1) {
          const face = FACES[i];
          const neighborId = world.getBlock(wx + face.dir[0], y + face.dir[1], wz + face.dir[2]);
          if (!shouldRenderFace(blockType, blockId, neighborId)) {
            continue;
          }
          const tile = getFaceTile(blockId, face.name);
          const uv = getAtlasUV(tile);
          pushFace(buffers, lx, y, lz, face, uv);
        }
      }
    }
  }

  return {
    opaqueGeometry: toGeometry(opaqueBuffers),
    transparentGeometry: toGeometry(transparentBuffers),
  };
}
