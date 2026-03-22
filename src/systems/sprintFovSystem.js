import { CAMERA_FOV, SPRINT_FOV_BOOST, SPRINT_FOV_SMOOTH } from "../utils/constants.js";

export class SprintFovSystem {
  constructor(camera) {
    this.camera = camera;
    this.currentFov = CAMERA_FOV;
  }

  update(delta, shouldBoost) {
    const targetFov = shouldBoost ? CAMERA_FOV + SPRINT_FOV_BOOST : CAMERA_FOV;
    const t = Math.min(1, delta * SPRINT_FOV_SMOOTH);
    this.currentFov += (targetFov - this.currentFov) * t;

    if (Math.abs(this.camera.fov - this.currentFov) > 0.01) {
      this.camera.fov = this.currentFov;
      this.camera.updateProjectionMatrix();
    }
  }
}
