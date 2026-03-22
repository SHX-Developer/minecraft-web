import * as THREE from "three";
import { createItemDisplayMesh } from "../items/itemMeshFactory.js";
import { HELD_ITEM_PIXEL_RATIO_MAX } from "../utils/constants.js";

export class HeldItemRenderer {
  constructor(canvas, atlasTexture) {
    this.canvas = canvas;
    this.atlasTexture = atlasTexture;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, HELD_ITEM_PIXEL_RATIO_MAX));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(canvas.clientWidth || 220, canvas.clientHeight || 220, false);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.01, 12);
    this.camera.position.set(1.55, 0.88, 2.05);
    this.camera.lookAt(0, 0, 0);

    this.ambient = new THREE.AmbientLight(0xffffff, 0.9);
    this.dir = new THREE.DirectionalLight(0xffffff, 0.92);
    this.dir.position.set(2.5, 3, 2);
    this.scene.add(this.ambient, this.dir);

    this.handGroup = new THREE.Group();
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0xd8b89b });
    const sleeveMaterial = new THREE.MeshLambertMaterial({ color: 0x5a708f });
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.98, 0.42), armMaterial);
    hand.position.set(0.82, -0.72, 0.32);
    hand.rotation.set(-0.44, 0.18, 0.08);
    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.46), sleeveMaterial);
    sleeve.position.set(0.76, -0.52, 0.3);
    sleeve.rotation.copy(hand.rotation);
    this.handGroup.add(hand, sleeve);
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
      this.currentMesh.rotation.set(-0.14, 0.46, -0.1);
      this.currentMesh.position.set(0.38, -0.42, -0.02);
      this.currentMesh.scale.setScalar(1.28);
    } else {
      this.currentMesh.rotation.set(-0.22, 0.86, 0.08);
      this.currentMesh.position.set(0.34, -0.36, -0.06);
      this.currentMesh.scale.setScalar(1.08);
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
