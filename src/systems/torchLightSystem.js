import * as THREE from "three";
import {
  TORCH_LIGHT_INTENSITY,
  TORCH_LIGHT_RADIUS,
  TORCH_MAX_ACTIVE_LIGHTS,
} from "../utils/constants.js";
import { BLOCK, isLightSourceBlock, isTorchBlock } from "../world/blockTypes.js";

function blockKey(x, y, z) {
  return `${x},${y},${z}`;
}

export class TorchLightSystem {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.lightSources = new Map();
    this.lights = [];
    this.rebuildTimer = 0;
    this.activeLights = [];

    for (let i = 0; i < TORCH_MAX_ACTIVE_LIGHTS; i += 1) {
      const light = new THREE.PointLight(0xffe5a3, 0, TORCH_LIGHT_RADIUS, 1.1);
      light.visible = false;
      this.scene.add(light);
      this.lights.push(light);
    }
  }

  onBlockChanged(x, y, z, previousId, nextId) {
    const key = blockKey(x, y, z);
    if (isLightSourceBlock(previousId)) {
      this.lightSources.delete(key);
    }
    if (isLightSourceBlock(nextId)) {
      let lx = 0.5;
      let ly = 0.58;
      let lz = 0.5;
      if (isTorchBlock(nextId) && nextId === BLOCK.TORCH_WEST) {
        lx = 0.28;
        ly = 0.86;
      } else if (isTorchBlock(nextId) && nextId === BLOCK.TORCH_EAST) {
        lx = 0.72;
        ly = 0.86;
      } else if (isTorchBlock(nextId) && nextId === BLOCK.TORCH_NORTH) {
        lz = 0.28;
        ly = 0.86;
      } else if (isTorchBlock(nextId) && nextId === BLOCK.TORCH_SOUTH) {
        lz = 0.72;
        ly = 0.86;
      }
      this.lightSources.set(key, {
        x: x + lx,
        y: y + ly,
        z: z + lz,
        id: nextId,
      });
    }
  }

  update(delta, playerPosition) {
    this.rebuildTimer -= delta;

    if (this.rebuildTimer <= 0) {
      this.rebuildTimer = 0.16;

      for (const [key, lightSource] of this.lightSources.entries()) {
        const id = this.world.getBlock(lightSource.x, lightSource.y, lightSource.z);
        if (!isLightSourceBlock(id)) {
          this.lightSources.delete(key);
        }
      }

      if (this.lightSources.size === 0) {
        this.activeLights.length = 0;
      } else {
        const nearest = [];
        for (const lightSource of this.lightSources.values()) {
          const dx = lightSource.x - playerPosition.x;
          const dy = lightSource.y - playerPosition.y;
          const dz = lightSource.z - playerPosition.z;
          const distSq = dx * dx + dy * dy + dz * dz;
          nearest.push({ lightSource, distSq });
        }
        nearest.sort((a, b) => a.distSq - b.distSq);

        const activeCount = Math.min(this.lights.length, nearest.length);
        this.activeLights.length = activeCount;
        for (let i = 0; i < activeCount; i += 1) {
          this.activeLights[i] = nearest[i].lightSource;
        }
      }
    }

    const activeCount = this.activeLights.length;
    for (let i = 0; i < activeCount; i += 1) {
      const lightSource = this.activeLights[i];
      const light = this.lights[i];
      light.visible = true;
      light.position.set(lightSource.x, lightSource.y, lightSource.z);
      if (lightSource.id === BLOCK.GLOW_BLOCK) {
        light.intensity = TORCH_LIGHT_INTENSITY * 1.22;
        light.color.setHex(0xffefba);
      } else {
        light.intensity = TORCH_LIGHT_INTENSITY;
        light.color.setHex(0xffc977);
      }
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
    this.lightSources.clear();
  }
}
