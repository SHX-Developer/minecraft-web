import * as THREE from "three";
import { MusicManager } from "../audio/musicManager.js";
import { SfxManager } from "../audio/sfxManager.js";
import { ParticlesManager } from "../effects/particlesManager.js";
import { AnimalManager } from "../entities/animalManager.js";
import { DroppedItemManager } from "../entities/droppedItemManager.js";
import { PlayerController } from "../player/playerController.js";
import { PlayerHealth } from "../player/playerHealth.js";
import { raycastBlock } from "../player/raycast.js";
import { BlockBreakSystem } from "../systems/blockBreakSystem.js";
import { CloudSystem } from "../systems/cloudSystem.js";
import { DayNightCycle } from "../systems/dayNightCycle.js";
import { FallDamageSystem } from "../systems/fallDamageSystem.js";
import { SprintFovSystem } from "../systems/sprintFovSystem.js";
import { TorchLightSystem } from "../systems/torchLightSystem.js";
import { WaterSystem } from "../systems/waterSystem.js";
import { DeathScreen } from "../ui/deathScreen.js";
import { HeartsUI } from "../ui/heartsUI.js";
import { HeldItemRenderer } from "../ui/heldItemRenderer.js";
import { InventoryUI } from "../ui/inventoryUI.js";
import {
  MAX_DELTA_TIME,
  MAX_RAY_DISTANCE,
  SFX_BREAK_VOLUME,
  SFX_FOOTSTEP_VOLUME,
  SFX_MASTER_VOLUME,
  MUSIC_TRACKS,
  MUSIC_VOLUME,
} from "../utils/constants.js";
import {
  BLOCK,
  getHotbarColor,
  isBlockBreakable,
  isBlockSolid,
  isTorchBlock,
} from "../world/blockTypes.js";
import { World } from "../world/world.js";
import { createCamera } from "./camera.js";
import { GameModeManager } from "./gameMode.js";
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
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}

export class Game {
  constructor({
    canvas,
    hudHotbarRoot,
    debugRoot,
    underwaterOverlay,
    inventoryOverlay,
    inventoryCreativeGrid,
    inventoryCreativeToggle,
    inventoryCreativePanel,
    inventoryStorageGrid,
    inventoryHotbar,
    inventoryTrash,
    inventoryCursor,
    heldItemCanvas,
    atlasUrl,
    hudElement,
  }) {
    this.canvas = canvas;
    this.hudHotbarRoot = hudHotbarRoot;
    this.debugRoot = debugRoot;
    this.underwaterOverlay = underwaterOverlay;
    this.inventoryOverlay = inventoryOverlay;
    this.inventoryCreativeGrid = inventoryCreativeGrid;
    this.inventoryCreativeToggle = inventoryCreativeToggle;
    this.inventoryCreativePanel = inventoryCreativePanel;
    this.inventoryStorageGrid = inventoryStorageGrid;
    this.inventoryHotbar = inventoryHotbar;
    this.inventoryTrash = inventoryTrash;
    this.inventoryCursor = inventoryCursor;
    this.heldItemCanvas = heldItemCanvas;
    this.atlasUrl = atlasUrl;
    this.hudElement = hudElement;

    this.gameModeManager = new GameModeManager();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.input = null;
    this.world = null;
    this.playerController = null;
    this.playerHealth = null;
    this.inventoryUI = null;
    this.selectionMesh = null;
    this.currentTarget = null;
    this.dayNightCycle = null;
    this.waterSystem = null;
    this.cloudSystem = null;
    this.sprintFovSystem = null;
    this.torchLightSystem = null;
    this.heldItemRenderer = null;
    this.musicManager = null;
    this.sfxManager = null;
    this.particlesManager = null;
    this.animalManager = null;
    this.droppedItemManager = null;
    this.blockBreakSystem = null;
    this.fallDamageSystem = null;
    this.heartsUI = null;
    this.deathScreen = null;
    this.damageOverlay = null;

    this.ready = false;
    this.running = false;
    this.dead = false;
    this.clock = new THREE.Clock();
    this.tmpRayOrigin = new THREE.Vector3();
    this.tmpRayDirection = new THREE.Vector3();
    this.fps = 0;
    this.fpsTimer = 0;
    this.fpsFrames = 0;
    this.onResize = () => resizeRenderer(this.renderer, this.camera);
    this.onUserGesture = null;
    this.onInventoryKeyDown = null;

    this.atlasTexture = null;
  }

  async init() {
    const { renderer, scene } = createRenderer(this.canvas);
    this.renderer = renderer;
    this.scene = scene;
    this.camera = createCamera();
    this.input = new InputManager(this.canvas);

    this.atlasTexture = await loadAtlasTexture(this.atlasUrl);
    this.atlasTexture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    this.world = new World(this.scene, this.atlasTexture);
    this.playerController = new PlayerController(this.camera, this.scene, this.world, this.input);
    this.playerController.setGameModeManager(this.gameModeManager);

    this.playerHealth = new PlayerHealth(10);

    this.inventoryUI = new InventoryUI({
      hudHotbarRoot: this.hudHotbarRoot,
      overlayElement: this.inventoryOverlay,
      creativeGridElement: this.inventoryCreativeGrid,
      creativeToggleElement: this.inventoryCreativeToggle,
      creativePanelElement: this.inventoryCreativePanel,
      storageGridElement: this.inventoryStorageGrid,
      inventoryHotbarElement: this.inventoryHotbar,
      trashElement: this.inventoryTrash,
      cursorElement: this.inventoryCursor,
      atlasTexture: this.atlasTexture,
    });

    this.dayNightCycle = new DayNightCycle(this.scene);
    this.cloudSystem = new CloudSystem(this.scene, this.dayNightCycle);
    this.sprintFovSystem = new SprintFovSystem(this.camera);
    this.particlesManager = new ParticlesManager(this.scene);
    this.animalManager = new AnimalManager(this.scene, this.world, this.particlesManager);
    this.torchLightSystem = new TorchLightSystem(this.scene, this.world);
    this.heldItemRenderer = new HeldItemRenderer(this.heldItemCanvas, this.atlasTexture);
    this.musicManager = new MusicManager({
      tracks: MUSIC_TRACKS,
      volume: MUSIC_VOLUME,
    });
    this.sfxManager = new SfxManager({
      masterVolume: SFX_MASTER_VOLUME,
      breakVolume: SFX_BREAK_VOLUME,
      footstepVolume: SFX_FOOTSTEP_VOLUME,
    });

    this.droppedItemManager = new DroppedItemManager(this.scene, this.world, this.atlasTexture);
    this.blockBreakSystem = new BlockBreakSystem(this.scene);
    this.fallDamageSystem = new FallDamageSystem(this.playerController, this.playerHealth, this.gameModeManager);

    this.heartsUI = new HeartsUI(this.hudElement);
    this.deathScreen = new DeathScreen(this.hudElement);

    this.damageOverlay = document.getElementById("damage-overlay");

    this.playerHealth.onChange((hp, max) => {
      this.heartsUI.updateHealth(hp, max);
    });

    this.playerHealth.onDeath(() => {
      this.handleDeath();
    });

    const spawn = this.world.getSpawnPoint();
    this.world.forceLoadSyncAround(spawn.x, spawn.z, 2);
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

    this.inventoryUI.onChange(() => {
      this.heldItemRenderer.setItem(this.inventoryUI.getSelectedBlockId());
    });
    this.heldItemRenderer.setItem(this.inventoryUI.getSelectedBlockId());

    this.onInventoryKeyDown = (event) => {
      if (event.code !== "KeyE" || event.repeat) {
        return;
      }
      event.preventDefault();
      this.toggleInventoryFromKey();
    };
    window.addEventListener("keydown", this.onInventoryKeyDown);

    this.setupAudioUnlock();
    window.addEventListener("resize", this.onResize);
    this.ready = true;
  }

  applyGameMode(mode) {
    this.gameModeManager.setMode(mode);

    const isSurvival = this.gameModeManager.isSurvival();

    this.inventoryUI.setSurvivalMode(isSurvival);
    this.heartsUI.setVisible(isSurvival);
    this.heartsUI.updateHealth(this.playerHealth.getHealth(), this.playerHealth.getMaxHealth());

    if (isSurvival) {
      this.playerController.player.isFlying = false;
    }

    const inventoryHeader = document.getElementById("inventory-header");
    if (inventoryHeader) {
      inventoryHeader.querySelector("span").textContent = isSurvival ? "Inventory" : "Creative Inventory";
    }
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
    if (this.dead) {
      return;
    }

    this.handleHotbarSelection();

    const controlsEnabled = this.input.locked && !this.inventoryUI.isOpen();
    this.playerController.update(delta, controlsEnabled);
    const playerPosition = this.playerController.getPosition();
    this.world.update(playerPosition);
    this.dayNightCycle.update(delta, playerPosition);
    this.cloudSystem.update(delta, playerPosition);
    this.waterSystem.update(delta);
    this.sprintFovSystem.update(
      delta,
      this.playerController.player.isSprinting && !this.playerController.player.inWater
    );
    this.torchLightSystem.update(delta, playerPosition);
    this.animalManager.update(delta, playerPosition);
    this.particlesManager.update(delta);

    this.playerHealth.update(delta);
    this.fallDamageSystem.update();

    if (this.gameModeManager.isSurvival()) {
      this.droppedItemManager.update(delta, playerPosition, (blockId) => {
        return this.inventoryUI.model.addItemToInventory(blockId);
      });
    }

    if (this.damageOverlay) {
      this.damageOverlay.style.opacity = this.playerHealth.isDamageFlashing() ? "0.35" : "0";
    }

    this.heldItemRenderer.setVisible(!this.inventoryUI.isOpen());
    this.heldItemRenderer.update(
      delta,
      this.playerController.player.isSprinting && controlsEnabled
    );

    if (controlsEnabled) {
      this.updateBlockTarget();
      this.handleBlockActions(delta);
    } else {
      this.selectionMesh.visible = false;
      this.blockBreakSystem.cancelBreaking();
    }

    this.sfxManager.updateFootsteps(delta, {
      ...this.playerController.getMovementAudioState(),
      active: controlsEnabled,
    });
    this.updateDebug(delta);
  }

  toggleInventoryFromKey() {
    if (this.dead) {
      return;
    }
    this.input.consumeKeyPress("KeyE");
    const opened = this.inventoryUI.toggle();
    if (opened && document.pointerLockElement) {
      document.exitPointerLock();
      return;
    }
    if (!opened) {
      this.input.requestPointerLock();
    }
  }

  handleHotbarSelection() {
    if (this.inventoryUI.isOpen()) {
      this.input.consumeWheelSteps();
      for (let i = 1; i <= 9; i += 1) {
        this.input.consumeKeyPress(`Digit${i}`);
        this.input.consumeKeyPress(`Numpad${i}`);
      }
      return;
    }

    for (let i = 1; i <= 9; i += 1) {
      if (this.input.consumeKeyPress(`Digit${i}`) || this.input.consumeKeyPress(`Numpad${i}`)) {
        this.inventoryUI.setSelected(i - 1);
      }
    }

    const wheelSteps = this.input.consumeWheelSteps();
    if (wheelSteps !== 0) {
      this.inventoryUI.cycle(wheelSteps);
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

  handleBlockActions(delta) {
    if (this.input.isMouseDown(0)) {
      this.handleBreakAction(delta);
    } else {
      this.blockBreakSystem.cancelBreaking();
    }

    if (this.input.consumeMouseButton(2)) {
      this.performPlaceAction();
    }
  }

  handleBreakAction(delta) {
    const blockDistance = this.currentTarget ? this.currentTarget.distance : MAX_RAY_DISTANCE;
    const hitAnimal = this.animalManager.tryHitFromRay(
      this.tmpRayOrigin,
      this.tmpRayDirection,
      MAX_RAY_DISTANCE,
      1,
      blockDistance
    );
    if (hitAnimal) {
      this.sfxManager.playBlockBreak();
      this.blockBreakSystem.cancelBreaking();
      return;
    }

    if (!this.currentTarget) {
      this.blockBreakSystem.cancelBreaking();
      return;
    }

    const target = this.currentTarget.position;
    const targetId = this.world.getBlock(target.x, target.y, target.z);
    if (!isBlockBreakable(targetId)) {
      this.blockBreakSystem.cancelBreaking();
      return;
    }

    const instantBreak = this.gameModeManager.instantBreak();

    if (!this.blockBreakSystem.isSameTarget(target.x, target.y, target.z)) {
      const readyNow = this.blockBreakSystem.startBreaking(target.x, target.y, target.z, targetId, instantBreak);
      if (readyNow) {
        this.breakBlock(target.x, target.y, target.z, targetId);
      }
      return;
    }

    const broken = this.blockBreakSystem.continueBreaking(delta);
    if (broken) {
      this.breakBlock(target.x, target.y, target.z, targetId);
    }
  }

  breakBlock(x, y, z, blockId) {
    const broken = this.world.setBlock(x, y, z, BLOCK.AIR);
    if (!broken) {
      return;
    }

    this.torchLightSystem.onBlockChanged(x, y, z, blockId, BLOCK.AIR);
    this.cleanupUnsupportedTorchesAround(x, y, z);
    this.particlesManager.spawnBlockBreak(x, y, z, getHotbarColor(blockId));
    this.sfxManager.playBlockBreak();

    if (this.gameModeManager.hasItemDrop()) {
      this.droppedItemManager.spawnItem(blockId, x, y, z);
    }
  }

  performPlaceAction() {
    if (!this.currentTarget) {
      return;
    }

    const target = this.currentTarget.position;
    const normal = this.currentTarget.normal;
    const placeX = target.x + normal.x;
    const placeY = target.y + normal.y;
    const placeZ = target.z + normal.z;

    if (!this.world.isReplaceable(placeX, placeY, placeZ)) {
      return;
    }

    const selectedBlock = this.inventoryUI.getSelectedBlockId();
    if (selectedBlock == null) {
      return;
    }
    const placeBlockId = this.resolvePlaceBlockId(selectedBlock, normal, placeX, placeY, placeZ);
    if (placeBlockId == null) {
      return;
    }

    if (this.playerController.wouldIntersectBlock(placeX, placeY, placeZ)) {
      return;
    }

    if (this.gameModeManager.consumesBlocks()) {
      if (!this.inventoryUI.model.consumeSelectedBlock()) {
        return;
      }
    }

    const previous = this.world.getBlock(placeX, placeY, placeZ);
    const changed = this.world.setBlock(placeX, placeY, placeZ, placeBlockId);
    if (!changed) {
      return;
    }
    this.torchLightSystem.onBlockChanged(placeX, placeY, placeZ, previous, placeBlockId);
    this.cleanupUnsupportedTorchesAround(placeX, placeY, placeZ);
  }

  resolvePlaceBlockId(selectedBlockId, normal, placeX, placeY, placeZ) {
    return selectedBlockId;
  }

  async handleDeath() {
    this.dead = true;

    if (this.inventoryUI.isOpen()) {
      this.inventoryUI.close();
    }

    if (this.gameModeManager.isSurvival()) {
      this.inventoryUI.model.clearAll();
      this.droppedItemManager.clear();
    }

    await this.deathScreen.show();

    this.playerHealth.reset();

    const spawn = this.world.getSpawnPoint();
    this.world.forceLoadSyncAround(spawn.x, spawn.z, 2);
    this.playerController.setPosition(spawn.x, spawn.y, spawn.z);
    this.playerController.player.velocity.set(0, 0, 0);
    this.playerController.player.isFlying = false;
    this.playerController.player.isSprinting = false;
    this.playerController.player.isCrouching = false;

    this.dead = false;
  }

  cleanupUnsupportedTorchesAround(worldX, worldY, worldZ) {
    const offsets = [
      [0, 0, 0],
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ];

    for (let i = 0; i < offsets.length; i += 1) {
      const o = offsets[i];
      const x = worldX + o[0];
      const y = worldY + o[1];
      const z = worldZ + o[2];
      const id = this.world.getBlock(x, y, z);
      if (!isTorchBlock(id)) {
        continue;
      }
      if (this.isTorchSupported(id, x, y, z)) {
        continue;
      }
      const changed = this.world.setBlock(x, y, z, BLOCK.AIR);
      if (changed) {
        this.torchLightSystem.onBlockChanged(x, y, z, id, BLOCK.AIR);
      }
    }
  }

  isTorchSupported(id, x, y, z) {
    if (id === BLOCK.TORCH) {
      return isBlockSolid(this.world.getBlock(x, y - 1, z));
    }
    if (id === BLOCK.TORCH_WEST) {
      return isBlockSolid(this.world.getBlock(x - 1, y, z));
    }
    if (id === BLOCK.TORCH_EAST) {
      return isBlockSolid(this.world.getBlock(x + 1, y, z));
    }
    if (id === BLOCK.TORCH_NORTH) {
      return isBlockSolid(this.world.getBlock(x, y, z - 1));
    }
    if (id === BLOCK.TORCH_SOUTH) {
      return isBlockSolid(this.world.getBlock(x, y, z + 1));
    }
    return true;
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
    const visibleChunks = this.world.getVisibleChunkCount(this.camera);
    const queues = this.world.getQueueSizes();

    const modeLabel = this.gameModeManager.getMode() || "none";

    const lines = [
      `FPS: ${this.fps.toFixed(0)}`,
      `Mode: ${modeLabel.toUpperCase()}`,
      `XYZ: ${pos.x.toFixed(2)} ${pos.y.toFixed(2)} ${pos.z.toFixed(2)}`,
      `Chunk: ${chunk.cx}, ${chunk.cz}`,
      `Active chunks: ${this.world.getActiveChunkCount()}`,
      `Visible chunks: ${visibleChunks}`,
      `Load queue: ${queues.loadQueue} | Rebuild queue: ${queues.rebuildQueue}`,
      `Block: ${this.inventoryUI.getSelectedBlockName()}`,
      `Animals: ${this.animalManager.getCount()}`,
      `State: ${this.playerController.getMovementMode()}`,
    ];

    if (this.gameModeManager.isSurvival()) {
      lines.push(`HP: ${this.playerHealth.getHealth()}/${this.playerHealth.getMaxHealth()}`);
      lines.push(`Drops: ${this.droppedItemManager.getCount()}`);
    }

    lines.push(
      `Day/Night cycle: ${((this.dayNightCycle.time / this.dayNightCycle.cycleDuration) * 100).toFixed(0)}%`
    );

    this.debugRoot.textContent = lines.join("\n");
  }

  destroy() {
    this.running = false;
    window.removeEventListener("resize", this.onResize);
    if (this.onInventoryKeyDown) {
      window.removeEventListener("keydown", this.onInventoryKeyDown);
    }
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
    if (this.animalManager) {
      this.animalManager.destroy();
    }
    if (this.inventoryUI) {
      this.inventoryUI.destroy();
    }
    if (this.heldItemRenderer) {
      this.heldItemRenderer.destroy();
    }
    if (this.torchLightSystem) {
      this.torchLightSystem.destroy();
    }
    if (this.droppedItemManager) {
      this.droppedItemManager.destroy();
    }
    if (this.blockBreakSystem) {
      this.blockBreakSystem.destroy();
    }
    if (this.heartsUI) {
      this.heartsUI.destroy();
    }
    if (this.deathScreen) {
      this.deathScreen.destroy();
    }
  }
}
