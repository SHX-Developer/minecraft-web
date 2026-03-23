import * as THREE from "three";
import { createItemDisplayMesh } from "../items/itemMeshFactory.js";
import { isBlockSolid } from "../world/blockTypes.js";

const PICKUP_RADIUS = 1.8;
const GRAVITY = 18.0;
const MAX_FALL_SPEED = 20.0;
const BOUNCE_VELOCITY = 3.5;
const SPIN_SPEED = 2.0;
const HOVER_SPEED = 2.5;
const HOVER_AMPLITUDE = 0.08;
const DESPAWN_TIME = 300;
const ITEM_SCALE = 0.35;

export class DroppedItemManager {
  constructor(scene, world, atlasTexture) {
    this.scene = scene;
    this.world = world;
    this.atlasTexture = atlasTexture;
    this.items = [];
  }

  spawnItem(blockId, worldX, worldY, worldZ) {
    const mesh = createItemDisplayMesh(blockId, this.atlasTexture);
    mesh.scale.setScalar(ITEM_SCALE);

    const group = new THREE.Group();
    group.add(mesh);
    group.position.set(worldX + 0.5, worldY + 0.5, worldZ + 0.5);
    this.scene.add(group);

    const spread = 0.15;
    this.items.push({
      blockId,
      group,
      mesh,
      velocityX: (Math.random() - 0.5) * 3 * spread,
      velocityY: BOUNCE_VELOCITY,
      velocityZ: (Math.random() - 0.5) * 3 * spread,
      onGround: false,
      age: 0,
      spinAngle: Math.random() * Math.PI * 2,
    });
  }

  update(delta, playerPosition, onPickup) {
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      const item = this.items[i];
      item.age += delta;

      if (item.age > DESPAWN_TIME) {
        this.removeItem(i);
        continue;
      }

      if (!item.onGround) {
        item.velocityY -= GRAVITY * delta;
        item.velocityY = Math.max(item.velocityY, -MAX_FALL_SPEED);

        const nextX = item.group.position.x + item.velocityX * delta;
        const nextY = item.group.position.y + item.velocityY * delta;
        const nextZ = item.group.position.z + item.velocityZ * delta;

        const floorY = Math.floor(nextY - 0.15);
        if (floorY >= 0 && isBlockSolid(this.world.getBlock(Math.floor(nextX), floorY, Math.floor(nextZ)))) {
          item.group.position.y = floorY + 1 + 0.15;
          item.velocityY = 0;
          item.velocityX = 0;
          item.velocityZ = 0;
          item.onGround = true;
        } else {
          item.group.position.x = nextX;
          item.group.position.y = nextY;
          item.group.position.z = nextZ;
        }
      } else {
        item.spinAngle += SPIN_SPEED * delta;
        item.mesh.rotation.y = item.spinAngle;
        const hover = Math.sin(item.age * HOVER_SPEED) * HOVER_AMPLITUDE;
        item.mesh.position.y = hover;
      }

      const dx = playerPosition.x - item.group.position.x;
      const dy = (playerPosition.y + 0.9) - item.group.position.y;
      const dz = playerPosition.z - item.group.position.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < PICKUP_RADIUS * PICKUP_RADIUS) {
        const picked = onPickup(item.blockId);
        if (picked) {
          this.removeItem(i);
        }
      }
    }
  }

  removeItem(index) {
    const item = this.items[index];
    this.scene.remove(item.group);
    item.group.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    this.items.splice(index, 1);
  }

  clear() {
    while (this.items.length > 0) {
      this.removeItem(this.items.length - 1);
    }
  }

  getCount() {
    return this.items.length;
  }

  destroy() {
    this.clear();
  }
}
