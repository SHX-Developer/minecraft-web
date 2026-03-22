import * as THREE from "three";
import { createItemDisplayMesh } from "../items/itemMeshFactory.js";

export class ItemPreviewCache {
  constructor(size = 48, atlasTexture = null) {
    this.size = size;
    this.atlasTexture = atlasTexture;
    this.cache = new Map();

    this.canvas = document.createElement("canvas");
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(this.size, this.size, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.01, 10);
    this.camera.position.set(1.45, 1.18, 1.55);
    this.camera.lookAt(0, 0, 0);

    this.lightA = new THREE.AmbientLight(0xffffff, 0.6);
    this.lightB = new THREE.DirectionalLight(0xffffff, 0.95);
    this.lightB.position.set(2, 3, 2);
    this.lightC = new THREE.DirectionalLight(0xffffff, 0.36);
    this.lightC.position.set(-1.7, 2, -1.4);
    this.scene.add(this.lightA, this.lightB, this.lightC);
  }

  get(blockId) {
    if (this.cache.has(blockId)) {
      return this.cache.get(blockId);
    }

    const mesh = createItemDisplayMesh(blockId, this.atlasTexture);
    const kind = mesh.userData.itemKind || "block";
    if (kind === "torch") {
      mesh.rotation.set(-0.3, 0.62, 0.03);
      mesh.position.set(-0.01, -0.08, 0);
      mesh.scale.setScalar(1.18);
    } else {
      mesh.rotation.set(-0.63, 0.72, 0.04);
      mesh.position.set(0, -0.03, 0);
      mesh.scale.setScalar(1.24);
    }
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
