import * as THREE from "three";
import {
  PLAYER_CROUCH_EYE_HEIGHT,
  PLAYER_CROUCH_HEIGHT,
  PLAYER_RADIUS,
  PLAYER_STAND_EYE_HEIGHT,
  PLAYER_STAND_HEIGHT,
} from "../utils/constants.js";

export class Player {
  constructor() {
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.standHeight = PLAYER_STAND_HEIGHT;
    this.crouchHeight = PLAYER_CROUCH_HEIGHT;
    this.standEyeHeight = PLAYER_STAND_EYE_HEIGHT;
    this.crouchEyeHeight = PLAYER_CROUCH_EYE_HEIGHT;
    this.height = PLAYER_STAND_HEIGHT;
    this.eyeHeight = PLAYER_STAND_EYE_HEIGHT;
    this.targetEyeHeight = PLAYER_STAND_EYE_HEIGHT;
    this.radius = PLAYER_RADIUS;
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.inWater = false;
    this.isCrouching = false;
    this.isSprinting = false;
  }
}
