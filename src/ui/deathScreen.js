export class DeathScreen {
  constructor(containerElement) {
    this.container = containerElement;
    this.element = null;
    this.resolve = null;
    this.build();
  }

  build() {
    this.element = document.createElement("div");
    this.element.id = "death-screen";
    this.element.style.display = "none";
    this.element.innerHTML = `
      <div class="death-panel">
        <h1 class="death-title">You Died!</h1>
        <p class="death-subtitle">All items have been lost</p>
        <button class="death-btn" type="button">Respawn</button>
      </div>
    `;

    this.element.querySelector(".death-btn").addEventListener("click", () => {
      if (this.resolve) {
        this.hide();
        this.resolve();
        this.resolve = null;
      }
    });

    this.container.appendChild(this.element);
  }

  show() {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.element.style.display = "flex";
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    });
  }

  hide() {
    this.element.style.display = "none";
  }

  isVisible() {
    return this.element.style.display !== "none";
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
