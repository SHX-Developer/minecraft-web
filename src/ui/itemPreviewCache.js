import * as THREE from "three";
import { createItemDisplayMesh } from "../items/itemMeshFactory.js";

export class ItemPreviewCache {
  constructor(size = 48) {
    this.size = size;
    this.cache = new Map();

    this.canvas = document.createElement("canvas");
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(this.size, this.size, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.01, 10);
    this.camera.position.set(1.6, 1.4, 1.6);
    this.camera.lookAt(0, 0, 0);

    this.lightA = new THREE.AmbientLight(0xffffff, 0.72);
    this.lightB = new THREE.DirectionalLight(0xffffff, 0.82);
    this.lightB.position.set(2, 3, 2);
    this.scene.add(this.lightA, this.lightB);
  }

  get(blockId) {
    if (this.cache.has(blockId)) {
      return this.cache.get(blockId);
    }

    const mesh = createItemDisplayMesh(blockId);
    mesh.rotation.set(-0.38, 0.74, 0.05);
    this.scene.add(mesh);
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.canvas.toDataURL("image/png");
    this.scene.remove(mesh);
    this.disposeObject(mesh);

    this.cache.set(blockId, dataUrl);
    return dataUrl;
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
    this.renderer.dispose();
    this.cache.clear();
  }
}

