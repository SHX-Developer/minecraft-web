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
    const orthoSize = 0.92;
    this.camera = new THREE.OrthographicCamera(
      -orthoSize, orthoSize, orthoSize, -orthoSize, 0.01, 10
    );
    this.camera.position.set(2, 1.6, 2);
    this.camera.lookAt(0, 0, 0);

    this.lightA = new THREE.AmbientLight(0xffffff, 0.55);
    this.lightB = new THREE.DirectionalLight(0xffffff, 1.1);
    this.lightB.position.set(1, 2.5, 3);
    this.lightC = new THREE.DirectionalLight(0xffffff, 0.35);
    this.lightC.position.set(-2, 0.5, -1);
    this.scene.add(this.lightA, this.lightB, this.lightC);
  }

  get(blockId) {
    if (this.cache.has(blockId)) {
      return this.cache.get(blockId);
    }

    const mesh = createItemDisplayMesh(blockId, this.atlasTexture);
    const kind = mesh.userData.itemKind || "block";
    if (kind === "plant") {
      mesh.rotation.set(Math.PI / -7, Math.PI / 4, 0);
      mesh.position.set(0, -0.05, 0);
      mesh.scale.setScalar(1.0);
    } else if (kind === "torch") {
      mesh.rotation.set(Math.PI / -7, Math.PI / 4, 0);
      mesh.position.set(0, -0.05, 0);
      mesh.scale.setScalar(1.0);
    } else {
      mesh.rotation.set(Math.PI / -6, Math.PI / 4, 0);
      mesh.position.set(0, 0, 0);
      mesh.scale.setScalar(1.0);
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
