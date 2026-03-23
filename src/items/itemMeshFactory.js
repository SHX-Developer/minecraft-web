import * as THREE from "three";
import {
  getAtlasUV,
  getBlockType,
  getFaceTile,
  getTileByName,
  isTorchBlock,
} from "../world/blockTypes.js";
import { getTorchParts } from "./torchParts.js";

function applyFaceUV(geometry, faceIndex, uv) {
  const attr = geometry.getAttribute("uv");
  const base = faceIndex * 4;
  attr.setXY(base + 0, uv.u1, uv.v0);
  attr.setXY(base + 1, uv.u1, uv.v1);
  attr.setXY(base + 2, uv.u0, uv.v1);
  attr.setXY(base + 3, uv.u0, uv.v0);
  attr.needsUpdate = true;
}

function createAtlasMaterial(atlasTexture) {
  return new THREE.MeshLambertMaterial({
    map: atlasTexture,
    transparent: false,
  });
}

function createCubeMesh(blockId, atlasTexture) {
  const geometry = new THREE.BoxGeometry(0.94, 0.94, 0.94);
  applyFaceUV(geometry, 0, getAtlasUV(getFaceTile(blockId, "right")));
  applyFaceUV(geometry, 1, getAtlasUV(getFaceTile(blockId, "left")));
  applyFaceUV(geometry, 2, getAtlasUV(getFaceTile(blockId, "top")));
  applyFaceUV(geometry, 3, getAtlasUV(getFaceTile(blockId, "bottom")));
  applyFaceUV(geometry, 4, getAtlasUV(getFaceTile(blockId, "front")));
  applyFaceUV(geometry, 5, getAtlasUV(getFaceTile(blockId, "back")));

  const mesh = new THREE.Mesh(geometry, createAtlasMaterial(atlasTexture));
  mesh.userData.itemKind = "block";
  return mesh;
}

function createTexturedBox(size, tileName, atlasTexture) {
  const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
  const uv = getAtlasUV(getTileByName(tileName));
  for (let i = 0; i < 6; i += 1) {
    applyFaceUV(geometry, i, uv);
  }
  const material = createAtlasMaterial(atlasTexture);
  if (tileName === "torch_head") {
    material.emissive = new THREE.Color(0xffa94a);
    material.emissiveIntensity = 0.42;
  }
  return new THREE.Mesh(geometry, material);
}

function createTorchMesh(blockId, atlasTexture) {
  const group = new THREE.Group();
  const parts = getTorchParts(blockId);

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    const sx = part.max[0] - part.min[0];
    const sy = part.max[1] - part.min[1];
    const sz = part.max[2] - part.min[2];
    const cx = (part.min[0] + part.max[0]) * 0.5 - 0.5;
    const cy = (part.min[1] + part.max[1]) * 0.5 - 0.5;
    const cz = (part.min[2] + part.max[2]) * 0.5 - 0.5;
    const mesh = createTexturedBox([sx, sy, sz], part.tile, atlasTexture);
    mesh.position.set(cx, cy, cz);
    group.add(mesh);
  }

  group.userData.itemKind = "torch";
  group.position.y = -0.02;
  group.scale.setScalar(1.08);
  return group;
}

function createCrossMesh(blockId, atlasTexture) {
  const group = new THREE.Group();
  const material = new THREE.MeshLambertMaterial({
    map: atlasTexture,
    transparent: true,
    alphaTest: 0.05,
    side: THREE.DoubleSide,
  });
  const geometry = new THREE.PlaneGeometry(0.92, 0.92);
  const uv = getAtlasUV(getFaceTile(blockId, "front"));
  const attr = geometry.getAttribute("uv");
  attr.setXY(0, uv.u1, uv.v0);
  attr.setXY(1, uv.u1, uv.v1);
  attr.setXY(2, uv.u0, uv.v1);
  attr.setXY(3, uv.u0, uv.v0);
  attr.needsUpdate = true;

  const planeA = new THREE.Mesh(geometry, material);
  const planeB = new THREE.Mesh(geometry.clone(), material.clone());
  planeA.rotation.y = Math.PI * 0.25;
  planeB.rotation.y = -Math.PI * 0.25;
  group.add(planeA, planeB);
  group.userData.itemKind = "plant";
  group.position.y = -0.06;
  group.scale.setScalar(1.02);
  return group;
}

export function createItemDisplayMesh(blockId, atlasTexture) {
  if (!atlasTexture || blockId == null) {
    const empty = new THREE.Group();
    empty.userData.itemKind = "empty";
    return empty;
  }
  if (isTorchBlock(blockId)) {
    return createTorchMesh(blockId, atlasTexture);
  }
  if (getBlockType(blockId).shape === "cross") {
    return createCrossMesh(blockId, atlasTexture);
  }
  return createCubeMesh(blockId, atlasTexture);
}
