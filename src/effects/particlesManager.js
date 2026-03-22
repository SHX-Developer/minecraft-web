import * as THREE from "three";

const MAX_PARTICLES = 1200;
const PARTICLES_PER_BREAK = 14;

export class ParticlesManager {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];

    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);

    this.geometry = new THREE.BufferGeometry();
    this.positionAttr = new THREE.BufferAttribute(this.positions, 3);
    this.colorAttr = new THREE.BufferAttribute(this.colors, 3);
    this.geometry.setAttribute("position", this.positionAttr);
    this.geometry.setAttribute("color", this.colorAttr);
    this.geometry.setDrawRange(0, 0);

    this.material = new THREE.PointsMaterial({
      size: 0.11,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);

    this.color = new THREE.Color();
  }

  spawnBlockBreak(blockX, blockY, blockZ, colorHex) {
    this.color.set(colorHex);

    for (let i = 0; i < PARTICLES_PER_BREAK; i += 1) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }

      const life = 0.35 + Math.random() * 0.35;
      this.particles.push({
        x: blockX + 0.5 + (Math.random() - 0.5) * 0.8,
        y: blockY + 0.5 + (Math.random() - 0.5) * 0.7,
        z: blockZ + 0.5 + (Math.random() - 0.5) * 0.8,
        vx: (Math.random() - 0.5) * 3.0,
        vy: 1.2 + Math.random() * 2.6,
        vz: (Math.random() - 0.5) * 3.0,
        life,
        maxLife: life,
        r: this.color.r,
        g: this.color.g,
        b: this.color.b,
      });
    }
  }

  update(delta) {
    if (this.particles.length === 0) {
      this.geometry.setDrawRange(0, 0);
      return;
    }

    let write = 0;
    const alive = [];

    for (let i = 0; i < this.particles.length; i += 1) {
      const p = this.particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        continue;
      }

      p.vy -= 13.5 * delta;
      p.vx *= 0.94;
      p.vz *= 0.94;
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;

      const fade = p.life / p.maxLife;
      const base = write * 3;
      this.positions[base] = p.x;
      this.positions[base + 1] = p.y;
      this.positions[base + 2] = p.z;
      this.colors[base] = p.r * fade;
      this.colors[base + 1] = p.g * fade;
      this.colors[base + 2] = p.b * fade;

      alive.push(p);
      write += 1;
    }

    this.particles = alive;
    this.geometry.setDrawRange(0, write);
    this.positionAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;
  }

  destroy() {
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}
