import * as THREE from "three";
import { createItemDisplayMesh } from "../items/itemMeshFactory.js";

export class HeldItemRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(canvas.clientWidth || 220, canvas.clientHeight || 220, false);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.01, 12);
    this.camera.position.set(1.8, 1.05, 2.25);
    this.camera.lookAt(0, 0, 0);

    this.ambient = new THREE.AmbientLight(0xffffff, 0.9);
    this.dir = new THREE.DirectionalLight(0xffffff, 0.92);
    this.dir.position.set(2.5, 3, 2);
    this.scene.add(this.ambient, this.dir);

    this.currentBlockId = null;
    this.currentMesh = null;
    this.time = 0;
    this.visible = true;
  }

  setItem(blockId) {
    if (this.currentBlockId === blockId) {
      return;
    }
    this.currentBlockId = blockId;

    if (this.currentMesh) {
      this.scene.remove(this.currentMesh);
      this.disposeObject(this.currentMesh);
      this.currentMesh = null;
    }

    if (blockId == null) {
      return;
    }

    this.currentMesh = createItemDisplayMesh(blockId);
    this.currentMesh.rotation.set(-0.18, 0.82, 0.08);
    this.currentMesh.position.set(0.28, -0.2, 0);
    this.scene.add(this.currentMesh);
  }

  setVisible(visible) {
    this.visible = visible;
    this.canvas.style.opacity = visible ? "1" : "0";
  }

  update(delta, isSprinting = false) {
    if (!this.visible || !this.currentMesh) {
      return;
    }
    this.time += delta;

    const sway = isSprinting ? 0.11 : 0.06;
    this.currentMesh.position.y = -0.2 + Math.sin(this.time * 4.5) * sway;
    this.currentMesh.rotation.y = 0.82 + Math.sin(this.time * 2.1) * 0.06;
    this.currentMesh.rotation.x = -0.18 + Math.sin(this.time * 3.2) * 0.025;
    this.renderer.render(this.scene, this.camera);
  }

  disposeObject(object) {
    object.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (!child.material) {
        return;
      }
      if (Array.isArray(child.material)) {
        for (let i = 0; i < child.material.length; i += 1) {
          child.material[i].dispose();
        }
        return;
      }
      child.material.dispose();
    });
  }

  destroy() {
    if (this.currentMesh) {
      this.disposeObject(this.currentMesh);
      this.currentMesh = null;
    }
    this.renderer.dispose();
  }
}

