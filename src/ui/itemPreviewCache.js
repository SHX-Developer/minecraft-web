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
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.01, 10);
    this.camera.position.set(1.95, 1.35, 2.25);
    this.camera.lookAt(0, 0, 0);

    this.lightA = new THREE.AmbientLight(0xffffff, 0.12);
    this.lightB = new THREE.DirectionalLight(0xffffff, 1.45);
    this.lightB.position.set(2.8, 3.4, 2.6);
    this.lightC = new THREE.DirectionalLight(0xffffff, 0.24);
    this.lightC.position.set(-2.2, 1.2, -1.8);
    this.lightD = new THREE.DirectionalLight(0xffffff, 0.34);
    this.lightD.position.set(0.2, 2.1, -2.7);
    this.scene.add(this.lightA, this.lightB, this.lightC, this.lightD);
  }

  get(blockId) {
    if (this.cache.has(blockId)) {
      return this.cache.get(blockId);
    }

    const mesh = createItemDisplayMesh(blockId, this.atlasTexture);
    const kind = mesh.userData.itemKind || "block";
    if (kind === "plant") {
      mesh.rotation.set(-0.26, 0.74, 0.01);
      mesh.position.set(0, -0.08, 0);
      mesh.scale.setScalar(1.04);
    } else if (kind === "torch") {
      mesh.rotation.set(-0.38, 0.7, 0.02);
      mesh.position.set(0, -0.08, 0);
      mesh.scale.setScalar(1.06);
    } else {
      mesh.rotation.set(-0.58, 0.8, 0.05);
      mesh.position.set(0, -0.06, 0);
      mesh.scale.setScalar(1.08);
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
