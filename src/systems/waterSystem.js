import * as THREE from "three";
import { BLOCK } from "../world/blockTypes.js";

const UNDERWATER_TINT = new THREE.Color(0x2f5f9f);

export class WaterSystem {
  constructor({ scene, world, playerController, overlayElement, dayNightCycle }) {
    this.scene = scene;
    this.world = world;
    this.playerController = playerController;
    this.overlayElement = overlayElement;
    this.dayNightCycle = dayNightCycle;

    this.isUnderwater = false;
    this.overlayOpacity = 0;
    this.cameraPos = new THREE.Vector3();
    this.fogColor = new THREE.Color();
  }

  update(delta) {
    const cameraPos = this.playerController.getCameraWorldPosition(this.cameraPos);
    this.isUnderwater = this.isCameraInWater(cameraPos);

    const targetOpacity = this.isUnderwater ? 0.5 : 0;
    const lerpFactor = Math.min(1, delta * 6.5);
    this.overlayOpacity += (targetOpacity - this.overlayOpacity) * lerpFactor;
    this.overlayElement.style.opacity = this.overlayOpacity.toFixed(3);

    if (!this.scene.fog) {
      return;
    }

    const baseFogColor = this.dayNightCycle.currentFogColor;
    const baseFogNear = this.dayNightCycle.currentFogNear;
    const baseFogFar = this.dayNightCycle.currentFogFar;

    if (!this.isUnderwater) {
      this.scene.fog.color.copy(baseFogColor);
      this.scene.fog.near = baseFogNear;
      this.scene.fog.far = baseFogFar;
      return;
    }

    this.fogColor.copy(baseFogColor).lerp(UNDERWATER_TINT, 0.8);
    this.scene.fog.color.copy(this.fogColor);
    this.scene.fog.near = Math.max(1.1, baseFogNear * 0.1);
    this.scene.fog.far = Math.max(14, baseFogFar * 0.24);
  }

  isCameraInWater(cameraPos) {
    const samples = [
      [0, 0, 0],
      [0, -0.1, 0],
      [0, 0.08, 0],
      [0.12, 0, 0],
      [-0.12, 0, 0],
      [0, 0, 0.12],
      [0, 0, -0.12],
    ];

    for (let i = 0; i < samples.length; i += 1) {
      const s = samples[i];
      const id = this.world.getBlock(cameraPos.x + s[0], cameraPos.y + s[1], cameraPos.z + s[2]);
      if (id === BLOCK.WATER) {
        return true;
      }
    }
    return false;
  }
}
