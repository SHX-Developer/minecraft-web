import { Game } from "./core/game.js";

async function bootstrap() {
  const canvas = document.getElementById("game-canvas");
  const hotbar = document.getElementById("hotbar");
  const debug = document.getElementById("debug");
  const underwaterOverlay = document.getElementById("underwater-overlay");

  if (!canvas || !hotbar || !debug || !underwaterOverlay) {
    throw new Error("Missing required DOM nodes.");
  }

  const atlasUrl = new URL("../assets/textures/atlas.png", import.meta.url).href;
  const game = new Game({
    canvas,
    hotbarRoot: hotbar,
    debugRoot: debug,
    underwaterOverlay,
    atlasUrl,
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
