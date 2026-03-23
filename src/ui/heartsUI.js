export class HeartsUI {
  constructor(containerElement) {
    this.container = containerElement;
    this.element = null;
    this.heartElements = [];
    this.visible = false;
    this.build();
  }

  build() {
    this.element = document.createElement("div");
    this.element.id = "hearts-bar";

    for (let i = 0; i < 10; i += 1) {
      const heart = document.createElement("span");
      heart.className = "heart heart-full";
      heart.textContent = "\u2764";
      this.heartElements.push(heart);
      this.element.appendChild(heart);
    }

    this.container.appendChild(this.element);
  }

  setVisible(visible) {
    this.visible = visible;
    this.element.style.display = visible ? "flex" : "none";
  }

  updateHealth(current, max) {
    for (let i = 0; i < this.heartElements.length; i += 1) {
      const heart = this.heartElements[i];
      if (i < max) {
        heart.style.display = "";
        if (i < current) {
          heart.className = "heart heart-full";
        } else {
          heart.className = "heart heart-empty";
        }
      } else {
        heart.style.display = "none";
      }
    }
  }

  flashDamage() {
    this.element.classList.add("hearts-flash");
    setTimeout(() => {
      this.element.classList.remove("hearts-flash");
    }, 300);
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
