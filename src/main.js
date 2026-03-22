import { Game } from "./core/game.js";

async function bootstrap() {
  const canvas = document.getElementById("game-canvas");
  const hotbar = document.getElementById("hotbar");
  const debug = document.getElementById("debug");
  const underwaterOverlay = document.getElementById("underwater-overlay");
  const inventoryOverlay = document.getElementById("inventory-overlay");
  const inventoryCreativeGrid = document.getElementById("inventory-creative-grid");
  const inventoryStorageGrid = document.getElementById("inventory-storage-grid");
  const inventoryHotbar = document.getElementById("inventory-hotbar-grid");
  const inventoryCursor = document.getElementById("inventory-cursor-item");
  const heldItemCanvas = document.getElementById("held-item-canvas");

  if (
    !canvas ||
    !hotbar ||
    !debug ||
    !underwaterOverlay ||
    !inventoryOverlay ||
    !inventoryCreativeGrid ||
    !inventoryStorageGrid ||
    !inventoryHotbar ||
    !inventoryCursor ||
    !heldItemCanvas
  ) {
    throw new Error("Missing required DOM nodes.");
  }

  const game = new Game({
    canvas,
    hudHotbarRoot: hotbar,
    debugRoot: debug,
    underwaterOverlay,
    inventoryOverlay,
    inventoryCreativeGrid,
    inventoryStorageGrid,
    inventoryHotbar,
    inventoryCursor,
    heldItemCanvas,
  });

  await game.init();
  game.start();
}

bootstrap().catch((error) => {
  // Keep error visible in UI when bootstrap fails.
  const debug = document.getElementById("debug");
  if (debug) {
    debug.textContent = `Bootstrap error: ${error.message}`;
  }
  console.error(error);
});
