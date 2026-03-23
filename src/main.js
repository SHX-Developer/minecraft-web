import { Game } from "./core/game.js";
import { MainMenu } from "./ui/mainMenu.js";

async function bootstrap() {
  const canvas = document.getElementById("game-canvas");
  const hotbar = document.getElementById("hotbar");
  const debug = document.getElementById("debug");
  const underwaterOverlay = document.getElementById("underwater-overlay");
  const inventoryOverlay = document.getElementById("inventory-overlay");
  const inventoryCreativeGrid = document.getElementById("inventory-creative-grid");
  const inventoryCreativeToggle = document.getElementById("inventory-creative-toggle");
  const inventoryCreativePanel = document.getElementById("inventory-creative-panel");
  const inventoryStorageGrid = document.getElementById("inventory-storage-grid");
  const inventoryHotbar = document.getElementById("inventory-hotbar-grid");
  const inventoryTrash = document.getElementById("inventory-trash-slot");
  const inventoryCursor = document.getElementById("inventory-cursor-item");
  const heldItemCanvas = document.getElementById("held-item-canvas");
  const hudElement = document.getElementById("hud");

  if (
    !canvas ||
    !hotbar ||
    !debug ||
    !underwaterOverlay ||
    !inventoryOverlay ||
    !inventoryCreativeGrid ||
    !inventoryCreativeToggle ||
    !inventoryCreativePanel ||
    !inventoryStorageGrid ||
    !inventoryHotbar ||
    !inventoryTrash ||
    !inventoryCursor ||
    !heldItemCanvas ||
    !hudElement
  ) {
    throw new Error("Missing required DOM nodes.");
  }

  const mainMenu = new MainMenu(document.body);
  const selectedMode = await mainMenu.show();

  const atlasVersion = Date.now();
  const atlasUrl = `${new URL("../assets/textures/atlas.png", import.meta.url).href}?v=${atlasVersion}`;
  const game = new Game({
    canvas,
    hudHotbarRoot: hotbar,
    debugRoot: debug,
    underwaterOverlay,
    inventoryOverlay,
    inventoryCreativeGrid,
    inventoryCreativeToggle,
    inventoryCreativePanel,
    inventoryStorageGrid,
    inventoryHotbar,
    inventoryTrash,
    inventoryCursor,
    heldItemCanvas,
    atlasUrl,
    hudElement,
  });

  await game.init();
  game.applyGameMode(selectedMode);
  game.start();
}

bootstrap().catch((error) => {
  const debug = document.getElementById("debug");
  if (debug) {
    debug.textContent = `Bootstrap error: ${error.message}`;
  }
  console.error(error);
});
