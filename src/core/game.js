import * as THREE from "three";
import { MusicManager } from "../audio/musicManager.js";
import { SfxManager } from "../audio/sfxManager.js";
import { ParticlesManager } from "../effects/particlesManager.js";
import { PlayerController } from "../player/playerController.js";
import { raycastBlock } from "../player/raycast.js";
import { DayNightCycle } from "../systems/dayNightCycle.js";
import { WaterSystem } from "../systems/waterSystem.js";
import { Hotbar } from "../ui/hotbar.js";
import {
  HOTBAR_BLOCK_IDS,
  MAX_DELTA_TIME,
  MAX_RAY_DISTANCE,
  SFX_BREAK_VOLUME,
  SFX_FOOTSTEP_VOLUME,
  SFX_MASTER_VOLUME,
  MUSIC_TRACKS,
  MUSIC_VOLUME,
} from "../utils/constants.js";
import { BLOCK, getHotbarColor, isBlockBreakable } from "../world/blockTypes.js";
import { World } from "../world/world.js";
import { createCamera } from "./camera.js";
import { InputManager } from "./input.js";
import { createRenderer, resizeRenderer } from "./renderer.js";

function loadAtlasTexture(url) {
  const loader = new THREE.TextureLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}

export class Game {
  constructor({ canvas, hotbarRoot, debugRoot, underwaterOverlay, atlasUrl }) {
    this.canvas = canvas;
    this.hotbarRoot = hotbarRoot;
    this.debugRoot = debugRoot;
    this.underwaterOverlay = underwaterOverlay;
    this.atlasUrl = atlasUrl;

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.input = null;
    this.world = null;
    this.playerController = null;
    this.hotbar = null;
    this.selectionMesh = null;
    this.currentTarget = null;
    this.dayNightCycle = null;
    this.waterSystem = null;
    this.musicManager = null;
    this.sfxManager = null;
    this.particlesManager = null;

    this.ready = false;
    this.running = false;
    this.clock = new THREE.Clock();
    this.tmpRayOrigin = new THREE.Vector3();
    this.tmpRayDirection = new THREE.Vector3();
    this.fps = 0;
    this.fpsTimer = 0;
    this.fpsFrames = 0;
    this.onResize = () => resizeRenderer(this.renderer, this.camera);
    this.onUserGesture = null;
  }

  async init() {
    const { renderer, scene } = createRenderer(this.canvas);
    this.renderer = renderer;
    this.scene = scene;
    this.camera = createCamera();
    this.input = new InputManager(this.canvas);

    const atlasTexture = await loadAtlasTexture(this.atlasUrl);
    this.world = new World(this.scene, atlasTexture);
    this.playerController = new PlayerController(this.camera, this.scene, this.world, this.input);
    this.hotbar = new Hotbar(this.hotbarRoot, HOTBAR_BLOCK_IDS);
    this.dayNightCycle = new DayNightCycle(this.scene);
    this.particlesManager = new ParticlesManager(this.scene);
    this.musicManager = new MusicManager({
      tracks: MUSIC_TRACKS,
      volume: MUSIC_VOLUME,
    });
    this.sfxManager = new SfxManager({
      masterVolume: SFX_MASTER_VOLUME,
      breakVolume: SFX_BREAK_VOLUME,
      footstepVolume: SFX_FOOTSTEP_VOLUME,
    });

    this.world.update(new THREE.Vector3(0, 0, 0));
    const spawn = this.world.getSpawnPoint();
    this.playerController.setPosition(spawn.x, spawn.y, spawn.z);
    this.world.update(spawn);

    this.waterSystem = new WaterSystem({
      scene: this.scene,
      world: this.world,
      playerController: this.playerController,
      overlayElement: this.underwaterOverlay,
      dayNightCycle: this.dayNightCycle,
    });

    this.selectionMesh = this.createSelectionMesh();
    this.selectionMesh.visible = false;
    this.scene.add(this.selectionMesh);

    this.setupAudioUnlock();

    window.addEventListener("resize", this.onResize);
    this.ready = true;
  }

  setupAudioUnlock() {
    this.onUserGesture = () => {
      this.musicManager.startFromUserGesture();
      this.sfxManager.unlockFromUserGesture();
    };

    window.addEventListener("pointerdown", this.onUserGesture, { passive: true });
    window.addEventListener("keydown", this.onUserGesture);
  }

  start() {
    if (!this.ready || this.running) {
      return;
    }
    this.running = true;
    this.clock.start();
    this.loop();
  }

  loop() {
    if (!this.running) {
      return;
    }

    const delta = Math.min(this.clock.getDelta(), MAX_DELTA_TIME);
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.loop());
  }

  update(delta) {
    this.handleHotbarSelection();
    this.playerController.update(delta);
    const playerPosition = this.playerController.getPosition();
    this.world.update(playerPosition);
    this.dayNightCycle.update(delta, playerPosition);
    this.waterSystem.update(delta);
    this.updateBlockTarget();
    this.handleBlockActions();
    this.particlesManager.update(delta);
    this.sfxManager.updateFootsteps(delta, {
      ...this.playerController.getMovementAudioState(),
      active: this.input.locked,
    });
    this.updateDebug(delta);
  }

  handleHotbarSelection() {
    for (let i = 1; i <= 9; i += 1) {
      if (this.input.consumeKeyPress(`Digit${i}`) || this.input.consumeKeyPress(`Numpad${i}`)) {
        this.hotbar.setSelected(i - 1);
      }
    }

    const wheelSteps = this.input.consumeWheelSteps();
    if (wheelSteps !== 0) {
      this.hotbar.cycle(wheelSteps);
    }
  }

  updateBlockTarget() {
    const origin = this.playerController.getCameraWorldPosition(this.tmpRayOrigin);
    const direction = this.playerController
      .getCameraWorldDirection(this.tmpRayDirection)
      .normalize();
    this.currentTarget = raycastBlock(this.world, origin, direction, MAX_RAY_DISTANCE);

    if (!this.currentTarget) {
      this.selectionMesh.visible = false;
      return;
    }

    this.selectionMesh.visible = true;
    this.selectionMesh.position.set(
      this.currentTarget.position.x + 0.5,
      this.currentTarget.position.y + 0.5,
      this.currentTarget.position.z + 0.5
    );
  }

  handleBlockActions() {
    const breakPressed = this.input.consumeMouseButton(0);
    const placePressed = this.input.consumeMouseButton(2);

    if (!this.input.locked || !this.currentTarget) {
      return;
    }

    if (breakPressed) {
      const target = this.currentTarget.position;
      const targetId = this.world.getBlock(target.x, target.y, target.z);
      if (isBlockBreakable(targetId)) {
        const broken = this.world.setBlock(target.x, target.y, target.z, BLOCK.AIR);
        if (broken) {
          this.particlesManager.spawnBlockBreak(
            target.x,
            target.y,
            target.z,
            getHotbarColor(targetId)
          );
          this.sfxManager.playBlockBreak();
        }
      }
    }

    if (placePressed) {
      const target = this.currentTarget.position;
      const normal = this.currentTarget.normal;
      const placeX = target.x + normal.x;
      const placeY = target.y + normal.y;
      const placeZ = target.z + normal.z;

      if (!this.world.isReplaceable(placeX, placeY, placeZ)) {
        return;
      }
      if (this.playerController.wouldIntersectBlock(placeX, placeY, placeZ)) {
        return;
      }

      const selectedBlock = this.hotbar.getSelectedBlockId();
      this.world.setBlock(placeX, placeY, placeZ, selectedBlock);
    }
  }

  createSelectionMesh() {
    const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01));
    const material = new THREE.LineBasicMaterial({
      color: 0x101010,
      transparent: true,
      opacity: 0.92,
      depthTest: true,
    });
    const lines = new THREE.LineSegments(geometry, material);
    lines.renderOrder = 10;
    return lines;
  }

  updateDebug(delta) {
    this.fpsFrames += 1;
    this.fpsTimer += delta;

    if (this.fpsTimer < 0.25) {
      return;
    }

    this.fps = this.fpsFrames / this.fpsTimer;
    this.fpsFrames = 0;
    this.fpsTimer = 0;

    const pos = this.playerController.getPosition();
    const chunk = this.world.getCurrentChunkCoords(pos.x, pos.z);

    const states = [];
    if (this.playerController.player.isSprinting) {
      states.push("sprint");
    }
    if (this.playerController.player.isCrouching) {
      states.push("crouch");
    }
    if (this.playerController.player.inWater) {
      states.push("swim");
    }
    if (states.length === 0) {
      states.push("normal");
    }

    const cyclePercent =
      (this.dayNightCycle.time / this.dayNightCycle.cycleDuration) * 100;

    const text = [
      `FPS: ${this.fps.toFixed(0)}`,
      `XYZ: ${pos.x.toFixed(2)} ${pos.y.toFixed(2)} ${pos.z.toFixed(2)}`,
      `Chunk: ${chunk.cx}, ${chunk.cz}`,
      `Active chunks: ${this.world.getActiveChunkCount()}`,
      `Block: ${this.hotbar.getSelectedBlockName()}`,
      `State: ${states.join(", ")}`,
      `Day/Night cycle: ${cyclePercent.toFixed(0)}%`,
    ].join("\n");

    this.debugRoot.textContent = text;
  }

  destroy() {
    this.running = false;
    window.removeEventListener("resize", this.onResize);
    if (this.onUserGesture) {
      window.removeEventListener("pointerdown", this.onUserGesture);
      window.removeEventListener("keydown", this.onUserGesture);
    }
    if (this.input) {
      this.input.destroy();
    }
    if (this.musicManager) {
      this.musicManager.destroy();
    }
    if (this.sfxManager) {
      this.sfxManager.destroy();
    }
    if (this.particlesManager) {
      this.particlesManager.destroy();
    }
  }
}
