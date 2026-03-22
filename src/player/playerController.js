import * as THREE from "three";
import {
  MOUSE_SENSITIVITY,
  PLAYER_CROUCH_SPEED,
  PLAYER_GRAVITY,
  PLAYER_JUMP_SPEED,
  PLAYER_MAX_FALL_SPEED,
  PLAYER_MOVE_SPEED,
  PLAYER_SPRINT_SPEED,
  PLAYER_SWIM_DOWN_SPEED,
  PLAYER_SWIM_SPEED,
  PLAYER_SWIM_UP_SPEED,
  PLAYER_WATER_DRAG,
  PLAYER_WATER_GRAVITY,
  SPRINT_DOUBLE_TAP_WINDOW,
} from "../utils/constants.js";
import { clamp } from "../utils/helpers.js";
import { BLOCK, isBlockSolid } from "../world/blockTypes.js";
import { Player } from "./player.js";

const GROUND_PROBE = 0.06;
const EYE_SMOOTHING = 14;

export class PlayerController {
  constructor(camera, scene, world, input) {
    this.camera = camera;
    this.scene = scene;
    this.world = world;
    this.input = input;
    this.player = new Player();

    this.body = new THREE.Object3D();
    this.pitchPivot = new THREE.Object3D();
    this.pitchPivot.position.y = this.player.eyeHeight;
    this.pitchPivot.add(this.camera);
    this.body.add(this.pitchPivot);
    this.scene.add(this.body);

    this.forward = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.wishDir = new THREE.Vector3();

    this.lastForwardTapTime = -Infinity;
  }

  setPosition(x, y, z) {
    this.player.position.set(x, y, z);
    this.body.position.copy(this.player.position);
  }

  getPosition() {
    return this.player.position;
  }

  getCameraWorldPosition(target) {
    return this.camera.getWorldPosition(target);
  }

  getCameraWorldDirection(target) {
    return this.camera.getWorldDirection(target);
  }

  update(delta) {
    this.updateLook();
    this.updateMovement(delta);
    this.updateEyeHeight(delta);
    this.body.position.copy(this.player.position);
  }

  updateLook() {
    const mouse = this.input.consumeMouseDelta();
    if (!this.input.locked) {
      return;
    }

    this.player.yaw -= mouse.x * MOUSE_SENSITIVITY;
    this.player.pitch -= mouse.y * MOUSE_SENSITIVITY;
    this.player.pitch = clamp(this.player.pitch, -Math.PI * 0.495, Math.PI * 0.495);

    this.body.rotation.y = this.player.yaw;
    this.pitchPivot.rotation.x = this.player.pitch;
  }

  updateMovement(delta) {
    const moveX = Number(this.input.isKeyDown("KeyD")) - Number(this.input.isKeyDown("KeyA"));
    const moveZ = Number(this.input.isKeyDown("KeyW")) - Number(this.input.isKeyDown("KeyS"));
    const wantsCrouch = this.input.isKeyDown("ShiftLeft") || this.input.isKeyDown("ShiftRight");

    this.updateCrouchState(wantsCrouch);
    this.updateSprintState(moveZ);

    this.player.inWater = this.isBodyInWater();
    if (this.player.inWater) {
      this.player.isSprinting = false;
      this.applyWaterMovement(moveX, moveZ, wantsCrouch, delta);
    } else {
      this.applyGroundMovement(moveX, moveZ, delta);
    }

    this.player.inWater = this.isBodyInWater();
  }

  updateCrouchState(wantsCrouch) {
    if (wantsCrouch) {
      this.player.isCrouching = true;
    } else if (this.player.isCrouching && this.canStand()) {
      this.player.isCrouching = false;
    }

    this.player.height = this.player.isCrouching ? this.player.crouchHeight : this.player.standHeight;
    this.player.targetEyeHeight = this.player.isCrouching
      ? this.player.crouchEyeHeight
      : this.player.standEyeHeight;

    if (this.player.isCrouching) {
      this.player.isSprinting = false;
    }
  }

  updateSprintState(moveZ) {
    if (this.input.consumeKeyPress("KeyW")) {
      const now = performance.now() * 0.001;
      const quickDoubleTap = now - this.lastForwardTapTime <= SPRINT_DOUBLE_TAP_WINDOW;
      if (quickDoubleTap && !this.player.isCrouching && !this.player.inWater) {
        this.player.isSprinting = true;
      }
      this.lastForwardTapTime = now;
    }

    if (!this.input.isKeyDown("KeyW") || moveZ <= 0 || this.player.isCrouching || this.player.inWater) {
      this.player.isSprinting = false;
    }
  }

  applyGroundMovement(moveX, moveZ, delta) {
    const moveLen = Math.hypot(moveX, moveZ);
    const normX = moveLen > 0 ? moveX / moveLen : 0;
    const normZ = moveLen > 0 ? moveZ / moveLen : 0;

    // Fixes W/S inversion: yaw=0 now maps W to camera forward (-Z).
    this.forward.set(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
    this.right.set(Math.cos(this.player.yaw), 0, -Math.sin(this.player.yaw));
    this.wishDir.set(0, 0, 0);

    const sideSpeed = this.player.isCrouching ? PLAYER_CROUCH_SPEED : PLAYER_MOVE_SPEED;
    const forwardSpeed =
      this.player.isSprinting && normZ > 0
        ? PLAYER_SPRINT_SPEED
        : this.player.isCrouching
          ? PLAYER_CROUCH_SPEED
          : PLAYER_MOVE_SPEED;

    this.wishDir.addScaledVector(this.right, normX * sideSpeed);
    this.wishDir.addScaledVector(this.forward, normZ * forwardSpeed);

    this.player.velocity.x = this.wishDir.x;
    this.player.velocity.z = this.wishDir.z;

    if (this.player.onGround && this.input.consumeKeyPress("Space")) {
      this.player.velocity.y = PLAYER_JUMP_SPEED;
      this.player.onGround = false;
    }

    this.player.velocity.y -= PLAYER_GRAVITY * delta;
    this.player.velocity.y = Math.max(this.player.velocity.y, -PLAYER_MAX_FALL_SPEED);

    const hit = this.moveAndCollide(
      this.player.velocity.x * delta,
      this.player.velocity.y * delta,
      this.player.velocity.z * delta
    );

    if ((hit.x || hit.z) && this.player.isSprinting) {
      this.player.isSprinting = false;
    }
    if (normZ <= 0) {
      this.player.isSprinting = false;
    }
  }

  applyWaterMovement(moveX, moveZ, wantsCrouch, delta) {
    const moveLen = Math.hypot(moveX, moveZ);
    const normX = moveLen > 0 ? moveX / moveLen : 0;
    const normZ = moveLen > 0 ? moveZ / moveLen : 0;

    this.forward.set(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
    this.right.set(Math.cos(this.player.yaw), 0, -Math.sin(this.player.yaw));
    this.wishDir.set(0, 0, 0);
    this.wishDir.addScaledVector(this.right, normX * PLAYER_SWIM_SPEED);
    this.wishDir.addScaledVector(this.forward, normZ * PLAYER_SWIM_SPEED);

    this.player.velocity.x = this.wishDir.x;
    this.player.velocity.z = this.wishDir.z;

    if (moveLen === 0) {
      const dragFactor = Math.max(0, 1 - PLAYER_WATER_DRAG * delta);
      this.player.velocity.x *= dragFactor;
      this.player.velocity.z *= dragFactor;
    }

    if (this.input.isKeyDown("Space")) {
      this.player.velocity.y = PLAYER_SWIM_UP_SPEED;
    } else if (wantsCrouch) {
      this.player.velocity.y = -PLAYER_SWIM_DOWN_SPEED;
    } else {
      this.player.velocity.y -= PLAYER_WATER_GRAVITY * delta;
      this.player.velocity.y = Math.max(this.player.velocity.y, -PLAYER_SWIM_DOWN_SPEED);
    }

    this.moveAndCollide(
      this.player.velocity.x * delta,
      this.player.velocity.y * delta,
      this.player.velocity.z * delta
    );
  }

  moveAndCollide(dx, dy, dz) {
    const p = this.player.position;
    const hit = { x: false, y: false, z: false };
    this.player.onGround = false;

    p.x += dx;
    if (this.collidesAt(p.x, p.y, p.z, this.player.height)) {
      p.x -= dx;
      this.player.velocity.x = 0;
      hit.x = true;
    }

    p.z += dz;
    if (this.collidesAt(p.x, p.y, p.z, this.player.height)) {
      p.z -= dz;
      this.player.velocity.z = 0;
      hit.z = true;
    }

    p.y += dy;
    if (this.collidesAt(p.x, p.y, p.z, this.player.height)) {
      p.y -= dy;
      if (dy < 0) {
        this.player.onGround = true;
      }
      this.player.velocity.y = 0;
      hit.y = true;
    }

    if (!this.player.onGround && !this.player.inWater) {
      p.y -= GROUND_PROBE;
      if (this.collidesAt(p.x, p.y, p.z, this.player.height)) {
        this.player.onGround = true;
        if (this.player.velocity.y < 0) {
          this.player.velocity.y = 0;
        }
      }
      p.y += GROUND_PROBE;
    }

    return hit;
  }

  updateEyeHeight(delta) {
    const t = Math.min(1, delta * EYE_SMOOTHING);
    this.player.eyeHeight += (this.player.targetEyeHeight - this.player.eyeHeight) * t;
    this.pitchPivot.position.y = this.player.eyeHeight;
  }

  canStand() {
    const p = this.player.position;
    return !this.collidesAt(p.x, p.y, p.z, this.player.standHeight);
  }

  collidesAt(px, py, pz, height) {
    const minX = Math.floor(px - this.player.radius);
    const maxX = Math.floor(px + this.player.radius);
    const minY = Math.floor(py);
    const maxY = Math.floor(py + height - 0.001);
    const minZ = Math.floor(pz - this.player.radius);
    const maxZ = Math.floor(pz + this.player.radius);

    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        for (let z = minZ; z <= maxZ; z += 1) {
          if (isBlockSolid(this.world.getBlock(x, y, z))) {
            return true;
          }
        }
      }
    }

    return false;
  }

  isBodyInWater() {
    const p = this.player.position;
    const r = this.player.radius * 0.75;
    const sampleHeights = [0.1, this.player.height * 0.45, this.player.height - 0.1];
    const offsets = [
      [0, 0],
      [r, 0],
      [-r, 0],
      [0, r],
      [0, -r],
    ];

    for (let i = 0; i < sampleHeights.length; i += 1) {
      const y = p.y + sampleHeights[i];
      for (let j = 0; j < offsets.length; j += 1) {
        const ox = offsets[j][0];
        const oz = offsets[j][1];
        const id = this.world.getBlock(p.x + ox, y, p.z + oz);
        if (id === BLOCK.WATER) {
          return true;
        }
      }
    }
    return false;
  }

  getHorizontalSpeed() {
    return Math.hypot(this.player.velocity.x, this.player.velocity.z);
  }

  getMovementAudioState() {
    return {
      horizontalSpeed: this.getHorizontalSpeed(),
      onGround: this.player.onGround,
      inWater: this.player.inWater,
      isSprinting: this.player.isSprinting,
      isCrouching: this.player.isCrouching,
    };
  }

  wouldIntersectBlock(blockX, blockY, blockZ) {
    const p = this.player.position;
    const minX = p.x - this.player.radius;
    const maxX = p.x + this.player.radius;
    const minY = p.y;
    const maxY = p.y + this.player.height;
    const minZ = p.z - this.player.radius;
    const maxZ = p.z + this.player.radius;

    return (
      minX < blockX + 1 &&
      maxX > blockX &&
      minY < blockY + 1 &&
      maxY > blockY &&
      minZ < blockZ + 1 &&
      maxZ > blockZ
    );
  }
}
