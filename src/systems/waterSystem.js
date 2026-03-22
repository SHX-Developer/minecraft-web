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
    const cameraBlock = this.world.getBlock(cameraPos.x, cameraPos.y, cameraPos.z);
    this.isUnderwater = cameraBlock === BLOCK.WATER;

    const targetOpacity = this.isUnderwater ? 0.38 : 0;
    const lerpFactor = Math.min(1, delta * 6);
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

    this.fogColor.copy(baseFogColor).lerp(UNDERWATER_TINT, 0.72);
    this.scene.fog.color.copy(this.fogColor);
    this.scene.fog.near = Math.max(1.4, baseFogNear * 0.14);
    this.scene.fog.far = Math.max(18, baseFogFar * 0.28);
  }
}
