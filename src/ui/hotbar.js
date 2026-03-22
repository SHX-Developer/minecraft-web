import { getBlockDisplayName, getHotbarColor } from "../world/blockTypes.js";

export class Hotbar {
  constructor(rootElement, blockIds) {
    this.rootElement = rootElement;
    this.blockIds = blockIds.slice();
    this.selectedIndex = 0;
    this.slotElements = [];
    this.build();
    this.setSelected(0);
  }

  build() {
    this.rootElement.innerHTML = "";
    this.slotElements.length = 0;

    for (let i = 0; i < this.blockIds.length; i += 1) {
      const blockId = this.blockIds[i];

      const slot = document.createElement("div");
      slot.className = "hotbar-slot";

      const index = document.createElement("span");
      index.className = "hotbar-slot-index";
      index.textContent = String(i + 1);

      const swatch = document.createElement("span");
      swatch.className = "hotbar-swatch";
      swatch.style.background = getHotbarColor(blockId);

      const label = document.createElement("span");
      label.className = "hotbar-slot-label";
      label.textContent = getBlockDisplayName(blockId);

      slot.append(index, swatch, label);
      this.rootElement.appendChild(slot);
      this.slotElements.push(slot);
    }
  }

  setSelected(index) {
    if (index < 0 || index >= this.blockIds.length) {
      return;
    }
    this.selectedIndex = index;
    for (let i = 0; i < this.slotElements.length; i += 1) {
      this.slotElements[i].classList.toggle("active", i === this.selectedIndex);
    }
  }

  cycle(step) {
    if (step === 0 || this.blockIds.length === 0) {
      return;
    }
    const nextIndex =
      (this.selectedIndex + step + this.blockIds.length * 8) % this.blockIds.length;
    this.setSelected(nextIndex);
  }

  getSelectedIndex() {
    return this.selectedIndex;
  }

  getSelectedBlockId() {
    return this.blockIds[this.selectedIndex];
  }

  getSelectedBlockName() {
    return getBlockDisplayName(this.getSelectedBlockId());
  }
}
