import { GAME_MODE } from "../core/gameMode.js";

export class MainMenu {
  constructor(containerElement) {
    this.container = containerElement;
    this.resolve = null;
    this.element = null;
    this.build();
  }

  build() {
    this.element = document.createElement("div");
    this.element.id = "main-menu";
    this.element.innerHTML = `
      <div class="menu-panel">
        <h1 class="menu-title">SHX CRAFT</h1>
        <div class="menu-subtitle">Minecraft-like Web Game</div>
        <div class="menu-buttons">
          <button class="menu-btn menu-btn-survival" data-mode="${GAME_MODE.SURVIVAL}">
            <span class="menu-btn-icon">&#9876;</span>
            <span class="menu-btn-label">Survival</span>
            <span class="menu-btn-desc">Mine, collect, survive</span>
          </button>
          <button class="menu-btn menu-btn-creative" data-mode="${GAME_MODE.CREATIVE}">
            <span class="menu-btn-icon">&#9733;</span>
            <span class="menu-btn-label">Creative</span>
            <span class="menu-btn-desc">Unlimited blocks, fly freely</span>
          </button>
        </div>
      </div>
    `;

    this.element.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-mode]");
      if (!btn || !this.resolve) {
        return;
      }
      const mode = btn.dataset.mode;
      this.hide();
      this.resolve(mode);
      this.resolve = null;
    });

    this.container.appendChild(this.element);
  }

  show() {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.element.style.display = "flex";
    });
  }

  hide() {
    this.element.style.display = "none";
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
