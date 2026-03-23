import {
  HOTBAR_BLOCK_IDS,
  INVENTORY_STORAGE_SLOTS,
} from "../utils/constants.js";
import { getCreativeBlockIds } from "../world/blockTypes.js";

const MAX_STACK_SIZE = 64;

export class InventoryModel {
  constructor() {
    this.creativeSlots = getCreativeBlockIds();
    this.storageSlots = new Array(INVENTORY_STORAGE_SLOTS).fill(null);
    this.storageCounts = new Array(INVENTORY_STORAGE_SLOTS).fill(0);
    this.hotbarSlots = HOTBAR_BLOCK_IDS.slice(0, 9);
    this.hotbarCounts = new Array(9).fill(0);
    this.selectedHotbarIndex = 0;
    this.survivalMode = false;

    this.listeners = new Set();
  }

  setSurvivalMode(survival) {
    this.survivalMode = survival;
    if (survival) {
      this.hotbarSlots = new Array(9).fill(null);
      this.hotbarCounts = new Array(9).fill(0);
      this.storageSlots = new Array(INVENTORY_STORAGE_SLOTS).fill(null);
      this.storageCounts = new Array(INVENTORY_STORAGE_SLOTS).fill(0);
    } else {
      this.hotbarSlots = HOTBAR_BLOCK_IDS.slice(0, 9);
      this.hotbarCounts = new Array(9).fill(0);
    }
    this.emitChange();
  }

  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emitChange() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  getSelectedHotbarIndex() {
    return this.selectedHotbarIndex;
  }

  setSelectedHotbarIndex(index) {
    if (index < 0 || index >= this.hotbarSlots.length) {
      return;
    }
    if (this.selectedHotbarIndex === index) {
      return;
    }
    this.selectedHotbarIndex = index;
    this.emitChange();
  }

  cycleHotbar(step) {
    if (step === 0 || this.hotbarSlots.length === 0) {
      return;
    }
    const len = this.hotbarSlots.length;
    const next = (this.selectedHotbarIndex + step + len * 10) % len;
    this.setSelectedHotbarIndex(next);
  }

  getSelectedBlockId() {
    return this.hotbarSlots[this.selectedHotbarIndex] ?? null;
  }

  getSlot(kind, index) {
    if (kind === "creative") {
      return this.creativeSlots[index] ?? null;
    }
    if (kind === "storage") {
      return this.storageSlots[index] ?? null;
    }
    if (kind === "hotbar") {
      return this.hotbarSlots[index] ?? null;
    }
    return null;
  }

  getSlotCount(kind, index) {
    if (kind === "creative") {
      return Infinity;
    }
    if (kind === "storage") {
      return this.storageCounts[index] || 0;
    }
    if (kind === "hotbar") {
      return this.hotbarCounts[index] || 0;
    }
    return 0;
  }

  setSlot(kind, index, blockId) {
    if (kind === "storage") {
      this.storageSlots[index] = blockId;
      if (blockId == null) {
        this.storageCounts[index] = 0;
      } else if (this.storageCounts[index] === 0) {
        this.storageCounts[index] = 1;
      }
      this.emitChange();
      return;
    }
    if (kind === "hotbar") {
      this.hotbarSlots[index] = blockId;
      if (blockId == null) {
        this.hotbarCounts[index] = 0;
      } else if (this.hotbarCounts[index] === 0) {
        this.hotbarCounts[index] = 1;
      }
      this.emitChange();
    }
  }

  setSlotWithCount(kind, index, blockId, count) {
    if (kind === "storage") {
      this.storageSlots[index] = count > 0 ? blockId : null;
      this.storageCounts[index] = count > 0 ? count : 0;
      this.emitChange();
      return;
    }
    if (kind === "hotbar") {
      this.hotbarSlots[index] = count > 0 ? blockId : null;
      this.hotbarCounts[index] = count > 0 ? count : 0;
      this.emitChange();
    }
  }

  addItemToInventory(blockId) {
    for (let i = 0; i < this.hotbarSlots.length; i += 1) {
      if (this.hotbarSlots[i] === blockId && this.hotbarCounts[i] < MAX_STACK_SIZE) {
        this.hotbarCounts[i] += 1;
        this.emitChange();
        return true;
      }
    }

    for (let i = 0; i < this.storageSlots.length; i += 1) {
      if (this.storageSlots[i] === blockId && this.storageCounts[i] < MAX_STACK_SIZE) {
        this.storageCounts[i] += 1;
        this.emitChange();
        return true;
      }
    }

    for (let i = 0; i < this.hotbarSlots.length; i += 1) {
      if (this.hotbarSlots[i] == null) {
        this.hotbarSlots[i] = blockId;
        this.hotbarCounts[i] = 1;
        this.emitChange();
        return true;
      }
    }

    for (let i = 0; i < this.storageSlots.length; i += 1) {
      if (this.storageSlots[i] == null) {
        this.storageSlots[i] = blockId;
        this.storageCounts[i] = 1;
        this.emitChange();
        return true;
      }
    }

    return false;
  }

  consumeSelectedBlock() {
    if (!this.survivalMode) {
      return true;
    }
    const idx = this.selectedHotbarIndex;
    if (this.hotbarSlots[idx] == null) {
      return false;
    }
    this.hotbarCounts[idx] -= 1;
    if (this.hotbarCounts[idx] <= 0) {
      this.hotbarSlots[idx] = null;
      this.hotbarCounts[idx] = 0;
    }
    this.emitChange();
    return true;
  }

  putIntoFirstStorage(blockId) {
    if (blockId == null) {
      return false;
    }
    for (let i = 0; i < this.storageSlots.length; i += 1) {
      if (this.storageSlots[i] == null) {
        this.storageSlots[i] = blockId;
        this.storageCounts[i] = 1;
        this.emitChange();
        return true;
      }
    }
    return false;
  }

  clearAll() {
    this.hotbarSlots.fill(null);
    this.hotbarCounts.fill(0);
    this.storageSlots.fill(null);
    this.storageCounts.fill(0);
    this.emitChange();
  }
}
