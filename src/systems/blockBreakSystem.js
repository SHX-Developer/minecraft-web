import * as THREE from "three";
import { getBlockType } from "../world/blockTypes.js";

const BREAK_STAGES = 8;
const CRACK_OPACITY_MIN = 0.15;
const CRACK_OPACITY_MAX = 0.85;

const BLOCK_BREAK_TIMES = Object.freeze({
  default: 1.2,
  stone: 2.5,
  cobblestone: 2.5,
  obsidian: 6.0,
  bedrock: Infinity,
  dirt: 0.8,
  sand: 0.8,
  grass: 0.9,
  planks: 1.0,
  dark_planks: 1.0,
  log: 1.5,
  leaves: 0.4,
  glass: 0.5,
  gravel: 0.8,
  clay: 0.8,
  snow: 0.6,
  brick: 2.0,
  stone_bricks: 2.0,
  bookshelf: 1.0,
  coal_ore: 2.2,
  iron_ore: 2.5,
  gold_ore: 2.8,
  diamond_ore: 3.0,
  moss_block: 0.8,
  netherrack: 1.0,
  quartz_block: 1.5,
  glow_block: 0.6,
});

export class BlockBreakSystem {
  constructor(scene) {
    this.scene = scene;

    this.targetX = null;
    this.targetY = null;
    this.targetZ = null;
    this.progress = 0;
    this.breakTime = 0;
    this.isBreaking = false;

    this.crackMesh = this.createCrackMesh();
    this.crackMesh.visible = false;
    this.scene.add(this.crackMesh);
  }

  createCrackMesh() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    this.crackCanvas = canvas;
    this.crackCtx = canvas.getContext("2d");

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    this.crackTexture = texture;

    const geometry = new THREE.BoxGeometry(1.006, 1.006, 1.006);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 5;
    return mesh;
  }

  drawCrackStage(stage) {
    const ctx = this.crackCtx;
    const w = 64;
    const h = 64;
    ctx.clearRect(0, 0, w, h);

    const t = stage / BREAK_STAGES;
    const opacity = CRACK_OPACITY_MIN + t * (CRACK_OPACITY_MAX - CRACK_OPACITY_MIN);

    ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
    ctx.lineWidth = 1.5 + stage * 0.4;

    const numCracks = 2 + stage * 2;
    for (let i = 0; i < numCracks; i += 1) {
      const sx = ((37 * (i + 1) * 41) % w);
      const sy = ((53 * (i + 1) * 31) % h);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      let cx = sx;
      let cy = sy;
      const segments = 2 + Math.floor(stage / 2);
      for (let s = 0; s < segments; s += 1) {
        cx += ((19 * (i + s + 7) * 13) % 22) - 11;
        cy += ((23 * (i + s + 3) * 17) % 22) - 11;
        cx = Math.max(0, Math.min(w, cx));
        cy = Math.max(0, Math.min(h, cy));
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    if (stage >= 3) {
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.35})`;
      const numPatches = Math.floor(stage / 2) + 1;
      for (let i = 0; i < numPatches; i += 1) {
        const px = ((31 * (i + 11) * 37) % (w - 14));
        const py = ((29 * (i + 13) * 41) % (h - 14));
        const pw = 5 + ((7 * (i + 1) * 13) % 9);
        const ph = 5 + ((11 * (i + 2) * 7) % 9);
        ctx.fillRect(px, py, pw, ph);
      }
    }

    this.crackTexture.needsUpdate = true;
  }

  startBreaking(x, y, z, blockId, instantBreak) {
    if (instantBreak) {
      this.reset();
      return true;
    }

    if (this.targetX === x && this.targetY === y && this.targetZ === z) {
      return false;
    }

    this.targetX = x;
    this.targetY = y;
    this.targetZ = z;
    this.progress = 0;
    this.isBreaking = true;

    const def = getBlockType(blockId);
    this.breakTime = BLOCK_BREAK_TIMES[def.name] || BLOCK_BREAK_TIMES.default;

    this.crackMesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    this.crackMesh.visible = true;
    this.drawCrackStage(0);

    return false;
  }

  continueBreaking(delta) {
    if (!this.isBreaking || this.breakTime <= 0 || this.breakTime === Infinity) {
      return false;
    }

    this.progress += delta / this.breakTime;

    const stage = Math.min(BREAK_STAGES, Math.floor(this.progress * (BREAK_STAGES + 1)));
    this.drawCrackStage(stage);

    if (this.progress >= 1) {
      this.reset();
      return true;
    }
    return false;
  }

  cancelBreaking() {
    this.reset();
  }

  reset() {
    this.targetX = null;
    this.targetY = null;
    this.targetZ = null;
    this.progress = 0;
    this.isBreaking = false;
    this.crackMesh.visible = false;
  }

  isSameTarget(x, y, z) {
    return this.targetX === x && this.targetY === y && this.targetZ === z;
  }

  destroy() {
    this.scene.remove(this.crackMesh);
    this.crackMesh.geometry.dispose();
    this.crackMesh.material.dispose();
    this.crackTexture.dispose();
  }
}
