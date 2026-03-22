import * as THREE from "three";
import { BLOCK, getHotbarColor, isTorchBlock } from "../world/blockTypes.js";

function shade(hex, amount) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amount);
  return c;
}

function createCubeMesh(colorHex) {
  const base = new THREE.Color(colorHex);
  const materials = [
    new THREE.MeshLambertMaterial({ color: shade(base, -0.07) }),
    new THREE.MeshLambertMaterial({ color: shade(base, 0.04) }),
    new THREE.MeshLambertMaterial({ color: shade(base, 0.12) }),
    new THREE.MeshLambertMaterial({ color: shade(base, -0.12) }),
    new THREE.MeshLambertMaterial({ color: shade(base, 0.03) }),
    new THREE.MeshLambertMaterial({ color: shade(base, -0.05) }),
  ];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.95), materials);
  mesh.position.y = 0.05;
  return mesh;
}

function createTorchMesh() {
  const group = new THREE.Group();

  const stick = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.62, 0.16),
    new THREE.MeshLambertMaterial({ color: 0x7e613f })
  );
  stick.position.y = -0.02;

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.2, 0.26),
    new THREE.MeshLambertMaterial({ color: 0xe3b04b })
  );
  head.position.y = 0.34;

  const flame = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.12),
    new THREE.MeshBasicMaterial({ color: 0xffe999 })
  );
  flame.position.y = 0.49;

  group.add(stick, head, flame);
  group.position.y = -0.08;
  return group;
}

export function createItemDisplayMesh(blockId) {
  if (isTorchBlock(blockId) || blockId === BLOCK.TORCH) {
    return createTorchMesh();
  }
  return createCubeMesh(getHotbarColor(blockId));
}

