import * as THREE from "three";
import {
  TORCH_LIGHT_INTENSITY,
  TORCH_LIGHT_RADIUS,
  TORCH_MAX_ACTIVE_LIGHTS,
} from "../utils/constants.js";
import { BLOCK, isTorchBlock } from "../world/blockTypes.js";

function blockKey(x, y, z) {
  return `${x},${y},${z}`;
}

export class TorchLightSystem {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.torchPositions = new Map();
    this.lights = [];
    this.time = 0;

    for (let i = 0; i < TORCH_MAX_ACTIVE_LIGHTS; i += 1) {
      const light = new THREE.PointLight(0xffc977, 0, TORCH_LIGHT_RADIUS, 1.75);
      light.visible = false;
      this.scene.add(light);
      this.lights.push(light);
    }
  }

  onBlockChanged(x, y, z, previousId, nextId) {
    const key = blockKey(x, y, z);
    if (isTorchBlock(previousId)) {
      this.torchPositions.delete(key);
    }
    if (isTorchBlock(nextId)) {
      let lx = 0.5;
      let ly = 0.82;
      let lz = 0.5;
      if (nextId === BLOCK.TORCH_WEST) {
        lx = 0.28;
        ly = 0.86;
      } else if (nextId === BLOCK.TORCH_EAST) {
        lx = 0.72;
        ly = 0.86;
      } else if (nextId === BLOCK.TORCH_NORTH) {
        lz = 0.28;
        ly = 0.86;
      } else if (nextId === BLOCK.TORCH_SOUTH) {
        lz = 0.72;
        ly = 0.86;
      }
      this.torchPositions.set(key, {
        x: x + lx,
        y: y + ly,
        z: z + lz,
      });
    }
  }

  update(delta, playerPosition) {
    this.time += delta;

    for (const [key, torch] of this.torchPositions.entries()) {
      const id = this.world.getBlock(torch.x, torch.y, torch.z);
      if (!isTorchBlock(id)) {
        this.torchPositions.delete(key);
      }
    }

    if (this.torchPositions.size === 0) {
      for (let i = 0; i < this.lights.length; i += 1) {
        this.lights[i].visible = false;
      }
      return;
    }

    const nearest = [];
    for (const torch of this.torchPositions.values()) {
      const dx = torch.x - playerPosition.x;
      const dy = torch.y - playerPosition.y;
      const dz = torch.z - playerPosition.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      nearest.push({ torch, distSq });
    }
    nearest.sort((a, b) => a.distSq - b.distSq);

    const activeCount = Math.min(this.lights.length, nearest.length);
    const flicker = 0.92 + Math.sin(this.time * 19) * 0.06;
    for (let i = 0; i < activeCount; i += 1) {
      const entry = nearest[i];
      const light = this.lights[i];
      light.visible = true;
      light.position.set(entry.torch.x, entry.torch.y, entry.torch.z);
      light.intensity = TORCH_LIGHT_INTENSITY * flicker;
    }
    for (let i = activeCount; i < this.lights.length; i += 1) {
      this.lights[i].visible = false;
    }
  }

  destroy() {
    for (let i = 0; i < this.lights.length; i += 1) {
      this.scene.remove(this.lights[i]);
    }
    this.lights.length = 0;
    this.torchPositions.clear();
  }
}
