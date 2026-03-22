import {
  HOTBAR_BLOCK_IDS,
  INVENTORY_STORAGE_SLOTS,
} from "../utils/constants.js";
import { getCreativeBlockIds } from "../world/blockTypes.js";

export class InventoryModel {
  constructor() {
    this.creativeSlots = getCreativeBlockIds();
    this.storageSlots = new Array(INVENTORY_STORAGE_SLOTS).fill(null);
    this.hotbarSlots = HOTBAR_BLOCK_IDS.slice(0, 9);
    this.selectedHotbarIndex = 0;

    this.listeners = new Set();
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
    return this.hotbarSlots[this.selectedHotbarIndex] ?? this.creativeSlots[0];
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

  setSlot(kind, index, blockId) {
    if (kind === "storage") {
      this.storageSlots[index] = blockId;
      this.emitChange();
      return;
    }
    if (kind === "hotbar") {
      this.hotbarSlots[index] = blockId;
      this.emitChange();
    }
  }

  putIntoFirstStorage(blockId) {
    if (blockId == null) {
      return false;
    }
    for (let i = 0; i < this.storageSlots.length; i += 1) {
      if (this.storageSlots[i] == null) {
        this.storageSlots[i] = blockId;
        this.emitChange();
        return true;
      }
    }
    return false;
  }
}

