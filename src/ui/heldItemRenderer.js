import * as THREE from "three";
import { createItemDisplayMesh } from "../items/itemMeshFactory.js";

export class HeldItemRenderer {
  constructor(canvas, atlasTexture) {
    this.canvas = canvas;
    this.atlasTexture = atlasTexture;
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
    this.camera.position.set(1.7, 0.9, 2.3);
    this.camera.lookAt(0, 0, 0);

    this.ambient = new THREE.AmbientLight(0xffffff, 0.9);
    this.dir = new THREE.DirectionalLight(0xffffff, 0.92);
    this.dir.position.set(2.5, 3, 2);
    this.scene.add(this.ambient, this.dir);

    this.handGroup = new THREE.Group();
    const hand = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.86, 0.34),
      new THREE.MeshLambertMaterial({ color: 0xd4b393 })
    );
    hand.position.set(0.92, -0.74, 0.18);
    hand.rotation.set(-0.42, 0.14, 0.06);
    this.handGroup.add(hand);
    this.scene.add(this.handGroup);

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
      this.handGroup.remove(this.currentMesh);
      this.disposeObject(this.currentMesh);
      this.currentMesh = null;
    }

    if (blockId == null) {
      return;
    }

    this.currentMesh = createItemDisplayMesh(blockId, this.atlasTexture);
    const kind = this.currentMesh.userData.itemKind || "block";
    if (kind === "torch") {
      this.currentMesh.rotation.set(-0.08, 0.36, -0.08);
      this.currentMesh.position.set(0.5, -0.42, 0.02);
      this.currentMesh.scale.setScalar(1.1);
    } else {
      this.currentMesh.rotation.set(-0.2, 0.8, 0.08);
      this.currentMesh.position.set(0.32, -0.34, -0.03);
      this.currentMesh.scale.setScalar(1);
    }
    this.handGroup.add(this.currentMesh);
  }

  setVisible(visible) {
    this.visible = visible;
    this.canvas.style.opacity = visible ? "1" : "0";
  }

  update(delta, isSprinting = false) {
    if (!this.visible) {
      return;
    }
    this.time += delta;

    const sway = isSprinting ? 0.11 : 0.06;
    this.handGroup.position.y = Math.sin(this.time * 4.5) * sway;
    this.handGroup.rotation.y = Math.sin(this.time * 2.1) * 0.05;

    if (this.currentMesh) {
      if (this.currentMesh.userData.itemKind === "torch") {
        this.currentMesh.rotation.y = 0.36 + Math.sin(this.time * 2.2) * 0.04;
        this.currentMesh.rotation.x = -0.08 + Math.sin(this.time * 3.2) * 0.02;
      } else {
        this.currentMesh.rotation.y = 0.8 + Math.sin(this.time * 2.1) * 0.06;
        this.currentMesh.rotation.x = -0.2 + Math.sin(this.time * 3.2) * 0.025;
      }
    }

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
    this.handGroup.traverse((child) => {
      if (!child.geometry || !child.material) {
        return;
      }
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material.dispose();
      }
    });
    this.renderer.dispose();
  }
}
