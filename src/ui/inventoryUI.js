import { InventoryModel } from "./inventoryModel.js";
import { ItemPreviewCache } from "./itemPreviewCache.js";
import { getBlockDisplayName } from "../world/blockTypes.js";

export class InventoryUI {
  constructor({
    hudHotbarRoot,
    overlayElement,
    creativeGridElement,
    creativeToggleElement,
    creativePanelElement,
    storageGridElement,
    inventoryHotbarElement,
    trashElement,
    cursorElement,
    atlasTexture,
  }) {
    this.hudHotbarRoot = hudHotbarRoot;
    this.overlayElement = overlayElement;
    this.creativeGridElement = creativeGridElement;
    this.creativeToggleElement = creativeToggleElement;
    this.creativePanelElement = creativePanelElement;
    this.storageGridElement = storageGridElement;
    this.inventoryHotbarElement = inventoryHotbarElement;
    this.trashElement = trashElement;
    this.cursorElement = cursorElement;

    this.model = new InventoryModel();
    this.previewCache = new ItemPreviewCache(128, atlasTexture);
    this.cursorItem = null;
    this.isOpenState = false;
    this.changeListeners = new Set();
    this.slotBindings = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.isCreativePanelOpen = false;

    this.unsubscribeModel = this.model.onChange(() => this.refresh());
    this.onMouseMove = (event) => {
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
      this.updateCursor();
    };
    this.onTrashPointerDown = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.cursorItem == null) {
        return;
      }
      this.cursorItem = null;
      this.refresh();
    };
    this.onCreativeToggleClick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.setCreativePanelOpen(!this.isCreativePanelOpen);
    };

    this.build();
  }

  onChange(listener) {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  emitChange() {
    for (const listener of this.changeListeners) {
      listener();
    }
  }

  build() {
    this.hudHotbarRoot.innerHTML = "";
    this.creativeGridElement.innerHTML = "";
    this.storageGridElement.innerHTML = "";
    this.inventoryHotbarElement.innerHTML = "";
    this.slotBindings.length = 0;

    if (this.trashElement) {
      this.trashElement.removeEventListener("pointerdown", this.onTrashPointerDown);
      this.trashElement.addEventListener("pointerdown", this.onTrashPointerDown);
    }
    if (this.creativeToggleElement) {
      this.creativeToggleElement.removeEventListener("click", this.onCreativeToggleClick);
      this.creativeToggleElement.addEventListener("click", this.onCreativeToggleClick);
    }

    for (let i = 0; i < this.model.hotbarSlots.length; i += 1) {
      this.bindSlot("hotbar", i, this.hudHotbarRoot, "hud");
      this.bindSlot("hotbar", i, this.inventoryHotbarElement, "inventory-hotbar");
    }

    for (let i = 0; i < this.model.storageSlots.length; i += 1) {
      this.bindSlot("storage", i, this.storageGridElement, "storage");
    }

    for (let i = 0; i < this.model.creativeSlots.length; i += 1) {
      this.bindSlot("creative", i, this.creativeGridElement, "creative");
    }

    this.setCreativePanelOpen(false);
    this.refresh();
  }

  setCreativePanelOpen(open) {
    this.isCreativePanelOpen = Boolean(open);
    if (this.creativePanelElement) {
      this.creativePanelElement.classList.toggle("open", this.isCreativePanelOpen);
    }
    if (this.creativeToggleElement) {
      this.creativeToggleElement.classList.toggle("active", this.isCreativePanelOpen);
    }
  }

  bindSlot(kind, index, parent, roleClass) {
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = `slot slot-${roleClass}`;
    slot.dataset.kind = kind;
    slot.dataset.index = String(index);

    const preview = document.createElement("span");
    preview.className = "slot-preview";
    slot.appendChild(preview);

    slot.addEventListener("pointerdown", (event) => {
      this.handleSlotPointerDown(kind, index, event);
    });

    parent.appendChild(slot);
    this.slotBindings.push({ kind, index, slot, preview, roleClass });
  }

  handleSlotPointerDown(kind, index, event) {
    event.preventDefault();
    event.stopPropagation();

    if (kind === "hotbar") {
      this.model.setSelectedHotbarIndex(index);
    }

    if (kind === "creative") {
      const source = this.model.getSlot(kind, index);
      if (source != null) {
        this.cursorItem = source;
      }
      this.refresh();
      return;
    }

    const source = this.model.getSlot(kind, index);
    if (this.cursorItem == null) {
      if (source == null) {
        this.refresh();
        return;
      }
      this.cursorItem = source;
      this.model.setSlot(kind, index, null);
      return;
    }

    if (source == null) {
      this.model.setSlot(kind, index, this.cursorItem);
      this.cursorItem = null;
      return;
    }

    this.model.setSlot(kind, index, this.cursorItem);
    this.cursorItem = source;
  }

  refresh() {
    const selected = this.model.getSelectedHotbarIndex();

    for (let i = 0; i < this.slotBindings.length; i += 1) {
      const binding = this.slotBindings[i];
      const id = this.model.getSlot(binding.kind, binding.index);
      binding.slot.classList.toggle("active", binding.kind === "hotbar" && binding.index === selected);
      binding.slot.classList.toggle("empty", id == null);
      if (id == null) {
        binding.preview.style.backgroundImage = "";
        binding.slot.title = "";
      } else {
        binding.preview.style.backgroundImage = `url("${this.previewCache.get(id)}")`;
        binding.slot.title = getBlockDisplayName(id);
      }
    }

    this.updateCursor();
    this.emitChange();

    if (this.trashElement) {
      this.trashElement.classList.toggle("ready", this.cursorItem != null);
    }
  }

  updateCursor() {
    if (!this.cursorElement) {
      return;
    }
    if (this.cursorItem == null || !this.isOpenState) {
      this.cursorElement.style.opacity = "0";
      this.cursorElement.style.backgroundImage = "";
      return;
    }
    this.cursorElement.style.opacity = "1";
    this.cursorElement.style.backgroundImage = `url("${this.previewCache.get(this.cursorItem)}")`;
    this.cursorElement.style.transform = `translate(${this.mouseX - 22}px, ${this.mouseY - 22}px)`;
  }

  isOpen() {
    return this.isOpenState;
  }

  open() {
    if (this.isOpenState) {
      return;
    }
    this.isOpenState = true;
    this.overlayElement.classList.add("visible");
    this.overlayElement.setAttribute("aria-hidden", "false");
    document.body.classList.add("inventory-open");
    window.addEventListener("pointermove", this.onMouseMove);
    this.updateCursor();
  }

  close() {
    if (!this.isOpenState) {
      return;
    }
    this.isOpenState = false;
    this.overlayElement.classList.remove("visible");
    this.overlayElement.setAttribute("aria-hidden", "true");
    document.body.classList.remove("inventory-open");
    window.removeEventListener("pointermove", this.onMouseMove);
    if (this.cursorItem != null) {
      if (!this.model.putIntoFirstStorage(this.cursorItem)) {
        this.model.setSlot("hotbar", this.model.getSelectedHotbarIndex(), this.cursorItem);
      }
      this.cursorItem = null;
    }
    this.updateCursor();
  }

  toggle() {
    if (this.isOpenState) {
      this.close();
      return false;
    }
    this.open();
    return true;
  }

  setSelected(index) {
    this.model.setSelectedHotbarIndex(index);
  }

  cycle(step) {
    this.model.cycleHotbar(step);
  }

  getSelectedIndex() {
    return this.model.getSelectedHotbarIndex();
  }

  getSelectedBlockId() {
    return this.model.getSelectedBlockId();
  }

  getSelectedBlockName() {
    const id = this.getSelectedBlockId();
    return id == null ? "empty" : getBlockDisplayName(id);
  }

  destroy() {
    document.body.classList.remove("inventory-open");
    this.unsubscribeModel();
    window.removeEventListener("pointermove", this.onMouseMove);
    if (this.trashElement) {
      this.trashElement.removeEventListener("pointerdown", this.onTrashPointerDown);
    }
    if (this.creativeToggleElement) {
      this.creativeToggleElement.removeEventListener("click", this.onCreativeToggleClick);
    }
    this.previewCache.destroy();
  }
}
