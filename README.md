# VoxelCraft MVP+ (Three.js)

Minecraft-like browser MVP on HTML/CSS/JavaScript (ES modules) + Three.js.

## What Is Implemented

- First-person world with chunked voxel terrain and mesh batching.
- Creative inventory (`E`) with:
  - large block list,
  - storage grid,
  - hotbar sync,
  - drag & drop / swap between slots.
- Hotbar + inventory item previews are rendered as 3D-like item renders (not flat color squares).
- Held item renderer in bottom-right corner.
- Block placement / destruction:
  - LMB hold: repeat break every `0.25s`,
  - RMB hold: repeat place every `0.25s`,
  - chunk-neighbor rebuild when border blocks change.
- Torch as placeable block:
  - floor and wall variants,
  - lightweight local torch lighting (pooled capped point lights).
- Movement upgrades:
  - `W/S` fixed,
  - `Shift` crouch + speed reduction,
  - crouch edge protection,
  - double-tap `W` sprint,
  - hold `Space` = auto-jump on landing,
  - double-tap `Space` toggles creative flight.
- Water:
  - separate transparent mesh path,
  - face culling between neighboring water blocks,
  - underwater tint + fog,
  - swim movement + shore step-up assist.
- Day/night cycle with sky transitions, square sun, square moon, stars, and clouds.
- Animals (chicken/pig/cow/sheep):
  - improved blocky shapes with readable silhouettes,
  - simple world collision checks,
  - forward wander behavior + turning near obstacles,
  - hit flash + death puff particles.
- Audio:
  - background music playlist after user interaction,
  - procedural block-break and footstep sounds.

## Controls

- `W/A/S/D` move
- `Mouse` look
- `Space` jump (hold for auto-jump on ground)
- `Double Space` toggle creative flight on/off
- `Shift` crouch (and safe edge movement)
- `Double W` sprint (forward)
- `LMB` break block / attack animal
- `RMB` place block
- `Hold LMB/RMB` repeat action every `0.25s`
- `1..9` hotbar slot select
- `Mouse wheel` hotbar cycle (wrap-around)
- `E` open/close creative inventory
- `Esc` unlock pointer

## Run Locally

1. Open this folder in VS Code (or any editor with static hosting).
2. Start a local server:
   - Live Server: right click `index.html` -> `Open with Live Server`
   - or terminal: `npx serve .` / `python -m http.server`
3. Open the served URL in browser.
4. Click inside the canvas to lock pointer.

## Music Setup

- Put your files in `assets/audio/`.
- Update playlist in `src/utils/constants.js`:
  - `MUSIC_TRACKS`
  - `MUSIC_VOLUME`
- Music starts only after user interaction (browser autoplay policy).

## Main Structure

```text
index.html
style.css
src/
  main.js
  core/
    game.js
    renderer.js
    camera.js
    input.js
  world/
    world.js
    chunk.js
    chunkMesh.js
    blockTypes.js
    worldGenerator.js
    generatedAtlas.js
  player/
    player.js
    playerController.js
    raycast.js
  ui/
    hotbar.js
    inventoryModel.js
    inventoryUI.js
    itemPreviewCache.js
    heldItemRenderer.js
  items/
    itemMeshFactory.js
  systems/
    dayNightCycle.js
    cloudSystem.js
    sprintFovSystem.js
    waterSystem.js
    torchLightSystem.js
  entities/
    animalManager.js
    animalTypes.js
  audio/
    musicManager.js
    sfxManager.js
  effects/
    particlesManager.js
  utils/
    constants.js
    helpers.js
assets/
  textures/
    atlas.png
  audio/
    .gitkeep
README.md
```

## Current MVP Limits

- No crafting logic (2x2 block is UI placeholder only).
- No survival stacks/hunger/player HP.
- No loot drops.
- No persistent save/load.
- No advanced AI/pathfinding.

