import * as THREE from "three";
import { CAMERA_FAR, CAMERA_FOV, CAMERA_NEAR } from "../utils/constants.js";

export function createCamera() {
  return new THREE.PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    CAMERA_NEAR,
    CAMERA_FAR
  );
}
