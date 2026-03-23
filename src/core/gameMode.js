export const GAME_MODE = Object.freeze({
  SURVIVAL: "survival",
  CREATIVE: "creative",
});

export class GameModeManager {
  constructor() {
    this.mode = null;
    this.listeners = new Set();
  }

  setMode(mode) {
    if (mode !== GAME_MODE.SURVIVAL && mode !== GAME_MODE.CREATIVE) {
      return;
    }
    this.mode = mode;
    for (const listener of this.listeners) {
      listener(this.mode);
    }
  }

  getMode() {
    return this.mode;
  }

  isSurvival() {
    return this.mode === GAME_MODE.SURVIVAL;
  }

  isCreative() {
    return this.mode === GAME_MODE.CREATIVE;
  }

  canFly() {
    return this.isCreative();
  }

  hasFallDamage() {
    return this.isSurvival();
  }

  hasHealth() {
    return this.isSurvival();
  }

  hasCreativeInventory() {
    return this.isCreative();
  }

  hasItemDrop() {
    return this.isSurvival();
  }

  consumesBlocks() {
    return this.isSurvival();
  }

  instantBreak() {
    return this.isCreative();
  }

  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
